use pretty_assertions::assert_eq;

use crate::cli::{parse, Command};
use crate::commands::init::InitOptions;
use crate::error::CliError;
use crate::format::Format;

fn args(parts: &[&str]) -> Vec<String> {
    parts.iter().map(|part| part.to_string()).collect()
}

#[test]
fn parses_the_init_command_with_defaults() {
    let command = parse(&args(&["init"])).unwrap();

    assert_eq!(
        command,
        Command::Init(InitOptions {
            format: Format::Css,
            brand: "#0a7755".to_string(),
            path: "src/styles/primitiv".to_string(),
            styles_enabled: true,
            alias_components: None,
            force: false,
        })
    );
}

#[test]
fn parses_every_init_override_flag() {
    let command = parse(&args(&[
        "init",
        "--format",
        "scss",
        "--brand",
        "#123456",
        "--path",
        "app/styles",
        "--no-styles",
        "--alias-components",
        "@/ui",
        "--force",
    ]))
    .unwrap();

    assert_eq!(
        command,
        Command::Init(InitOptions {
            format: Format::Scss,
            brand: "#123456".to_string(),
            path: "app/styles".to_string(),
            styles_enabled: false,
            alias_components: Some("@/ui".to_string()),
            force: true,
        })
    );
}

#[test]
fn parses_explicit_styles_re_enabling_a_prior_no_styles() {
    let command = parse(&args(&["init", "--no-styles", "--styles"])).unwrap();

    assert!(matches!(
        command,
        Command::Init(InitOptions { styles_enabled: true, .. })
    ));
}

#[test]
fn rejects_an_unexpected_argument_to_init() {
    assert!(matches!(
        parse(&args(&["init", "--bogus"])).unwrap_err(),
        CliError::Usage(_)
    ));
}

#[test]
fn rejects_an_unknown_format_for_init() {
    assert!(matches!(
        parse(&args(&["init", "--format", "toml"])).unwrap_err(),
        CliError::Usage(_)
    ));
}

#[test]
fn rejects_init_value_flags_with_no_value() {
    for flag in ["--format", "--brand", "--path", "--alias-components"] {
        assert!(matches!(
            parse(&args(&["init", flag])).unwrap_err(),
            CliError::Usage(_)
        ));
    }
}

#[test]
fn parses_the_list_command() {
    let command = parse(&args(&["list"])).unwrap();

    assert_eq!(command, Command::List { json: false });
}

#[test]
fn parses_the_list_command_with_json() {
    let command = parse(&args(&["list", "--json"])).unwrap();

    assert_eq!(command, Command::List { json: true });
}

#[test]
fn rejects_an_unexpected_argument_to_list() {
    assert!(matches!(
        parse(&args(&["list", "--bogus"])).unwrap_err(),
        CliError::Usage(_)
    ));
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
            out: Some("src/styles/tokens.css".to_string()),
            format: None,
        }
    );
}

#[test]
fn parses_the_tokens_command_with_an_explicit_scss_format() {
    let command =
        parse(&args(&["tokens", "--out", "x.scss", "--format", "scss"])).unwrap();

    assert_eq!(
        command,
        Command::Tokens {
            out: Some("x.scss".to_string()),
            format: Some(Format::Scss),
        }
    );
}

#[test]
fn parses_bare_tokens_with_no_flags() {
    let command = parse(&args(&["tokens"])).unwrap();

    assert_eq!(
        command,
        Command::Tokens {
            out: None,
            format: None,
        }
    );
}

#[test]
fn rejects_an_unknown_format_for_tokens() {
    assert!(matches!(
        parse(&args(&["tokens", "--out", "x", "--format", "toml"])).unwrap_err(),
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
    assert!(matches!(
        parse(&args(&["tokens", "--format"])).unwrap_err(),
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
