use std::path::Path;

use primitiv_emit::{
    ThemeRamps, emit_theme_ramps_css, emit_theme_ramps_scss, emit_theme_ramps_tailwind,
};

use crate::error::CliError;
use crate::format::Format;
use crate::ports::fs::FileSystem;
use crate::seeds::{as_pairs, resolve_neutral, resolve_seeds};
use crate::token_source::{INTENT, parse};

/// The `primitiv theme [--<family> <colour>]... --out <path> [--format <fmt>]`
/// command (RFC 0005 §2.4): derive each seeded family's paired light + dark ramp
/// overrides via the Harmoni-backed emitter, serialise them in the requested
/// `format`, and write them to `out` through the filesystem port.
///
/// Overriding a palette family re-skins every semantic role built on it with no
/// further work, because the emitted Intent layer references the families by
/// name (`action/danger/*` is already `var(--primitiv-color-danger-*)`).
///
/// A family no flag names falls back to `primitiv.json`'s `theme` block, so the
/// seeds a project recorded once are what it re-emits from.
///
/// `steps` is the ramp length. Away from Primitiv's own scale of ten, the shipped
/// Intent layer names steps the ramp no longer has, so the embedded Intent
/// document is handed to the emitter and the file also carries the roles that
/// length has moved. **The registry stylesheets are written against ten steps**, so
/// a project that shortens or lengthens its ramps owns the consequences for its own
/// component styling.
pub fn theme(
    fs: &impl FileSystem,
    seeds: &[(String, String)],
    out: &Path,
    format: Format,
    steps: usize,
) -> Result<(), CliError> {
    let resolved = resolve_seeds(fs, seeds, "theme")?;
    let seeds = as_pairs(&resolved);
    let neutral = resolve_neutral(fs, &resolved)?;
    let intent = parse(INTENT);
    let ramps = ThemeRamps {
        seeds: &seeds,
        steps,
        intent: &intent,
        neutral,
        roles: None,
    };
    let overrides = match format {
        Format::Css => emit_theme_ramps_css(&ramps)?,
        Format::Scss => emit_theme_ramps_scss(&ramps)?,
        Format::Tailwind => emit_theme_ramps_tailwind(&ramps)?,
    };
    fs.write(out, overrides.as_bytes())?;
    Ok(())
}

/// The palette family a single seed names — `init` records one brand, and the
/// vocabulary lives in [`RAMP_FAMILIES`](crate::cli::RAMP_FAMILIES), so this points
/// at its first entry rather than spelling the string a second time.
pub const BRAND: &str = crate::cli::RAMP_FAMILIES[0];

/// The theme overrides file's basename, without an extension — shared so whoever
/// writes the file and whoever imports it cannot disagree on its name.
pub const FILE_STEM: &str = "primitiv.theme";
