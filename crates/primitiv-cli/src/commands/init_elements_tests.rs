//! `init` and the elements surface (RFC 0033 §8.2): the surface it records,
//! the default it detects, and the project with no `package.json` it accepts.

use std::path::Path;

use crate::commands::init::{InitOptions, init};
use crate::config::{Config, Surface};
use crate::ports::fs::{FileSystem, InMemoryFs};
use crate::ports::output::InMemoryOutput;
use crate::ports::prompt::{Decision, InMemoryPrompt};
use crate::ports::registry::EmbeddedRegistry;

/// Run a non-interactive `init` and parse the config it wrote.
fn init_config(fs: &InMemoryFs, options: InitOptions) -> Config {
    init(
        fs,
        &InMemoryOutput::new(),
        &EmbeddedRegistry,
        &InMemoryPrompt::new(Decision::Keep),
        false,
        &options,
    )
    .unwrap();
    Config::parse(&fs.read(Path::new("primitiv.json")).unwrap()).unwrap()
}

#[test]
fn records_the_surface_it_is_given() {
    let fs = InMemoryFs::new();
    fs.write(
        Path::new("package.json"),
        br#"{ "dependencies": { "react": "^19.0.0" } }"#,
    )
    .unwrap();

    let config = init_config(
        &fs,
        InitOptions {
            surface: Some(Surface::Elements),
            path: Some("site/styles".into()),
            ..Default::default()
        },
    );

    assert_eq!(config.surface, Surface::Elements);
}

#[test]
fn defaults_a_project_without_react_to_the_elements_surface() {
    // A Vue, Angular or server-rendered project lists no React.
    let fs = InMemoryFs::new();
    fs.write(
        Path::new("package.json"),
        br#"{ "dependencies": { "vue": "^3.5.0" } }"#,
    )
    .unwrap();

    assert_eq!(
        init_config(&fs, InitOptions::default()).surface,
        Surface::Elements
    );
}

#[test]
fn configures_a_folder_with_no_package_json_for_the_elements_surface() {
    // A plain HTML site has no package.json, and no package manager to need one.
    let fs = InMemoryFs::new();

    assert_eq!(
        init_config(&fs, InitOptions::default()).surface,
        Surface::Elements
    );
}

#[test]
fn defaults_the_elements_styles_path_to_a_primitiv_folder() {
    // A site has no src/ convention; one folder holds the page's styles and snippets.
    let fs = InMemoryFs::new();

    let config = init_config(&fs, InitOptions::default());

    assert_eq!(config.styles.path, "primitiv");
    assert_eq!(config.tokens.path, "primitiv/tokens.css");
}

#[test]
fn defaults_the_styles_path_to_the_static_folder_of_a_project_it_recognises() {
    // A Spring Boot project serves src/main/resources/static at the site root.
    let fs = InMemoryFs::new();
    fs.write(Path::new("pom.xml"), b"").unwrap();

    let config = init_config(&fs, InitOptions::default());

    assert_eq!(config.styles.path, "src/main/resources/static/primitiv");
    assert_eq!(config.tokens.path, "src/main/resources/static/primitiv/tokens.css");
}

#[test]
fn asks_for_the_surface_first_when_interactive_and_takes_the_answer() {
    // Detection would say elements (no react); the person says react.
    let fs = InMemoryFs::new();
    fs.write(Path::new("package.json"), b"{}").unwrap();
    let prompt = InMemoryPrompt::new(Decision::Keep);
    prompt.queue_answers(&["react"]);

    init(
        &fs,
        &InMemoryOutput::new(),
        &EmbeddedRegistry,
        &prompt,
        true,
        &InitOptions::default(),
    )
    .unwrap();

    let config = Config::parse(&fs.read(Path::new("primitiv.json")).unwrap()).unwrap();
    assert_eq!(config.surface, Surface::React);
    assert_eq!(
        prompt.questions().first().map(String::as_str),
        Some("Surface (react, elements)")
    );
}

#[test]
fn keeps_the_detected_surface_for_an_unrecognised_answer() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("package.json"), b"{}").unwrap();
    let prompt = InMemoryPrompt::new(Decision::Keep);
    prompt.queue_answers(&["vue"]);

    init(
        &fs,
        &InMemoryOutput::new(),
        &EmbeddedRegistry,
        &prompt,
        true,
        &InitOptions::default(),
    )
    .unwrap();

    let config = Config::parse(&fs.read(Path::new("primitiv.json")).unwrap()).unwrap();
    assert_eq!(config.surface, Surface::Elements);
}

#[test]
fn surfaces_a_failed_surface_prompt() {
    let fs = InMemoryFs::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);
    prompt.fail();

    let error = init(
        &fs,
        &InMemoryOutput::new(),
        &EmbeddedRegistry,
        &prompt,
        true,
        &InitOptions::default(),
    )
    .unwrap_err();

    assert!(matches!(error, crate::error::CliError::Io(_)), "{error:?}");
    assert!(!fs.exists(Path::new("primitiv.json")));
}

#[test]
fn surfaces_a_package_json_that_cannot_be_read() {
    // Missing means "no React"; unreadable is an error, not a guess.
    let fs = InMemoryFs::new();
    fs.write(Path::new("package.json"), b"{}").unwrap();
    fs.fail_reads_to(Path::new("package.json"));

    let error = init(
        &fs,
        &InMemoryOutput::new(),
        &EmbeddedRegistry,
        &InMemoryPrompt::new(Decision::Keep),
        false,
        &InitOptions::default(),
    )
    .unwrap_err();

    assert!(matches!(error, crate::error::CliError::Io(_)), "{error:?}");
}

#[test]
fn records_an_elements_project_as_headless_by_default() {
    // Styling is the opt-in on the elements surface: `add` then copies nothing.
    let fs = InMemoryFs::new();

    assert!(!init_config(&fs, InitOptions::default()).styles.enabled);
}

#[test]
fn records_the_url_a_recognised_project_serves_its_styles_at() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("build.gradle.kts"), b"").unwrap();

    let config = init_config(&fs, InitOptions::default());

    assert_eq!(config.styles.url.as_deref(), Some("/primitiv"));
}

#[test]
fn records_the_url_it_is_given() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("pom.xml"), b"").unwrap();

    let config = init_config(
        &fs,
        InitOptions {
            url: Some("/app/primitiv".into()),
            ..Default::default()
        },
    );

    assert_eq!(config.styles.url.as_deref(), Some("/app/primitiv"));
}

#[test]
fn takes_the_path_as_the_url_of_a_site_it_does_not_recognise() {
    // A plain site served from its own folder: the relative path is the URL,
    // which is what the printed links have always been.
    let fs = InMemoryFs::new();

    let config = init_config(
        &fs,
        InitOptions {
            path: Some("public/primitiv".into()),
            ..Default::default()
        },
    );

    assert_eq!(config.styles.url.as_deref(), Some("public/primitiv"));
}

#[test]
fn keeps_the_detected_url_only_for_the_detected_path() {
    // Choosing another folder makes the detected URL a guess about the wrong one.
    let fs = InMemoryFs::new();
    fs.write(Path::new("pom.xml"), b"").unwrap();

    let config = init_config(
        &fs,
        InitOptions {
            path: Some("web/primitiv".into()),
            ..Default::default()
        },
    );

    assert_eq!(config.styles.url.as_deref(), Some("web/primitiv"));
}

#[test]
fn records_no_url_for_the_react_surface() {
    // A bundler imports the styles; there is no page to link them from.
    let fs = InMemoryFs::new();
    fs.write(
        Path::new("package.json"),
        br#"{ "dependencies": { "react": "^19.0.0" } }"#,
    )
    .unwrap();

    let config = init_config(
        &fs,
        InitOptions {
            surface: Some(Surface::React),
            ..Default::default()
        },
    );

    assert_eq!(config.styles.url, None);
}

#[test]
fn asks_for_the_url_after_the_path_when_interactive() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("pom.xml"), b"").unwrap();
    let prompt = InMemoryPrompt::new(Decision::Keep);
    // surface, format, brand, path, url
    prompt.queue_answers(&["elements", "css", "#236ce1", "", "/static/primitiv"]);

    init(
        &fs,
        &InMemoryOutput::new(),
        &EmbeddedRegistry,
        &prompt,
        true,
        &InitOptions::default(),
    )
    .unwrap();

    let config = Config::parse(&fs.read(Path::new("primitiv.json")).unwrap()).unwrap();
    assert_eq!(config.styles.url.as_deref(), Some("/static/primitiv"));
    assert_eq!(
        prompt.questions().get(4).map(String::as_str),
        Some("URL the styles folder is served at")
    );
}

#[test]
fn surfaces_a_failed_url_prompt() {
    let fs = InMemoryFs::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);
    // surface, styles, format, brand and path succeed; the URL prompt fails.
    prompt.fail_after(5);

    let error = init(
        &fs,
        &InMemoryOutput::new(),
        &EmbeddedRegistry,
        &prompt,
        true,
        &InitOptions::default(),
    )
    .unwrap_err();

    assert!(matches!(error, crate::error::CliError::Io(_)), "{error:?}");
    assert_eq!(prompt.questions().last().map(String::as_str), Some("Where should copied styles land"));
}

/// Run a non-interactive `init` and return what it printed.
fn init_output(fs: &InMemoryFs, options: InitOptions) -> String {
    let output = InMemoryOutput::new();
    init(
        fs,
        &output,
        &EmbeddedRegistry,
        &InMemoryPrompt::new(Decision::Keep),
        false,
        &options,
    )
    .unwrap();
    String::from_utf8(output.captured()).unwrap()
}

#[test]
fn a_styled_elements_init_prints_the_links_its_page_needs() {
    // The token layer it just wrote, at the URL the server serves it from, and
    // the fonts the tokens name — loaded, or the stack falls back to sans-serif.
    let fs = InMemoryFs::new();
    fs.write(Path::new("pom.xml"), b"").unwrap();

    let printed = init_output(
        &fs,
        InitOptions {
            styles_enabled: Some(true),
            ..Default::default()
        },
    );

    assert!(
        printed.ends_with(
            "\nLink the base styles from your page:\n\n  \
             <link rel=\"stylesheet\" href=\"/primitiv/tokens.css\">\n\n\
             The tokens name Asta Sans, Khand and JetBrains Mono. Load them, or text falls back to your system's sans-serif:\n\n  \
             <link rel=\"stylesheet\" href=\"https://fonts.googleapis.com/css2?family=Asta+Sans:wght@300..800&family=Khand:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400..700&display=swap\">\n"
        ),
        "{printed}"
    );
}

#[test]
fn a_headless_elements_init_prints_no_links() {
    // Nothing was written to link.
    let fs = InMemoryFs::new();

    assert!(!init_output(&fs, InitOptions::default()).contains("<link"));
}

#[test]
fn an_elements_init_in_scss_leaves_linking_to_the_build() {
    let fs = InMemoryFs::new();

    let printed = init_output(
        &fs,
        InitOptions {
            styles_enabled: Some(true),
            format: Some(crate::format::Format::Scss),
            ..Default::default()
        },
    );

    assert!(!printed.contains("<link"), "{printed}");
}

#[test]
fn surfaces_a_failure_printing_the_links() {
    let fs = InMemoryFs::new();
    let output = InMemoryOutput::new();
    output.fail_stdout();

    let error = init(
        &fs,
        &output,
        &EmbeddedRegistry,
        &InMemoryPrompt::new(Decision::Keep),
        false,
        &InitOptions {
            styles_enabled: Some(true),
            ..Default::default()
        },
    )
    .unwrap_err();

    assert!(matches!(error, crate::error::CliError::Io(_)), "{error:?}");
}
