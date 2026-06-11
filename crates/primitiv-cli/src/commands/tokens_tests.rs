use std::path::Path;

use crate::commands::tokens::tokens;
use crate::error::CliError;
use crate::ports::fs::{FileSystem, InMemoryFs};

#[test]
fn writes_the_design_system_token_layer_as_css() {
    let fs = InMemoryFs::new();
    let out = Path::new("src/styles/primitiv/tokens.css");

    tokens(&fs, out).unwrap();

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
fn surfaces_a_write_failure() {
    let fs = InMemoryFs::new();
    let out = Path::new("tokens.css");
    fs.fail_writes_to(out);

    let err = tokens(&fs, out).unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}
