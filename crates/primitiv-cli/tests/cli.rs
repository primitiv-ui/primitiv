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
fn init_detects_the_components_alias_from_a_real_tsconfig() {
    let dir = assert_fs::TempDir::new().unwrap();
    dir.child("package.json").write_str("{}").unwrap();
    dir.child("tsconfig.json")
        .write_str(r#"{ "compilerOptions": { "paths": { "@/*": ["./src/*"] } } }"#)
        .unwrap();

    Command::cargo_bin("primitiv")
        .unwrap()
        .current_dir(dir.path())
        .arg("init")
        .assert()
        .success();

    dir.child("primitiv.json").assert(predicate::str::contains(
        "\"aliases\": { \"components\": \"@/components\" }",
    ));
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
fn add_dry_run_reports_the_resolved_plan_without_installing() {
    // `--dry-run` keeps the e2e from shelling out to a real package manager: it
    // reports the plan and stops (RFC 0005 §5). The install path is proven at the
    // command layer with the process-runner fake.
    Command::cargo_bin("primitiv")
        .unwrap()
        .args(["add", "button", "switch", "--dry-run"])
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
        .args(["add", "button", "--json", "--dry-run"])
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
fn add_styles_only_copies_the_styled_surface_on_the_real_filesystem() {
    // `--styles-only` skips the package install, so this is the one `add` e2e
    // that runs the real copy without shelling out to a live package manager:
    // it proves the OsFs write + create_dir_all + EmbeddedRegistry file fetch +
    // config + alias resolution all wire up (RFC 0005 §4.1 step 4).
    let dir = assert_fs::TempDir::new().unwrap();
    dir.child("primitiv.json")
        .write_str(
            r##"{
  "version": 1,
  "framework": "react",
  "styles": { "enabled": true, "format": "css", "path": "src/styles/primitiv" },
  "tokens": { "format": "css", "path": "src/styles/primitiv/tokens.css" },
  "theme": { "brand": "#0a7755" },
  "aliases": {},
  "registry": { "version": "0.1.0" }
}"##,
        )
        .unwrap();
    // The `@/*` → `./src/*` mapping resolves the React surface to `src/components`.
    dir.child("tsconfig.json")
        .write_str(r#"{ "compilerOptions": { "paths": { "@/*": ["./src/*"] } } }"#)
        .unwrap();

    Command::cargo_bin("primitiv")
        .unwrap()
        .current_dir(dir.path())
        .args(["add", "button", "--styles-only"])
        .assert()
        .success();

    // The stylesheet lands in the styles path...
    dir.child("src/styles/primitiv/button/styles.css")
        .assert(predicate::str::contains(".primitiv-button"));
    // ...and the React surface in the alias-resolved components directory.
    dir.child("src/components/button.tsx")
        .assert(predicate::str::contains("export"));
    dir.child("src/components/button.recipe.ts")
        .assert(predicate::path::exists());
}

#[test]
fn add_dry_run_emits_the_refresh_plan_when_styles_are_configured() {
    // Covers the OsFs monomorphisation of the dry-run refresh report path: with a
    // primitiv.json present, `add --dry-run` appends the "Refresh plan:" section
    // classifying each destination file (all new here since nothing is on disk).
    let dir = assert_fs::TempDir::new().unwrap();
    dir.child("primitiv.json")
        .write_str(
            r##"{
  "version": 1,
  "framework": "react",
  "styles": { "enabled": true, "format": "css", "path": "src/styles/primitiv" },
  "tokens": { "format": "css", "path": "src/styles/primitiv/tokens.css" },
  "theme": { "brand": "#0a7755" },
  "aliases": {},
  "registry": { "version": "0.1.0" }
}"##,
        )
        .unwrap();

    Command::cargo_bin("primitiv")
        .unwrap()
        .current_dir(dir.path())
        .args(["add", "button", "--dry-run"])
        .assert()
        .success()
        .stdout(predicate::str::contains("Resolved 1 component to add:"))
        .stdout(predicate::str::contains("Refresh plan:"))
        .stdout(predicate::str::contains("new"));
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
fn add_tailwind_project_prints_wiring_snippet_in_non_interactive_mode() {
    // The binary is never a TTY under assert_cmd, so interactive=false. For a
    // Tailwind-format project that print the wiring snippet to stdout after copy.
    let dir = assert_fs::TempDir::new().unwrap();
    dir.child("primitiv.json")
        .write_str(
            r##"{
  "version": 1,
  "framework": "react",
  "styles": { "enabled": true, "format": "tailwind", "path": "src/styles/primitiv" },
  "tokens": { "format": "css", "path": "src/styles/primitiv/tokens.css" },
  "theme": { "brand": "#0a7755" },
  "aliases": {},
  "registry": { "version": "0.1.0" }
}"##,
        )
        .unwrap();
    dir.child("tsconfig.json")
        .write_str(r#"{ "compilerOptions": { "paths": { "@/*": ["./src/*"] } } }"#)
        .unwrap();

    Command::cargo_bin("primitiv")
        .unwrap()
        .current_dir(dir.path())
        .args(["add", "button", "--styles-only"])
        .assert()
        .success()
        .stdout(predicate::str::contains("@custom-variant dark"))
        .stdout(predicate::str::contains("Tailwind wiring"));
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
