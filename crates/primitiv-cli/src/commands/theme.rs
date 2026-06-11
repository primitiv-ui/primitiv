use std::path::Path;

use primitiv_emit::{emit_theme_brand_css, emit_theme_brand_scss};

use crate::error::CliError;
use crate::format::Format;
use crate::ports::fs::FileSystem;

/// The `primitiv theme --brand <hex> --out <path> [--format <fmt>]` command
/// (RFC 0005 §2.4): derive the paired light + dark brand overrides from `brand`
/// via the Harmoni-backed emitter, serialise them in the requested `format`, and
/// write them to `out` through the filesystem port. CSS is canonical; SCSS is
/// the thinnest adapter over it (the TS / Tailwind serialisers land next).
pub fn theme(fs: &impl FileSystem, brand: &str, out: &Path, format: Format) -> Result<(), CliError> {
    let overrides = match format {
        Format::Css => emit_theme_brand_css(brand)?,
        Format::Scss => emit_theme_brand_scss(brand)?,
    };
    fs.write(out, overrides.as_bytes())?;
    Ok(())
}
