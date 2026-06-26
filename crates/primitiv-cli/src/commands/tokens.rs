use std::path::{Path, PathBuf};

use primitiv_emit::{
    emit_tailwind_tokens, emit_tokens_css, emit_tokens_scss, TokenSources, BASE_CSS, BASE_SCSS,
};
use serde_json::Value;

use crate::config::try_resolve;
use crate::error::CliError;
use crate::format::Format;
use crate::ports::fs::FileSystem;
use crate::ports::output::Output;

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
/// The destination resolves in three tiers (RFC 0005 §2.3 / §3.2, Principle 4):
/// an explicit `--out` always wins; otherwise the nearest `primitiv.json`'s
/// `tokens.path` is used; with neither a file destination nor a config, the
/// layer streams to **stdout** (the fully config-less `tokens --format css`).
/// `format`, when omitted, falls back to the config's `tokens.format` and then
/// to CSS. A missing config is fine; a *malformed* config always errors.
pub fn tokens(
    fs: &impl FileSystem,
    output: &impl Output,
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
    let base = [parse(PRIMITIVES), parse(INTERACTION)];
    let theme = [parse(PALETTE), parse(INTENT)];
    let density = [parse(CONTEXT)];
    let sources = TokenSources {
        base: &base,
        theme: &theme,
        density: &density,
    };
    let rendered = match format {
        Format::Css => emit_tokens_css(&sources),
        Format::Scss => emit_tokens_scss(&sources),
        Format::Tailwind => emit_tailwind_tokens(&sources),
    };
    let (base_name, base_styles) = base_companion(format);
    let target = out
        .map(Path::to_path_buf)
        .or_else(|| config.as_ref().map(|config| PathBuf::from(&config.tokens.path)));
    match target {
        // A file destination: the base element styles ship as a sibling the token
        // layer imports, so the foundation is one `@import` away (RFC 0008 §7). The
        // import leads the file — CSS requires `@import` before any other rule.
        Some(path) => {
            fs.write(&path.with_file_name(base_name), base_styles.as_bytes())?;
            let imported = format!("@import \"./{base_name}\";\n\n{rendered}");
            fs.write(&path, imported.as_bytes())?;
        }
        // No file to host a sibling: inline the base layer after the tokens so the
        // streamed foundation stays self-contained.
        None => output.write_stdout(format!("{rendered}\n{base_styles}").as_bytes())?,
    }
    Ok(())
}

/// The base element stylesheet companion for a format: its sibling filename and
/// embedded contents. CSS and Tailwind share the canonical CSS sheet; SCSS takes
/// the byte-identical `.scss` mirror so a Sass pipeline imports a partial.
fn base_companion(format: Format) -> (&'static str, &'static str) {
    match format {
        Format::Css | Format::Tailwind => ("primitiv-base.css", BASE_CSS),
        Format::Scss => ("primitiv-base.scss", BASE_SCSS),
    }
}

/// Parse one embedded DTCG document. The input is compiled into the binary and
/// asserted by the `tokens` tests, so a parse failure is a build-time programmer
/// error, not a runtime condition — hence the panic rather than a [`CliError`].
fn parse(document: &str) -> Value {
    serde_json::from_str(document).expect("embedded DTCG document is valid JSON")
}
