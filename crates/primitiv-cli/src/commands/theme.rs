use std::path::Path;

use primitiv_emit::emit_theme_brand_css;

use crate::error::CliError;
use crate::ports::fs::FileSystem;

/// The `primitiv theme --brand <hex> --out <path>` command (RFC 0005 §2.4):
/// derive the paired light + dark brand overrides from `brand` via the
/// Harmoni-backed emitter and write them to `out` through the filesystem port.
/// CSS is the canonical (and, for now, only) format; the other serialisers land
/// with the multi-format `--format` flag.
pub fn theme(fs: &impl FileSystem, brand: &str, out: &Path) -> Result<(), CliError> {
    let css = emit_theme_brand_css(brand)?;
    fs.write(out, css.as_bytes())?;
    Ok(())
}
