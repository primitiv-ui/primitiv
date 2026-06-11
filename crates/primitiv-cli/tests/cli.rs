//! End-to-end tests for the real `primitiv` binary (RFC 0007 §3, the top of the
//! test pyramid). The lower layers fake the filesystem and parse args in
//! isolation; these run the built bin via `CARGO_BIN_EXE` against an
//! `assert_fs` temp dir, proving the shell only the bin owns — `env::args`
//! collection, the `OsFs` adapter wiring, and the CliError → stderr + exit-code
//! mapping (RFC 0005 §5). cargo-llvm-cov collects the subprocess's coverage, so
//! `main.rs` is covered here rather than exempted ("glue not exempted").

use assert_cmd::Command;
use assert_fs::prelude::*;
use predicates::prelude::*;

#[test]
fn writes_the_brand_theme_and_exits_zero() {
    let dir = assert_fs::TempDir::new().unwrap();
    let out = dir.child("primitiv.theme.css");

    Command::cargo_bin("primitiv")
        .unwrap()
        .args(["theme", "--brand", "#0a7755", "--out"])
        .arg(out.path())
        .assert()
        .success();

    out.assert(predicate::str::contains("--primitiv-color-brand-500"));
}

#[test]
fn reports_a_usage_error_on_stderr_and_exits_two() {
    Command::cargo_bin("primitiv")
        .unwrap()
        .arg("bogus")
        .assert()
        .code(2)
        .stderr(predicate::str::contains("primitiv: unknown command 'bogus'"));
}
