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
fn init_writes_a_primitiv_json_into_the_working_directory() {
    let dir = assert_fs::TempDir::new().unwrap();
    dir.child("package.json").write_str("{}").unwrap();

    Command::cargo_bin("primitiv")
        .unwrap()
        .current_dir(dir.path())
        .arg("init")
        .assert()
        .success();

    let config = dir.child("primitiv.json");
    config.assert(predicate::str::contains(
        "\"$schema\": \"https://primitiv-ui.dev/schema/primitiv.json\"",
    ));
    config.assert(predicate::str::contains("\"brand\": \"#0a7755\""));
}

#[test]
fn init_refuses_to_run_outside_a_node_project_and_exits_eight() {
    let dir = assert_fs::TempDir::new().unwrap();

    // An empty directory with no package.json: there is no project to configure.
    Command::cargo_bin("primitiv")
        .unwrap()
        .current_dir(dir.path())
        .arg("init")
        .assert()
        .code(8)
        .stderr(predicate::str::contains(
            "primitiv: no package.json found in",
        ));

    dir.child("primitiv.json")
        .assert(predicate::path::missing());
}

#[test]
fn list_prints_the_registry_components() {
    Command::cargo_bin("primitiv")
        .unwrap()
        .arg("list")
        .assert()
        .success()
        .stdout(predicate::str::contains("COMPONENT"))
        .stdout(predicate::str::contains("button"));
}

#[test]
fn list_json_streams_the_raw_registry_index() {
    Command::cargo_bin("primitiv")
        .unwrap()
        .args(["list", "--json"])
        .assert()
        .success()
        .stdout(predicate::str::contains("\"components\""));
}

#[test]
fn add_reports_the_resolved_plan() {
    Command::cargo_bin("primitiv")
        .unwrap()
        .args(["add", "button", "switch"])
        .assert()
        .success()
        .stdout(predicate::str::contains("Resolved 2 components to add:"))
        .stdout(predicate::str::contains("button"))
        .stdout(predicate::str::contains("switch"))
        .stdout(predicate::str::contains("Packages to ensure:"))
        .stdout(predicate::str::contains("@primitiv-ui/react"));
}

#[test]
fn add_json_emits_the_structured_plan() {
    Command::cargo_bin("primitiv")
        .unwrap()
        .args(["add", "button", "--json"])
        .assert()
        .success()
        .stdout(predicate::str::contains("\"components\""))
        .stdout(predicate::str::contains("\"name\": \"button\""))
        .stdout(predicate::str::contains("\"@primitiv-ui/react\""));
}

#[test]
fn add_rejects_an_unknown_component_and_exits_nine() {
    Command::cargo_bin("primitiv")
        .unwrap()
        .args(["add", "nope"])
        .assert()
        .code(9)
        .stderr(predicate::str::contains(
            "primitiv: component 'nope' is not in the registry",
        ));
}

#[test]
fn tokens_streams_the_layer_to_stdout_when_config_less() {
    let dir = assert_fs::TempDir::new().unwrap();

    // No primitiv.json anywhere above the temp dir, so the layer goes to stdout.
    Command::cargo_bin("primitiv")
        .unwrap()
        .current_dir(dir.path())
        .args(["tokens", "--format", "css"])
        .assert()
        .success()
        .stdout(predicate::str::contains("@layer primitiv.tokens"));
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
