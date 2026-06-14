//! The `primitiv.lock` manifest (RFC 0005 §4.2) — the record of the content
//! hashes `add` wrote, so a re-add can tell an untouched file (safe to refresh)
//! from a consumer-edited one (kept, never silently clobbered).

use std::collections::BTreeMap;

use serde::Deserialize;

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
