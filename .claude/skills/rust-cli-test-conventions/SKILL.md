---
name: rust-cli-test-conventions
description: How the primitiv-cli / primitiv-emit Rust crates are structured and tested — the ports & adapters seam (FileSystem + InMemoryFs failure injection), the hand-rolled arg parser, hand-authored golden files (no insta), the lib+thin-bin split, and the tests/ e2e layer whose subprocess coverage keeps the shell at 100%. TRIGGER when adding a command, port, adapter, or e2e test under crates/primitiv-cli or crates/primitiv-emit, when wiring a new effect behind a trait, when a coverage region won't close, or when deciding unit vs command vs e2e for a CLI behaviour. SKIP for harmoni-core/wasm engine work (see rust-wasm-workflow) and all React work.
---

# Rust CLI test conventions

The discipline behind `crates/primitiv-cli` and `crates/primitiv-emit`
(RFC 0007). Strict TDD, red→green→refactor, one cycle per commit,
**100% lines + regions + functions** — the same rule as the rest of the
repo, with no exemption for "just glue".

## The exact gate (run before every push)

```sh
cargo test --workspace                              # compiles + runs every crate
cargo llvm-cov --workspace --exclude harmoni-core --exclude harmoni-wasm \
  --fail-under-lines 100 --fail-under-regions 100 --fail-under-functions 100
```

Per-cycle, scope it: `cargo test -p primitiv-cli <filter>` /
`-p primitiv-emit`. `cargo-llvm-cov` isn't always preinstalled in a
fresh container — `cargo install cargo-llvm-cov` + `rustup component add
llvm-tools-preview` if `no such command: llvm-cov`. **Regions are the
branch proxy** — a lines-only pass hides an undriven branch, so the
regions number is the one that bites; drive every branch from a test.

## Crate layout & the test-file convention

```
crates/primitiv-cli/
  src/
    lib.rs            # module list + `#[cfg(test)] mod *_tests;` wiring
    main.rs           # the `primitiv` bin — thin shell, NO logic
    cli.rs            # hand-rolled arg parser → Command enum
    run.rs            # parse + dispatch to a command, threading the port
    error.rs          # CliError: exit_code() + Display (RFC 0005 §5)
    commands/<cmd>.rs # one command, writing through the port
    ports/fs.rs       # FileSystem trait + OsFs adapter + InMemoryFs fake
  tests/cli.rs        # e2e: the real binary via CARGO_BIN_EXE
```

- Tests are **co-located `_tests.rs` siblings** (mirroring `harmoni-core`),
  registered as `#[cfg(test)] mod foo_tests;` next to their module's
  declaration. `error.rs` → `error_tests.rs`, `ports/fs.rs` →
  `ports/fs_tests.rs`.
- `pretty_assertions::assert_eq` everywhere (coloured diffs; the
  ergonomics `insta` would have given **without** snapshot semantics).
- A tiny `fn args(parts: &[&str]) -> Vec<String>` helper turns string
  literals into owned args — copy it per test file, don't share a helper
  module (mirror the React fixtures rule: pure data, not helpers).

## Ports & adapters — the test seam

Every effect is a trait the logic depends on; the real bin passes a real
adapter, tests pass a fake (RFC 0007 §2.2).

```rust
pub trait FileSystem {
    fn read(&self, path: &Path) -> io::Result<Vec<u8>>;
    fn write(&self, path: &Path, bytes: &[u8]) -> io::Result<()>;
    fn exists(&self, path: &Path) -> bool;
}
```

- **`OsFs`** — the real adapter, a thin `std::fs` passthrough with **no
  logic** (policy like directory creation belongs in the command layer,
  where the fake can drive it). Unit-tested against an `assert_fs`
  `TempDir`, since the adapter itself is testable.
- **`InMemoryFs`** — a `#[cfg(test)]` fake: writes land in a
  `RefCell<HashMap<PathBuf, Vec<u8>>>`, reads of unwritten paths report
  `NotFound` (mirroring `std::fs`). Command-layer tests use this — fast,
  deterministic, no real files.
- **Failure injection** — `fail_writes_to(path)` makes one path's
  `write` return `PermissionDenied`, so the `CliError::Io` branch is
  driven without an unwritable real filesystem. This is how you close
  the error-path region a happy-path test leaves open. Add a parallel
  knob (`fail_reads_to`, …) when a new effect needs its error branch
  covered.

The command is the seam's consumer: `theme(fs: &impl FileSystem, …)`
takes the port by generic, so the same function runs on `OsFs` in the
bin and `InMemoryFs` in tests.

## The arg parser is hand-rolled, not clap (deliberate)

`cli.rs` parses `&[String]` (process args minus the bin name) into a
plain `Command` data enum via a hand-written `match`. **No clap.**
Clap's derived branches can't reach 100% regions without a carve-out;
the surface is small (RFC 0005 §2), so a hand-rolled parser keeps every
branch — unknown command, missing required flag, flag-without-value,
unexpected trailing arg — under a direct test. Keep `parse` a **pure
function returning `Result<Command, CliError>`** so it unit-tests with
no I/O. Flags are order-free (`while let Some(flag) = iter.next()` with a
`take_value` helper that errors when a flag ends the args).

## Golden files: authored, never captured

Generated output (`primitiv-emit` CSS/SCSS/TS/Tailwind) is asserted by
exact compare against a **hand-authored** expected file — write the
intended bytes first (encoding design intent), then make the emitter
match. **`insta` / snapshot testing is ruled out** (a snapshot passes
the moment you accept whatever the code emitted — a characterisation
test, which the repo bans). No `cargo insta accept`, ever. The
readable-diff ergonomics come from `pretty_assertions` instead.

## The test pyramid — pick the lowest layer that proves it

| Layer | Where | Use it for |
|---|---|---|
| **Unit (pure)** | `*_tests.rs` siblings | parser, `exit_code`/`Display`, planners, any pure logic |
| **Emitter golden** | `primitiv-emit` `*_tests.rs` | exact emitted bytes |
| **Command (fake)** | `commands/*_tests.rs` + `InMemoryFs` | a command orchestrates the port correctly |
| **E2e (real bin)** | `crates/primitiv-cli/tests/cli.rs` | arg-parse + adapter wiring + exit codes on real files |

Most behaviour is proven by the fast lower layers; the e2e layer stays
thin and only covers what they can't fake.

## The bin shell & e2e subprocess coverage

`main.rs` is the one part the unit/command layers can't reach —
`env::args` collection and the `CliError` → `eprintln!("primitiv: …")` +
`ExitCode::from(error.exit_code())` map. It is **covered by e2e, not
exempted**:

```rust
// tests/cli.rs
use assert_cmd::Command;
use assert_fs::prelude::*;
use predicates::prelude::*;

Command::cargo_bin("primitiv").unwrap()
    .args(["theme", "--brand", "#0a7755", "--out"]).arg(out.path())
    .assert().success();
```

`cargo-llvm-cov` merges the spawned binary's coverage back into the
report (**verified in this repo** — `main.rs` reaches 100% from the e2e
subprocess alone), so there is **no `--ignore-filename-regex`
carve-out**. Two e2e tests cover the whole shell: one success path
(asserts the written file) and one error path (`.code(2)` +
`.stderr(contains("primitiv: …"))`). The documented-exemption fallback
exists only if subprocess coverage ever regresses.

- The bin target is named `primitiv` via an explicit `[[bin]]` in
  `Cargo.toml` (the package is `primitiv-cli`); `CARGO_BIN_EXE_primitiv`
  / `cargo_bin("primitiv")` then resolve it.
- `main` returns `std::process::ExitCode` (`ExitCode::from(u8)`) — exit
  codes are `u8` and stable per failure source (RFC 0005 §5): `2` usage,
  `3` invalid colour, `4` I/O; new variants take a new code.

## Dev-deps (pin in each crate's `[dev-dependencies]`)

`pretty_assertions` (diffs), `assert_fs` (temp dirs + file predicates),
`assert_cmd` (run the bin, assert exit/stdio), `predicates` (composable
string/file assertions). **Never `insta`.**
