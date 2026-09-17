use std::path::Path;

use primitiv_emit::{
    ThemeRamps, emit_theme_ramps_css, emit_theme_ramps_scss, emit_theme_ramps_tailwind,
};

use std::path::PathBuf;

use crate::config::try_resolve;
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
    out: Option<&Path>,
    format: Option<Format>,
    steps: usize,
) -> Result<(), CliError> {
    let (out, format) = resolve_destination(fs, out, format)?;
    let out = out.as_path();
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

/// Where the overrides go and in what format, resolving what the flags left out.
///
/// The same three tiers `tokens` uses, for the same reason (RFC 0005 §2.3/§3.2):
/// an explicit flag always wins, then the nearest `primitiv.json`, then CSS. It
/// matters more here than it looks, because the overrides file is not free to
/// live anywhere — the token layer imports it by name from its own directory
/// (`leading_imports`), so a default that guessed differently would write a file
/// nothing imports.
///
/// With no flag and no config there is nothing to resolve a destination from, and
/// that is a usage error rather than a guess: writing `primitiv.theme.css` into
/// whatever directory the shell happens to be in is not a default, it is a
/// surprise.
fn resolve_destination(
    fs: &impl FileSystem,
    out: Option<&Path>,
    format: Option<Format>,
) -> Result<(PathBuf, Format), CliError> {
    // Read the config only when something is actually missing — the same shape
    // `tokens` resolves through, deliberately, so the two cannot drift on which
    // tier wins or on when a malformed config is allowed to go unnoticed.
    let config = if format.is_none() || out.is_none() {
        try_resolve(fs, &fs.current_dir()?)?
    } else {
        None
    };
    let format = format
        .or_else(|| config.as_ref().map(|config| config.tokens.format))
        .unwrap_or(Format::Css);
    let out = match out {
        Some(out) => out.to_path_buf(),
        None => {
            let config = config.ok_or_else(|| {
                CliError::Usage(
                    "theme requires --out <path>, or a primitiv.json recording tokens.path"
                        .to_string(),
                )
            })?;
            Path::new(&config.tokens.path)
                .with_file_name(format!("{FILE_STEM}.{}", format.extension()))
        }
    };
    Ok((out, format))
}

/// The palette family a single seed names — `init` records one brand, and the
/// vocabulary lives in [`RAMP_FAMILIES`](crate::cli::RAMP_FAMILIES), so this points
/// at its first entry rather than spelling the string a second time.
pub const BRAND: &str = crate::cli::RAMP_FAMILIES[0];

/// The theme overrides file's basename, without an extension — shared so whoever
/// writes the file and whoever imports it cannot disagree on its name.
pub const FILE_STEM: &str = "primitiv.theme";
