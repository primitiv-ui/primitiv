use std::path::Path;

use pretty_assertions::assert_eq;

use crate::error::CliError;
use crate::lock::{Lock, fnv1a_hex};
use crate::ports::fs::{FileSystem, InMemoryFs};

#[test]
fn hashes_the_empty_input_to_the_fnv_offset_basis() {
    // The empty input never enters the mixing loop, so the hash is the 64-bit
    // FNV-1a offset basis verbatim.
    assert_eq!(fnv1a_hex(b""), "cbf29ce484222325");
}

#[test]
fn hashes_a_byte_to_its_known_fnv1a_vector() {
    // The published FNV-1a/64 test vector for "a".
    assert_eq!(fnv1a_hex(b"a"), "af63dc4c8601ec8c");
}

#[test]
fn parses_a_lock_into_its_file_hashes() {
    let lock = Lock::parse(br#"{ "files": { "src/components/button.tsx": "af63dc4c8601ec8c" } }"#);

    assert_eq!(
        lock.files
            .get("src/components/button.tsx")
            .map(String::as_str),
        Some("af63dc4c8601ec8c")
    );
}

#[test]
fn parses_a_malformed_lock_as_empty() {
    // A machine-managed lock degrades to empty rather than erroring.
    assert_eq!(Lock::parse(b"{ not json }"), Lock::default());
}

#[test]
fn records_installed_component_names_sorted_in_the_lock() {
    let mut lock = Lock::default();
    lock.record_component("switch");
    lock.record_component("button");
    // A re-add of the same component is idempotent (a set, not a list).
    lock.record_component("button");

    assert_eq!(
        lock.components.iter().map(String::as_str).collect::<Vec<_>>(),
        vec!["button", "switch"]
    );
}

#[test]
fn renders_recorded_components_before_the_files() {
    let mut lock = Lock::default();
    lock.record_component("button");
    lock.record("src/components/button.tsx", b"wrapper");

    assert_eq!(
        String::from_utf8(lock.to_bytes()).unwrap(),
        format!(
            "{{\n  \"components\": [\n    \"button\"\n  ],\n  \"files\": {{\n    \"src/components/button.tsx\": \"{}\"\n  }}\n}}\n",
            fnv1a_hex(b"wrapper"),
        )
    );
}

#[test]
fn parses_recorded_components_from_a_lock() {
    let lock = Lock::parse(br#"{ "components": ["button", "switch"], "files": {} }"#);

    assert_eq!(
        lock.components.iter().map(String::as_str).collect::<Vec<_>>(),
        vec!["button", "switch"]
    );
}

#[test]
fn renders_an_empty_lock() {
    assert_eq!(
        Lock::default().to_bytes(),
        b"{\n  \"components\": [],\n  \"files\": {}\n}\n"
    );
}

#[test]
fn renders_recorded_files_sorted_by_path() {
    let mut lock = Lock::default();
    lock.record(
        "src/styles/primitiv/button/styles.css",
        b".primitiv-button{}",
    );
    lock.record("src/components/button.tsx", b"wrapper");

    // Sorted by path; each value is the FNV-1a hash of the recorded bytes. The
    // (empty) components array still leads the object.
    assert_eq!(
        String::from_utf8(lock.to_bytes()).unwrap(),
        format!(
            "{{\n  \"components\": [],\n  \"files\": {{\n    \"src/components/button.tsx\": \"{}\",\n    \"src/styles/primitiv/button/styles.css\": \"{}\"\n  }}\n}}\n",
            fnv1a_hex(b"wrapper"),
            fnv1a_hex(b".primitiv-button{}"),
        )
    );
}

#[test]
fn reads_a_missing_lock_as_empty() {
    let fs = InMemoryFs::new();

    assert_eq!(
        Lock::read(&fs, Path::new("primitiv.lock")).unwrap(),
        Lock::default()
    );
}

#[test]
fn reads_back_a_written_lock() {
    let fs = InMemoryFs::new();
    let mut lock = Lock::default();
    lock.record("src/components/button.tsx", b"wrapper");
    lock.write(&fs, Path::new("primitiv.lock")).unwrap();

    assert_eq!(Lock::read(&fs, Path::new("primitiv.lock")).unwrap(), lock);
}

#[test]
fn surfaces_a_non_not_found_read_error() {
    let fs = InMemoryFs::new();
    fs.fail_reads_to(Path::new("primitiv.lock"));

    let err = Lock::read(&fs, Path::new("primitiv.lock")).unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}

#[test]
fn surfaces_a_write_failure() {
    let fs = InMemoryFs::new();
    fs.fail_writes_to(Path::new("primitiv.lock"));

    let err = Lock::default()
        .write(&fs, Path::new("primitiv.lock"))
        .unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}

// ── classify ────────────────────────────────────────────────────────────────

#[test]
fn classify_returns_new_when_the_file_does_not_exist() {
    use crate::lock::Refresh;
    let fs = InMemoryFs::new();

    assert!(matches!(
        Lock::default()
            .classify(&fs, Path::new("styles.css"))
            .unwrap(),
        Refresh::New
    ));
}

#[test]
fn classify_returns_unchanged_when_disk_content_matches_the_lock() {
    use crate::lock::Refresh;
    let fs = InMemoryFs::new();
    fs.write(Path::new("styles.css"), b".primitiv-button{}")
        .unwrap();
    let mut lock = Lock::default();
    lock.record("styles.css", b".primitiv-button{}");

    assert!(matches!(
        lock.classify(&fs, Path::new("styles.css")).unwrap(),
        Refresh::Unchanged
    ));
}

#[test]
fn classify_returns_edited_when_disk_content_differs_from_the_lock() {
    use crate::lock::Refresh;
    let fs = InMemoryFs::new();
    fs.write(Path::new("styles.css"), b"edited by the consumer")
        .unwrap();
    let mut lock = Lock::default();
    lock.record("styles.css", b".primitiv-button{}");

    assert!(matches!(
        lock.classify(&fs, Path::new("styles.css")).unwrap(),
        Refresh::Edited
    ));
}

#[test]
fn classify_surfaces_a_read_failure_as_io_error() {
    use crate::lock::Refresh;
    let fs = InMemoryFs::new();
    fs.write(Path::new("styles.css"), b"x").unwrap();
    fs.fail_reads_to(Path::new("styles.css"));

    let err = Lock::default()
        .classify(&fs, Path::new("styles.css"))
        .unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
    // Silence the unused import warning when the test is compiled.
    let _ = Refresh::New;
}
