use std::io;
use std::path::Path;

#[cfg(test)]
use std::cell::RefCell;
#[cfg(test)]
use std::collections::HashMap;
#[cfg(test)]
use std::path::PathBuf;

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
}

/// An in-memory [`FileSystem`] fake for command-layer tests (RFC 0007 §2.2,
/// D49). Writes land in a map; reads of unwritten paths report `NotFound`,
/// mirroring `std::fs`.
#[cfg(test)]
#[derive(Debug, Default)]
pub struct InMemoryFs {
    files: RefCell<HashMap<PathBuf, Vec<u8>>>,
}

#[cfg(test)]
impl InMemoryFs {
    pub fn new() -> Self {
        Self::default()
    }
}

#[cfg(test)]
impl FileSystem for InMemoryFs {
    fn read(&self, path: &Path) -> io::Result<Vec<u8>> {
        self.files
            .borrow()
            .get(path)
            .cloned()
            .ok_or_else(|| io::Error::new(io::ErrorKind::NotFound, "no such path"))
    }

    fn write(&self, path: &Path, bytes: &[u8]) -> io::Result<()> {
        self.files.borrow_mut().insert(path.to_path_buf(), bytes.to_vec());
        Ok(())
    }

    fn exists(&self, path: &Path) -> bool {
        self.files.borrow().contains_key(path)
    }
}
