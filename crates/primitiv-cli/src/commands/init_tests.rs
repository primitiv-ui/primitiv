use std::path::Path;

use pretty_assertions::assert_eq;

use crate::commands::init::{init, InitOptions};
use crate::error::CliError;
use crate::format::Format;
use crate::ports::fs::{FileSystem, InMemoryFs};
use crate::ports::output::InMemoryOutput;
use crate::ports::prompt::{Decision, InMemoryPrompt};

/// The options the parser produces when `init` is run with no flags — every
/// promptable choice `None`, left for `init` to resolve.
fn default_options() -> InitOptions {
    InitOptions::default()
}

/// A non-interactive prompt for the tests that don't drive prompting — `init`
/// runs with `interactive = false`, so it is never consulted.
fn silent_prompt() -> InMemoryPrompt {
    InMemoryPrompt::new(Decision::Keep)
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

/// The config a flag-less `init` writes in a project whose `tsconfig.json`
/// declares a root `@/*` path mapping: the `components` alias is detected and
/// persisted rather than left empty.
const EXPECTED_DETECTED_ALIAS: &str = r##"{
  "$schema": "https://primitiv-ui.dev/schema/primitiv.json",
  "version": 1,
  "framework": "react",
  "styles": { "enabled": true, "format": "css", "path": "src/styles/primitiv" },
  "tokens": { "format": "css", "path": "src/styles/primitiv/tokens.css" },
  "theme": { "brand": "#0a7755" },
  "aliases": { "components": "@/components" },
  "registry": { "version": "0.1.0" }
}
"##;

#[test]
fn detects_the_components_alias_from_tsconfig_when_no_flag_is_given() {
    let fs = InMemoryFs::new();
    fs.set_current_dir(Path::new("project"));
    fs.write(Path::new("project/package.json"), b"{}").unwrap();
    fs.write(
        Path::new("project/tsconfig.json"),
        br#"{ "compilerOptions": { "paths": { "@/*": ["./src/*"] } } }"#,
    )
    .unwrap();

    init(&fs, &InMemoryOutput::new(), &silent_prompt(), false, &default_options()).unwrap();

    let written =
        String::from_utf8(fs.read(Path::new("project/primitiv.json")).unwrap()).unwrap();
    assert_eq!(written, EXPECTED_DETECTED_ALIAS);
}

#[test]
fn an_explicit_alias_flag_wins_over_detection() {
    let fs = InMemoryFs::new();
    fs.set_current_dir(Path::new("project"));
    fs.write(Path::new("project/package.json"), b"{}").unwrap();
    // A tsconfig that would otherwise detect `@/components` is ignored when the
    // flag is set.
    fs.write(
        Path::new("project/tsconfig.json"),
        br#"{ "compilerOptions": { "paths": { "@/*": ["./src/*"] } } }"#,
    )
    .unwrap();

    init(
        &fs,
        &InMemoryOutput::new(),
        &silent_prompt(),
        false,
        &InitOptions {
            alias_components: Some("@/ui".to_string()),
            ..default_options()
        },
    )
    .unwrap();

    let written =
        String::from_utf8(fs.read(Path::new("project/primitiv.json")).unwrap()).unwrap();
    assert!(written.contains(r#""aliases": { "components": "@/ui" }"#));
}

#[test]
fn surfaces_a_failure_to_detect_the_alias() {
    let fs = InMemoryFs::new();
    fs.set_current_dir(Path::new("project"));
    fs.write(Path::new("project/package.json"), b"{}").unwrap();
    fs.fail_reads_to(Path::new("project/tsconfig.json"));

    let err = init(&fs, &InMemoryOutput::new(), &silent_prompt(), false, &default_options()).unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}

#[test]
fn writes_a_default_primitiv_json_to_the_working_directory() {
    let fs = InMemoryFs::new();
    fs.set_current_dir(Path::new("project"));
    fs.write(Path::new("project/package.json"), b"{}").unwrap();

    init(&fs, &InMemoryOutput::new(), &silent_prompt(), false, &default_options()).unwrap();

    let written =
        String::from_utf8(fs.read(Path::new("project/primitiv.json")).unwrap()).unwrap();
    assert_eq!(written, EXPECTED_DEFAULT);
}

#[test]
fn reflects_every_overridden_choice_in_the_written_config() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("package.json"), b"{}").unwrap();

    init(
        &fs,
        &InMemoryOutput::new(),
        &silent_prompt(),
        false,
        &InitOptions {
            format: Some(Format::Scss),
            brand: Some("#123456".to_string()),
            path: Some("app/styles".to_string()),
            styles_enabled: Some(false),
            alias_components: Some("@/ui".to_string()),
            force: false,
            yes: false,
        },
    )
    .unwrap();

    let written = String::from_utf8(fs.read(Path::new("primitiv.json")).unwrap()).unwrap();
    assert_eq!(written, EXPECTED_SCSS);
}

#[test]
fn refuses_to_overwrite_an_existing_config() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("package.json"), b"{}").unwrap();
    let existing = Path::new("primitiv.json");
    fs.write(existing, b"{ \"hand\": \"edited\" }").unwrap();

    let err = init(&fs, &InMemoryOutput::new(), &silent_prompt(), false, &default_options()).unwrap_err();

    assert!(matches!(err, CliError::Conflict(_)));
    // The consumer's file is left exactly as it was (Principle 2).
    assert_eq!(fs.read(existing).unwrap(), b"{ \"hand\": \"edited\" }");
}

#[test]
fn overwrites_an_existing_config_when_forced() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("package.json"), b"{}").unwrap();
    let existing = Path::new("primitiv.json");
    fs.write(existing, b"{ \"hand\": \"edited\" }").unwrap();

    init(
        &fs,
        &InMemoryOutput::new(),
        &silent_prompt(),
        false,
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
fn refuses_to_run_outside_a_node_project() {
    let fs = InMemoryFs::new();
    fs.set_current_dir(Path::new("empty"));

    // No package.json in the working directory: there is no project to configure.
    let err = init(&fs, &InMemoryOutput::new(), &silent_prompt(), false, &default_options()).unwrap_err();

    assert!(matches!(err, CliError::Project(_)));
    // Nothing is written into a directory that isn't a project (Principle 2).
    assert!(!fs.exists(Path::new("empty/primitiv.json")));
}

#[test]
fn surfaces_a_failure_to_read_the_working_directory() {
    let fs = InMemoryFs::new();
    fs.fail_current_dir();

    let err = init(&fs, &InMemoryOutput::new(), &silent_prompt(), false, &default_options()).unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}

#[test]
fn surfaces_a_write_failure() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("package.json"), b"{}").unwrap();
    fs.fail_writes_to(Path::new("primitiv.json"));

    let err = init(&fs, &InMemoryOutput::new(), &silent_prompt(), false, &default_options()).unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}

#[test]
fn keeps_the_css_extension_for_the_tailwind_token_layer() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("package.json"), b"{}").unwrap();

    init(
        &fs,
        &InMemoryOutput::new(),
        &silent_prompt(),
        false,
        &InitOptions {
            format: Some(Format::Tailwind),
            ..default_options()
        },
    )
    .unwrap();

    let written = String::from_utf8(fs.read(Path::new("primitiv.json")).unwrap()).unwrap();
    assert_eq!(written, EXPECTED_TAILWIND);
}

/// The config an interactive, flag-less `init` writes when the consumer answers
/// the format / brand / path prompts (and keeps styles via the `[Y/n]` default).
const EXPECTED_INTERACTIVE: &str = r##"{
  "$schema": "https://primitiv-ui.dev/schema/primitiv.json",
  "version": 1,
  "framework": "react",
  "styles": { "enabled": true, "format": "scss", "path": "app/styles" },
  "tokens": { "format": "scss", "path": "app/styles/tokens.scss" },
  "theme": { "brand": "#ff0000" },
  "aliases": {},
  "registry": { "version": "0.1.0" }
}
"##;

#[test]
fn interactive_init_prompts_for_each_omitted_choice() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("package.json"), b"{}").unwrap();
    let prompt = silent_prompt();
    // The free-text prompts are answered in order: format, brand, path. Styles is
    // a [Y/n] confirm, which defaults to yes.
    prompt.queue_answers(&["scss", "#ff0000", "app/styles"]);

    init(&fs, &InMemoryOutput::new(), &prompt, true, &default_options()).unwrap();

    let written = String::from_utf8(fs.read(Path::new("primitiv.json")).unwrap()).unwrap();
    assert_eq!(written, EXPECTED_INTERACTIVE);
    // Each omitted choice was prompted for.
    assert_eq!(prompt.confirmed(), vec!["Include example styles?"]);
    assert_eq!(
        prompt.questions(),
        vec![
            "Stylesheet format (css, scss, tailwind)",
            "Brand colour",
            "Where should copied styles land",
            "Components import alias (blank for relative imports)",
        ]
    );
}

#[test]
fn interactive_init_prompts_for_the_components_alias_pre_filled_with_detection() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("package.json"), b"{}").unwrap();
    // A tsconfig that detects `@/components`: the alias prompt is pre-filled with
    // it, and an empty answer (the exhausted queue) accepts the detected default.
    fs.write(
        Path::new("tsconfig.json"),
        br#"{ "compilerOptions": { "paths": { "@/*": ["./src/*"] } } }"#,
    )
    .unwrap();
    let prompt = silent_prompt();

    init(&fs, &InMemoryOutput::new(), &prompt, true, &default_options()).unwrap();

    let written = String::from_utf8(fs.read(Path::new("primitiv.json")).unwrap()).unwrap();
    assert_eq!(written, EXPECTED_DETECTED_ALIAS);
}

#[test]
fn interactive_init_surfaces_an_alias_prompt_failure() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("package.json"), b"{}").unwrap();
    let prompt = silent_prompt();
    // styles + format + brand + path succeed (calls 1–4); the alias prompt (5) fails.
    prompt.fail_after(4);

    let err = init(&fs, &InMemoryOutput::new(), &prompt, true, &default_options()).unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}

#[test]
fn interactive_init_falls_back_to_css_for_an_unrecognised_format() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("package.json"), b"{}").unwrap();
    let prompt = silent_prompt();
    // An unparseable format answer falls back to CSS; brand and path are left to
    // their defaults (the queue is exhausted, so `ask` returns each default).
    prompt.queue_answers(&["nonsense"]);

    init(&fs, &InMemoryOutput::new(), &prompt, true, &default_options()).unwrap();

    let written = String::from_utf8(fs.read(Path::new("primitiv.json")).unwrap()).unwrap();
    assert_eq!(written, EXPECTED_DEFAULT);
}

#[test]
fn the_yes_flag_accepts_the_defaults_without_prompting() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("package.json"), b"{}").unwrap();
    let prompt = silent_prompt();

    // Interactive, but `--yes` short-circuits every prompt to its default.
    init(
        &fs,
        &InMemoryOutput::new(),
        &prompt,
        true,
        &InitOptions {
            yes: true,
            ..default_options()
        },
    )
    .unwrap();

    let written = String::from_utf8(fs.read(Path::new("primitiv.json")).unwrap()).unwrap();
    assert_eq!(written, EXPECTED_DEFAULT);
    assert!(prompt.confirmed().is_empty());
    assert!(prompt.questions().is_empty());
}

#[test]
fn interactive_init_surfaces_a_styles_prompt_failure() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("package.json"), b"{}").unwrap();
    let prompt = silent_prompt();
    prompt.fail();

    let err = init(&fs, &InMemoryOutput::new(), &prompt, true, &default_options()).unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}

#[test]
fn interactive_init_surfaces_a_format_prompt_failure() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("package.json"), b"{}").unwrap();
    let prompt = silent_prompt();
    // The styles confirm (call 1) succeeds; the format prompt (call 2) fails.
    prompt.fail_after(1);

    let err = init(&fs, &InMemoryOutput::new(), &prompt, true, &default_options()).unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}

#[test]
fn interactive_init_surfaces_a_brand_prompt_failure() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("package.json"), b"{}").unwrap();
    let prompt = silent_prompt();
    // styles confirm + format prompt succeed (calls 1–2); the brand prompt (3) fails.
    prompt.fail_after(2);

    let err = init(&fs, &InMemoryOutput::new(), &prompt, true, &default_options()).unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}

#[test]
fn interactive_init_surfaces_a_path_prompt_failure() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("package.json"), b"{}").unwrap();
    let prompt = silent_prompt();
    // styles + format + brand succeed (calls 1–3); the path prompt (4) fails.
    prompt.fail_after(3);

    let err = init(&fs, &InMemoryOutput::new(), &prompt, true, &default_options()).unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}

#[test]
fn init_emits_the_token_layer_when_styles_are_enabled() {
    let fs = InMemoryFs::new();
    let output = InMemoryOutput::new();
    fs.write(Path::new("package.json"), b"{}").unwrap();

    init(&fs, &output, &silent_prompt(), false, &default_options()).unwrap();

    let token_path = Path::new("src/styles/primitiv/tokens.css");
    assert!(fs.exists(token_path), "token layer should be written");
    let content = String::from_utf8(fs.read(token_path).unwrap()).unwrap();
    assert!(content.contains("@layer primitiv.tokens"));
}

#[test]
fn init_does_not_emit_the_token_layer_when_styles_are_disabled() {
    let fs = InMemoryFs::new();
    let output = InMemoryOutput::new();
    fs.write(Path::new("package.json"), b"{}").unwrap();

    init(
        &fs,
        &output,
        &silent_prompt(),
        false,
        &InitOptions {
            styles_enabled: Some(false),
            ..default_options()
        },
    )
    .unwrap();

    assert!(
        !fs.exists(Path::new("src/styles/primitiv/tokens.css")),
        "token layer must not be written when styles are disabled"
    );
}

#[test]
fn init_surfaces_a_token_layer_write_failure() {
    let fs = InMemoryFs::new();
    let output = InMemoryOutput::new();
    fs.write(Path::new("package.json"), b"{}").unwrap();
    fs.fail_writes_to(Path::new("src/styles/primitiv/tokens.css"));

    let err = init(&fs, &output, &silent_prompt(), false, &default_options()).unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}
