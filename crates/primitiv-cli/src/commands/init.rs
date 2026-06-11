use crate::config;
use crate::error::CliError;
use crate::format::Format;
use crate::ports::fs::FileSystem;

/// The system default brand colour `init` records when none is given — the same
/// hex the `primitiv.json` schema and examples use (RFC 0005 §3.1).
pub const DEFAULT_BRAND: &str = "#0a7755";

/// Where copied component styles land by default (RFC 0005 §3.1).
pub const DEFAULT_STYLES_PATH: &str = "src/styles/primitiv";

/// The `$schema` URL written into every `primitiv.json` so editors can offer
/// completion against the published schema (RFC 0005 §3.1).
const SCHEMA_URL: &str = "https://primitiv-ui.dev/schema/primitiv.json";

/// The fully-resolved choices `init` writes into `primitiv.json`. The parser
/// fills each field from a flag or its default, so this carries no `Option`s and
/// the command is a pure render-and-write (RFC 0005 §2.1). Detection and
/// prompting (package manager, tsconfig alias) are a later increment; for now
/// every value is a flag or a default.
#[derive(Debug, PartialEq)]
pub struct InitOptions {
    pub format: Format,
    pub brand: String,
    pub path: String,
    pub styles_enabled: bool,
    pub alias_components: Option<String>,
    pub force: bool,
}

/// The `primitiv init` command (RFC 0005 §2.1): render the resolved choices into
/// a `primitiv.json` and write it to the working directory through the
/// filesystem port — the durable config every other command reads (§3).
///
/// This is the non-interactive core: the choices arrive as flags (or defaults),
/// not prompts. Honouring Principle 2 (never clobber), an existing
/// `primitiv.json` is a [`CliError::Conflict`] unless `--force` is set.
pub fn init(fs: &impl FileSystem, options: &InitOptions) -> Result<(), CliError> {
    let path = fs.current_dir()?.join(config::FILE_NAME);
    if fs.exists(&path) && !options.force {
        return Err(CliError::Conflict(format!(
            "{} already exists; pass --force to overwrite",
            path.display()
        )));
    }
    fs.write(&path, render(options).as_bytes())?;
    Ok(())
}

/// Serialise the options into the canonical `primitiv.json` text. Hand-rendered
/// (not `serde_json`) so the emitted bytes are an exactly-authored golden, the
/// same discipline as the emitter's CSS output (RFC 0007 §4).
fn render(options: &InitOptions) -> String {
    let aliases = match &options.alias_components {
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
        enabled = options.styles_enabled,
        format = options.format.as_str(),
        path = options.path,
        ext = token_extension(options.format),
        brand = options.brand,
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
