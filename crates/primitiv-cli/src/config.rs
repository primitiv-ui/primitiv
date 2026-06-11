use std::collections::BTreeMap;

use serde::Deserialize;

use crate::error::CliError;
use crate::format::Format;

/// The durable `primitiv.json` a consumer keeps in their project (RFC 0005 §3).
/// It records the choices — format, paths, brand, registry pin — so every re-run
/// is deterministic and config-less. Unknown keys (e.g. `$schema`) are ignored,
/// so the file can carry editor hints the CLI does not model.
#[derive(Debug, Deserialize, PartialEq)]
pub struct Config {
    pub version: u32,
    pub framework: String,
    pub styles: Styles,
    pub tokens: Tokens,
    pub theme: Theme,
    pub aliases: BTreeMap<String, String>,
    pub registry: Registry,
}

/// Where copied component styles land and in what format (RFC 0005 §3.1).
#[derive(Debug, Deserialize, PartialEq)]
pub struct Styles {
    pub enabled: bool,
    pub format: Format,
    pub path: String,
}

/// The emitted token layer's format and destination (RFC 0005 §3.1).
#[derive(Debug, Deserialize, PartialEq)]
pub struct Tokens {
    pub format: Format,
    pub path: String,
}

/// The brand colour the theme overrides are derived from (RFC 0005 §3.1).
#[derive(Debug, Deserialize, PartialEq)]
pub struct Theme {
    pub brand: String,
}

/// The registry pin that makes `add` deterministic (RFC 0005 §3.1 / §6.4).
#[derive(Debug, Deserialize, PartialEq)]
pub struct Registry {
    pub version: String,
}

impl Config {
    /// Parse the bytes of a `primitiv.json` into the typed [`Config`]. A pure
    /// function — no I/O — so it unit-tests directly; the walk-up that finds the
    /// file lives behind the [`FileSystem`](crate::ports::fs::FileSystem) port.
    /// A malformed document maps to [`CliError::Config`].
    pub fn parse(bytes: &[u8]) -> Result<Config, CliError> {
        serde_json::from_slice(bytes).map_err(|error| CliError::Config(error.to_string()))
    }
}
