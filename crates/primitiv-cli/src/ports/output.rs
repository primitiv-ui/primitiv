use std::io::{self, Write};

#[cfg(test)]
use std::cell::RefCell;

/// The standard-output port — the seam a command streams generated output to
/// when no file destination is given (Principle 4: a config-less
/// `tokens --format css` writes to stdout, not a file).
///
/// The real binary supplies an [`OsStdout`] adapter over the process stdout;
/// command-layer tests supply the [`InMemoryOutput`] fake so the streamed bytes
/// are captured and asserted without touching a real stream (RFC 0007 §2.2).
pub trait Output {
    fn write_stdout(&self, bytes: &[u8]) -> io::Result<()>;

    /// Write a diagnostic — a warning the run continues past (RFC 0032 D8).
    ///
    /// Separate from [`write_stdout`](Output::write_stdout) because a
    /// config-less `tokens --format css` streams the **stylesheet** to stdout, so
    /// a warning written there would be pasted into the consumer's CSS. Stderr is
    /// also what makes `primitiv tokens > tokens.css` keep working while the
    /// developer still sees what the palette did not cover.
    fn write_stderr(&self, bytes: &[u8]) -> io::Result<()>;
}

/// The real [`Output`] adapter the bin runs on — a thin passthrough to the
/// process stdout. It carries no logic of its own (RFC 0007 §2.1).
pub struct OsStdout;

impl Output for OsStdout {
    fn write_stdout(&self, bytes: &[u8]) -> io::Result<()> {
        io::stdout().write_all(bytes)
    }

    fn write_stderr(&self, bytes: &[u8]) -> io::Result<()> {
        io::stderr().write_all(bytes)
    }
}

/// An in-memory [`Output`] fake for command-layer tests (RFC 0007 §2.2): the
/// streamed bytes accumulate in a buffer the test can read back.
#[cfg(test)]
#[derive(Debug, Default)]
pub struct InMemoryOutput {
    stdout: RefCell<Vec<u8>>,
    stderr: RefCell<Vec<u8>>,
    fail_stderr: RefCell<bool>,
    fail: RefCell<bool>,
    /// Remaining successful writes before the next write fails. `None` means no
    /// scheduled failure; `Some(0)` means the very next write fails.
    writes_before_fail: RefCell<Option<usize>>,
}

#[cfg(test)]
impl InMemoryOutput {
    pub fn new() -> Self {
        Self::default()
    }

    /// Make ALL [`write_stdout`](Output::write_stdout) calls fail with
    /// `BrokenPipe`, so a command can drive its stdout-error branch without a
    /// real broken stream (e.g. a closed downstream pipe).
    pub fn fail_stdout(&self) {
        *self.fail.borrow_mut() = true;
    }

    /// Make every [`write_stderr`](Output::write_stderr) call fail with
    /// `BrokenPipe`, so a command can drive its diagnostic-write error branch.
    pub fn fail_stderr(&self) {
        *self.fail_stderr.borrow_mut() = true;
    }

    /// Let the next `n` writes succeed, then fail the `(n+1)`-th with
    /// `BrokenPipe`. `fail_stdout_after(0)` is equivalent to `fail_stdout()`.
    pub fn fail_stdout_after(&self, n: usize) {
        *self.writes_before_fail.borrow_mut() = Some(n);
    }

    /// The bytes streamed to stdout so far.
    pub fn captured(&self) -> Vec<u8> {
        self.stdout.borrow().clone()
    }

    /// The diagnostics written to stderr so far.
    pub fn captured_stderr(&self) -> Vec<u8> {
        self.stderr.borrow().clone()
    }
}

#[cfg(test)]
impl Output for InMemoryOutput {
    fn write_stdout(&self, bytes: &[u8]) -> io::Result<()> {
        if *self.fail.borrow() {
            return Err(io::Error::new(io::ErrorKind::BrokenPipe, "stdout blocked"));
        }
        let mut guard = self.writes_before_fail.borrow_mut();
        match *guard {
            Some(0) => {
                return Err(io::Error::new(io::ErrorKind::BrokenPipe, "stdout blocked"));
            }
            Some(ref mut n) => {
                *n -= 1;
            }
            None => {}
        }
        drop(guard);
        self.stdout.borrow_mut().extend_from_slice(bytes);
        Ok(())
    }

    fn write_stderr(&self, bytes: &[u8]) -> io::Result<()> {
        if *self.fail_stderr.borrow() {
            return Err(io::Error::new(io::ErrorKind::BrokenPipe, "stderr blocked"));
        }
        self.stderr.borrow_mut().extend_from_slice(bytes);
        Ok(())
    }
}
