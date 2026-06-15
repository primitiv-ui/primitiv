use std::path::Path;

use crate::commands::list::list;
use crate::error::CliError;
use crate::lock::Lock;
use crate::ports::fs::{FileSystem, InMemoryFs};
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

/// The hand-authored table with nothing installed: the name and version columns
/// are padded to the widest of their values and headers, and every component's
/// INSTALLED cell is the `-` placeholder.
const EXPECTED_TABLE: &str = "\
COMPONENT  VERSION  INSTALLED
button     0.1.0    -
switch     0.2.0    -
";

/// The same table after `button` has been added: its INSTALLED cell reads `yes`.
const EXPECTED_TABLE_WITH_INSTALL: &str = "\
COMPONENT  VERSION  INSTALLED
button     0.1.0    yes
switch     0.2.0    -
";

#[test]
fn renders_a_component_table_to_stdout() {
    let fs = InMemoryFs::new();
    let registry = InMemoryRegistry::new(INDEX);
    let output = InMemoryOutput::new();

    list(&fs, &registry, &output, false).unwrap();

    assert_eq!(String::from_utf8(output.captured()).unwrap(), EXPECTED_TABLE);
}

#[test]
fn marks_a_component_installed_from_the_lock() {
    let fs = InMemoryFs::new();
    let mut lock = Lock::default();
    lock.record_component("button");
    fs.write(Path::new("primitiv.lock"), &lock.to_bytes()).unwrap();
    let registry = InMemoryRegistry::new(INDEX);
    let output = InMemoryOutput::new();

    list(&fs, &registry, &output, false).unwrap();

    assert_eq!(
        String::from_utf8(output.captured()).unwrap(),
        EXPECTED_TABLE_WITH_INSTALL
    );
}

#[test]
fn streams_the_raw_index_as_json() {
    let fs = InMemoryFs::new();
    let registry = InMemoryRegistry::new(INDEX);
    let output = InMemoryOutput::new();

    list(&fs, &registry, &output, true).unwrap();

    // --json is the index as data: the bytes pass through untouched.
    assert_eq!(output.captured(), INDEX);
}

#[test]
fn errors_when_the_registry_is_unavailable() {
    let fs = InMemoryFs::new();
    let registry = InMemoryRegistry::failing();
    let output = InMemoryOutput::new();

    let err = list(&fs, &registry, &output, false).unwrap_err();

    assert!(matches!(err, CliError::Registry(_)));
}

#[test]
fn errors_on_a_malformed_index() {
    let fs = InMemoryFs::new();
    let registry = InMemoryRegistry::new(b"{ not json }");
    let output = InMemoryOutput::new();

    let err = list(&fs, &registry, &output, false).unwrap_err();

    assert!(matches!(err, CliError::Registry(_)));
}

#[test]
fn surfaces_a_failure_to_read_the_working_directory() {
    let fs = InMemoryFs::new();
    fs.fail_current_dir();
    let registry = InMemoryRegistry::new(INDEX);
    let output = InMemoryOutput::new();

    let err = list(&fs, &registry, &output, false).unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}

#[test]
fn surfaces_a_failure_to_read_the_lock() {
    let fs = InMemoryFs::new();
    fs.fail_reads_to(Path::new("primitiv.lock"));
    let registry = InMemoryRegistry::new(INDEX);
    let output = InMemoryOutput::new();

    let err = list(&fs, &registry, &output, false).unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}

#[test]
fn surfaces_a_stdout_failure_rendering_the_table() {
    let fs = InMemoryFs::new();
    let registry = InMemoryRegistry::new(INDEX);
    let output = InMemoryOutput::new();
    output.fail_stdout();

    let err = list(&fs, &registry, &output, false).unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}

#[test]
fn surfaces_a_stdout_failure_streaming_json() {
    let fs = InMemoryFs::new();
    let registry = InMemoryRegistry::new(INDEX);
    let output = InMemoryOutput::new();
    output.fail_stdout();

    let err = list(&fs, &registry, &output, true).unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}
