//! The interactive prompt port (RFC 0005 §4.2) — the seam `add` asks the
//! consumer, per edited file, whether to overwrite it or keep their edits.

/// The consumer's answer when `add` finds a file they have edited since it was
/// last written (RFC 0005 §4.2). Two-way: take the registry version, or keep the
/// local edits (the safe default).
#[derive(Debug, PartialEq)]
pub enum Decision {
    /// Replace the edited file with the registry version.
    Overwrite,
    /// Leave the consumer's edited file untouched.
    Keep,
}

/// Map a typed answer to a [`Decision`]. `o` / `overwrite` (any case, surrounding
/// whitespace ignored) chooses [`Decision::Overwrite`]; everything else —
/// including `k`, an empty line (the default), and unrecognised input — keeps the
/// edits, the safe default (Principle 2).
pub fn parse_decision(answer: &str) -> Decision {
    match answer.trim().to_ascii_lowercase().as_str() {
        "o" | "overwrite" => Decision::Overwrite,
        _ => Decision::Keep,
    }
}
