use std::path::{Path, PathBuf};

use primitiv_emit::{
    BASE_CSS, BASE_SCSS, TokenSources, emit_breakpoints_ts, emit_tailwind_tokens, emit_tokens_css,
    emit_tokens_scss, tokens_from_dtcg,
};

use crate::commands::theme;
use crate::config::{try_resolve, Config};
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
    // Resolved unconditionally, not just when a flag is missing: whether the project
    // seeded its own ramps decides what the token layer imports, so the config is
    // always relevant to the output. This also makes "a malformed config always
    // errors" hold for every invocation, matching `resolve_seeds` — silently
    // ignoring a file the consumer wrote is worse than stopping.
    let config = try_resolve(fs, &fs.current_dir()?)?;
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
            let imported = format!("{}{rendered}", leading_imports(base_name, format, &config));
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
/// The theme line appears only for a project whose `primitiv.json` carries ramp
/// seeds, because that is the project that has a theme file to import; importing
/// one that does not exist is a build error in every bundler.
fn leading_imports(base_name: &str, format: Format, config: &Option<Config>) -> String {
    let seeded = config
        .as_ref()
        .is_some_and(|config| !config.theme.seeds.is_empty());
    let theme = if seeded {
        format!(
            "@import \"./{}.{}\";\n",
            theme::FILE_STEM,
            format.extension()
        )
    } else {
        String::new()
    };
    format!("@import \"./{base_name}\";\n{theme}\n")
}
