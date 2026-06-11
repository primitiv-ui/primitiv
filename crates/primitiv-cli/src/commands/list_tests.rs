use crate::commands::list::list;
use crate::error::CliError;
use crate::ports::output::InMemoryOutput;
use crate::ports::registry::InMemoryRegistry;

/// A registry index the command formats — two components at distinct versions.
const INDEX: &[u8] = br##"{
  "version": "0.1.0",
  "components": {
    "button": { "version": "0.1.0" },
    "switch": { "version": "0.2.0" }
  }
}"##;

/// The hand-authored table the renderer must match: the name column is padded to
/// the widest of the names and the `COMPONENT` header.
const EXPECTED_TABLE: &str = "\
COMPONENT  VERSION
button     0.1.0
switch     0.2.0
";

#[test]
fn renders_a_component_table_to_stdout() {
    let registry = InMemoryRegistry::new(INDEX);
    let output = InMemoryOutput::new();

    list(&registry, &output, false).unwrap();

    assert_eq!(String::from_utf8(output.captured()).unwrap(), EXPECTED_TABLE);
}

#[test]
fn streams_the_raw_index_as_json() {
    let registry = InMemoryRegistry::new(INDEX);
    let output = InMemoryOutput::new();

    list(&registry, &output, true).unwrap();

    // --json is the index as data: the bytes pass through untouched.
    assert_eq!(output.captured(), INDEX);
}

#[test]
fn errors_when_the_registry_is_unavailable() {
    let registry = InMemoryRegistry::failing();
    let output = InMemoryOutput::new();

    let err = list(&registry, &output, false).unwrap_err();

    assert!(matches!(err, CliError::Registry(_)));
}

#[test]
fn errors_on_a_malformed_index() {
    let registry = InMemoryRegistry::new(b"{ not json }");
    let output = InMemoryOutput::new();

    let err = list(&registry, &output, false).unwrap_err();

    assert!(matches!(err, CliError::Registry(_)));
}

#[test]
fn surfaces_a_stdout_failure_rendering_the_table() {
    let registry = InMemoryRegistry::new(INDEX);
    let output = InMemoryOutput::new();
    output.fail_stdout();

    let err = list(&registry, &output, false).unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}

#[test]
fn surfaces_a_stdout_failure_streaming_json() {
    let registry = InMemoryRegistry::new(INDEX);
    let output = InMemoryOutput::new();
    output.fail_stdout();

    let err = list(&registry, &output, true).unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}
