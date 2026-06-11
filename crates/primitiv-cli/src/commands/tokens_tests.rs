use std::path::Path;

use crate::commands::tokens::tokens;
use crate::error::CliError;
use crate::format::Format;
use crate::ports::fs::{FileSystem, InMemoryFs};

/// A `primitiv.json` whose `tokens.path` the command falls back to when `--out`
/// is omitted (RFC 0005 §2.3 / §3.1).
const CONFIG: &[u8] = br##"{
  "version": 1,
  "framework": "react",
  "styles": { "enabled": true, "format": "css", "path": "src/styles/primitiv" },
  "tokens": { "format": "css", "path": "src/styles/from-config.css" },
  "theme": { "brand": "#0a7755" },
  "aliases": {},
  "registry": { "version": "0.1.0" }
}"##;

#[test]
fn writes_the_design_system_token_layer_as_css() {
    let fs = InMemoryFs::new();
    let out = Path::new("src/styles/primitiv/tokens.css");

    tokens(&fs, Format::Css, Some(out)).unwrap();

    let written = String::from_utf8(fs.read(out).unwrap()).unwrap();
    // The cascade-layer declaration (RFC 0008) heads the file.
    assert!(written.contains(
        "@layer primitiv.tokens, primitiv.theme, primitiv.base, primitiv.variants, primitiv.states;"
    ));
    // A real primitive routed into the base :root block (space-4 = 4px → 0.25rem).
    assert!(written.contains("--primitiv-space-space-4: 0.25rem;"));
    // The theme and density axes are scoped (palette/intent and context routed).
    assert!(written.contains("[data-theme=\"dark\"]"));
    assert!(written.contains("[data-density="));
}

#[test]
fn writes_the_token_layer_as_scss_when_the_format_is_scss() {
    let fs = InMemoryFs::new();
    let out = Path::new("src/styles/primitiv/tokens.scss");

    tokens(&fs, Format::Scss, Some(out)).unwrap();

    let written = String::from_utf8(fs.read(out).unwrap()).unwrap();
    // The SCSS surface is the canonical CSS plus resolving $primitiv-* variables.
    assert!(written.contains("@layer primitiv.tokens"));
    assert!(written.contains("$primitiv-space-space-4: var(--primitiv-space-space-4);"));
}

#[test]
fn writes_the_token_layer_as_a_tailwind_preset_when_the_format_is_tailwind() {
    let fs = InMemoryFs::new();
    let out = Path::new("src/styles/primitiv/tokens.css");

    tokens(&fs, Format::Tailwind, Some(out)).unwrap();

    let written = String::from_utf8(fs.read(out).unwrap()).unwrap();
    // The Tailwind v4 @theme preset maps names onto Tailwind namespaces.
    assert!(written.contains("@theme {"));
    assert!(written.contains("--spacing-space-4: var(--primitiv-space-space-4);"));
}

#[test]
fn falls_back_to_the_config_path_when_out_is_omitted() {
    let fs = InMemoryFs::new();
    fs.set_current_dir(Path::new("project"));
    fs.write(Path::new("project/primitiv.json"), CONFIG).unwrap();

    tokens(&fs, Format::Css, None).unwrap();

    // Written to the config's tokens.path, resolved by walking up from the cwd.
    let written = String::from_utf8(fs.read(Path::new("src/styles/from-config.css")).unwrap()).unwrap();
    assert!(written.contains("@layer primitiv.tokens"));
}

#[test]
fn errors_when_out_is_omitted_and_no_config_exists() {
    let fs = InMemoryFs::new();
    fs.set_current_dir(Path::new("project"));

    let err = tokens(&fs, Format::Css, None).unwrap_err();

    assert!(matches!(err, CliError::Config(_)));
}

#[test]
fn errors_when_out_is_omitted_and_the_working_directory_is_unavailable() {
    let fs = InMemoryFs::new();
    fs.fail_current_dir();

    let err = tokens(&fs, Format::Css, None).unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}

#[test]
fn surfaces_a_write_failure() {
    let fs = InMemoryFs::new();
    let out = Path::new("tokens.css");
    fs.fail_writes_to(out);

    let err = tokens(&fs, Format::Css, Some(out)).unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}
