---
name: mutation-testing
description: Run Stryker mutation testing over the headless library one component at a time, then use surviving mutants to strengthen weak or missing tests — coverage proves a line ran, mutation proves it is asserted on. TRIGGER during the MUTATE step of a red-green cycle, when the user mentions mutation testing / Stryker / mutation score / surviving mutants, when bringing a component up to the hard 100% gate or adding one to the allowlist, or when judging whether the tests would catch a real regression. SKIP for writing the tests themselves (see react-test-conventions) and non-test work.
---

# Mutation Testing

For writing good tests (factories, behavior-driven patterns), load the `react-test-conventions` skill. This skill focuses on verifying test effectiveness.

Mutation testing answers the question: **"Are my tests actually catching bugs?"**

Code coverage tells you what code your tests execute. Mutation testing tells you if your tests would **detect changes** to that code. A test suite with 100% coverage can still miss 40% of potential bugs.

**Default posture:** use an automated mutation harness first. For JavaScript and TypeScript projects, recommend Stryker as the starting point if it is not already set up. Use manual/mental mutations only as a fallback, a teaching aid, or a focused follow-up for subtle survivors.

**Deep-dive resources** are in the `resources/` directory. Load them on demand:

| Resource | Load when... |
|----------|-------------|
| `mutator-rules.md` | Planning tests, scanning changed code for likely gaps, manually applying mutations, or interpreting surviving/equivalent mutants |

---

## In this repo (Primitiv)

Primitiv is a **pnpm** workspace, and the canonical setup lives in
`docs/mutation-testing-plan.md` + `packages/react/stryker.config.mjs` — read
those first; the generic flow below is background. When following any generic
step here:

- Translate commands: `npm …` / `npx …` → `pnpm …` / `pnpm exec …`, and scope
  to the headless library, e.g.
  `pnpm --filter @primitiv-ui/react exec stryker run`.
- Mutation runs **one component at a time** via the `STRYKER_COMPONENT` env var
  and a per-component **allowlist** (Button first), not a diff-against-main
  scope.
- The score gate is a **hard 100%** — a survivor is a missing assertion, and
  `// Stryker disable` is an absolute last resort for provably-equivalent
  mutants only. There is no "establish a baseline first" ramp: a component
  joins the allowlist only once it already kills every mutant.
- Reports are inspected as **GitHub Actions artifacts** (HTML report uploaded
  `if: always()`, plus the score in the job summary), since suites aren't run
  locally.
- For writing the tests that kill survivors, load **`react-test-conventions`**
  (this repo's equivalent of a general testing skill).

### Gotchas learned during the sweep

- **Verify every kill with `typecheck`, not just the vitest suite.** vitest runs
  through esbuild, which strips types without checking them — a type error hides
  behind a green suite and only fails in CI's separate *Type-check libraries*
  step. After each component run both
  `pnpm --filter @primitiv-ui/react exec vitest run src/<Name>` **and**
  `pnpm --filter @primitiv-ui/react typecheck`.
- **`displayName` is the universal first survivor.** Every component ships an
  unasserted `displayName`; assert `Component.displayName` (plus each
  sub-component and any context's `displayName`) — the reliable first kill.
- **Compound `Object.assign` components: do NOT delete the `Root.displayName`
  assignment.** With the `const X = Object.assign(XRoot, { … })` pattern the
  compound *is* `XRoot`, so `X.displayName = "X"` overwrites `XRoot.displayName`
  at load — the `XRoot.displayName = "XRoot"` line looks like dead code. It
  isn't: that assignment is what declares `displayName` on `typeof XRoot`, which
  the `TXCompound` type extends. Delete it and `tsc` fails on the compound's own
  `displayName` line (and your test). Keep it and
  `// Stryker disable next-line StringLiteral` it — the value is genuinely never
  observable at runtime (equivalent), but the assignment must stay for the type.
  Kill the rest by asserting the *compound's* and each *separate* sub-component's
  `displayName`.
- **A `// Stryker disable` is not always "equivalent".** Most are (a stable
  `useState` setter in a dep array, a duplicate no-op timer). But Stryker's
  vitest runner also can't attribute a React **commit-phase throw** (e.g. a
  callback ref dereferencing null on detach) to a covering test under
  `coverageAnalysis: perTest` — the identical `BlockStatement` twin scores but
  the `ConditionalExpression` twin survives. That's a runner limitation, not
  equivalence; disable the one mutator with a comment that says so, and keep the
  test that proves the guard is real.

---

## Core Concept

**The Mutation Testing Process:**

1. **Generate mutants**: Introduce small bugs (mutations) into production code
2. **Run tests**: Execute your test suite against each mutant
3. **Evaluate results**: If tests fail, the mutant is "killed" (good). If tests pass, the mutant "survived" (bad - your tests missed the bug)

**The Insight**: A surviving mutant represents a bug your tests wouldn't catch.

---

## When to Use This Skill

Use mutation testing analysis when:

- Reviewing code changes on a branch
- Verifying test effectiveness after TDD
- Identifying weak tests that appear to have coverage
- Finding missing edge case tests
- Validating that refactoring didn't weaken test suite

**Integration with planning and TDD:**

```
FOR EACH STEP:
    ├─► CONFIRM: Human approves observable acceptance criteria
    ├─► RED: Write failing test, using mutator rules to spot likely gaps
    ├─► GREEN: Make it pass
    ├─► Run mutation testing
    ├─► KILL MUTANTS: Strengthen tests for worthwhile survivors
    ├─► REFACTOR: If valuable
    └─► STOP: Present work, mutation report, and wait for commit approval

PRE-PR QUALITY GATE:
    └─► Re-run mutation testing for the branch/repo scope
```

Mutation testing is not a replacement for RED-GREEN-MUTATE-KILL MUTANTS-REFACTOR. It verifies the tests created during those increments are strong enough to catch real behavioral regressions before refactoring and before PR.

---

## Harness-First Mutation Workflow

When analyzing code on a branch, prove test effectiveness with Stryker whenever practical. Do not stop at reasoning about whether a test would catch a mutation; run the harness, then use the report to drive focused test improvements.

### Step 1: Inspect Setup and Scope

```bash
rg --files | rg '(^|/)(package.json|stryker\.config\.(mjs|cjs|js|json)|stryker\.conf\.(js|json))$'
git diff main...HEAD --name-only
```

- Identify the test runner and existing Stryker config. Here that is fixed:
  pnpm + Vitest (jsdom), config at `packages/react/stryker.config.mjs`.
- Map the changed files to their component(s) — everything under
  `src/<Component>/` — and run that component with `mutate:component <Name>`.
- The mutation scope is always the headless library (`packages/react`); we do
  not mutate the whole repo.

### Step 2: Set Up Stryker When Missing

Install the runner and core alongside the project's test runner, then write the
config by hand (in this repo, scoped to the headless library):

```bash
pnpm --filter @primitiv-ui/react add -D @stryker-mutator/core @stryker-mutator/vitest-runner
```

Then author and adapt `stryker.config.mjs`:

- Use the Vitest runner (`@stryker-mutator/vitest-runner`) — this repo's suite is Vitest + jsdom.
- Mutate component source only. Mirror the coverage-exclude list in `vite.config.ts`: exclude test files (`**/*.test.{ts,tsx}`, `**/__tests__/**`), the pure-type modules (`types.ts`), and barrels (`index.ts`).
- Optionally add `@stryker-mutator/typescript-checker` so type-invalid mutants are reported as compile errors instead of wasting test time (this is a TypeScript-only library).
- Keep setup changes reviewable: dependencies, config, the `mutate*` scripts, and `.gitignore` entries for Stryker temp/report output (`reports/`, `.stryker-tmp/`).

### Step 3: Per-Component Commands

This repo scopes mutation **one component at a time** via `STRYKER_COMPONENT`
and a per-component allowlist (the config reads the env var and narrows both
`mutate` and the Vitest dry-run). The package scripts:

```json
{
  "scripts": {
    "mutate": "stryker run",
    "mutate:component": "node ../../scripts/mutate.mjs"
  }
}
```

- `pnpm --filter @primitiv-ui/react mutate:component Button` — mutate a single
  component (sets `STRYKER_COMPONENT=Button`).
- `pnpm --filter @primitiv-ui/react mutate` — mutate the whole allowlist (every
  component already held at 100%).

Widen coverage by bringing one new component to a full kill, then adding it to
the allowlist — never by relaxing the gate.

Use exact line ranges for tiny follow-up checks when the report points to a
specific survivor:

```bash
pnpm exec stryker run --mutate "src/Button/Button.tsx:80-92"
```

### Step 4: Run and Triage

Run `mutate:component <Name>` for focused feedback while strengthening one component. Run `mutate` (the whole allowlist) after changing shared test infrastructure or the Stryker/Vitest config, to confirm nothing already-green regressed.

Categorize Stryker findings:

| Category | Description | Action Required |
|----------|-------------|-----------------|
| Killed | Test failed when mutant was applied | None - tests are effective |
| Survived | Tests passed with mutant active | Add/strengthen test, unless equivalent |
| No Coverage | No test exercises this code | Add behavior test |
| Equivalent | Mutant produces same behavior | None - not a real bug |

Fix obvious issues immediately:

- Missing boundary tests
- Weak or absent assertions
- One-sided branch coverage
- Missing side-effect verification
- High-value business rules such as money, permissions, eligibility, safety, or data loss

Use the harness's ask-question facility for subtle survivors that require human judgment. Ask one concise question with concrete choices, explain the mutation, and describe the tradeoff. Use this when behavior is intentionally unspecified, the correct domain rule is unclear, the test would be expensive or brittle, or the mutant may be equivalent but you are not certain.

### Step 5: Kill Survivors With TDD

For each survivor worth killing:

1. Keep or recreate the mutant.
2. Write the smallest behavior test that fails against the mutant for the right reason.
3. Restore the original production code.
4. Verify the new test passes.
5. Re-run Stryker scoped to the mutated file or line range, then re-run `mutate:component <Name>` to confirm the component is fully killed.

Avoid overfitting tests to implementation details. Strong mutation tests assert observable behavior: return values, persisted state, emitted events, permissions, messages, or meaningful collaborator calls.

## Stryker Configuration Guidance

Stryker should be the normal entry point for JS/TS mutation testing.

### Starting Configuration

The config is `packages/react/stryker.config.mjs` and reads `STRYKER_COMPONENT`
to scope the run. The shape (see `docs/mutation-testing-plan.md` for the full
version):

```javascript
const component = process.env.STRYKER_COMPONENT; // e.g. "Button"

export default {
  testRunner: "vitest",
  coverageAnalysis: "perTest",
  reporters: ["html", "clear-text", "progress"],
  mutate: [
    `src/${component}/**/*.{ts,tsx}`,
    "!src/**/*.test.{ts,tsx}",
    "!src/**/__tests__/**",
    "!src/**/types.ts",
    "!src/**/index.ts"
  ]
}
```

**Vitest environment:** the suite runs in **jsdom** (Node-based), which the
Stryker Vitest runner supports directly — there is no Browser Mode concern
here. `coverageAnalysis: "perTest"` maps each mutant to its covering tests so
only those re-run, and `vite.config.ts` narrows the dry-run's `test.include` to
the target component when `STRYKER_COMPONENT` is set.

### CI and Quality Gates

- The gate is a **hard 100%** mutation score (`break: 100`) for every allowlisted component — a single survivor fails the run. There is no "baseline first" ramp: a component only joins the allowlist once it already kills every mutant.
- `mutation.yml` runs the allowlist (a per-component matrix as the list grows), uploads the HTML report as an artifact with **`if: always()`** and writes the clear-text score to the job summary — so survivors are inspectable on a failed run without running the suite locally.
- `// Stryker disable` is an absolute last resort, reserved for provably-equivalent mutants with a written justification — never a way to lift the score.

### Manual Mutation Fallback

If Stryker is unavailable or cannot target the code under review, load `resources/mutator-rules.md` and manually apply the relevant operators. Always revert each mutation before the next one. Manual mutation should still follow the same loop: mutate, run tests, classify, fix obvious gaps, ask about judgment calls, and report the result.

---

## Summary: Mutation Testing Mindset

**The key question for every line of code:**

> "If I introduced a bug here, would my tests catch it?"

**For each test, verify it would catch:**
- Arithmetic operator changes
- Boundary condition shifts
- Boolean logic inversions
- Removed statements
- Changed return values

**Remember:**
- Coverage measures execution, mutation testing measures detection
- A test that doesn't make assertions can't kill mutants
- Boundary values, mixed boolean cases, non-identity values, and observable side effects kill many common mutants
- For the full mutator checklist and examples, load `resources/mutator-rules.md`
