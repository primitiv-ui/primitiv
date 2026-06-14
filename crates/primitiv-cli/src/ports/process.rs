use std::io;
use std::path::Path;
use std::process::Command;

#[cfg(test)]
use std::cell::RefCell;
#[cfg(test)]
use std::path::PathBuf;

/// The process port — the seam `add` runs the detected package manager through
/// to install the headless package (RFC 0005 §4.1 step 2).
///
/// The real binary supplies an [`OsProcessRunner`] that spawns the command;
/// command-layer tests supply the [`InMemoryProcessRunner`] fake, which records
/// the invocation instead of running anything (RFC 0007 §2.2).
pub trait ProcessRunner {
    /// Run `program` with `args` in `cwd`, succeeding only on a zero exit. A
    /// failure to spawn, or a non-zero exit, is an `io::Error`.
    fn run(&self, program: &str, args: &[String], cwd: &Path) -> io::Result<()>;
}

/// The real [`ProcessRunner`] the bin runs on — spawns the command, routing the
/// manager's **stdout to our stderr** so its progress still reaches the user
/// without polluting a `--json` stdout (RFC 0005 §5); the manager's stderr is
/// inherited as usual. A non-zero exit becomes an error so the command layer can
/// surface a failed install.
pub struct OsProcessRunner;

impl ProcessRunner for OsProcessRunner {
    fn run(&self, program: &str, args: &[String], cwd: &Path) -> io::Result<()> {
        let status = Command::new(program)
            .args(args)
            .current_dir(cwd)
            .stdout(io::stderr())
            .status()?;
        if status.success() {
            Ok(())
        } else {
            Err(io::Error::other(format!("`{program}` exited with {status}")))
        }
    }
}

/// An in-memory [`ProcessRunner`] fake for command-layer tests (RFC 0007 §2.2):
/// it records each invocation rather than spawning a process, and can be made to
/// fail so the install-error branch is driven without a real failing command.
#[cfg(test)]
#[derive(Debug, Default)]
pub struct InMemoryProcessRunner {
    calls: RefCell<Vec<(String, Vec<String>, PathBuf)>>,
    fail: RefCell<bool>,
}

#[cfg(test)]
impl InMemoryProcessRunner {
    pub fn new() -> Self {
        Self::default()
    }

    /// Make the next [`run`](ProcessRunner::run) fail, modelling a manager that
    /// couldn't be spawned or exited non-zero.
    pub fn fail(&self) {
        *self.fail.borrow_mut() = true;
    }

    /// The invocations recorded so far, as `(program, args, cwd)` tuples.
    pub fn calls(&self) -> Vec<(String, Vec<String>, PathBuf)> {
        self.calls.borrow().clone()
    }
}

#[cfg(test)]
impl ProcessRunner for InMemoryProcessRunner {
    fn run(&self, program: &str, args: &[String], cwd: &Path) -> io::Result<()> {
        if *self.fail.borrow() {
            return Err(io::Error::other("command failed"));
        }
        self.calls
            .borrow_mut()
            .push((program.to_string(), args.to_vec(), cwd.to_path_buf()));
        Ok(())
    }
}
