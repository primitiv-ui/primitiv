use std::path::{Path, PathBuf};

use serde_json::Value;

use crate::config::Config;
use crate::error::CliError;

/// Where the palette document is, or `None` where this project has none.
///
/// The same shape `tokens` and `theme` resolve a destination through, for the
/// same reason (RFC 0005 §3.2): the flag always wins, then the nearest
/// `primitiv.json`. There is no third tier — a project with no palette reference
/// and no flag is the ordinary case, not a default to guess at, and guessing
/// would mean a stray `primitiv.palette.json` in a parent directory silently
/// re-skinning a build that never asked for it.
pub fn locate(from: Option<&Path>, config: Option<&Config>) -> Option<PathBuf> {
    from.map(Path::to_path_buf).or_else(|| {
        config
            .and_then(|config| config.theme.palette.as_deref())
            .map(PathBuf::from)
    })
}

/// A palette document's per-mode token subtrees, ready for the emitter's values
/// path (RFC 0032 D1).
///
/// The document a designer hands over is DTCG keyed by mode — `light` and `dark`
/// at the top, each holding the ramps (`color.<family>.<step>`) and, unless the
/// consumer asked otherwise, the roles solved against them (D3). That is exactly
/// the shape [`emit_theme_overrides_css`](primitiv_emit::emit_theme_overrides_css)
/// already reads, which is why the handoff needed a reader rather than a format.
pub fn parse(bytes: &[u8], path: &Path) -> Result<Value, CliError> {
    let document: Value =
        serde_json::from_slice(bytes).map_err(|error| malformed(path, &error.to_string()))?;
    let modes = document
        .as_object()
        .ok_or_else(|| malformed(path, "expected an object keyed by mode"))?;
    Ok(Value::Object(
        modes
            .iter()
            // `$`-prefixed keys are DTCG's own metadata, not modes. The identity
            // block (D13) is exactly one of these, and `flatten_modes` would read
            // it as a theme scope called `$extensions`.
            .filter(|(key, _)| !key.starts_with('$'))
            .map(|(mode, tokens)| (mode.clone(), tokens.clone()))
            .collect(),
    ))
}

/// A palette document the CLI could not read, named where it was found.
///
/// [`CliError::Config`] rather than a variant of its own: to the consumer this is
/// a project file that says what their build is made of, exactly as
/// `primitiv.json` is, and it fails for the same reasons — so it should fail the
/// same way, with the same exit code.
fn malformed(path: &Path, reason: &str) -> CliError {
    CliError::Config(format!("{}: {reason}", path.display()))
}
