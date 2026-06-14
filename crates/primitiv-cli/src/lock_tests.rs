use crate::lock::fnv1a_hex;

#[test]
fn hashes_the_empty_input_to_the_fnv_offset_basis() {
    // The empty input never enters the mixing loop, so the hash is the 64-bit
    // FNV-1a offset basis verbatim.
    assert_eq!(fnv1a_hex(b""), "cbf29ce484222325");
}

#[test]
fn hashes_a_byte_to_its_known_fnv1a_vector() {
    // The published FNV-1a/64 test vector for "a".
    assert_eq!(fnv1a_hex(b"a"), "af63dc4c8601ec8c");
}
