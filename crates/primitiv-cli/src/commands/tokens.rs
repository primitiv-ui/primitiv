use std::path::Path;

use primitiv_emit::{emit_tokens_css, TokenSources};
use serde_json::Value;

use crate::error::CliError;
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

/// The `primitiv tokens --out <path>` command (RFC 0005 §2.3): route the
/// embedded design-system DTCG into the emitter, serialise the shared token
/// layer as canonical CSS, and write it to `out` through the filesystem port.
/// SCSS / Tailwind formats and `primitiv.json` path / format defaults land next.
pub fn tokens(fs: &impl FileSystem, out: &Path) -> Result<(), CliError> {
    let base = [parse(PRIMITIVES), parse(INTERACTION)];
    let theme = [parse(PALETTE), parse(INTENT)];
    let density = [parse(CONTEXT)];
    let css = emit_tokens_css(&TokenSources {
        base: &base,
        theme: &theme,
        density: &density,
    });
    fs.write(out, css.as_bytes())?;
    Ok(())
}

/// Parse one embedded DTCG document. The input is compiled into the binary and
/// asserted by the `tokens` tests, so a parse failure is a build-time programmer
/// error, not a runtime condition — hence the panic rather than a [`CliError`].
fn parse(document: &str) -> Value {
    serde_json::from_str(document).expect("embedded DTCG document is valid JSON")
}
