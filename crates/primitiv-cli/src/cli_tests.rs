use pretty_assertions::assert_eq;

use crate::cli::{parse, Command};
use crate::error::CliError;
use crate::format::Format;

fn args(parts: &[&str]) -> Vec<String> {
    parts.iter().map(|part| part.to_string()).collect()
}

#[test]
fn parses_the_theme_command_with_brand_and_out() {
    let command = parse(&args(&["theme", "--brand", "#0a7755", "--out", "x.css"])).unwrap();

    assert_eq!(
        command,
        Command::Theme {
            brand: "#0a7755".to_string(),
            out: "x.css".to_string(),
            format: Format::Css,
        }
    );
}

#[test]
fn parses_an_explicit_scss_format() {
    let command =
        parse(&args(&["theme", "--brand", "#0a7755", "--out", "x.scss", "--format", "scss"]))
            .unwrap();

    assert_eq!(
        command,
        Command::Theme {
            brand: "#0a7755".to_string(),
            out: "x.scss".to_string(),
            format: Format::Scss,
        }
    );
}

#[test]
fn parses_an_explicit_css_format() {
    let command =
        parse(&args(&["theme", "--brand", "#0a7755", "--out", "x.css", "--format", "css"]))
            .unwrap();

    assert_eq!(
        command,
        Command::Theme {
            brand: "#0a7755".to_string(),
            out: "x.css".to_string(),
            format: Format::Css,
        }
    );
}

#[test]
fn parses_an_explicit_tailwind_format() {
    let command =
        parse(&args(&["theme", "--brand", "#0a7755", "--out", "x.css", "--format", "tailwind"]))
            .unwrap();

    assert_eq!(
        command,
        Command::Theme {
            brand: "#0a7755".to_string(),
            out: "x.css".to_string(),
            format: Format::Tailwind,
        }
    );
}

#[test]
fn rejects_an_unknown_format() {
    assert!(matches!(
        parse(&args(&["theme", "--brand", "#0a7755", "--out", "x", "--format", "toml"]))
            .unwrap_err(),
        CliError::Usage(_)
    ));
}

#[test]
fn parses_the_tokens_command_with_out() {
    let command = parse(&args(&["tokens", "--out", "src/styles/tokens.css"])).unwrap();

    assert_eq!(
        command,
        Command::Tokens {
            out: "src/styles/tokens.css".to_string(),
        }
    );
}

#[test]
fn rejects_tokens_missing_out() {
    assert!(matches!(
        parse(&args(&["tokens"])).unwrap_err(),
        CliError::Usage(_)
    ));
}

#[test]
fn rejects_an_unexpected_argument_to_tokens() {
    let err = parse(&args(&["tokens", "--out", "x.css", "--extra"])).unwrap_err();

    assert!(matches!(err, CliError::Usage(_)));
}

#[test]
fn rejects_an_empty_argument_list() {
    assert!(matches!(parse(&[]).unwrap_err(), CliError::Usage(_)));
}

#[test]
fn rejects_an_unknown_command() {
    assert!(matches!(
        parse(&args(&["frobnicate"])).unwrap_err(),
        CliError::Usage(_)
    ));
}

#[test]
fn rejects_an_unexpected_argument_to_theme() {
    let err = parse(&args(&["theme", "--brand", "#0a7755", "--out", "x.css", "--extra"])).unwrap_err();

    assert!(matches!(err, CliError::Usage(_)));
}

#[test]
fn rejects_a_flag_with_no_value() {
    assert!(matches!(
        parse(&args(&["theme", "--brand"])).unwrap_err(),
        CliError::Usage(_)
    ));
    assert!(matches!(
        parse(&args(&["theme", "--out"])).unwrap_err(),
        CliError::Usage(_)
    ));
    assert!(matches!(
        parse(&args(&["theme", "--format"])).unwrap_err(),
        CliError::Usage(_)
    ));
    assert!(matches!(
        parse(&args(&["tokens", "--out"])).unwrap_err(),
        CliError::Usage(_)
    ));
}

#[test]
fn rejects_theme_missing_brand() {
    assert!(matches!(
        parse(&args(&["theme", "--out", "x.css"])).unwrap_err(),
        CliError::Usage(_)
    ));
}

#[test]
fn rejects_theme_missing_out() {
    assert!(matches!(
        parse(&args(&["theme", "--brand", "#0a7755"])).unwrap_err(),
        CliError::Usage(_)
    ));
}
