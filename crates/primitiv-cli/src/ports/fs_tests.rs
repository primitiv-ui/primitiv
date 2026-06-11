use std::path::Path;

use assert_fs::prelude::*;

use crate::ports::fs::{FileSystem, InMemoryFs, OsFs};

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

#[test]
fn should_fail_writes_to_a_path_marked_as_failing() {
    let fs = InMemoryFs::new();
    let path = Path::new("src/styles/primitiv.theme.css");
    fs.fail_writes_to(path);

    let err = fs.write(path, b"x").unwrap_err();

    assert_eq!(err.kind(), std::io::ErrorKind::PermissionDenied);
    // Other paths still write normally.
    assert!(fs.write(Path::new("other"), b"y").is_ok());
}

#[test]
fn os_fs_writes_and_reads_back_a_real_file() {
    let dir = assert_fs::TempDir::new().unwrap();
    let file = dir.child("tokens.css");

    OsFs.write(file.path(), b"--x: 1;").unwrap();

    assert!(OsFs.exists(file.path()));
    assert_eq!(OsFs.read(file.path()).unwrap(), b"--x: 1;");
}

#[test]
fn os_fs_reports_a_missing_path_as_absent() {
    let dir = assert_fs::TempDir::new().unwrap();

    assert!(!OsFs.exists(dir.child("nope.css").path()));
}
