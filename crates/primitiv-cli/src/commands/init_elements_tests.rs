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
    fs.write(Path::new("package.json"), br#"{ "dependencies": { "react": "^19.0.0" } }"#).unwrap();

    let config = init_config(
        &fs,
        InitOptions { surface: Some(Surface::Elements), path: Some("site/styles".into()), ..Default::default() },
    );

    assert_eq!(config.surface, Surface::Elements);
}

#[test]
fn defaults_a_project_without_react_to_the_elements_surface() {
    // A Vue, Angular or server-rendered project lists no React.
    let fs = InMemoryFs::new();
    fs.write(Path::new("package.json"), br#"{ "dependencies": { "vue": "^3.5.0" } }"#).unwrap();

    assert_eq!(init_config(&fs, InitOptions::default()).surface, Surface::Elements);
}

#[test]
fn configures_a_folder_with_no_package_json_for_the_elements_surface() {
    // A plain HTML site has no package.json, and no package manager to need one.
    let fs = InMemoryFs::new();

    assert_eq!(init_config(&fs, InitOptions::default()).surface, Surface::Elements);
}


#[test]
fn defaults_the_elements_styles_path_to_a_primitiv_folder() {
    // A site has no src/ convention; one folder holds the page's styles and snippets.
    let fs = InMemoryFs::new();

    let config = init_config(&fs, InitOptions::default());

    assert_eq!(config.styles.path, "primitiv");
    assert_eq!(config.tokens.path, "primitiv/tokens.css");
}
