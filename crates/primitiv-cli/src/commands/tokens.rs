use std::path::{Path, PathBuf};

use primitiv_emit::{emit_tailwind_tokens, emit_tokens_css, emit_tokens_scss, TokenSources};
use serde_json::Value;

use crate::config::try_resolve;
use crate::error::CliError;
use crate::format::Format;
use crate::ports::fs::FileSystem;

// The design system's own DTCG token documents, embedded into the binary so
// `tokens` can emit the base layer with no project input. Routing mirrors the
// figma-token-sync collection table (RFC 0006 §4): the single-mode `primitives`
// and `interaction` form the mode-independent base; `palette` and `intent`
// carry the theme axis; `context` carries the density axis.
const PRIMITIVES: &str =
    include_str!(concat!(env!("CARGO_MANIFEST_DIR"), "/../../packages/tokens/src/primitives.json"));
const INTERACTION: &str =
    include_str!(concat!(env!("CARGO_MANIFEST_DIR"), "/../../packages/tokens/src/interaction.json"));
const PALETTE: &str =
    include_str!(concat!(env!("CARGO_MANIFEST_DIR"), "/../../packages/tokens/src/palette.json"));
const INTENT: &str =
    include_str!(concat!(env!("CARGO_MANIFEST_DIR"), "/../../packages/tokens/src/intent.json"));
const CONTEXT: &str =
    include_str!(concat!(env!("CARGO_MANIFEST_DIR"), "/../../packages/tokens/src/context.json"));

/// The `primitiv tokens [--out <path>] [--format <fmt>]` command (RFC 0005 §2.3):
/// route the embedded design-system DTCG into the emitter, serialise the shared
/// token layer in the resolved `format`, and write it through the filesystem
/// port. CSS is canonical; SCSS is the canonical CSS plus resolving
/// `$primitiv-*` variables; Tailwind is the `@theme` preset.
///
/// Either flag omitted is filled from the nearest `primitiv.json` (resolved by
/// walking up from the working directory, RFC 0005 §3.2): `format` falls back to
/// the config's `tokens.format` and then to CSS, while `out` falls back to the
/// config's `tokens.path` — required, since there is no other source for it.
/// A missing config is fine for the format default but errors for the path; a
/// *malformed* config always errors. (Emitting to stdout with no config — the
/// fully config-less case — is a later increment.)
pub fn tokens(
    fs: &impl FileSystem,
    format: Option<Format>,
    out: Option<&Path>,
) -> Result<(), CliError> {
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
        None => PathBuf::from(
            config
                .map(|config| config.tokens.path)
                .ok_or_else(|| {
                    CliError::Config(
                        "tokens needs --out <path> or a primitiv.json with tokens.path".to_string(),
                    )
                })?,
        ),
    };
    let base = [parse(PRIMITIVES), parse(INTERACTION)];
    let theme = [parse(PALETTE), parse(INTENT)];
    let density = [parse(CONTEXT)];
    let sources = TokenSources {
        base: &base,
        theme: &theme,
        density: &density,
    };
    let output = match format {
        Format::Css => emit_tokens_css(&sources),
        Format::Scss => emit_tokens_scss(&sources),
        Format::Tailwind => emit_tailwind_tokens(&sources),
    };
    fs.write(&out, output.as_bytes())?;
    Ok(())
}

/// Parse one embedded DTCG document. The input is compiled into the binary and
/// asserted by the `tokens` tests, so a parse failure is a build-time programmer
/// error, not a runtime condition — hence the panic rather than a [`CliError`].
fn parse(document: &str) -> Value {
    serde_json::from_str(document).expect("embedded DTCG document is valid JSON")
}
