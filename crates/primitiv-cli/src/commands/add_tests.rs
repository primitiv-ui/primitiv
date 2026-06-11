use pretty_assertions::assert_eq;

use crate::commands::add::add;
use crate::error::CliError;
use crate::ports::output::InMemoryOutput;
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

/// Turn string literals into the owned component list the command takes.
fn names(parts: &[&str]) -> Vec<String> {
    parts.iter().map(|part| part.to_string()).collect()
}

#[test]
fn reports_a_single_resolved_component() {
    let registry = InMemoryRegistry::new(FLAT);
    let output = InMemoryOutput::new();

    add(&registry, &output, &names(&["button"])).unwrap();

    assert_eq!(
        String::from_utf8(output.captured()).unwrap(),
        "Resolved 1 component to add:\n  button  0.1.0\n",
    );
}

#[test]
fn reports_several_resolved_components_sorted_and_aligned() {
    let registry = InMemoryRegistry::new(FLAT);
    let output = InMemoryOutput::new();

    // Requested out of order; the plan is sorted and the version column aligned.
    add(&registry, &output, &names(&["switch", "button"])).unwrap();

    assert_eq!(
        String::from_utf8(output.captured()).unwrap(),
        "Resolved 2 components to add:\n  button  0.1.0\n  switch  0.2.0\n",
    );
}

#[test]
fn pulls_in_transitive_component_dependencies() {
    let registry = InMemoryRegistry::new(WITH_DEPS);
    let output = InMemoryOutput::new();

    add(&registry, &output, &names(&["field"])).unwrap();

    assert_eq!(
        String::from_utf8(output.captured()).unwrap(),
        "Resolved 3 components to add:\n  button  0.1.0\n  field   0.3.0\n  label   0.1.0\n",
    );
}

#[test]
fn deduplicates_a_component_requested_and_pulled_in_as_a_dependency() {
    let registry = InMemoryRegistry::new(WITH_DEPS);
    let output = InMemoryOutput::new();

    // `button` is both requested and a dependency of `field`: it appears once.
    add(&registry, &output, &names(&["field", "button"])).unwrap();

    assert_eq!(
        String::from_utf8(output.captured()).unwrap(),
        "Resolved 3 components to add:\n  button  0.1.0\n  field   0.3.0\n  label   0.1.0\n",
    );
}

#[test]
fn errors_when_a_requested_component_is_unknown() {
    let registry = InMemoryRegistry::new(FLAT);
    let output = InMemoryOutput::new();

    let err = add(&registry, &output, &names(&["nope"])).unwrap_err();

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
    let registry = InMemoryRegistry::new(DANGLING);
    let output = InMemoryOutput::new();

    let err = add(&registry, &output, &names(&["field"])).unwrap_err();

    assert!(matches!(err, CliError::NotFound(_)));
}

#[test]
fn errors_when_the_registry_is_unavailable() {
    let registry = InMemoryRegistry::failing();
    let output = InMemoryOutput::new();

    let err = add(&registry, &output, &names(&["button"])).unwrap_err();

    assert!(matches!(err, CliError::Registry(_)));
}

#[test]
fn errors_on_a_malformed_registry_index() {
    let registry = InMemoryRegistry::new(b"{ not json }");
    let output = InMemoryOutput::new();

    let err = add(&registry, &output, &names(&["button"])).unwrap_err();

    assert!(matches!(err, CliError::Registry(_)));
}

#[test]
fn surfaces_a_stdout_failure() {
    let registry = InMemoryRegistry::new(FLAT);
    let output = InMemoryOutput::new();
    output.fail_stdout();

    let err = add(&registry, &output, &names(&["button"])).unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}
