# Mutation testing plan (Stryker) — `@primitiv-ui/react`

Introducing mutation testing to the headless library with
[Stryker](https://stryker-mutator.io/). Scoped to `packages/react` first,
starting with **Button** as the test case, then growing a per-component
allowlist until every component is covered.

Mutation testing is the natural next rung above our 100%-coverage bar: line
coverage proves a line _ran_; mutation testing proves a line is _asserted on_.
A surviving mutant is precisely an assertion the suite is missing.

## What we're building

- **Package:** `@primitiv-ui/react` (`packages/react`) — the headless library.
- **Runner:** Vitest (`@stryker-mutator/vitest-runner`). Latest Stryker is
  `9.6.1`; its vitest-runner peer-deps `vitest: >=2.0.0`, so our Vitest `4.1.4`
  stack is supported. Vite 8 is newer than Stryker's test matrix — smoke-test
  on first run, but no problem expected.
- **Test layout that makes this clean:** tests are colocated and
  self-contained under `src/<Component>/__tests__/*.test.tsx`. Button's tests
  import only `../Button`, RTL, and `react` — no cross-component coupling — so
  scoping mutation to one component at a time is straightforward.

## Design

### 1. Dev dependencies (in `packages/react`)

Pin `@stryker-mutator/core` and `@stryker-mutator/vitest-runner` at `9.6.1`.

### 2. One parametrised config — `packages/react/stryker.config.mjs`

`.mjs` (not JSON) so it can read an env var and drive both what gets mutated
and which tests run:

- Reads `STRYKER_COMPONENT` (e.g. `Button`).
- `mutate` (per component):
  `["src/<Component>/**/*.{ts,tsx}", "!**/*.test.{ts,tsx}", "!**/types.ts", "!**/index.ts"]`
  — the same exclusions the coverage config already uses (barrels and pure
  type modules aren't mutated).
- `testRunner: "vitest"`, `coverageAnalysis: "perTest"` — Stryker maps which
  test covers which mutant and only re-runs the covering tests per mutant. The
  main time-saver in the per-mutant loop.
- HTML report path parametrised per component
  (`reports/mutation/<Component>.html`) so component reports don't clobber each
  other.
- An **enabled-component allowlist** array lives here (starts `["Button"]`).
  With no `STRYKER_COMPONENT`, it mutates the whole allowlist; with one set, it
  scopes to that single component.

### 3. Narrow the dry-run too — small tweak to `vite.config.ts`

`coverageAnalysis: perTest` speeds the per-mutant loop, but Stryker's initial
dry run still executes every test file. To make a single-component run
genuinely fast, `vite.config.ts` narrows `test.include` to `src/<Component>/**`
**only when `STRYKER_COMPONENT` is set**. Normal `qa:units` runs are untouched
(env var absent → full suite). One guarded block; non-invasive.

### 4. Scripts (`packages/react/package.json`)

```jsonc
"mutate":           "stryker run",                     // whole allowlist
"mutate:component": "node ../../scripts/mutate.mjs"    // STRYKER_COMPONENT=$1 stryker run
```

Usage: `pnpm --filter @primitiv-ui/react mutate:component Button`. A tiny
`scripts/mutate.mjs` sets the env var cross-platform and spawns Stryker —
avoids a `cross-env` dependency.

### 5. CI — new `mutation.yml`, non-blocking

Path-filtered to `packages/react/**`, mirroring `ci.yml`'s
wasm-build → install sequence. Runs the allowlist and uploads the HTML report
as an artifact. Kept **off** the required `test` check so a surviving mutant
never blocks a merge while the allowlist is still small. Promote to required
once the list is mature.

### 6. `.gitignore`

Add `packages/react/reports/` and `.stryker-tmp/`.

## Incremental approach

The **allowlist array in `stryker.config.mjs` is the ratchet.** A component
joins it only once it has zero surviving mutants, and the `break` threshold
applies only to what's on the list — so the list stays green and adding a
component is a deliberate act.

Per-component loop:

1. `mutate:component <Name>` → open `reports/mutation/<Name>.html`.
2. For each **survivor**, add or strengthen a test to kill it — following the
   repo's TDD discipline and `react-test-conventions` (concern-based files,
   shared fixtures). Survivors are exactly the assertions the 100%-line suite
   is missing.
3. Re-run until no survivors remain at the target score.
4. Add `<Name>` to the allowlist. Commit (`test(<name>): kill mutants` + config
   bump) and push. One component per PR keeps reports and reviews small.

**Order** — cheapest first, to build momentum and validate the harness on
simple surfaces before the rich ones:

1. **Button** (first — the harness proving ground).
2. Leaf / primitive: `Slot`, `VisuallyHidden`, `Divider`, `AccessibleIcon`,
   `Status`.
3. Simple controls: `Switch`, `Checkbox`, `Toggle`.
4. Compound / stateful (richest survivor yield): `Tabs`, `Accordion`, `Select`,
   `Carousel`, and the rest of the inventory.

## Open decisions

1. **`break` (mutation-score gate) for allowlisted components.**
   Recommendation: **100**, with genuinely-equivalent mutants marked via
   `// Stryker disable` comments. Matches the repo's 100%-coverage culture and
   makes "on the list" mean "fully killed." Alternative: a softer gate (e.g.
   90) that tolerates a margin of survivors per component.
2. **Whether `mutation.yml` ever becomes a required check**, or stays an
   informational artifact-only run.
