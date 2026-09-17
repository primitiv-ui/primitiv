use std::collections::BTreeMap;
use std::io;
use std::path::{Path, PathBuf};

use serde::Deserialize;

use crate::error::CliError;
use crate::format::Format;
use crate::ports::fs::FileSystem;

/// The config file the CLI looks for at each directory while resolving, and the
/// name `init` writes (so the two stay in lockstep).
pub(crate) const FILE_NAME: &str = "primitiv.json";

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

/// The ramp seeds the theme overrides are derived from (RFC 0005 §3.1) — one
/// colour per palette family, e.g. `{ "brand": "#0a7755", "danger": "#db2424" }`.
///
/// Keyed by family rather than a field per colour, so
/// [`RAMP_FAMILIES`](crate::cli::RAMP_FAMILIES) stays the single place the
/// vocabulary lives and the flags cannot drift from the config. A family the CLI
/// does not generate is rejected when the seeds are read, not silently kept.
#[derive(Debug, Deserialize, PartialEq, Default)]
pub struct Theme {
    #[serde(flatten)]
    pub seeds: BTreeMap<String, String>,
    /// Where this project's palette document lives (RFC 0032 D2/D14), relative
    /// to the config — the handoff recorded once so every `primitiv tokens` run
    /// re-applies it, rather than a flag the developer retypes.
    ///
    /// Not in the flattened seed map above for the same reason `neutral` is not:
    /// it is a path, not a colour, and a family called `palette` would be a
    /// ramp the CLI does not generate.
    pub palette: Option<String>,
    /// The neutral ramp, which is not a seed and so is not in the map above.
    ///
    /// A neutral ramp is generated *between* two anchors rather than from one
    /// colour, so it cannot be a `"neutral": "#888888"` entry — that is the whole
    /// reason `--neutral` has always been refused. Naming the field also keeps it
    /// out of the flattened map, which every family key still falls into.
    pub neutral: Option<NeutralEntry>,
}

/// What the `neutral` key holds. A ramp block is the real form; a bare string is
/// accepted only so the mistake can be answered properly.
///
/// `"neutral": "#888888"` is the natural thing to try, because every other family
/// takes a colour there. Letting serde reject it by type would say "expected
/// struct Neutral" and stop — [`resolve_neutral`](crate::seeds::resolve_neutral)
/// answers it with what to write instead.
#[derive(Debug, Deserialize, PartialEq)]
#[serde(untagged)]
pub enum NeutralEntry {
    /// The mistake: one colour, as the seeded families take.
    Seed(String),
    /// The ramp, generated between two anchors.
    Ramp(Neutral),
}

/// The neutral ramp's shape, mirroring the model the engine generates from.
///
/// Both anchors are optional and default to the pair the Harmoni plugin's own
/// default project uses, so a consumer who wants their brand's tint over ordinary
/// greys writes only the tint.
#[derive(Debug, Deserialize, PartialEq, Default)]
pub struct Neutral {
    /// The light anchor. Defaults to [`DEFAULT_WHITE`].
    pub white: Option<String>,
    /// The dark anchor. Defaults to [`DEFAULT_BLACK`].
    pub black: Option<String>,
    /// The tint laid over both anchors. Absent leaves an untinted grey.
    pub tint: Option<Tint>,
}

/// The tint over a neutral ramp's anchors — one source and an angle, never two
/// colours (the engine's [`NeutralTint`](harmoni_core::api::NeutralTint) says why).
#[derive(Debug, Deserialize, PartialEq)]
pub struct Tint {
    /// A ramp family whose seed tints the anchors (`"brand"`), or a colour.
    ///
    /// Naming a family is the point rather than a convenience: the tint exists so
    /// the neutral relates to the brand and **follows it when the brand moves**.
    /// Copying the brand's colour in here would freeze that relationship at the
    /// moment it was written.
    pub source: String,
    /// How far the anchors take the source colour, 0..1.
    pub strength: f32,
    /// Hue divergence between the anchors, in degrees. 0 is a single source.
    #[serde(default)]
    pub spread: f32,
    /// How far chroma crests through the mid-tones, 0..1.
    #[serde(default)]
    pub bow: f32,
}

/// The anchors a neutral ramp runs between when the config names none — the pair
/// the plugin's default project carries, so the two sides agree on "the default
/// neutral" without either restating it.
pub const DEFAULT_WHITE: &str = "oklch(0.99 0 0)";
/// The dark companion to [`DEFAULT_WHITE`].
pub const DEFAULT_BLACK: &str = "oklch(0.02 0 0)";

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
        Some((_, bytes)) => Config::parse(&bytes),
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
    Ok(try_resolve_at(fs, start)?.map(|(_, config)| config))
}

/// Like [`try_resolve`], but also reporting **where** the config was found — for
/// the one caller that writes back to it (RFC 0032 D10's palette reference).
///
/// The path comes from the same walk rather than a second one, so the file a
/// command reads and the file it records into cannot be different ones.
pub fn try_resolve_at(
    fs: &impl FileSystem,
    start: &Path,
) -> Result<Option<(PathBuf, Config)>, CliError> {
    match read_nearest(fs, start)? {
        Some((path, bytes)) => Config::parse(&bytes).map(|config| Some((path, config))),
        None => Ok(None),
    }
}

/// Read the nearest `primitiv.json` — its path and its bytes — walking up from `start`
/// through the [`FileSystem`] port (RFC 0005 §3.2). `NotFound` at a level
/// ascends to the parent; any other read error is a hard I/O failure;
/// exhausting the ancestors yields `Ok(None)`.
fn read_nearest(
    fs: &impl FileSystem,
    start: &Path,
) -> Result<Option<(PathBuf, Vec<u8>)>, CliError> {
    let mut dir = Some(start);
    while let Some(current) = dir {
        let path = current.join(FILE_NAME);
        match fs.read(&path) {
            Ok(bytes) => return Ok(Some((path, bytes))),
            Err(error) if error.kind() == io::ErrorKind::NotFound => {}
            Err(error) => return Err(CliError::Io(error)),
        }
        dir = current.parent();
    }
    Ok(None)
}
