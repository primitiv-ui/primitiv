use std::path::Path;

use pretty_assertions::assert_eq;
use primitiv_emit::emit_theme_brand_css;

use crate::error::CliError;
use crate::ports::fs::{FileSystem, InMemoryFs};
use crate::run::run;

fn args(parts: &[&str]) -> Vec<String> {
    parts.iter().map(|part| part.to_string()).collect()
}

#[test]
fn dispatches_the_theme_command_and_writes_the_file() {
    let fs = InMemoryFs::new();

    run(&fs, &args(&["theme", "--brand", "#0a7755", "--out", "out.css"])).unwrap();

    let written = fs.read(Path::new("out.css")).unwrap();
    assert_eq!(written, emit_theme_brand_css("#0a7755").unwrap().into_bytes());
}

#[test]
fn propagates_a_parse_error() {
    let fs = InMemoryFs::new();

    let err = run(&fs, &args(&["bogus"])).unwrap_err();

    assert!(matches!(err, CliError::Usage(_)));
}
