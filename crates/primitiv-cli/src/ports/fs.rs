use std::io;
use std::path::Path;
use std::path::PathBuf;

#[cfg(test)]
use std::cell::RefCell;
#[cfg(test)]
use std::collections::HashMap;

/// The filesystem port — the single seam every command goes through to touch
/// disk.
///
/// The real binary supplies an OS-backed adapter; command-layer tests supply
/// the in-memory [`InMemoryFs`] fake so logic stays deterministic, with no
/// real files and no machine dependence (RFC 0007 §2.2).
pub trait FileSystem {
    fn read(&self, path: &Path) -> io::Result<Vec<u8>>;
    fn write(&self, path: &Path, bytes: &[u8]) -> io::Result<()>;
    fn exists(&self, path: &Path) -> bool;
    /// The directory a walk-up (e.g. [`config::resolve`](crate::config::resolve))
    /// starts from — the process working directory for the real bin.
    fn current_dir(&self) -> io::Result<PathBuf>;
}

/// The OS-backed [`FileSystem`] adapter the real bin runs on — a thin
/// passthrough to `std::fs`. It carries no logic of its own (RFC 0007 §2.1);
/// directory creation and other policy stay in the command layer, where they
/// are unit-testable against the [`InMemoryFs`] fake.
pub struct OsFs;

impl FileSystem for OsFs {
    fn read(&self, path: &Path) -> io::Result<Vec<u8>> {
        std::fs::read(path)
    }

    fn write(&self, path: &Path, bytes: &[u8]) -> io::Result<()> {
        std::fs::write(path, bytes)
    }

    fn exists(&self, path: &Path) -> bool {
        path.exists()
    }

    fn current_dir(&self) -> io::Result<PathBuf> {
        std::env::current_dir()
    }
}

/// An in-memory [`FileSystem`] fake for command-layer tests (RFC 0007 §2.2,
/// D49). Writes land in a map; reads of unwritten paths report `NotFound`,
/// mirroring `std::fs`.
#[cfg(test)]
#[derive(Debug, Default)]
pub struct InMemoryFs {
    files: RefCell<HashMap<PathBuf, Vec<u8>>>,
    fail_writes: RefCell<Option<PathBuf>>,
    fail_reads: RefCell<Option<PathBuf>>,
    cwd: RefCell<PathBuf>,
    fail_current_dir: RefCell<bool>,
}

#[cfg(test)]
impl InMemoryFs {
    pub fn new() -> Self {
        Self::default()
    }

    /// Make any [`write`](FileSystem::write) to `path` fail with
    /// `PermissionDenied`, so command tests can drive a write-error branch
    /// without a real, unwritable filesystem (RFC 0007 §7).
    pub fn fail_writes_to(&self, path: &Path) {
        *self.fail_writes.borrow_mut() = Some(path.to_path_buf());
    }

    /// Make any [`read`](FileSystem::read) of `path` fail with
    /// `PermissionDenied`, so a command can drive the non-`NotFound` read-error
    /// branch (which the walk-up resolver treats as a hard I/O failure rather
    /// than "keep looking") without a real, unreadable filesystem.
    pub fn fail_reads_to(&self, path: &Path) {
        *self.fail_reads.borrow_mut() = Some(path.to_path_buf());
    }

    /// Set the directory [`current_dir`](FileSystem::current_dir) reports, so a
    /// command test can place the start of a config walk-up at a known path.
    pub fn set_current_dir(&self, path: &Path) {
        *self.cwd.borrow_mut() = path.to_path_buf();
    }

    /// Make [`current_dir`](FileSystem::current_dir) fail with `NotFound`, so a
    /// command can drive the branch where the working directory is unavailable.
    pub fn fail_current_dir(&self) {
        *self.fail_current_dir.borrow_mut() = true;
    }
}

#[cfg(test)]
impl FileSystem for InMemoryFs {
    fn read(&self, path: &Path) -> io::Result<Vec<u8>> {
        if self.fail_reads.borrow().as_deref() == Some(path) {
            return Err(io::Error::new(io::ErrorKind::PermissionDenied, "read blocked"));
        }
        self.files
            .borrow()
            .get(path)
            .cloned()
            .ok_or_else(|| io::Error::new(io::ErrorKind::NotFound, "no such path"))
    }

    fn write(&self, path: &Path, bytes: &[u8]) -> io::Result<()> {
        if self.fail_writes.borrow().as_deref() == Some(path) {
            return Err(io::Error::new(io::ErrorKind::PermissionDenied, "write blocked"));
        }
        self.files.borrow_mut().insert(path.to_path_buf(), bytes.to_vec());
        Ok(())
    }

    fn exists(&self, path: &Path) -> bool {
        self.files.borrow().contains_key(path)
    }

    fn current_dir(&self) -> io::Result<PathBuf> {
        if *self.fail_current_dir.borrow() {
            return Err(io::Error::new(io::ErrorKind::NotFound, "no working directory"));
        }
        Ok(self.cwd.borrow().clone())
    }
}
