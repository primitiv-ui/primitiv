/// An output format a command can serialise to (RFC 0005 §2.3/§2.4). CSS is the
/// canonical format and the default; the other serialisers land incrementally
/// (SCSS first), each adding a variant here. It deserialises straight from a
/// `primitiv.json` `format` field (lowercase names) and parses from a
/// `--format` flag, so both the config and the parser can match on it.
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Format {
    Css,
    Scss,
    Tailwind,
}

impl Format {
    /// Parse a `--format` flag value, returning `None` for an unrecognised
    /// format so the caller can raise its own usage error.
    pub fn parse(value: &str) -> Option<Format> {
        match value {
            "css" => Some(Format::Css),
            "scss" => Some(Format::Scss),
            "tailwind" => Some(Format::Tailwind),
            _ => None,
        }
    }
}
