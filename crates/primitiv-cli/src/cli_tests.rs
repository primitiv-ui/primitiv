use harmoni_core::api::DEFAULT_STEPS;
use pretty_assertions::assert_eq;

use crate::cli::{Command, parse};
use crate::commands::add::AddOptions;
use crate::commands::init::InitOptions;
use crate::error::CliError;
use crate::format::Format;

fn args(parts: &[&str]) -> Vec<String> {
    parts.iter().map(|part| part.to_string()).collect()
}

#[test]
fn parses_the_init_command_with_defaults() {
    let command = parse(&args(&["init"])).unwrap();

    assert_eq!(command, Command::Init(InitOptions::default()));
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
        "--yes",
    ]))
    .unwrap();

    assert_eq!(
        command,
        Command::Init(InitOptions {
            format: Some(Format::Scss),
            brand: Some("#123456".to_string()),
            path: Some("app/styles".to_string()),
            styles_enabled: Some(false),
            alias_components: Some("@/ui".to_string()),
            force: true,
            yes: true,
        })
    );
}

#[test]
fn parses_explicit_styles_re_enabling_a_prior_no_styles() {
    let command = parse(&args(&["init", "--no-styles", "--styles"])).unwrap();

    assert!(matches!(
        command,
        Command::Init(InitOptions {
            styles_enabled: Some(true),
            ..
        })
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
fn parses_the_add_command_with_one_component() {
    let command = parse(&args(&["add", "button"])).unwrap();

    assert_eq!(
        command,
        Command::Add(AddOptions {
            components: vec!["button".to_string()],
            ..Default::default()
        })
    );
}

#[test]
fn parses_the_add_command_with_several_components() {
    let command = parse(&args(&["add", "button", "switch"])).unwrap();

    assert_eq!(
        command,
        Command::Add(AddOptions {
            components: vec!["button".to_string(), "switch".to_string()],
            ..Default::default()
        })
    );
}

#[test]
fn parses_add_with_the_json_and_dry_run_flags_among_the_components() {
    // Flags are order-free: they can sit after a component name, in any order.
    let command = parse(&args(&["add", "button", "--dry-run", "--json"])).unwrap();

    assert_eq!(
        command,
        Command::Add(AddOptions {
            components: vec!["button".to_string()],
            json: true,
            dry_run: true,
            ..Default::default()
        })
    );
}

#[test]
fn parses_add_with_a_format_override() {
    // `--format` overrides the config's stylesheet format for this copy.
    let command = parse(&args(&["add", "button", "--format", "scss"])).unwrap();

    assert_eq!(
        command,
        Command::Add(AddOptions {
            components: vec!["button".to_string()],
            format: Some(Format::Scss),
            ..Default::default()
        })
    );
}

#[test]
fn rejects_add_format_with_no_value() {
    assert!(matches!(
        parse(&args(&["add", "button", "--format"])).unwrap_err(),
        CliError::Usage(_)
    ));
}

#[test]
fn rejects_an_unknown_add_format() {
    assert!(matches!(
        parse(&args(&["add", "button", "--format", "less"])).unwrap_err(),
        CliError::Usage(_)
    ));
}

#[test]
fn parses_add_with_a_path_override() {
    // `--path` overrides where copied stylesheets land for this run.
    let command = parse(&args(&["add", "button", "--path", "lib/styles"])).unwrap();

    assert_eq!(
        command,
        Command::Add(AddOptions {
            components: vec!["button".to_string()],
            path: Some("lib/styles".to_string()),
            ..Default::default()
        })
    );
}

#[test]
fn rejects_add_path_with_no_value() {
    assert!(matches!(
        parse(&args(&["add", "button", "--path"])).unwrap_err(),
        CliError::Usage(_)
    ));
}

#[test]
fn parses_add_with_the_force_flag() {
    let command = parse(&args(&["add", "button", "--force"])).unwrap();

    assert_eq!(
        command,
        Command::Add(AddOptions {
            components: vec!["button".to_string()],
            force: true,
            ..Default::default()
        })
    );
}

#[test]
fn parses_add_with_the_styles_only_flag() {
    let command = parse(&args(&["add", "button", "--styles-only"])).unwrap();

    assert_eq!(
        command,
        Command::Add(AddOptions {
            components: vec!["button".to_string()],
            styles_only: true,
            ..Default::default()
        })
    );
}

#[test]
fn parses_add_with_the_no_styles_flag() {
    let command = parse(&args(&["add", "button", "--no-styles"])).unwrap();

    assert_eq!(
        command,
        Command::Add(AddOptions {
            components: vec!["button".to_string()],
            no_styles: true,
            ..Default::default()
        })
    );
}

#[test]
fn rejects_add_combining_styles_only_and_no_styles() {
    // The two contradict — skipping both the package and the styles — so the
    // combination is a usage error rather than a silent no-op.
    assert!(matches!(
        parse(&args(&["add", "button", "--styles-only", "--no-styles"])).unwrap_err(),
        CliError::Usage(_)
    ));
}

#[test]
fn parses_add_with_the_no_wiring_flag() {
    let command = parse(&args(&["add", "button", "--no-wiring"])).unwrap();

    assert_eq!(
        command,
        Command::Add(AddOptions {
            components: vec!["button".to_string()],
            no_wiring: true,
            ..Default::default()
        })
    );
}

#[test]
fn parses_add_with_a_registry_override() {
    let command = parse(&args(&["add", "button", "--registry", "vendor/registry"])).unwrap();

    assert_eq!(
        command,
        Command::Add(AddOptions {
            components: vec!["button".to_string()],
            registry: Some("vendor/registry".to_string()),
            ..Default::default()
        })
    );
}

#[test]
fn rejects_add_registry_with_no_value() {
    assert!(matches!(
        parse(&args(&["add", "button", "--registry"])).unwrap_err(),
        CliError::Usage(_)
    ));
}

#[test]
fn rejects_add_with_no_components() {
    assert!(matches!(
        parse(&args(&["add"])).unwrap_err(),
        CliError::Usage(_)
    ));
}

#[test]
fn parses_add_all_with_no_component_names() {
    // `--all` stands in for an explicit list — no component names are required.
    let command = parse(&args(&["add", "--all"])).unwrap();

    assert_eq!(
        command,
        Command::Add(AddOptions {
            all: true,
            ..Default::default()
        })
    );
}

#[test]
fn rejects_add_combining_all_with_component_names() {
    // `--all` is the whole registry; naming components alongside it is ambiguous.
    assert!(matches!(
        parse(&args(&["add", "--all", "button"])).unwrap_err(),
        CliError::Usage(_)
    ));
}

#[test]
fn rejects_an_unexpected_flag_to_add() {
    assert!(matches!(
        parse(&args(&["add", "button", "--soon"])).unwrap_err(),
        CliError::Usage(_)
    ));
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
            seeds: vec![("brand".to_string(), "#0a7755".to_string())],
            out: Some("x.css".to_string()),
            format: None,
            steps: DEFAULT_STEPS,
        }
    );
}

/// The handoff command should carry nothing the project already knows (RFC 0032
/// §5 step 3). `--out` and `--format` are both recorded in `primitiv.json`, so
/// requiring them again on every run is the CLI asking a question it can answer.
#[test]
fn parses_a_theme_command_that_names_neither_an_out_nor_a_format() {
    let command = parse(&args(&["theme", "--brand", "#0a7755"])).unwrap();

    assert_eq!(
        command,
        Command::Theme {
            seeds: vec![("brand".to_string(), "#0a7755".to_string())],
            out: None,
            format: None,
            steps: DEFAULT_STEPS,
        }
    );
}

/// `dtcg` keeps requiring one, and the asymmetry is the point: its document is a
/// route OUT of the project into a design tool, so `primitiv.json` records no
/// destination for it to fall back on.
#[test]
fn still_requires_an_out_for_dtcg() {
    assert!(matches!(
        parse(&args(&["dtcg", "--brand", "#0a7755"])).unwrap_err(),
        CliError::Usage(_)
    ));
}

#[test]
fn parses_an_explicit_scss_format() {
    let command = parse(&args(&[
        "theme", "--brand", "#0a7755", "--out", "x.scss", "--format", "scss",
    ]))
    .unwrap();

    assert_eq!(
        command,
        Command::Theme {
            seeds: vec![("brand".to_string(), "#0a7755".to_string())],
            out: Some("x.scss".to_string()),
            format: Some(Format::Scss),
            steps: DEFAULT_STEPS,
        }
    );
}

#[test]
fn parses_an_explicit_css_format() {
    let command = parse(&args(&[
        "theme", "--brand", "#0a7755", "--out", "x.css", "--format", "css",
    ]))
    .unwrap();

    assert_eq!(
        command,
        Command::Theme {
            seeds: vec![("brand".to_string(), "#0a7755".to_string())],
            out: Some("x.css".to_string()),
            format: Some(Format::Css),
            steps: DEFAULT_STEPS,
        }
    );
}

#[test]
fn parses_an_explicit_tailwind_format() {
    let command = parse(&args(&[
        "theme", "--brand", "#0a7755", "--out", "x.css", "--format", "tailwind",
    ]))
    .unwrap();

    assert_eq!(
        command,
        Command::Theme {
            seeds: vec![("brand".to_string(), "#0a7755".to_string())],
            out: Some("x.css".to_string()),
            format: Some(Format::Tailwind),
            steps: DEFAULT_STEPS,
        }
    );
}

#[test]
fn rejects_an_unknown_format() {
    assert!(matches!(
        parse(&args(&[
            "theme", "--brand", "#0a7755", "--out", "x", "--format", "toml"
        ]))
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
            from: None,
        }
    );
}

#[test]
fn parses_the_tokens_command_with_an_explicit_scss_format() {
    let command = parse(&args(&["tokens", "--out", "x.scss", "--format", "scss"])).unwrap();

    assert_eq!(
        command,
        Command::Tokens {
            out: Some("x.scss".to_string()),
            format: Some(Format::Scss),
            from: None,
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
            from: None,
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
    let err = parse(&args(&[
        "theme", "--brand", "#0a7755", "--out", "x.css", "--extra",
    ]))
    .unwrap_err();

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
fn accepts_theme_with_no_seed_flag_and_defers_to_the_config() {
    // Whether a seed exists at all is a run-time question: the answer is in
    // `primitiv.json`, which the parser has not read.
    let command = parse(&args(&["theme", "--out", "x.css"])).unwrap();

    assert_eq!(
        command,
        Command::Theme {
            seeds: Vec::new(),
            out: Some("x.css".to_string()),
            format: None,
            steps: DEFAULT_STEPS,
        }
    );
}

#[test]
fn rejects_a_bare_argument_to_theme_that_names_no_flag_at_all() {
    assert!(matches!(
        parse(&args(&["theme", "brand", "--out", "x.css"])).unwrap_err(),
        CliError::Usage(_)
    ));
}

#[test]
fn rejects_a_flag_to_theme_that_names_no_ramp_family() {
    assert!(matches!(
        parse(&args(&["theme", "--accent", "#123456", "--out", "x.css"])).unwrap_err(),
        CliError::Usage(_)
    ));
}

#[test]
fn rejects_a_ramp_flag_that_ends_the_arguments_with_no_colour() {
    assert!(matches!(
        parse(&args(&["theme", "--out", "x.css", "--danger"])).unwrap_err(),
        CliError::Usage(_)
    ));
}

#[test]
fn rejects_seeding_the_neutral_ramp_by_name_rather_than_as_a_typo() {
    let message = match parse(&args(&["theme", "--neutral", "#888888", "--out", "x.css"])) {
        Err(CliError::Usage(message)) => message,
        other => panic!("expected a usage error, got {other:?}"),
    };

    // Not "unexpected argument": the neutral ramp is generated from a different
    // model, and saying so is the difference between a mistyped flag and the wrong
    // shape. The CLI does generate neutral ramps now, so the message names the
    // block to write rather than reporting a gap.
    assert!(message.contains("neutral"), "{message}");
    assert!(message.contains("between two anchors"), "{message}");
    assert!(message.contains("primitiv.json"), "{message}");
}

/// `theme` no longer rejects a missing `--out` at PARSE time (RFC 0032 §5 step 3):
/// whether there is a destination to fall back on is a run-time question, and the
/// answer is in `primitiv.json`, which the parser has not read — the same reasoning
/// that already let a seedless `theme` through. The refusal still exists for the
/// case where there is genuinely nothing to resolve; it lives in the command, where
/// the config is in hand (`refuses_to_guess_a_destination_with_no_out_and_no_config`).
#[test]
fn defers_a_missing_out_to_the_command_rather_than_rejecting_it() {
    let command = parse(&args(&["theme", "--brand", "#0a7755"])).unwrap();

    assert!(matches!(command, Command::Theme { out: None, .. }));
}

#[test]
fn parses_a_seed_for_every_ramp_family_in_canonical_order() {
    let command = parse(&args(&[
        "theme", "--info", "#008e9d", "--brand", "#0a7755", "--danger", "#db2424", "--out", "x.css",
    ]))
    .unwrap();

    // Flags are order-free, but the emitted seeds are not: they come out in the
    // palette's own family order so the override file reads the same however the
    // command was typed.
    assert_eq!(
        command,
        Command::Theme {
            seeds: vec![
                ("brand".to_string(), "#0a7755".to_string()),
                ("danger".to_string(), "#db2424".to_string()),
                ("info".to_string(), "#008e9d".to_string()),
            ],
            out: Some("x.css".to_string()),
            format: None,
            steps: DEFAULT_STEPS,
        }
    );
}

#[test]
fn parses_a_dtcg_export_with_the_same_ramp_seeds_as_theme() {
    let command = parse(&args(&[
        "dtcg",
        "--brand",
        "#0a7755",
        "--danger",
        "#db2424",
        "--out",
        "palette.json",
    ]))
    .unwrap();

    assert_eq!(
        command,
        Command::Dtcg {
            seeds: vec![
                ("brand".to_string(), "#0a7755".to_string()),
                ("danger".to_string(), "#db2424".to_string()),
            ],
            out: "palette.json".to_string(),
            steps: DEFAULT_STEPS,
        }
    );
}

#[test]
fn rejects_a_format_on_the_dtcg_export() {
    // DTCG is one serialisation, so `--format` is not a choice this command has —
    // and it reads as an unknown flag rather than being quietly ignored.
    assert!(matches!(
        parse(&args(&[
            "dtcg", "--brand", "#0a7755", "--format", "css", "--out", "x.json"
        ]))
        .unwrap_err(),
        CliError::Usage(_)
    ));
}

#[test]
fn parses_an_explicit_step_count_for_a_theme_ramp() {
    let command = parse(&args(&[
        "theme", "--brand", "#0a7755", "--out", "x.css", "--steps", "7",
    ]))
    .unwrap();

    assert_eq!(
        command,
        Command::Theme {
            seeds: vec![("brand".to_string(), "#0a7755".to_string())],
            out: Some("x.css".to_string()),
            format: None,
            steps: 7,
        }
    );
}

#[test]
fn parses_an_explicit_step_count_for_a_dtcg_export() {
    // The same knob on both commands: a ramp's length is a property of generating
    // it, not of how it is serialised afterwards.
    let command = parse(&args(&[
        "dtcg", "--brand", "#0a7755", "--out", "x.json", "--steps", "24",
    ]))
    .unwrap();

    assert_eq!(
        command,
        Command::Dtcg {
            seeds: vec![("brand".to_string(), "#0a7755".to_string())],
            out: "x.json".to_string(),
            steps: 24,
        }
    );
}

#[test]
fn rejects_a_step_count_that_is_not_a_number() {
    assert!(matches!(
        parse(&args(&["theme", "--out", "x.css", "--steps", "lots"])).unwrap_err(),
        CliError::Usage(_)
    ));
}

#[test]
fn rejects_a_step_count_flag_with_no_value() {
    assert!(matches!(
        parse(&args(&["theme", "--out", "x.css", "--steps"])).unwrap_err(),
        CliError::Usage(_)
    ));
}

/// `--from` is how a freshly-delivered palette is applied (RFC 0032 D14); the
/// config records it afterwards, so the flag is typed once.
#[test]
fn parses_the_tokens_command_with_a_palette_to_apply() {
    let command = parse(&args(&["tokens", "--from", "primitiv.palette.json"])).unwrap();

    assert_eq!(
        command,
        Command::Tokens {
            out: None,
            format: None,
            from: Some("primitiv.palette.json".to_string()),
        }
    );
}

/// `--from` trailing the argument list is a half-typed command, not a request to
/// apply nothing — the parser says which flag is short of its value.
#[test]
fn rejects_a_palette_flag_with_no_value() {
    assert!(matches!(
        parse(&args(&["tokens", "--from"])).unwrap_err(),
        CliError::Usage(message) if message.contains("--from")
    ));
}
