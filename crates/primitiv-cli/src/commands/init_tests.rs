use std::path::Path;

use pretty_assertions::assert_eq;

use crate::commands::init::{init, InitOptions, DEFAULT_BRAND, DEFAULT_STYLES_PATH};
use crate::error::CliError;
use crate::format::Format;
use crate::ports::fs::{FileSystem, InMemoryFs};

/// The options the parser produces when `init` is run with no flags — every
/// value its default.
fn default_options() -> InitOptions {
    InitOptions {
        format: Format::Css,
        brand: DEFAULT_BRAND.to_string(),
        path: DEFAULT_STYLES_PATH.to_string(),
        styles_enabled: true,
        alias_components: None,
        force: false,
    }
}

/// The canonical `primitiv.json` a flag-less `init` writes (RFC 0005 §3.1),
/// hand-authored as the golden the renderer must match byte-for-byte.
const EXPECTED_DEFAULT: &str = r##"{
  "$schema": "https://primitiv-ui.dev/schema/primitiv.json",
  "version": 1,
  "framework": "react",
  "styles": { "enabled": true, "format": "css", "path": "src/styles/primitiv" },
  "tokens": { "format": "css", "path": "src/styles/primitiv/tokens.css" },
  "theme": { "brand": "#0a7755" },
  "aliases": {},
  "registry": { "version": "0.1.0" }
}
"##;

/// The config a fully-flagged `init --format scss --brand #123456 --path
/// app/styles --no-styles --alias-components @/ui` writes — every field driven
/// off its default.
const EXPECTED_SCSS: &str = r##"{
  "$schema": "https://primitiv-ui.dev/schema/primitiv.json",
  "version": 1,
  "framework": "react",
  "styles": { "enabled": false, "format": "scss", "path": "app/styles" },
  "tokens": { "format": "scss", "path": "app/styles/tokens.scss" },
  "theme": { "brand": "#123456" },
  "aliases": { "components": "@/ui" },
  "registry": { "version": "0.1.0" }
}
"##;

/// A Tailwind config: the format name is `tailwind`, but the token layer is a
/// CSS `@theme` preset, so its file keeps the `.css` extension.
const EXPECTED_TAILWIND: &str = r##"{
  "$schema": "https://primitiv-ui.dev/schema/primitiv.json",
  "version": 1,
  "framework": "react",
  "styles": { "enabled": true, "format": "tailwind", "path": "src/styles/primitiv" },
  "tokens": { "format": "tailwind", "path": "src/styles/primitiv/tokens.css" },
  "theme": { "brand": "#0a7755" },
  "aliases": {},
  "registry": { "version": "0.1.0" }
}
"##;

#[test]
fn writes_a_default_primitiv_json_to_the_working_directory() {
    let fs = InMemoryFs::new();
    fs.set_current_dir(Path::new("project"));

    init(&fs, &default_options()).unwrap();

    let written =
        String::from_utf8(fs.read(Path::new("project/primitiv.json")).unwrap()).unwrap();
    assert_eq!(written, EXPECTED_DEFAULT);
}

#[test]
fn reflects_every_overridden_choice_in_the_written_config() {
    let fs = InMemoryFs::new();

    init(
        &fs,
        &InitOptions {
            format: Format::Scss,
            brand: "#123456".to_string(),
            path: "app/styles".to_string(),
            styles_enabled: false,
            alias_components: Some("@/ui".to_string()),
            force: false,
        },
    )
    .unwrap();

    let written = String::from_utf8(fs.read(Path::new("primitiv.json")).unwrap()).unwrap();
    assert_eq!(written, EXPECTED_SCSS);
}

#[test]
fn refuses_to_overwrite_an_existing_config() {
    let fs = InMemoryFs::new();
    let existing = Path::new("primitiv.json");
    fs.write(existing, b"{ \"hand\": \"edited\" }").unwrap();

    let err = init(&fs, &default_options()).unwrap_err();

    assert!(matches!(err, CliError::Conflict(_)));
    // The consumer's file is left exactly as it was (Principle 2).
    assert_eq!(fs.read(existing).unwrap(), b"{ \"hand\": \"edited\" }");
}

#[test]
fn overwrites_an_existing_config_when_forced() {
    let fs = InMemoryFs::new();
    let existing = Path::new("primitiv.json");
    fs.write(existing, b"{ \"hand\": \"edited\" }").unwrap();

    init(
        &fs,
        &InitOptions {
            force: true,
            ..default_options()
        },
    )
    .unwrap();

    let written = String::from_utf8(fs.read(existing).unwrap()).unwrap();
    assert_eq!(written, EXPECTED_DEFAULT);
}

#[test]
fn keeps_the_css_extension_for_the_tailwind_token_layer() {
    let fs = InMemoryFs::new();

    init(
        &fs,
        &InitOptions {
            format: Format::Tailwind,
            ..default_options()
        },
    )
    .unwrap();

    let written = String::from_utf8(fs.read(Path::new("primitiv.json")).unwrap()).unwrap();
    assert_eq!(written, EXPECTED_TAILWIND);
}
