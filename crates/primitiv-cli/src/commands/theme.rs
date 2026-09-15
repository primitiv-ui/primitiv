use std::path::Path;

use primitiv_emit::{emit_theme_ramps_css, emit_theme_ramps_scss, emit_theme_ramps_tailwind};

use crate::error::CliError;
use crate::format::Format;
use crate::ports::fs::FileSystem;

/// The `primitiv theme [--<family> <colour>]... --out <path> [--format <fmt>]`
/// command (RFC 0005 §2.4): derive each seeded family's paired light + dark ramp
/// overrides via the Harmoni-backed emitter, serialise them in the requested
/// `format`, and write them to `out` through the filesystem port.
///
/// Overriding a palette family re-skins every semantic role built on it with no
/// further work, because the emitted Intent layer references the families by
/// name (`action/danger/*` is already `var(--primitiv-color-danger-*)`).
pub fn theme(
    fs: &impl FileSystem,
    seeds: &[(String, String)],
    out: &Path,
    format: Format,
) -> Result<(), CliError> {
    let seeds: Vec<(&str, &str)> = seeds
        .iter()
        .map(|(family, seed)| (family.as_str(), seed.as_str()))
        .collect();
    let overrides = match format {
        Format::Css => emit_theme_ramps_css(&seeds)?,
        Format::Scss => emit_theme_ramps_scss(&seeds)?,
        Format::Tailwind => emit_theme_ramps_tailwind(&seeds)?,
    };
    fs.write(out, overrides.as_bytes())?;
    Ok(())
}
