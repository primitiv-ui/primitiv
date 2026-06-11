use std::path::Path;

use pretty_assertions::assert_eq;
use primitiv_emit::emit_theme_brand_css;

use crate::error::CliError;
use crate::ports::fs::{FileSystem, InMemoryFs};
use crate::ports::output::InMemoryOutput;
use crate::ports::registry::EmbeddedRegistry;
use crate::run::run;

fn args(parts: &[&str]) -> Vec<String> {
    parts.iter().map(|part| part.to_string()).collect()
}

#[test]
fn dispatches_the_theme_command_and_writes_the_file() {
    let fs = InMemoryFs::new();
    let stdout = InMemoryOutput::new();

    run(&fs, &stdout, &EmbeddedRegistry, &args(&["theme", "--brand", "#0a7755", "--out", "out.css"]))
        .unwrap();

    let written = fs.read(Path::new("out.css")).unwrap();
    assert_eq!(written, emit_theme_brand_css("#0a7755").unwrap().into_bytes());
}

#[test]
fn dispatches_the_init_command_and_writes_the_config() {
    let fs = InMemoryFs::new();
    let stdout = InMemoryOutput::new();
    fs.write(Path::new("package.json"), b"{}").unwrap();

    run(&fs, &stdout, &EmbeddedRegistry, &args(&["init"])).unwrap();

    let written = String::from_utf8(fs.read(Path::new("primitiv.json")).unwrap()).unwrap();
    assert!(written.contains("\"$schema\": \"https://primitiv-ui.dev/schema/primitiv.json\""));
}

#[test]
fn dispatches_the_list_command_and_streams_the_registry() {
    let fs = InMemoryFs::new();
    let stdout = InMemoryOutput::new();

    run(&fs, &stdout, &EmbeddedRegistry, &args(&["list"])).unwrap();

    let streamed = String::from_utf8(stdout.captured()).unwrap();
    assert!(streamed.contains("button"));
}

#[test]
fn dispatches_the_tokens_command_and_writes_the_file() {
    let fs = InMemoryFs::new();
    let stdout = InMemoryOutput::new();

    run(&fs, &stdout, &EmbeddedRegistry, &args(&["tokens", "--out", "tokens.css"])).unwrap();

    let written = String::from_utf8(fs.read(Path::new("tokens.css")).unwrap()).unwrap();
    assert!(written.contains("@layer primitiv.tokens"));
}

#[test]
fn propagates_a_parse_error() {
    let fs = InMemoryFs::new();
    let stdout = InMemoryOutput::new();

    let err = run(&fs, &stdout, &EmbeddedRegistry, &args(&["bogus"])).unwrap_err();

    assert!(matches!(err, CliError::Usage(_)));
}
