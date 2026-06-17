use crate::config;
use crate::detect;
use crate::error::CliError;
use crate::format::Format;
use crate::ports::fs::FileSystem;
use crate::ports::output::Output;
use crate::ports::prompt::Prompt;

/// The system default brand colour `init` records when none is given — the same
/// hex the `primitiv.json` schema and examples use (RFC 0005 §3.1).
pub const DEFAULT_BRAND: &str = "#0a7755";

/// Where copied component styles land by default (RFC 0005 §3.1).
pub const DEFAULT_STYLES_PATH: &str = "src/styles/primitiv";

/// The `$schema` URL written into every `primitiv.json` so editors can offer
/// completion against the published schema (RFC 0005 §3.1).
const SCHEMA_URL: &str = "https://primitiv-ui.dev/schema/primitiv.json";

/// The flag-level choices `init` resolves into `primitiv.json` (RFC 0005 §2.1).
/// Each promptable choice is an `Option`: `Some` when its flag was given, `None`
/// when omitted — left for `init` to resolve, by **prompting** the consumer in an
/// interactive session (each pre-filled with its default) or falling back to the
/// default otherwise (§2.1). `alias_components` has a third source — when its flag
/// is absent `init` *detects* it from the project's `tsconfig.json` /
/// `jsconfig.json` (§3.3).
#[derive(Debug, Default, PartialEq)]
pub struct InitOptions {
    pub format: Option<Format>,
    pub brand: Option<String>,
    pub path: Option<String>,
    pub styles_enabled: Option<bool>,
    /// The components import alias when given explicitly via
    /// `--alias-components`; `None` defers to tsconfig/jsconfig detection.
    pub alias_components: Option<String>,
    pub force: bool,
    /// Accept the detected defaults without prompting (the `--yes` flag) — so an
    /// interactive session can still run non-interactively (RFC 0005 §2.1 / §5).
    pub yes: bool,
}

/// The choices resolved into the exact values `render` writes — every `Option`
/// from [`InitOptions`] collapsed to a concrete value by a flag, a prompt, or a
/// default.
struct ResolvedInit {
    format: Format,
    brand: String,
    path: String,
    styles_enabled: bool,
    alias_components: Option<String>,
}

/// The `primitiv init` command (RFC 0005 §2.1): resolve the consumer's choices
/// into a `primitiv.json` and write it to the working directory through the
/// filesystem port — the durable config every other command reads (§3).
///
/// Each omitted choice is **prompted** for when the session is `interactive` (and
/// `--yes` was not passed), pre-filled with its default; otherwise the default is
/// taken silently (§2.1, Principle 3 — every prompt has a flag). Honouring
/// Principle 2 (never clobber), an existing `primitiv.json` is a
/// [`CliError::Conflict`] unless `--force` is set.
///
/// When `--alias-components` is omitted the components import alias is
/// **detected** from the project's `tsconfig.json` / `jsconfig.json`
/// (`detect::components_alias`, RFC 0005 §3.3); an explicit flag always wins,
/// and a project with no detectable alias falls back to relative imports (an
/// empty `aliases` map).
///
/// `init` configures an **existing** project; it never scaffolds one. Run in a
/// directory with no `package.json` it is a [`CliError::Project`] pointing at
/// `npm create vite` / `create-next-app` (RFC 0005 §1.5.1), rather than seeding
/// a `primitiv.json` next to nothing.
pub fn init(
    fs: &impl FileSystem,
    output: &impl Output,
    prompt: &impl Prompt,
    interactive: bool,
    options: &InitOptions,
) -> Result<(), CliError> {
    let dir = fs.current_dir()?;
    if !fs.exists(&dir.join("package.json")) {
        return Err(CliError::Project(format!(
            "no package.json found in {}; create an app first \
             (e.g. npm create vite or create-next-app), then run primitiv init",
            dir.display()
        )));
    }
    let path = dir.join(config::FILE_NAME);
    if fs.exists(&path) && !options.force {
        return Err(CliError::Conflict(format!(
            "{} already exists; pass --force to overwrite",
            path.display()
        )));
    }
    // Detect the alias only when the flag is absent — an explicit
    // `--alias-components` wins in `resolve`, so detection would be discarded.
    let detected_alias = match options.alias_components {
        Some(_) => None,
        None => detect::components_alias(fs, &dir)?,
    };
    let resolved = resolve(options, prompt, interactive, detected_alias)?;
    fs.write(&path, render(&resolved).as_bytes())?;
    if resolved.styles_enabled {
        let token_dir = dir.join(&resolved.path);
        let token_out = token_dir.join(format!("tokens.{}", token_extension(resolved.format)));
        fs.create_dir_all(&token_dir)?;
        crate::commands::tokens::tokens(fs, output, Some(resolved.format), Some(&token_out))?;
    }
    Ok(())
}

/// Collapse each [`InitOptions`] choice to a concrete value: a given flag wins;
/// otherwise an interactive session (not `--yes`) prompts for it pre-filled with
/// its default, and a non-interactive one takes the default silently (RFC 0005
/// §2.1). The components alias prompt is pre-filled with the **detected** value
/// (`detected_alias`); a blank answer (no detection, nothing typed) means relative
/// imports.
fn resolve(
    options: &InitOptions,
    prompt: &impl Prompt,
    interactive: bool,
    detected_alias: Option<String>,
) -> Result<ResolvedInit, CliError> {
    let ask = interactive && !options.yes;
    let styles_enabled = match options.styles_enabled {
        Some(value) => value,
        None if ask => prompt
            .confirm("Include example styles?")
            .map_err(CliError::Io)?,
        None => true,
    };
    let format = match options.format {
        Some(value) => value,
        None if ask => {
            let answer =
                ask_text(prompt, "Stylesheet format (css, scss, tailwind)", Format::Css.as_str())?;
            Format::parse(&answer).unwrap_or(Format::Css)
        }
        None => Format::Css,
    };
    let brand = match &options.brand {
        Some(value) => value.clone(),
        None if ask => ask_text(prompt, "Brand colour", DEFAULT_BRAND)?,
        None => DEFAULT_BRAND.to_string(),
    };
    let path = match &options.path {
        Some(value) => value.clone(),
        None if ask => ask_text(prompt, "Where should copied styles land", DEFAULT_STYLES_PATH)?,
        None => DEFAULT_STYLES_PATH.to_string(),
    };
    let alias_components = match &options.alias_components {
        Some(value) => Some(value.clone()),
        None if ask => {
            let answer = ask_text(
                prompt,
                "Components import alias (blank for relative imports)",
                detected_alias.as_deref().unwrap_or(""),
            )?;
            (!answer.is_empty()).then_some(answer)
        }
        None => detected_alias,
    };
    Ok(ResolvedInit {
        format,
        brand,
        path,
        styles_enabled,
        alias_components,
    })
}

/// Ask a free-text `question` pre-filled with `default` through the [`Prompt`]
/// port, mapping a stream failure to a [`CliError::Io`] — the single error seam
/// the brand / path / format prompts share.
fn ask_text(prompt: &impl Prompt, question: &str, default: &str) -> Result<String, CliError> {
    prompt.ask(question, default).map_err(CliError::Io)
}

/// Serialise the resolved choices into the canonical `primitiv.json` text.
/// Hand-rendered (not `serde_json`) so the emitted bytes are an exactly-authored
/// golden, the same discipline as the emitter's CSS output (RFC 0007 §4).
fn render(resolved: &ResolvedInit) -> String {
    let aliases = match &resolved.alias_components {
        Some(value) => format!("{{ \"components\": \"{value}\" }}"),
        None => "{}".to_string(),
    };
    format!(
        "{{\n  \"$schema\": \"{schema}\",\n  \"version\": 1,\n  \"framework\": \"react\",\n  \
         \"styles\": {{ \"enabled\": {enabled}, \"format\": \"{format}\", \"path\": \"{path}\" }},\n  \
         \"tokens\": {{ \"format\": \"{format}\", \"path\": \"{path}/tokens.{ext}\" }},\n  \
         \"theme\": {{ \"brand\": \"{brand}\" }},\n  \
         \"aliases\": {aliases},\n  \
         \"registry\": {{ \"version\": \"0.1.0\" }}\n}}\n",
        schema = SCHEMA_URL,
        enabled = resolved.styles_enabled,
        format = resolved.format.as_str(),
        path = resolved.path,
        ext = token_extension(resolved.format),
        brand = resolved.brand,
        aliases = aliases,
    )
}

/// The file extension for the token layer in a given format — Tailwind emits a
/// CSS `@theme` preset, so it shares CSS's extension.
fn token_extension(format: Format) -> &'static str {
    match format {
        Format::Css | Format::Tailwind => "css",
        Format::Scss => "scss",
    }
}
