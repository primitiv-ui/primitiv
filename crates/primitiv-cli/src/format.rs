/// An output format a command can serialise to (RFC 0005 §2.3/§2.4). CSS is the
/// canonical format and the default; the other serialisers land incrementally
/// (SCSS first), each adding a variant here. Kept dependency-free so both the
/// parser and the commands can match on it.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Format {
    Css,
    Scss,
}

impl Format {
    /// Parse a `--format` flag value, returning `None` for an unrecognised
    /// format so the caller can raise its own usage error.
    pub fn parse(value: &str) -> Option<Format> {
        match value {
            "css" => Some(Format::Css),
            "scss" => Some(Format::Scss),
            _ => None,
        }
    }
}
