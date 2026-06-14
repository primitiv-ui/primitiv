use pretty_assertions::assert_eq;

use crate::lock::{fnv1a_hex, Lock};

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
        lock.files.get("src/components/button.tsx").map(String::as_str),
        Some("af63dc4c8601ec8c")
    );
}

#[test]
fn parses_a_malformed_lock_as_empty() {
    // A machine-managed lock degrades to empty rather than erroring.
    assert_eq!(Lock::parse(b"{ not json }"), Lock::default());
}

#[test]
fn renders_an_empty_lock() {
    assert_eq!(Lock::default().to_bytes(), b"{\n  \"files\": {}\n}\n");
}

#[test]
fn renders_recorded_files_sorted_by_path() {
    let mut lock = Lock::default();
    lock.record("src/styles/primitiv/button/styles.css", b".primitiv-button{}");
    lock.record("src/components/button.tsx", b"wrapper");

    // Sorted by path; each value is the FNV-1a hash of the recorded bytes.
    assert_eq!(
        String::from_utf8(lock.to_bytes()).unwrap(),
        format!(
            "{{\n  \"files\": {{\n    \"src/components/button.tsx\": \"{}\",\n    \"src/styles/primitiv/button/styles.css\": \"{}\"\n  }}\n}}\n",
            fnv1a_hex(b"wrapper"),
            fnv1a_hex(b".primitiv-button{}"),
        )
    );
}
