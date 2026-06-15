//! The `primitiv.lock` manifest (RFC 0005 §4.2) — the record of the content
//! hashes `add` wrote, so a re-add can tell an untouched file (safe to refresh)
//! from a consumer-edited one (kept, never silently clobbered).

use std::collections::BTreeMap;
use std::io;
use std::path::Path;

use serde::Deserialize;

use crate::error::CliError;
use crate::ports::fs::FileSystem;

/// The lock file's name, written beside `primitiv.json` (RFC 0005 §4.2).
pub const FILE_NAME: &str = "primitiv.lock";

/// How a destination file compares to the lock's recorded hash (RFC 0005 §4.2).
///
/// Returned by [`Lock::classify`] so `add` can decide whether to refresh, keep,
/// or prompt — and label each file in the dry-run refresh report.
#[derive(Debug, PartialEq)]
pub enum Refresh {
    /// The file does not yet exist on disk — `add` will create it.
    New,
    /// The file is on disk and its content matches what the lock recorded
    /// (untouched since `add` last wrote it) — safe to overwrite.
    Unchanged,
    /// The file is on disk but its content differs from the lock record
    /// (consumer-edited) — kept unless `--force` is set.
    Edited,
}

/// The parsed `primitiv.lock`: a map from each written file's project-relative
/// path to the [`fnv1a_hex`] of the bytes `add` last wrote there. A `BTreeMap`
/// keeps the serialised order deterministic.
#[derive(Debug, Default, PartialEq, Deserialize)]
pub struct Lock {
    #[serde(default)]
    pub files: BTreeMap<String, String>,
}

impl Lock {
    /// Parse the bytes of a `primitiv.lock`. The lock is **machine-managed**, so
    /// a malformed one is not a hard error: it degrades to an empty manifest,
    /// under which every existing file looks untracked and is therefore *kept*
    /// (never clobbered), and a fresh lock is written. A missing file is read as
    /// empty by the caller before reaching here.
    pub fn parse(bytes: &[u8]) -> Lock {
        serde_json::from_slice(bytes).unwrap_or_default()
    }

    /// Render the manifest as canonical `primitiv.lock` bytes. Hand-rendered (the
    /// authored-golden discipline, RFC 0007 §4) — paths are `/`-joined registry
    /// file names and values are hex hashes, so no JSON escaping is needed.
    pub fn to_bytes(&self) -> Vec<u8> {
        if self.files.is_empty() {
            return b"{\n  \"files\": {}\n}\n".to_vec();
        }
        let entries: Vec<String> = self
            .files
            .iter()
            .map(|(path, hash)| format!("    \"{path}\": \"{hash}\""))
            .collect();
        format!("{{\n  \"files\": {{\n{}\n  }}\n}}\n", entries.join(",\n")).into_bytes()
    }

    /// Record that `bytes` were written to `path`, so a later re-add can detect
    /// whether the on-disk file still matches.
    pub fn record(&mut self, path: &str, bytes: &[u8]) {
        self.files.insert(path.to_string(), fnv1a_hex(bytes));
    }

    /// Read the lock at `path` through the [`FileSystem`] port. A missing lock is
    /// an empty manifest (the first `add` in a project); any other read error is
    /// a hard [`CliError::Io`].
    pub fn read(fs: &impl FileSystem, path: &Path) -> Result<Lock, CliError> {
        match fs.read(path) {
            Ok(bytes) => Ok(Lock::parse(&bytes)),
            Err(error) if error.kind() == io::ErrorKind::NotFound => Ok(Lock::default()),
            Err(error) => Err(CliError::Io(error)),
        }
    }

    /// Write the manifest to `path` through the [`FileSystem`] port.
    pub fn write(&self, fs: &impl FileSystem, path: &Path) -> Result<(), CliError> {
        fs.write(path, &self.to_bytes()).map_err(CliError::Io)
    }

    /// Classify a destination file against the lock and disk (RFC 0005 §4.2).
    /// Returns [`Refresh::New`] when the file does not exist, [`Refresh::Unchanged`]
    /// when it is on disk and matches the lock's recorded hash, or
    /// [`Refresh::Edited`] when it is on disk but differs. A read failure on the
    /// existing file is a [`CliError::Io`].
    pub fn classify(&self, fs: &impl FileSystem, dest: &Path) -> Result<Refresh, CliError> {
        if !fs.exists(dest) {
            return Ok(Refresh::New);
        }
        let current = fnv1a_hex(&fs.read(dest).map_err(CliError::Io)?);
        let key = dest.to_string_lossy();
        if self.files.get(key.as_ref()) == Some(&current) {
            Ok(Refresh::Unchanged)
        } else {
            Ok(Refresh::Edited)
        }
    }
}

/// The 64-bit FNV-1a hash of `bytes`, lower-hex and zero-padded to 16 digits.
///
/// Hand-rolled and dependency-free (the repo's dep-minimal ethos): stable across
/// platforms and Rust versions, unlike `std`'s `DefaultHasher`. It only has to
/// detect *change*, not resist attack, so a non-cryptographic hash is enough.
pub fn fnv1a_hex(bytes: &[u8]) -> String {
    let mut hash: u64 = 0xcbf2_9ce4_8422_2325;
    for &byte in bytes {
        hash ^= u64::from(byte);
        hash = hash.wrapping_mul(0x0000_0100_0000_01b3);
    }
    format!("{hash:016x}")
}
