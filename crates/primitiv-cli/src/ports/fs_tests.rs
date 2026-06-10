use std::path::Path;

use crate::ports::fs::{FileSystem, InMemoryFs};

#[test]
fn should_read_back_bytes_that_were_written() {
    let fs = InMemoryFs::new();
    let path = Path::new("src/styles/tokens.css");

    fs.write(path, b"--x: 1;").unwrap();

    assert_eq!(fs.read(path).unwrap(), b"--x: 1;");
}

#[test]
fn should_report_a_path_as_existing_only_after_it_is_written() {
    let fs = InMemoryFs::new();
    let path = Path::new("primitiv.json");

    assert!(!fs.exists(path));
    fs.write(path, b"{}").unwrap();
    assert!(fs.exists(path));
}

#[test]
fn should_error_with_not_found_when_reading_a_missing_path() {
    let fs = InMemoryFs::new();

    let err = fs.read(Path::new("missing")).unwrap_err();

    assert_eq!(err.kind(), std::io::ErrorKind::NotFound);
}
