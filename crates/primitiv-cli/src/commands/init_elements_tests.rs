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
