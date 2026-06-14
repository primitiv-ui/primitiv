//! The `primitiv.lock` manifest (RFC 0005 §4.2) — the record of the content
//! hashes `add` wrote, so a re-add can tell an untouched file (safe to refresh)
//! from a consumer-edited one (kept, never silently clobbered).

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
