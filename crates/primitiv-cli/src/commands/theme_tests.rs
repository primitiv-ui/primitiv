use std::path::Path;

use pretty_assertions::assert_eq;
use primitiv_emit::{emit_theme_brand_css, emit_theme_brand_scss, emit_theme_brand_tailwind};

use crate::commands::theme::theme;
use crate::error::CliError;
use crate::format::Format;
use crate::ports::fs::{FileSystem, InMemoryFs};

#[test]
fn writes_the_brand_theme_css_to_the_out_path() {
    let fs = InMemoryFs::new();
    let out = Path::new("src/styles/primitiv.theme.css");

    theme(&fs, "#0a7755", out, Format::Css).unwrap();

    let written = fs.read(out).unwrap();
    let expected = emit_theme_brand_css("#0a7755").unwrap();
    assert_eq!(written, expected.into_bytes());
}

#[test]
fn writes_the_brand_theme_scss_when_the_format_is_scss() {
    let fs = InMemoryFs::new();
    let out = Path::new("src/styles/primitiv.theme.scss");

    theme(&fs, "#0a7755", out, Format::Scss).unwrap();

    let written = fs.read(out).unwrap();
    let expected = emit_theme_brand_scss("#0a7755").unwrap();
    assert_eq!(written, expected.into_bytes());
}

#[test]
fn writes_the_brand_theme_tailwind_when_the_format_is_tailwind() {
    let fs = InMemoryFs::new();
    let out = Path::new("src/styles/primitiv.theme.css");

    theme(&fs, "#0a7755", out, Format::Tailwind).unwrap();

    let written = fs.read(out).unwrap();
    let expected = emit_theme_brand_tailwind("#0a7755").unwrap();
    assert_eq!(written, expected.into_bytes());
}

#[test]
fn surfaces_an_invalid_brand_colour() {
    let fs = InMemoryFs::new();

    let err = theme(&fs, "not-a-colour", Path::new("out.css"), Format::Css).unwrap_err();

    assert!(matches!(err, CliError::InvalidColor(_)));
}

#[test]
fn surfaces_an_invalid_brand_colour_in_the_scss_path() {
    let fs = InMemoryFs::new();

    let err = theme(&fs, "not-a-colour", Path::new("out.scss"), Format::Scss).unwrap_err();

    assert!(matches!(err, CliError::InvalidColor(_)));
}

#[test]
fn surfaces_an_invalid_brand_colour_in_the_tailwind_path() {
    let fs = InMemoryFs::new();

    let err = theme(&fs, "not-a-colour", Path::new("out.css"), Format::Tailwind).unwrap_err();

    assert!(matches!(err, CliError::InvalidColor(_)));
}

#[test]
fn surfaces_a_write_failure() {
    let fs = InMemoryFs::new();
    let out = Path::new("out.css");
    fs.fail_writes_to(out);

    let err = theme(&fs, "#0a7755", out, Format::Css).unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}
