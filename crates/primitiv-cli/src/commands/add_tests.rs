use std::path::Path;

use pretty_assertions::assert_eq;

use crate::commands::add::{add, AddOptions};
use crate::error::CliError;
use crate::ports::fs::{FileSystem, InMemoryFs};
use crate::ports::output::InMemoryOutput;
use crate::ports::process::InMemoryProcessRunner;
use crate::ports::registry::InMemoryRegistry;

/// A registry of two independent components, neither depending on the other.
const FLAT: &[u8] = br##"{
  "version": "0.1.0",
  "components": {
    "button": { "version": "0.1.0" },
    "switch": { "version": "0.2.0" }
  }
}"##;

/// A registry where `field` pulls in two siblings, so resolving it exercises
/// transitive expansion (RFC 0005 §4.4).
const WITH_DEPS: &[u8] = br##"{
  "version": "0.1.0",
  "components": {
    "button": { "version": "0.1.0" },
    "label": { "version": "0.1.0" },
    "field": { "version": "0.3.0", "dependsOn": { "components": ["button", "label"] } }
  }
}"##;

/// A registry whose components declare the npm packages they need, including an
/// overlap so resolving both exercises dedup across package lists (RFC 0005 §4.4).
const WITH_PACKAGES: &[u8] = br##"{
  "version": "0.1.0",
  "components": {
    "button": { "version": "0.1.0", "dependsOn": { "packages": ["@primitiv-ui/react"] } },
    "icon": { "version": "0.2.0", "dependsOn": { "packages": ["@primitiv-ui/react", "@primitiv-ui/icons"] } }
  }
}"##;

/// A registry whose `button` declares a CSS stylesheet to copy (RFC 0005 §6.2),
/// so the style-copy path has something to fetch.
const WITH_STYLES: &[u8] = br##"{
  "version": "0.1.0",
  "components": {
    "button": { "version": "0.1.0", "styles": { "formats": { "css": ["styles.css"] } } }
  }
}"##;

/// A registry whose `button` declares **both** a package to install and a
/// stylesheet to copy, so `--styles-only` / `--no-styles` can be shown to skip
/// exactly one of the two effects.
const WITH_PACKAGE_AND_STYLES: &[u8] = br##"{
  "version": "0.1.0",
  "components": {
    "button": { "version": "0.1.0", "dependsOn": { "packages": ["@primitiv-ui/react"] }, "styles": { "formats": { "css": ["styles.css"] } } }
  }
}"##;

/// A registry whose `button` carries the full styled surface — a CSS stylesheet
/// and the format-independent React surface (recipe + wrapper, D55).
const WITH_STYLED_SURFACE: &[u8] = br##"{
  "version": "0.1.0",
  "components": {
    "button": { "version": "0.1.0", "styles": { "formats": { "css": ["styles.css"] }, "react": ["button.recipe.ts", "button.tsx"] } }
  }
}"##;

/// A `tsconfig.json` mapping the `@/*` alias to `./src/*`, so the React surface
/// resolves to `src/components`.
const TSCONFIG: &[u8] = br#"{ "compilerOptions": { "paths": { "@/*": ["./src/*"] } } }"#;

/// A project config opting into CSS styles under `src/styles/primitiv` — what
/// `init` writes (RFC 0005 §3.1).
const CONFIG: &[u8] = br##"{
  "version": 1,
  "framework": "react",
  "styles": { "enabled": true, "format": "css", "path": "src/styles/primitiv" },
  "tokens": { "format": "css", "path": "src/styles/primitiv/tokens.css" },
  "theme": { "brand": "#0a7755" },
  "aliases": {},
  "registry": { "version": "0.1.0" }
}"##;

/// The same config with the styled surface opted out (`styles.enabled = false`).
const CONFIG_NO_STYLES: &[u8] = br##"{
  "version": 1,
  "framework": "react",
  "styles": { "enabled": false, "format": "css", "path": "src/styles/primitiv" },
  "tokens": { "format": "css", "path": "src/styles/primitiv/tokens.css" },
  "theme": { "brand": "#0a7755" },
  "aliases": {},
  "registry": { "version": "0.1.0" }
}"##;

/// Turn string literals into the owned component list the command takes.
fn names(parts: &[&str]) -> Vec<String> {
    parts.iter().map(|part| part.to_string()).collect()
}

// The reporting/resolution tests run with `dry_run = true` so they exercise only
// the plan, never the install side effect; the install behaviour has its own
// tests below, driven through the recording process-runner fake.

#[test]
fn reports_a_single_resolved_component() {
    let fs = InMemoryFs::new();
    let registry = InMemoryRegistry::new(FLAT);
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &AddOptions { components: names(&["button"]), json: false, dry_run: true, ..Default::default() },
    ).unwrap();

    assert_eq!(
        String::from_utf8(output.captured()).unwrap(),
        "Resolved 1 component to add:\n  button  0.1.0\n",
    );
}

#[test]
fn lists_the_npm_packages_to_ensure_sorted_and_deduplicated() {
    let fs = InMemoryFs::new();
    let registry = InMemoryRegistry::new(WITH_PACKAGES);
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &AddOptions { components: names(&["button", "icon"]), json: false, dry_run: true, ..Default::default() },
    ).unwrap();

    // The packages section lists the union of both components' deps — sorted and
    // with the shared `@primitiv-ui/react` appearing once.
    assert_eq!(
        String::from_utf8(output.captured()).unwrap(),
        "Resolved 2 components to add:\n  button  0.1.0\n  icon    0.2.0\n\n\
         Packages to ensure:\n  @primitiv-ui/icons\n  @primitiv-ui/react\n",
    );
}

#[test]
fn renders_the_plan_as_json_with_components_and_packages() {
    let fs = InMemoryFs::new();
    let registry = InMemoryRegistry::new(WITH_PACKAGES);
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &AddOptions { components: names(&["button", "icon"]), json: true, dry_run: true, ..Default::default() },
    ).unwrap();

    assert_eq!(
        String::from_utf8(output.captured()).unwrap(),
        r#"{
  "components": [
    { "name": "button", "version": "0.1.0" },
    { "name": "icon", "version": "0.2.0" }
  ],
  "packages": [
    "@primitiv-ui/icons",
    "@primitiv-ui/react"
  ]
}
"#,
    );
}

#[test]
fn renders_json_with_an_empty_packages_array_when_there_are_none() {
    let fs = InMemoryFs::new();
    let registry = InMemoryRegistry::new(FLAT);
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &AddOptions { components: names(&["button"]), json: true, dry_run: true, ..Default::default() },
    ).unwrap();

    assert_eq!(
        String::from_utf8(output.captured()).unwrap(),
        r#"{
  "components": [
    { "name": "button", "version": "0.1.0" }
  ],
  "packages": []
}
"#,
    );
}

#[test]
fn reports_several_resolved_components_sorted_and_aligned() {
    let fs = InMemoryFs::new();
    let registry = InMemoryRegistry::new(FLAT);
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();

    // Requested out of order; the plan is sorted and the version column aligned.
    add(
        &fs,
        &registry,
        &output,
        &runner,
        &AddOptions { components: names(&["switch", "button"]), json: false, dry_run: true, ..Default::default() },
    ).unwrap();

    assert_eq!(
        String::from_utf8(output.captured()).unwrap(),
        "Resolved 2 components to add:\n  button  0.1.0\n  switch  0.2.0\n",
    );
}

#[test]
fn pulls_in_transitive_component_dependencies() {
    let fs = InMemoryFs::new();
    let registry = InMemoryRegistry::new(WITH_DEPS);
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &AddOptions { components: names(&["field"]), json: false, dry_run: true, ..Default::default() },
    ).unwrap();

    assert_eq!(
        String::from_utf8(output.captured()).unwrap(),
        "Resolved 3 components to add:\n  button  0.1.0\n  field   0.3.0\n  label   0.1.0\n",
    );
}

#[test]
fn deduplicates_a_component_requested_and_pulled_in_as_a_dependency() {
    let fs = InMemoryFs::new();
    let registry = InMemoryRegistry::new(WITH_DEPS);
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();

    // `button` is both requested and a dependency of `field`: it appears once.
    add(
        &fs,
        &registry,
        &output,
        &runner,
        &AddOptions { components: names(&["field", "button"]), json: false, dry_run: true, ..Default::default() },
    ).unwrap();

    assert_eq!(
        String::from_utf8(output.captured()).unwrap(),
        "Resolved 3 components to add:\n  button  0.1.0\n  field   0.3.0\n  label   0.1.0\n",
    );
}

#[test]
fn errors_when_a_requested_component_is_unknown() {
    let fs = InMemoryFs::new();
    let registry = InMemoryRegistry::new(FLAT);
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();

    let err = add(
        &fs,
        &registry,
        &output,
        &runner,
        &AddOptions { components: names(&["nope"]), json: false, dry_run: true, ..Default::default() },
    ).unwrap_err();

    assert!(matches!(err, CliError::NotFound(_)));
}

#[test]
fn errors_when_a_dependency_is_missing_from_the_registry() {
    // `field` lists `label`, but the registry omits it: the transitive walk fails.
    const DANGLING: &[u8] = br##"{
  "version": "0.1.0",
  "components": {
    "field": { "version": "0.1.0", "dependsOn": { "components": ["label"] } }
  }
}"##;
    let fs = InMemoryFs::new();
    let registry = InMemoryRegistry::new(DANGLING);
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();

    let err = add(
        &fs,
        &registry,
        &output,
        &runner,
        &AddOptions { components: names(&["field"]), json: false, dry_run: true, ..Default::default() },
    ).unwrap_err();

    assert!(matches!(err, CliError::NotFound(_)));
}

#[test]
fn errors_when_the_registry_is_unavailable() {
    let fs = InMemoryFs::new();
    let registry = InMemoryRegistry::failing();
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();

    let err = add(
        &fs,
        &registry,
        &output,
        &runner,
        &AddOptions { components: names(&["button"]), json: false, dry_run: true, ..Default::default() },
    ).unwrap_err();

    assert!(matches!(err, CliError::Registry(_)));
}

#[test]
fn errors_on_a_malformed_registry_index() {
    let fs = InMemoryFs::new();
    let registry = InMemoryRegistry::new(b"{ not json }");
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();

    let err = add(
        &fs,
        &registry,
        &output,
        &runner,
        &AddOptions { components: names(&["button"]), json: false, dry_run: true, ..Default::default() },
    ).unwrap_err();

    assert!(matches!(err, CliError::Registry(_)));
}

#[test]
fn surfaces_a_stdout_failure() {
    let fs = InMemoryFs::new();
    let registry = InMemoryRegistry::new(FLAT);
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    output.fail_stdout();

    let err = add(
        &fs,
        &registry,
        &output,
        &runner,
        &AddOptions { components: names(&["button"]), json: false, dry_run: true, ..Default::default() },
    ).unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}

#[test]
fn installs_the_packages_with_the_detected_manager() {
    let fs = InMemoryFs::new();
    fs.set_current_dir(Path::new("project"));
    fs.write(Path::new("project/pnpm-lock.yaml"), b"").unwrap();
    let registry = InMemoryRegistry::new(WITH_PACKAGES);
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &AddOptions { components: names(&["button", "icon"]), json: false, dry_run: false, ..Default::default() },
    ).unwrap();

    // One `pnpm add` invocation in the project directory installs the deduped,
    // sorted package set.
    assert_eq!(
        runner.calls(),
        vec![(
            "pnpm".to_string(),
            vec![
                "add".to_string(),
                "@primitiv-ui/icons".to_string(),
                "@primitiv-ui/react".to_string(),
            ],
            Path::new("project").to_path_buf(),
        )]
    );
}

#[test]
fn styles_only_copies_styles_without_installing_the_package() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG).unwrap();
    let registry = InMemoryRegistry::new(WITH_PACKAGE_AND_STYLES)
        .with_file("button", "styles.css", b".primitiv-button{}");
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &AddOptions {
            components: names(&["button"]),
            styles_only: true,
            ..Default::default()
        },
    )
    .unwrap();

    // The package install is skipped despite `button` declaring one...
    assert!(runner.calls().is_empty());
    // ...but the stylesheet is still copied.
    assert_eq!(
        fs.read(Path::new("src/styles/primitiv/button/styles.css")).unwrap(),
        b".primitiv-button{}"
    );
}

#[test]
fn no_styles_installs_the_package_without_copying_styles() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG).unwrap();
    let registry = InMemoryRegistry::new(WITH_PACKAGE_AND_STYLES)
        .with_file("button", "styles.css", b".primitiv-button{}");
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &AddOptions {
            components: names(&["button"]),
            no_styles: true,
            ..Default::default()
        },
    )
    .unwrap();

    // The package is installed...
    assert_eq!(runner.calls().len(), 1);
    // ...but no stylesheet is copied.
    assert!(!fs.exists(Path::new("src/styles/primitiv/button/styles.css")));
}

#[test]
fn does_not_install_under_dry_run() {
    let fs = InMemoryFs::new();
    let registry = InMemoryRegistry::new(WITH_PACKAGES);
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &AddOptions { components: names(&["button"]), json: false, dry_run: true, ..Default::default() },
    ).unwrap();

    assert!(runner.calls().is_empty());
}

#[test]
fn does_not_install_when_no_component_needs_a_package() {
    let fs = InMemoryFs::new();
    let registry = InMemoryRegistry::new(FLAT);
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();

    // FLAT's components declare no packages, so even a non-dry run runs nothing.
    add(
        &fs,
        &registry,
        &output,
        &runner,
        &AddOptions { components: names(&["button"]), json: false, dry_run: false, ..Default::default() },
    ).unwrap();

    assert!(runner.calls().is_empty());
}

#[test]
fn errors_when_the_package_manager_fails() {
    let fs = InMemoryFs::new();
    let registry = InMemoryRegistry::new(WITH_PACKAGES);
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    runner.fail();

    let err = add(
        &fs,
        &registry,
        &output,
        &runner,
        &AddOptions { components: names(&["button"]), json: false, dry_run: false, ..Default::default() },
    ).unwrap_err();

    assert!(matches!(err, CliError::Install(_)));
}

#[test]
fn copies_the_configured_format_stylesheet_into_the_styles_path() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG).unwrap();
    let registry =
        InMemoryRegistry::new(WITH_STYLES).with_file("button", "styles.css", b".primitiv-button{}");
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &AddOptions { components: names(&["button"]), json: false, dry_run: false, ..Default::default() },
    ).unwrap();

    // The CSS lands under <styles.path>/<component>/ verbatim.
    assert_eq!(
        fs.read(Path::new("src/styles/primitiv/button/styles.css")).unwrap(),
        b".primitiv-button{}"
    );
}

#[test]
fn does_not_copy_styles_when_the_project_opts_out() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG_NO_STYLES).unwrap();
    let registry =
        InMemoryRegistry::new(WITH_STYLES).with_file("button", "styles.css", b".primitiv-button{}");
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &AddOptions { components: names(&["button"]), json: false, dry_run: false, ..Default::default() },
    ).unwrap();

    assert!(!fs.exists(Path::new("src/styles/primitiv/button/styles.css")));
}

#[test]
fn does_not_copy_styles_when_there_is_no_project_config() {
    let fs = InMemoryFs::new();
    // No primitiv.json: a headless-only install copies nothing.
    let registry =
        InMemoryRegistry::new(WITH_STYLES).with_file("button", "styles.css", b".primitiv-button{}");
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &AddOptions { components: names(&["button"]), json: false, dry_run: false, ..Default::default() },
    ).unwrap();

    assert!(!fs.exists(Path::new("src/styles/primitiv/button/styles.css")));
}

#[test]
fn errors_when_the_registry_cannot_serve_a_style_file() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG).unwrap();
    // The index declares styles.css but the registry serves no file bytes.
    let registry = InMemoryRegistry::new(WITH_STYLES);
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();

    let err = add(
        &fs,
        &registry,
        &output,
        &runner,
        &AddOptions { components: names(&["button"]), json: false, dry_run: false, ..Default::default() },
    ).unwrap_err();

    assert!(matches!(err, CliError::Registry(_)));
}

#[test]
fn surfaces_a_directory_creation_failure_during_style_copy() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG).unwrap();
    fs.fail_create_dir_to(Path::new("src/styles/primitiv/button"));
    let registry =
        InMemoryRegistry::new(WITH_STYLES).with_file("button", "styles.css", b".primitiv-button{}");
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();

    let err = add(
        &fs,
        &registry,
        &output,
        &runner,
        &AddOptions { components: names(&["button"]), json: false, dry_run: false, ..Default::default() },
    ).unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}

#[test]
fn surfaces_a_write_failure_during_style_copy() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG).unwrap();
    fs.fail_writes_to(Path::new("src/styles/primitiv/button/styles.css"));
    let registry =
        InMemoryRegistry::new(WITH_STYLES).with_file("button", "styles.css", b".primitiv-button{}");
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();

    let err = add(
        &fs,
        &registry,
        &output,
        &runner,
        &AddOptions { components: names(&["button"]), json: false, dry_run: false, ..Default::default() },
    ).unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}

#[test]
fn errors_on_a_malformed_project_config_during_style_copy() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), b"{ not json }").unwrap();
    let registry =
        InMemoryRegistry::new(WITH_STYLES).with_file("button", "styles.css", b".primitiv-button{}");
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();

    let err = add(
        &fs,
        &registry,
        &output,
        &runner,
        &AddOptions { components: names(&["button"]), json: false, dry_run: false, ..Default::default() },
    ).unwrap_err();

    assert!(matches!(err, CliError::Config(_)));
}

#[test]
fn copies_the_react_surface_into_the_alias_resolved_components_directory() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG).unwrap();
    fs.write(Path::new("tsconfig.json"), TSCONFIG).unwrap();
    let registry = InMemoryRegistry::new(WITH_STYLED_SURFACE)
        .with_file("button", "styles.css", b".primitiv-button{}")
        .with_file("button", "button.recipe.ts", b"export const button = cva();")
        .with_file("button", "button.tsx", b"export function Button() {}");
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &AddOptions { components: names(&["button"]), ..Default::default() },
    )
    .unwrap();

    // The stylesheet still lands in the styles path...
    assert!(fs.exists(Path::new("src/styles/primitiv/button/styles.css")));
    // ...and the recipe + wrapper land flat in the alias-resolved components dir.
    assert_eq!(
        fs.read(Path::new("src/components/button.recipe.ts")).unwrap(),
        b"export const button = cva();"
    );
    assert_eq!(
        fs.read(Path::new("src/components/button.tsx")).unwrap(),
        b"export function Button() {}"
    );
}

#[test]
fn falls_back_to_a_root_components_directory_without_a_detectable_alias() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG).unwrap();
    // No tsconfig/jsconfig: the alias cannot be detected, so the React surface
    // falls back to the project-root `components` directory.
    let registry = InMemoryRegistry::new(WITH_STYLED_SURFACE)
        .with_file("button", "styles.css", b".primitiv-button{}")
        .with_file("button", "button.recipe.ts", b"recipe")
        .with_file("button", "button.tsx", b"wrapper");
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &AddOptions { components: names(&["button"]), ..Default::default() },
    )
    .unwrap();

    assert_eq!(fs.read(Path::new("components/button.tsx")).unwrap(), b"wrapper");
}

#[test]
fn errors_when_the_registry_cannot_serve_a_react_file() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG).unwrap();
    // The stylesheet is served but the React surface is not, so the copy fails
    // in the React loop rather than the stylesheet loop.
    let registry = InMemoryRegistry::new(WITH_STYLED_SURFACE)
        .with_file("button", "styles.css", b".primitiv-button{}");
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();

    let err = add(
        &fs,
        &registry,
        &output,
        &runner,
        &AddOptions { components: names(&["button"]), ..Default::default() },
    )
    .unwrap_err();

    assert!(matches!(err, CliError::Registry(_)));
}

#[test]
fn surfaces_a_failure_to_resolve_the_components_directory() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG).unwrap();
    // The tsconfig read fails (not merely absent), so the alias resolution is a
    // hard I/O error rather than the relative-import fallback.
    fs.fail_reads_to(Path::new("tsconfig.json"));
    let registry = InMemoryRegistry::new(WITH_STYLED_SURFACE)
        .with_file("button", "styles.css", b".primitiv-button{}")
        .with_file("button", "button.recipe.ts", b"recipe")
        .with_file("button", "button.tsx", b"wrapper");
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();

    let err = add(
        &fs,
        &registry,
        &output,
        &runner,
        &AddOptions { components: names(&["button"]), ..Default::default() },
    )
    .unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}

#[test]
fn surfaces_a_failure_to_read_the_working_directory_before_installing() {
    let fs = InMemoryFs::new();
    fs.fail_current_dir();
    let registry = InMemoryRegistry::new(WITH_PACKAGES);
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();

    let err = add(
        &fs,
        &registry,
        &output,
        &runner,
        &AddOptions { components: names(&["button"]), json: false, dry_run: false, ..Default::default() },
    ).unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}
