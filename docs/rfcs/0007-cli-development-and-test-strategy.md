# RFC 0007 — CLI development & test strategy

> **Status:** Draft
> **Author:** simonrevill, with architectural review
> **Date:** 2026-06-09
> **Relates to:** RFC 0005 (the CLI this tests), RFC 0006 (the emitter), the
> `CLAUDE.md` working style (strict TDD, 100% coverage, pure red-green), the
> `react-test-conventions` skill (the convention this mirrors for Rust), and the
> `rust-wasm-workflow` skill (cargo commands, the `harmoni-core` boundary).

---

## 0. Summary

The Primitiv CLI is a critical, user-facing tool — a mistake corrupts a
consumer's repo. It is built under the same discipline as everything else:
strict TDD, red → green → refactor, **100% coverage**, pure red-green (no
characterisation tests). But a CLI is mostly *effects* — filesystem writes,
spawning package managers, fetching a registry, patching configs — and testing
effects naïvely yields slow, flaky, network-coupled tests. This RFC designs the
test environment that keeps the CLI as TDD-able as a pure function.

The moves:

1. **Pure core, thin effectful edges** — all logic is pure functions over data;
   every effect sits behind a small trait (port) that tests fake (§2).
2. **The agent flags are the test seams** — `--json`, `--yes`, `--dry-run`,
   `--registry <path>` (designed in RFC 0005 for agents) are exactly what makes
   the CLI deterministically testable. One design, two consumers (§2.3).
3. **A test pyramid** — many pure unit tests, golden tests for the emitter,
   fake-injected command tests, a few real-binary end-to-end tests (§3).
4. **Hand-authored golden files** — expected outputs are written by hand
   (encoding design intent), asserted by exact compare; **snapshot testing
   (`insta`) is ruled out entirely** — a snapshot passes the moment you accept
   whatever the code emitted, which is a characterisation test (D31, §6).
5. **100% everywhere + Rust in CI** — the whole CLI workspace holds 100%
   coverage, enforced by a new `cargo test` + `cargo llvm-cov` CI job (Rust
   currently runs in no workflow) (D30, §7).

## 0.1 Scope

In scope: the CLI crate layout, the ports/adapters seam, the test pyramid and
tooling, fixtures, the golden-file discipline, the coverage/CI policy, and the
red-green cycle for a CLI feature. Out of scope: the command *behaviour* (RFC
0005), the token *transform* (RFC 0006), and the React test conventions (the
`react-test-conventions` skill — mirrored here, not redefined).

---

## 1. Principles

1. **Same discipline as the rest of the repo.** Red → green → refactor, one
   commit per cycle, 100% coverage, pure red-green. The CLI gets no exemption
   for being "just glue."
2. **Logic is pure; effects are injected.** If a function touches the disk, the
   network, or a subprocess, that effect is a trait the caller passes in. The
   real binary passes real adapters; tests pass fakes.
3. **Determinism.** Given fixtures and fake adapters, a test's result never
   depends on the machine, the network, an installed package manager, or wall
   time.
4. **The expected output is authored, not captured.** A test states the intended
   result first and fails until the code meets it. Nothing is "blessed" after
   the fact (§6).
5. **Conventions mirror the existing code.** Co-located `_tests.rs` siblings
   (like `harmoni-core`), shared pure-data fixtures (like the React side).

---

## 2. Architecture — pure core, ports & adapters

### 2.1 Crate layout (extends the workspace)

```
crates/
  harmoni-core/      # existing — palette engine; linked by `theme`
  harmoni-wasm/      # existing
  primitiv-emit/     # NEW — pure DTCG → {css,scss,tailwind} transform (RFC 0006; TS dropped, D50)
  primitiv-cli/      # NEW — lib + thin bin
    src/
      lib.rs         # all logic; co-located `_tests.rs` siblings
      main.rs        # thin: parse args → call lib; no logic
      ...
    tests/           # NEW for the repo — end-to-end binary tests (assert_cmd)
```

- **`primitiv-emit`** is a pure crate: DTCG in, format strings out. A pure
  transform is the most TDD-able thing there is — golden tests cover it
  exhaustively, and both `tokens` and `theme` reuse it.
- **`primitiv-cli`** is split **lib + thin bin**: `lib.rs` holds the logic so it
  is testable without spawning a process; `main.rs` only parses args and calls in.
- **`theme`** links `harmoni-core` natively (no new engine).

### 2.2 The ports

Every effect is a trait; the logic depends on the trait, never on `std::fs` /
`std::process` / the network directly.

| Port | Responsibility | Real adapter | Test double |
|---|---|---|---|
| `FileSystem` | read / write / exists / hash | `std::fs` | temp dir (`assert_fs`) or in-memory map |
| `PackageManager` | "ensure dep X" via pnpm/npm/yarn/bun | spawn the manager | **recording fake** — captures the intended command, runs nothing |
| `Registry` | fetch `registry.json` + component files | HTTPS / GitHub raw | local fixture dir (this *is* `--registry <path>`) |
| `Prompter` | interactive questions | TTY prompts | scripted answers — but mostly bypassed (§2.3) |

Sketch:

```rust
trait FileSystem { fn read(&self, p: &Path) -> io::Result<Vec<u8>>; fn write(&self, p: &Path, b: &[u8]) -> io::Result<()>; fn exists(&self, p: &Path) -> bool; }
trait PackageManager { fn ensure(&self, dep: &str) -> Result<Action>; } // fake records `Action`, runs nothing
trait Registry { fn manifest(&self) -> Result<RegistryIndex>; fn component(&self, name: &str) -> Result<ComponentFiles>; }
```

The `add` flow becomes a **pure planner** + an applier: `plan(config, registry,
fs_state) -> Vec<Action>` is a pure function (trivially unit-tested), and
applying the plan goes through the ports.

### 2.3 The agent flags are the test seams

RFC 0005 gave every command a non-interactive mode for agents. The same
affordances make it testable — we get the test harness for free:

- `--json` → tests parse structured stdout instead of scraping prose.
- `--yes` / `--no-*` → tests drive decisions without a TTY (the `Prompter` is
  rarely needed).
- `--dry-run` → tests assert "wrote nothing" by checking the temp dir is
  unchanged.
- `--registry <path>` → tests point at a fixture registry; **no network, ever**.

This is the payoff of designing for agents: the agent surface and the test
surface are the same surface.

---

## 3. The test pyramid

| Layer | Count | Where | What it proves |
|---|---|---|---|
| **Unit — pure core** | many | `lib.rs` `_tests.rs` siblings | config parse/merge, registry resolution + transitive-dep planning, the `add` plan, diff/hash refresh, detection logic |
| **Emitter golden** | per format × shape | `primitiv-emit` `_tests.rs` + `tests/golden/` | the exact bytes of emitted CSS/SCSS/Tailwind (TS dropped, D50) |
| **Command (fakes)** | medium | `primitiv-cli` `_tests.rs` | a command orchestrates the ports correctly — recorded PM commands + resulting in-memory FS |
| **End-to-end (real bin)** | few | `crates/primitiv-cli/tests/` | the real binary: arg-parsing, adapter wiring, exit codes, real files on disk |

The pyramid keeps the slow layer (real-binary e2e) thin: most behaviour is
proven by fast pure/fake tests, and e2e only covers what the lower layers fake
out (true arg-parse + real adapter wiring).

---

## 4. Measuring outputs

How each kind of result is asserted — the answer to "how do we measure the
output of each test":

| Output | How it's measured |
|---|---|
| A returned value/struct | `assert_eq!` (derive `PartialEq` + `Debug`) |
| Generated file content (tokens, styles) | exact compare vs a **hand-authored golden file** (`include_str!`) |
| Filesystem effects | `assert_fs`: `tmp.child("src/styles/tokens.css").assert(predicate::path::exists())` + content predicate |
| Process behaviour | `assert_cmd`: `.assert().success()` / `.code(2)` / `.stdout(...)` / `.stderr(...)` |
| Machine output (`--json`) | parse stdout into `serde_json::Value` / a typed struct, assert fields |
| "Wrote nothing" (`--dry-run`) | assert the temp dir is byte-for-byte unchanged |
| A package-manager call | inspect the recording fake's captured `Action`s |

---

## 5. Fixtures

Pure data, shared across tests, mirroring the React fixture convention:

- **Fixture project** — a fake consumer repo (a `package.json`, a lockfile, and
  framework markers like `vite.config.ts` / `next.config.js`) so detection,
  wiring, and `add` run against a realistic tree in a temp dir.
- **Fixture registry** — a local `registry.json` + a couple of components
  (`button`, `switch`) with `contract.json` and per-format files, passed via
  `--registry <path>`.
- **Fixture DTCG** — a trimmed token set feeding `primitiv-emit` golden tests.
- **Golden outputs** — the hand-authored expected files (§6).

---

## 6. Red-green discipline & golden files (D31)

Snapshot tools (`insta`) auto-generate a snapshot and you `cargo insta accept`
it — so the test **passes the moment you accept whatever the code emitted**.
That is a characterisation test, and it violates the repo rule: *no tests that
pass on first run; if one does, delete it.* **Snapshot testing is therefore
ruled out for this workspace** — `insta` is not a dependency, and
`cargo insta accept` is never how behaviour is specified.

So for generated outputs we **author the expected file by hand first**:

1. **RED** — write `tests/golden/tokens.css` (the intended custom properties,
   from the Figma-ported design), then
   `assert_eq!(emit_css(&fixture_tokens()), include_str!("golden/tokens.css"));`.
   It fails — `emit_css` doesn't exist / doesn't match.
2. **GREEN** — implement `emit_css` until the bytes match the authored intent.
3. **REFACTOR** — clean up; the golden file stays the spec.

The golden file encodes *design intent*, not "whatever the code produced." The
readable-diff ergonomics a snapshot tool would have offered come instead from
**`pretty_assertions`** (a drop-in `assert_eq!` with a coloured line diff) — no
snapshot semantics, no accept step, nothing that can pass on first run.

---

## 7. Coverage & CI (D30)

- **100% across the CLI workspace** (`primitiv-emit` + `primitiv-cli`), matching
  the repo-wide rule. Error branches and adapter glue are covered too — via
  fake-injected command tests and the e2e layer — not exempted.
- **The bin shell is covered by e2e, not exempted.** `main.rs` (`env::args`
  collection, the `CliError` → stderr + exit-code map) and the `OsFs` adapter
  are the one part the unit/command layers can't reach. Rather than carve them
  out with `--ignore-filename-regex`, the `tests/cli.rs` e2e layer runs the real
  `primitiv` binary via `CARGO_BIN_EXE`, and `cargo-llvm-cov` merges the
  spawned process's coverage back in — **verified in this repo**: `main.rs`
  reaches 100% regions/functions/lines from the e2e subprocess alone, with no
  exemption. This honours Principle 1 ("no exemption for being just glue"). The
  `OsFs` passthrough is additionally unit-tested against an `assert_fs` temp dir
  (§2.2), since the adapter itself is testable; only the `env::args`/exit-code
  shell genuinely needs the subprocess path. The documented-exemption fallback
  (`--ignore-filename-regex` over `main.rs`) stays unused unless subprocess
  coverage ever regresses.
- **The gate measures lines, regions, AND functions — not lines alone.** A
  lines-only threshold lets an untested branch slip through (the `if`-with-no-
  `else` skip path still counts its lines as hit). The gate is therefore
  `--fail-under-lines 100 --fail-under-regions 100 --fail-under-functions 100`;
  regions are the closest llvm-cov metric to branch coverage, so they are what
  enforce "every branch is driven by a test."
- **Rust enters CI.** Today no workflow runs Rust. A new job runs
  `cargo test --workspace` and `cargo llvm-cov` with the coverage gate on PRs
  touching `crates/**`. (`cargo test --workspace` already covers `harmoni-core`
  locally; CI makes it enforced.)
- Per-cycle, the scoped run is `cargo test -p primitiv-emit` /
  `-p primitiv-cli`; full-workspace + coverage before a push, mirroring the
  React `qa:units` habit.

---

## 8. The TDD cycle for a CLI feature (worked example: `tokens --format css`)

1. **Emitter, RED→GREEN** — author `golden/tokens.css`; `assert_eq!` against
   `emit_css(fixture_tokens())`; fail; implement until match.
2. **Command, RED→GREEN (fakes)** — drive `tokens --format css` with a fake FS +
   fixture registry; assert the file is written at the configured path with the
   golden bytes; implement the command wiring.
3. **End-to-end, RED→GREEN (real bin)** — `assert_cmd` runs `primitiv tokens
   --format css --cwd <tmp> --yes` in an `assert_fs` temp dir; assert exit 0, the
   file on disk equals the golden, and `--json` reports the write.

Each step is one red-green(-refactor) commit. The lower layers make the failures
fast and precise; the e2e layer proves the seams are wired.

---

## 9. Tooling

- `assert_cmd` — run the built binary, assert exit code + stdio.
- `assert_fs` — temp-dir fixtures + filesystem assertions.
- `predicates` — composable assertions for files/strings.
- `serde_json` (dev) — parse and assert `--json` output.
- `cargo-llvm-cov` — coverage measurement + the CI gate.
- `pretty_assertions` (dev) — readable coloured diffs on golden-file mismatch
  (the diff ergonomics that ruled-out `insta` would have provided, §6).
- **No `insta` / snapshot tooling** — ruled out (§6); behaviour is authored, not
  captured.

(Confirm exact versions at build time; pin in each crate's `[dev-dependencies]`.)

---

## 10. What this RFC does not cover

- Command behaviour, flags, `primitiv.json`, the registry format — RFC 0005.
- The token transform and the "one look, many formats" emit — RFC 0006.
- React test conventions — the `react-test-conventions` skill.
- The publish workflow internals — `RELEASING.md`.

---

## 11. Open questions

1. ~~**In-memory `FileSystem` vs always `assert_fs`.**~~ **Resolved (D49):**
   in-memory FS fake for command-layer tests (fastest), `assert_fs` temp dirs for
   the e2e layer (real adapter wiring).
2. ~~**`cargo-llvm-cov` vs `tarpaulin`.**~~ **Resolved (D49):** `cargo-llvm-cov`
   (more accurate, already the assumed tool in §7/§9). Exact CI trigger path
   filter settled when the workflow is written.
3. **Config-format parsers as a fuzz target.** Whether `primitiv.json` and DTCG
   parsing warrant `proptest`/fuzzing beyond example-based tests. *(Deferred —
   decide once the parsers exist; example-based tests first.)*
4. ~~**A `rust-cli-test-conventions` skill.**~~ **Resolved:** written once the
   bin + e2e layer landed, capturing the ports/`InMemoryFs`-failure-injection,
   hand-rolled-parser, golden-file, lib+thin-bin, and e2e-subprocess-coverage
   conventions (`.claude/skills/rust-cli-test-conventions/`).

---

## 12. Decision record

| # | Decision | Maps to |
|---|---|---|
| 1 | Pure core + ports/adapters (`FileSystem`, `PackageManager`, `Registry`, `Prompter`); `primitiv-cli` is lib + thin bin; emitter is its own `primitiv-emit` crate; the agent flags double as test seams | D29 |
| 2 | **100% coverage** across the CLI workspace; **Rust enters CI** (`cargo test` + `cargo llvm-cov` gate), since it runs in no workflow today | D30 |
| 3 | Generated outputs asserted via **hand-authored golden files** + exact compare (pure red-green); **snapshot testing (`insta`) ruled out entirely** (not a dependency); diff ergonomics via `pretty_assertions` | D31 |
