use std::path::{Path, PathBuf};

use primitiv_emit::TokenSources;

use crate::commands::tokens::{UTILITIES_FILE, utilities_css};
use crate::config::try_resolve_at;
use crate::error::CliError;
use crate::format::Format;
use crate::ports::fs::FileSystem;
use crate::ports::output::Output;
use crate::token_source::{
    BREAKPOINT, CONTEXT, ELEVATION, INTENT, INTERACTION, MOTION, PALETTE, PRIMITIVES, parse,
};

/// The `primitiv utilities [--out <path>]` command (RFC 0034 §3.3): write the
/// utility classes once, on demand.
///
/// The destination resolves as `tokens` does: `--out`, else beside the
/// configured token layer, else stdout. Beside the token layer it says how to
/// load the file — the `<link>` an elements page pastes, from the URL its
/// styles are served at, or an import after `tokens.css` — and, when the config
/// does not keep the classes yet, how to have `primitiv tokens` regenerate them.
/// A Tailwind project is refused: Tailwind writes these classes itself.
pub fn utilities(
    fs: &impl FileSystem,
    output: &impl Output,
    out: Option<&Path>,
) -> Result<(), CliError> {
    let dir = fs.current_dir()?;
    let located = try_resolve_at(fs, &dir)?;
    let config = located.as_ref().map(|(_, config)| config);
    if config.is_some_and(|config| config.tokens.format == Format::Tailwind) {
        return Err(CliError::Usage(
            "utilities are for CSS and SCSS projects; Tailwind already writes these classes \
             from Primitiv's tokens (--format tailwind)"
                .to_string(),
        ));
    }
    let base = [
        parse(PRIMITIVES),
        parse(INTERACTION),
        parse(MOTION),
        parse(ELEVATION),
        parse(BREAKPOINT),
    ];
    let theme = [parse(PALETTE), parse(INTENT)];
    let density = [parse(CONTEXT)];
    let css = utilities_css(&TokenSources {
        base: &base,
        theme: &theme,
        density: &density,
    });
    let printed = match (out, config) {
        (Some(path), _) => {
            fs.write(path, css.as_bytes())?;
            format!("Wrote {}.\n", path.display())
        }
        (None, Some(config)) => {
            let path = PathBuf::from(&config.tokens.path).with_file_name(UTILITIES_FILE);
            fs.write(&path, css.as_bytes())?;
            let load = match &config.styles.url {
                Some(url) => format!(
                    " Link it from your page, after tokens.css:\n\n  \
                     <link rel=\"stylesheet\" href=\"{}/{UTILITIES_FILE}\">\n",
                    url.trim_end_matches('/')
                ),
                None => " Import it after tokens.css.\n".to_string(),
            };
            let keep = if config.tokens.utilities {
                ""
            } else {
                "\nTo keep it regenerated with the token layer, set \"utilities\": true in \
                 primitiv.json's tokens block.\n"
            };
            format!("Wrote {}.{load}{keep}", path.display())
        }
        (None, None) => css,
    };
    output.write_stdout(printed.as_bytes())?;
    Ok(())
}
