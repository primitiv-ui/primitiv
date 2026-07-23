# Mutation testing plan (Stryker) — `@primitiv-ui/react`

Introducing mutation testing to the headless library with
[Stryker](https://stryker-mutator.io/). Scoped to `packages/react` first,
starting with **Button** as the test case, then growing a per-component
allowlist until every component is covered.

> **Status:** the harness is landed. The allowlist
> (`packages/react/mutation-allowlist.json`) is the machine source of truth for
> what is at **100% mutation score**; the checklist below is the human tracker.
> Next: bring the next unchecked component to a full kill and add it to the
> allowlist.

## Progress

`mutation-allowlist.json` and this list stay in lockstep — tick a box here in
the same commit that adds the component to the allowlist. Rough order is
cheapest-first (leaf → simple control → composite → compound/stateful); it's a
guide, not a rule.

**Done (29 / 43):** every box below the line is a component in `packages/react/src`.

Leaf / primitive:
- [x] Divider
- [x] VisuallyHidden
- [x] AccessibleIcon
- [x] Slot
- [x] Status
- [x] Portal
- [x] DirectionProvider
- [x] SkipNav
- [x] EmptyState
- [x] Avatar
- [x] Progress
- [x] Breadcrumb

Simple controls:
- [x] Button
- [x] Switch
- [x] Checkbox
- [x] Toggle
- [x] Radio
- [x] Input
- [x] Textarea
- [x] Alert

Composites / groups:
- [x] CheckboxCard
- [x] RadioCard
- [x] RadioGroup
- [x] ToggleGroup
- [x] Field
- [x] Fieldset
- [x] InputGroup
- [ ] SegmentedControl

Compound / stateful:
- [x] Collapsible
- [x] Accordion
- [ ] Tabs
- [ ] Tooltip
- [ ] Popover
- [ ] Dropdown
- [ ] ContextMenu
- [ ] Modal
- [ ] Drawer
- [ ] Select
- [ ] Slider
- [ ] Table
- [ ] Tree
- [ ] Carousel
- [ ] MillerColumns

**Not components** (shared code — a possible later pass, not part of the 42):
`src/hooks`, `src/utils`, `src/test`.

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

### 5. CI — new `mutation.yml`

Path-filtered to `packages/react/**`, mirroring `ci.yml`'s
wasm-build → install sequence.

**Viewing runs without a local machine.** The maintainer can't run mutation
suites locally, so the workflow is the primary way to inspect results. Two
surfaces come out of every run:

- **HTML report artifact.** Stryker's HTML reporter writes a self-contained
  `reports/mutation/<Component>.html` (static — download the artifact zip, open
  in any browser; no server or local run needed). Uploaded via
  `actions/upload-artifact@v4` with **`if: always()`** — this is essential:
  with `break: 100` a surviving mutant fails the Stryker step, and `always()`
  guarantees the report still uploads _on failure_, which is exactly when you
  need to see which mutants survived.
- **Job summary.** Stryker's clear-text score (mutation score + survivor count)
  is piped into `$GITHUB_STEP_SUMMARY`, so the headline number shows on the
  Actions run page without downloading anything.

The Stryker **Dashboard** (dashboard.stryker-mutator.io) is deliberately _not_
used — it hosts reports publicly and needs an API key. Artifacts keep results
inside the repo's access controls.

**Scaling: matrix per component.** Starts as a single job over the allowlist
(fine while it's just Button). As the list grows it becomes a **matrix, one job
per allowlisted component** — a setup job reads the allowlist array and emits
the matrix JSON; each component runs in parallel with its own artifact and
independent pass/fail, so a survivor in one component doesn't obscure the
others.

Because the score gate is a hard requirement (below), this is intended to
become a **required check** once the harness is proven on Button.

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

## Settled decisions

1. **`break` (mutation-score gate) = `100`. Hard requirement.** Every mutant on
   an allowlisted component must be **killed by a test**. That is the only
   accepted outcome.

   `// Stryker disable` is an **absolute last resort**, not a routine tool. It
   is reserved for a mutant that is _provably equivalent_ — one where the
   mutation produces observably-identical behaviour, so **no test could ever
   distinguish it** (e.g. a change with no reachable effect on output, state,
   DOM, or side effects). "The test is awkward / verbose / annoying to write"
   is never a justification — write the test. Before any disable lands:

   - it carries a comment proving _why_ the mutant is equivalent, not merely
     _that_ it survived;
   - the default assumption in review is that a survivor is a **missing
     assertion**, and the burden is on the disable to overturn that.

   Expect these to be vanishingly rare in a headless library — most survivors
   will be real gaps. This keeps "on the list" meaning "fully killed" and
   mirrors the repo's 100%-coverage culture.
2. **`mutation.yml` becomes a required check** once Button proves the harness.
   Until then it runs on every PR so reports/artifacts are always available.
