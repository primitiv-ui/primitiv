use std::path::{Path, PathBuf};

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
fn os_fs_creates_a_nested_directory() {
    let dir = assert_fs::TempDir::new().unwrap();
    let nested = dir.child("styles/primitiv/button");

    OsFs.create_dir_all(nested.path()).unwrap();

    assert!(nested.path().is_dir());
}

#[test]
fn in_memory_fs_create_dir_all_succeeds() {
    let fs = InMemoryFs::new();

    assert!(fs.create_dir_all(Path::new("styles/primitiv/button")).is_ok());
}

#[test]
fn in_memory_fs_can_fail_create_dir_all() {
    let fs = InMemoryFs::new();
    let path = Path::new("styles/primitiv/button");
    fs.fail_create_dir_to(path);

    assert_eq!(
        fs.create_dir_all(path).unwrap_err().kind(),
        std::io::ErrorKind::PermissionDenied
    );
}

#[test]
fn os_fs_reports_a_missing_path_as_absent() {
    let dir = assert_fs::TempDir::new().unwrap();

    assert!(!OsFs.exists(dir.child("nope.css").path()));
}

#[test]
fn os_fs_reports_the_process_current_directory() {
    assert_eq!(OsFs.current_dir().unwrap(), std::env::current_dir().unwrap());
}

#[test]
fn in_memory_fs_reports_its_configured_current_directory() {
    let fs = InMemoryFs::new();
    fs.set_current_dir(Path::new("project/packages/app"));

    assert_eq!(fs.current_dir().unwrap(), PathBuf::from("project/packages/app"));
}

#[test]
fn in_memory_fs_can_fail_current_dir() {
    let fs = InMemoryFs::new();
    fs.fail_current_dir();

    assert_eq!(
        fs.current_dir().unwrap_err().kind(),
        std::io::ErrorKind::NotFound
    );
}
