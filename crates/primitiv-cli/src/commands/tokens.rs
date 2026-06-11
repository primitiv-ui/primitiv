use std::path::{Path, PathBuf};

use primitiv_emit::{emit_tailwind_tokens, emit_tokens_css, emit_tokens_scss, TokenSources};
use serde_json::Value;

use crate::config::resolve;
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
/// token layer in the requested `format`, and write it through the filesystem
/// port. CSS is canonical; SCSS is the canonical CSS plus resolving
/// `$primitiv-*` variables; Tailwind is the `@theme` preset.
///
/// When `out` is omitted the destination falls back to the `tokens.path` of the
/// nearest `primitiv.json` (resolved by walking up from the working directory),
/// so an `init`-ed project needs no flag (RFC 0005 §3.2). Defaulting the
/// *format* from the config — and emitting to stdout with no config at all — are
/// later increments.
pub fn tokens(fs: &impl FileSystem, format: Format, out: Option<&Path>) -> Result<(), CliError> {
    let out = match out {
        Some(out) => out.to_path_buf(),
        None => PathBuf::from(resolve(fs, &fs.current_dir()?)?.tokens.path),
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
