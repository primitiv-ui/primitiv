use crate::ports::output::{InMemoryOutput, Output, OsStdout};

#[test]
fn in_memory_output_captures_what_was_streamed() {
    let output = InMemoryOutput::new();

    output.write_stdout(b"--x: 1;").unwrap();
    output.write_stdout(b" --y: 2;").unwrap();

    assert_eq!(output.captured(), b"--x: 1; --y: 2;");
}

#[test]
fn in_memory_output_can_fail_a_stream_write() {
    let output = InMemoryOutput::new();
    output.fail_stdout();

    let err = output.write_stdout(b"x").unwrap_err();

    assert_eq!(err.kind(), std::io::ErrorKind::BrokenPipe);
}

#[test]
fn os_stdout_accepts_a_write() {
    // A thin passthrough to the process stdout; an empty write proves the
    // adapter without polluting the test runner's output.
    OsStdout.write_stdout(b"").unwrap();
}

#[test]
fn fail_stdout_after_lets_n_writes_succeed_then_errors() {
    let output = InMemoryOutput::new();
    output.fail_stdout_after(1); // first write succeeds, second fails

    output.write_stdout(b"ok").unwrap();
    let err = output.write_stdout(b"x").unwrap_err();

    assert_eq!(err.kind(), std::io::ErrorKind::BrokenPipe);
    // Only the first write made it into the buffer.
    assert_eq!(output.captured(), b"ok");
}

#[test]
fn fail_stdout_after_zero_fails_on_the_very_next_write() {
    let output = InMemoryOutput::new();
    output.fail_stdout_after(0); // fails immediately

    let err = output.write_stdout(b"x").unwrap_err();

    assert_eq!(err.kind(), std::io::ErrorKind::BrokenPipe);
}
