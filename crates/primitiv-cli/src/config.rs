use std::collections::BTreeMap;
use std::io;
use std::path::Path;

use serde::Deserialize;

use crate::error::CliError;
use crate::format::Format;
use crate::ports::fs::FileSystem;

/// The config file the CLI looks for at each directory while resolving.
const FILE_NAME: &str = "primitiv.json";

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

/// Find and parse the nearest `primitiv.json` starting at `start`, **requiring**
/// one (RFC 0005 §3.2): an absent file is a [`CliError::Config`]. For commands
/// that need the config (the file path can only come from it).
pub fn resolve(fs: &impl FileSystem, start: &Path) -> Result<Config, CliError> {
    match read_nearest(fs, start)? {
        Some(bytes) => Config::parse(&bytes),
        None => Err(CliError::Config(format!(
            "no {FILE_NAME} found in {} or any parent directory",
            start.display()
        ))),
    }
}

/// Like [`resolve`], but an absent config is `Ok(None)` rather than an error —
/// for commands that only consult `primitiv.json` for *optional* defaults and
/// fall back when it is missing. A **malformed** config still errors, so a
/// broken file is never silently ignored.
pub fn try_resolve(fs: &impl FileSystem, start: &Path) -> Result<Option<Config>, CliError> {
    match read_nearest(fs, start)? {
        Some(bytes) => Config::parse(&bytes).map(Some),
        None => Ok(None),
    }
}

/// Read the bytes of the nearest `primitiv.json`, walking up from `start`
/// through the [`FileSystem`] port (RFC 0005 §3.2). `NotFound` at a level
/// ascends to the parent; any other read error is a hard I/O failure;
/// exhausting the ancestors yields `Ok(None)`.
fn read_nearest(fs: &impl FileSystem, start: &Path) -> Result<Option<Vec<u8>>, CliError> {
    let mut dir = Some(start);
    while let Some(current) = dir {
        match fs.read(&current.join(FILE_NAME)) {
            Ok(bytes) => return Ok(Some(bytes)),
            Err(error) if error.kind() == io::ErrorKind::NotFound => {}
            Err(error) => return Err(CliError::Io(error)),
        }
        dir = current.parent();
    }
    Ok(None)
}
