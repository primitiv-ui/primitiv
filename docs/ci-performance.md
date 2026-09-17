# CI performance — where the time goes, and what to do about it

**Measured 2026-09-17** against CI run
[`35258531040`](https://github.com/primitiv-ui/primitiv/actions/runs/35258531040)
(`ci.yml`, commit `657231f`, ubuntu-latest, green). Nothing here has been
built — this is the analysis to revisit before spending time on it.

**Read the measured/inferred split before acting on anything below.** The step
timings are real, taken from the Actions API. What is slow *inside* the
six-minute test step has **not** been measured, and the per-item suggestions in
§4 are informed guesses. Measure before implementing any of them.

---

## 1. The measured picture

One job, 21 steps, run serially. Total **11m14s**.

| Step | Wall clock | Share |
| --- | --- | --- |
| **Test libraries** | **5m59s** | 53% |
| **Check docs-data is current** | **3m45s** | 33% |
| Type-check libraries | 15s | 2% |
| Codecov uploads (×3) | 17s | 3% |
| Setup (checkout, pnpm, node, rust, wasm-pack) | 19s | 3% |
| Build harmoni-wasm | 12s | 2% |
| Build workbench | 8s | 1% |
| Type-check registry wrappers | 6s | 1% |
| Check headless prop-type hygiene | 3s | <1% |
| Install dependencies (cached) | 2s | <1% |
| Generate icons · stylesheets · data-attributes | 3s total | <1% |

**Two steps are 87% of the run.** Everything else together is under a minute,
so effort spent anywhere but those two is effort wasted.

---

## 2. The surprise: `docs-data` is a third of CI, and it is not a test

`qa:docs-data` runs `scripts/docs-data/sync-docs-data.mjs --check`, which
regenerates every component's `.docs.json` and asks git whether the tree moved.
The regeneration spawns **one Node subprocess per component**:

```js
const run = spawnSync(
  process.execPath,
  [join(HERE, "extract-docs-data.mjs"), id],
  { cwd: ROOT, encoding: "utf8" },
);
```

**62 components, serially.** Each pays a cold Node boot plus — whatever the
extractor does to read types — almost certainly a fresh TypeScript program.
3m45s / 62 ≈ **3.6s each**, which is about what a cold TS program costs.

**This is the cheapest large win available**, and it is an ordinary
refactor rather than a CI trick: build the program once, loop the components
inside one process. The `--check` contract is unaffected — it regenerates in
place and diffs with git, so nothing about *what* "current" means changes,
only how many processes compute it.

Expected: **3m45s → well under 30s**. Unmeasured, but the arithmetic is not
subtle.

The per-component subprocess is not an accident worth being rude about: the
generator was originally per-component and hand-run (the file's own header says
so), and `sync-docs-data.mjs` wrapped it rather than rewriting it. That was the
right call at the time. It is now the most expensive thing in CI after the
tests.

---

## 3. The structural win: split the job

`ci.yml` is a single `test` job running all 21 steps in sequence. But the test
run, the type-checks, `docs-data`, the stylesheet check and the workbench build
share nothing except setup — there is no ordering constraint between them.

Split into parallel jobs and wall clock becomes `max(slowest)` instead of
`sum(all)`:

- **11m14s → ~6m**, bounded by the test step alone
- **no change to any test, any threshold, or any check's semantics**

The cost is duplicated setup per job — checkout, pnpm, setup-node, the
harmoni-wasm build, install — about **35s**. At three or four jobs that is
comfortably worth it.

**Do this first.** It is the only item here with no behavioural risk at all,
and it compounds with everything else: once the tests are the only thing on the
critical path, every later saving shows up directly in wall clock.

---

## 4. The test step (5m59s) — options, none yet measured

`pnpm -r --filter @primitiv-ui/react --filter …/icons --filter …/tokens qa:units`,
where each package's `qa:units` is `vitest run --coverage`. `packages/react` is
449 test files, ~2,500 tests, jsdom, v8 coverage, thresholds at 100% for lines,
branches, functions and statements.

**Verified while measuring:** `packages/react` declares no dependency on
`icons` or `tokens`, so pnpm has no topological reason to serialise the three.
Worth confirming they actually run concurrently before assuming the 5m59s is
all `react`.

### 4.1 Sharding — the standard answer, with a complication that is ours

```yaml
strategy:
  matrix:
    shard: [1, 2, 3, 4]
steps:
  - run: pnpm --filter @primitiv-ui/react vitest run --shard=${{ matrix.shard }}/4
```

~6m → ~1.5m wall clock.

**The 100% coverage gate is what makes this awkward.** Thresholds are enforced
per run, and no single shard executes all the code, so every shard fails its
own threshold check. Sharding therefore requires:

1. shards run with `--coverage` but **thresholds off**,
2. each shard's lcov uploaded as an artifact,
3. a final job that merges them and asserts the thresholds.

That turns one legible failure into a two-stage one, and the gate is
non-negotiable (CLAUDE.md working style 1). **Not worth it until §2 and §3 are
done** — those two get most of the wall clock back without touching how
coverage is enforced.

### 4.2 Cheaper levers, roughly best-value first

- **Cache Vite's transform cache** (`node_modules/.vite`), keyed on the lockfile
  plus a source hash. 449 files plus dependencies are transformed cold on every
  run.
- **`pool: 'threads'`** rather than the default forks. Usually a solid win and
  it keeps per-file isolation.
- **Per-package environment.** `@primitiv-ui/tokens` is unlikely to need jsdom
  at all; `environmentMatchGlobs` lets node-only suites skip the jsdom setup.
- **`--reporter=dot`** in CI. Marginal, free.

### 4.3 Rejected, with reasons

- **happy-dom in place of jsdom.** Typically 2–3× faster, and wrong for this
  library. The suite's value is DOM *fidelity* — Popover API, `:has()`, author
  `display` beating `[hidden]`, real `userEvent` sequences — and CLAUDE.md
  already records several bugs that only a real browser surfaced. Swapping the
  DOM implementation to save minutes on the suite whose whole point is fidelity
  trades the asset for the cost.
- **`isolate: false`.** A large speedup, and a direct route to the worst class
  of failure: cross-test leakage through `useId`, portals, popovers and
  module-level collections, surfacing as flaky-only-in-CI. The suite is the
  thing that makes 100% mutation scores meaningful; making it unreliable to
  make it fast is the wrong direction.

---

## 5. Suggested order

1. **Batch `docs-data` into one process** (§2) — biggest single saving, ordinary
   refactor, no CI machinery.
2. **Split `ci.yml` into parallel jobs** (§3) — no behavioural risk, and it is
   what makes every later saving visible.
3. **Measure the test run** before touching it — `--coverage` on vs off, threads
   vs forks, with and without the Vite cache. §4.2 is guesswork until then.
4. **Shard only if still needed** (§4.1), accepting the merged-coverage
   machinery as its real price.

After 1 and 2, the projected run is bounded by the test step at roughly **6
minutes**, down from 11m14s, with nothing about the tests or the gates changed.

---

## 6. What has not been established

- **Where the 5m59s actually goes.** No profiling has been done inside the test
  run. Coverage instrumentation could plausibly be 10% or 40% of it; the honest
  answer is that nobody has looked.
- **Whether the three library suites run concurrently** under `pnpm -r`. There
  is no dependency forcing them to serialise, but that is not the same as
  observing that they do not.
- **What `extract-docs-data.mjs` spends its 3.6s on.** The TypeScript-program
  hypothesis fits the number, and is a hypothesis.
