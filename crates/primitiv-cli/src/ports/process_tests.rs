use std::path::Path;

use pretty_assertions::assert_eq;

use crate::ports::process::{InMemoryProcessRunner, OsProcessRunner, ProcessRunner};

#[test]
fn os_runner_succeeds_on_a_zero_exit() {
    let dir = assert_fs::TempDir::new().unwrap();

    // `true` exits 0.
    OsProcessRunner.run("true", &[], dir.path()).unwrap();
}

#[test]
fn os_runner_errors_on_a_non_zero_exit() {
    let dir = assert_fs::TempDir::new().unwrap();

    // `false` exits 1, which the adapter maps to an error.
    let err = OsProcessRunner.run("false", &[], dir.path()).unwrap_err();

    assert!(err.to_string().contains("exited with"));
}

#[test]
fn os_runner_errors_when_the_program_cannot_be_spawned() {
    let dir = assert_fs::TempDir::new().unwrap();

    let err = OsProcessRunner
        .run("primitiv-no-such-program", &[], dir.path())
        .unwrap_err();

    assert_eq!(err.kind(), std::io::ErrorKind::NotFound);
}

#[test]
fn in_memory_runner_records_each_invocation() {
    let runner = InMemoryProcessRunner::new();

    runner
        .run("pnpm", &["add".to_string(), "react".to_string()], Path::new("app"))
        .unwrap();

    assert_eq!(
        runner.calls(),
        vec![(
            "pnpm".to_string(),
            vec!["add".to_string(), "react".to_string()],
            Path::new("app").to_path_buf(),
        )]
    );
}

#[test]
fn in_memory_runner_can_be_made_to_fail() {
    let runner = InMemoryProcessRunner::new();
    runner.fail();

    assert!(runner.run("pnpm", &[], Path::new("app")).is_err());
    // A failed run records nothing.
    assert!(runner.calls().is_empty());
}
