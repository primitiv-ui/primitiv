use std::path::{Path, PathBuf};

use primitiv_emit::{
    BASE_CSS, BASE_SCSS, TokenSources, emit_breakpoints_ts, emit_tailwind_tokens, emit_tokens_css,
    emit_tokens_scss, tokens_from_dtcg,
};

use crate::commands::theme;
use crate::config::try_resolve;
use crate::error::CliError;
use crate::format::Format;
use crate::ports::fs::FileSystem;
use crate::ports::output::Output;
use crate::token_source::{
    BREAKPOINT, CONTEXT, ELEVATION, INTENT, INTERACTION, MOTION, PALETTE, PRIMITIVES, parse,
};

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
    let base = [
        parse(PRIMITIVES),
        parse(INTERACTION),
        parse(MOTION),
        parse(ELEVATION),
        parse(BREAKPOINT),
    ];
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
    let target = out.map(Path::to_path_buf).or_else(|| {
        config
            .as_ref()
            .map(|config| PathBuf::from(&config.tokens.path))
    });
    match target {
        // A file destination: the base element styles ship as a sibling the token
        // layer imports, so the foundation is one `@import` away (RFC 0008 §7). The
        // import leads the file — CSS requires `@import` before any other rule.
        Some(path) => {
            fs.write(&path.with_file_name(base_name), base_styles.as_bytes())?;
            let imported = format!("{}{rendered}", leading_imports(fs, &path, base_name, format));
            fs.write(&path, imported.as_bytes())?;
            // A JS-consumable sibling for consumers that need a real value outside
            // the CSS cascade — e.g. useMediaQuery's matchMedia() (RFC 0025 §5).
            let breakpoint_tokens = tokens_from_dtcg(&parse(BREAKPOINT));
            let breakpoints_ts = emit_breakpoints_ts(&breakpoint_tokens);
            fs.write(
                &path.with_file_name("breakpoints.ts"),
                breakpoints_ts.as_bytes(),
            )?;
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

/// The `@import` lines the token layer leads with, in cascade-irrelevant order —
/// `primitiv.theme` outranks `primitiv.tokens` by layer, declared up front in the
/// emitted layer statement, so what matters is only that both precede the first
/// rule (CSS requires `@import` before anything else).
///
/// The theme line appears only when that file is actually **there**, beside the token
/// layer. The predicate has to be the file rather than the config's seeds: a default
/// `init` records the shipped brand and deliberately writes no override for it, so
/// keying off the config emitted an import of a stylesheet that does not exist — a
/// build error in every bundler. Tracking the file also self-corrects, whoever wrote
/// or deleted it.
fn leading_imports(
    fs: &impl FileSystem,
    token_path: &Path,
    base_name: &str,
    format: Format,
) -> String {
    let theme_name = format!("{}.{}", theme::FILE_STEM, format.extension());
    if fs.exists(&token_path.with_file_name(&theme_name)) {
        return format!("@import \"./{base_name}\";\n@import \"./{theme_name}\";\n\n");
    }
    format!("@import \"./{base_name}\";\n\n")
}
