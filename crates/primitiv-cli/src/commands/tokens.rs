use std::path::{Path, PathBuf};

use primitiv_emit::{
    BASE_CSS, BASE_SCSS, TokenSources, emit_breakpoints_ts, emit_tailwind_tokens,
    emit_theme_overrides_css, emit_theme_overrides_scss, emit_theme_overrides_tailwind,
    emit_tokens_css, emit_tokens_scss, tokens_from_dtcg,
};

use crate::commands::theme;
use crate::config::{Config, try_resolve_at};
use crate::error::CliError;
use crate::format::Format;
use crate::palette;
use crate::ports::fs::FileSystem;
use crate::ports::output::Output;
use crate::token_source::{
    BREAKPOINT, CONTEXT, ELEVATION, INTENT, INTERACTION, MOTION, PALETTE, PRIMITIVES, parse,
};

/// What a `tokens` run was asked for — grouped rather than passed positionally,
/// the same shape [`AddOptions`](crate::commands::add::AddOptions) and
/// [`InitOptions`](crate::commands::init::InitOptions) already take, so a call
/// site reads as names instead of a row of `Some`/`None`/`false`.
#[derive(Debug, Default, PartialEq)]
pub struct TokensOptions {
    /// `None` falls back to the config's `tokens.format`, then CSS.
    pub format: Option<Format>,
    /// `None` falls back to the config's `tokens.path`, then stdout.
    pub out: Option<PathBuf>,
    /// The palette to apply; `None` falls back to the config's `theme.palette`.
    pub from: Option<PathBuf>,
    /// Apply the palette's ramps and leave Primitiv's own roles standing.
    pub ramps_only: bool,
}

/// The `primitiv tokens [--out <path>] [--format <fmt>] [--from <palette>]
/// [--ramps-only]` command (RFC 0005 §2.3):
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
///
/// `from` names a palette document to apply (RFC 0032 D14). Omitted, the config's
/// `theme.palette` is used; given, it is also **recorded** there (D10), so the
/// flag is typed once and every later run re-applies the same palette.
/// `ramps_only` applies its colours and leaves Primitiv's own semantics standing
/// (§7 q4) — the consuming build's call, not the designer's.
pub fn tokens(
    fs: &impl FileSystem,
    output: &impl Output,
    options: &TokensOptions,
) -> Result<(), CliError> {
    let TokensOptions {
        format,
        out,
        from,
        ramps_only,
    } = options;
    let (format, ramps_only) = (*format, *ramps_only);
    let (out, from) = (out.as_deref(), from.as_deref());
    // Unconditional now, where it used to be gated on a missing flag. The palette
    // makes the config load-bearing whatever the flags say: without `--from` it is
    // where the reference is read (D2), and with `--from` it is where the reference
    // is written (D10). "A malformed config always errors" is therefore literally
    // true rather than true-unless-both-flags-were-given.
    let located = try_resolve_at(fs, &fs.current_dir()?)?;
    let config = located.as_ref().map(|(_, config)| config);
    let format = format
        .or_else(|| config.map(|config| config.tokens.format))
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
    let target = out
        .map(Path::to_path_buf)
        .or_else(|| config.map(|config| PathBuf::from(&config.tokens.path)));
    match target {
        // A file destination: the base element styles ship as a sibling the token
        // layer imports, so the foundation is one `@import` away (RFC 0008 §7). The
        // import leads the file — CSS requires `@import` before any other rule.
        Some(path) => {
            fs.write(&path.with_file_name(base_name), base_styles.as_bytes())?;
            // Before the token layer, not after: `leading_imports` decides whether
            // to emit the theme `@import` by asking whether that file is there, so
            // the overrides have to land first or the very run that wrote them
            // emits a layer that does not reference them.
            write_overrides(fs, output, &path, format, from, config, ramps_only)?;
            // D10: the reference is recorded so the flag is typed once. Only what
            // `--from` named — a palette that came from the config is already
            // there, and a project with no config has nowhere to record it.
            if let (Some(from), Some((config_path, _))) = (from, located.as_ref()) {
                palette::record(fs, config_path, from)?;
            }
            let imported = format!(
                "{}{rendered}",
                leading_imports(fs, &path, base_name, format)
            );
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

/// Write the palette's override layer beside the token layer, where this project
/// has a palette to write (RFC 0032 D9).
///
/// The destination is not a choice: the token layer imports the overrides by name
/// from its own directory (`leading_imports`), so the file goes where that import
/// points and nowhere else.
fn write_overrides(
    fs: &impl FileSystem,
    output: &impl Output,
    token_path: &Path,
    format: Format,
    from: Option<&Path>,
    config: Option<&Config>,
    ramps_only: bool,
) -> Result<(), CliError> {
    let Some(source) = palette::locate(from, config) else {
        return Ok(());
    };
    let palette = palette::parse(&fs.read(&source)?, &source)?;
    let palette = if ramps_only {
        let carried = palette.token_count();
        let kept = palette::ramps_only(palette);
        // Warned rather than refused (D8), and still written: an override layer
        // that silently does nothing is indistinguishable from one that worked.
        if kept.token_count() == 0 && carried > 0 {
            output.write_stderr(
                format!(
                    "primitiv: warning: --ramps-only discarded all {carried} tokens in {}\n  \
                     the palette carries no colour ramps, only roles\n  \
                     the theme layer is written with no overrides\n",
                    source.display()
                )
                .as_bytes(),
            )?;
        }
        kept
    } else {
        palette
    };
    let documents = [palette.document()];
    let overrides = match format {
        Format::Css => emit_theme_overrides_css(&documents),
        Format::Scss => emit_theme_overrides_scss(&documents),
        Format::Tailwind => emit_theme_overrides_tailwind(&documents),
    };
    let name = format!("{}.{}", theme::FILE_STEM, format.extension());
    fs.write(&token_path.with_file_name(name), overrides.as_bytes())?;
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
