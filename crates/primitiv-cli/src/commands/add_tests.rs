use std::path::Path;

use pretty_assertions::assert_eq;

use crate::commands::add::add;
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

    add(&fs, &registry, &output, &runner, &names(&["button"]), false, true).unwrap();

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

    add(&fs, &registry, &output, &runner, &names(&["button", "icon"]), false, true).unwrap();

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

    add(&fs, &registry, &output, &runner, &names(&["button", "icon"]), true, true).unwrap();

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

    add(&fs, &registry, &output, &runner, &names(&["button"]), true, true).unwrap();

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
    add(&fs, &registry, &output, &runner, &names(&["switch", "button"]), false, true).unwrap();

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

    add(&fs, &registry, &output, &runner, &names(&["field"]), false, true).unwrap();

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
    add(&fs, &registry, &output, &runner, &names(&["field", "button"]), false, true).unwrap();

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

    let err = add(&fs, &registry, &output, &runner, &names(&["nope"]), false, true).unwrap_err();

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

    let err = add(&fs, &registry, &output, &runner, &names(&["field"]), false, true).unwrap_err();

    assert!(matches!(err, CliError::NotFound(_)));
}

#[test]
fn errors_when_the_registry_is_unavailable() {
    let fs = InMemoryFs::new();
    let registry = InMemoryRegistry::failing();
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();

    let err = add(&fs, &registry, &output, &runner, &names(&["button"]), false, true).unwrap_err();

    assert!(matches!(err, CliError::Registry(_)));
}

#[test]
fn errors_on_a_malformed_registry_index() {
    let fs = InMemoryFs::new();
    let registry = InMemoryRegistry::new(b"{ not json }");
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();

    let err = add(&fs, &registry, &output, &runner, &names(&["button"]), false, true).unwrap_err();

    assert!(matches!(err, CliError::Registry(_)));
}

#[test]
fn surfaces_a_stdout_failure() {
    let fs = InMemoryFs::new();
    let registry = InMemoryRegistry::new(FLAT);
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    output.fail_stdout();

    let err = add(&fs, &registry, &output, &runner, &names(&["button"]), false, true).unwrap_err();

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

    add(&fs, &registry, &output, &runner, &names(&["button", "icon"]), false, false).unwrap();

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
fn does_not_install_under_dry_run() {
    let fs = InMemoryFs::new();
    let registry = InMemoryRegistry::new(WITH_PACKAGES);
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();

    add(&fs, &registry, &output, &runner, &names(&["button"]), false, true).unwrap();

    assert!(runner.calls().is_empty());
}

#[test]
fn does_not_install_when_no_component_needs_a_package() {
    let fs = InMemoryFs::new();
    let registry = InMemoryRegistry::new(FLAT);
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();

    // FLAT's components declare no packages, so even a non-dry run runs nothing.
    add(&fs, &registry, &output, &runner, &names(&["button"]), false, false).unwrap();

    assert!(runner.calls().is_empty());
}

#[test]
fn errors_when_the_package_manager_fails() {
    let fs = InMemoryFs::new();
    let registry = InMemoryRegistry::new(WITH_PACKAGES);
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    runner.fail();

    let err = add(&fs, &registry, &output, &runner, &names(&["button"]), false, false).unwrap_err();

    assert!(matches!(err, CliError::Install(_)));
}

#[test]
fn surfaces_a_failure_to_read_the_working_directory_before_installing() {
    let fs = InMemoryFs::new();
    fs.fail_current_dir();
    let registry = InMemoryRegistry::new(WITH_PACKAGES);
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();

    let err = add(&fs, &registry, &output, &runner, &names(&["button"]), false, false).unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}
