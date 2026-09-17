use std::path::Path;

use crate::error::CliError;
use crate::ports::fs::{FileSystem, InMemoryFs};
use crate::seeds::{as_pairs, resolve_seeds};

/// A `primitiv.json` whose `theme` block carries whatever seeds a case needs.
fn with_theme(theme: &str) -> InMemoryFs {
    let fs = InMemoryFs::new();
    let config = format!(
        r#"{{
          "version": 1,
          "framework": "react",
          "styles": {{ "enabled": true, "format": "css", "path": "s" }},
          "tokens": {{ "format": "css", "path": "t.css" }},
          "theme": {theme},
          "aliases": {{}},
          "registry": {{ "version": "0.1.0" }}
        }}"#
    );
    fs.write(Path::new("primitiv.json"), config.as_bytes())
        .unwrap();
    fs
}

#[test]
fn takes_the_configs_seeds_in_palette_family_order() {
    let fs = with_theme(r##"{ "info": "#008e9d", "brand": "#0a7755" }"##);

    let seeds = resolve_seeds(&fs, &[], "theme").unwrap();

    // Family order, not the order the config happened to list them, so the emitted
    // file reads the same however the block was written.
    assert_eq!(
        seeds,
        vec![
            ("brand".to_string(), "#0a7755".to_string()),
            ("info".to_string(), "#008e9d".to_string()),
        ]
    );
}

#[test]
fn a_flag_replaces_only_its_own_family() {
    let fs = with_theme(r##"{ "brand": "#0a7755", "danger": "#db2424" }"##);

    let seeds = resolve_seeds(
        &fs,
        &[("brand".to_string(), "#ff0066".to_string())],
        "theme",
    )
    .unwrap();

    assert_eq!(
        seeds,
        vec![
            ("brand".to_string(), "#ff0066".to_string()),
            ("danger".to_string(), "#db2424".to_string()),
        ]
    );
}

#[test]
fn works_with_no_config_at_all_from_the_flags_alone() {
    let fs = InMemoryFs::new();

    let seeds = resolve_seeds(
        &fs,
        &[("brand".to_string(), "#0a7755".to_string())],
        "theme",
    )
    .unwrap();

    assert_eq!(seeds, vec![("brand".to_string(), "#0a7755".to_string())]);
}

#[test]
fn answers_a_neutral_seeded_as_one_colour_with_the_shape_to_write_instead() {
    use crate::seeds::resolve_neutral;

    let fs = with_theme(r##"{ "brand": "#0a7755", "neutral": "#888888" }"##);

    let message = match resolve_neutral(&fs, &[]) {
        Err(CliError::Usage(message)) => message,
        other => panic!("expected a usage error, got {other:?}"),
    };

    // The reason has changed and the message with it. The CLI generates neutral
    // ramps now, so "we do not surface that model" would be a lie — what is wrong
    // is the shape, and the message says which shape to write instead.
    assert!(message.contains("primitiv.json"), "{message}");
    assert!(message.contains("between two anchors"), "{message}");
    assert!(message.contains("\"tint\""), "{message}");
}

#[test]
fn refuses_a_family_the_cli_does_not_generate() {
    let fs = with_theme(r##"{ "accent": "#0a7755" }"##);

    let message = match resolve_seeds(&fs, &[], "theme") {
        Err(CliError::Usage(message)) => message,
        other => panic!("expected a usage error, got {other:?}"),
    };

    assert!(message.contains("'accent'"), "{message}");
    assert!(message.contains("brand"), "{message}");
}

#[test]
fn surfaces_a_malformed_config_rather_than_ignoring_it() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), b"{ not json }")
        .unwrap();

    assert!(resolve_seeds(&fs, &[], "theme").is_err());
}

#[test]
fn surfaces_a_failure_to_read_the_working_directory() {
    let fs = InMemoryFs::new();
    fs.fail_current_dir();

    assert!(matches!(
        resolve_seeds(&fs, &[], "theme").unwrap_err(),
        CliError::Io(_)
    ));
}

#[test]
fn borrows_the_seeds_as_the_pairs_the_emitter_takes() {
    let seeds = vec![("brand".to_string(), "#0a7755".to_string())];

    assert_eq!(as_pairs(&seeds), vec![("brand", "#0a7755")]);
}

#[test]
fn resolves_a_tint_source_named_as_a_family_to_that_familys_seed() {
    use crate::seeds::resolve_neutral;
    use harmoni_core::ColorInput;

    let fs = with_theme(
        r##"{
          "brand": "#0a7755",
          "neutral": { "tint": { "source": "brand", "strength": 0.2 } }
        }"##,
    );
    let seeds = resolve_seeds(&fs, &[], "theme").unwrap();

    let neutral = resolve_neutral(&fs, &seeds)
        .unwrap()
        .expect("a neutral ramp");
    let tint = neutral.tint.expect("a tint");

    // Naming a family resolves to that family's seed, which is its step 500 —
    // so the neutral keeps relating to the brand rather than freezing a copy of
    // whatever the brand was when the config was written.
    assert_eq!(tint.source, ColorInput::Css("#0a7755".to_string()));
}

#[test]
fn falls_back_to_the_plugins_own_anchors_when_the_config_names_none() {
    use crate::config::{DEFAULT_BLACK, DEFAULT_WHITE};
    use crate::seeds::resolve_neutral;
    use harmoni_core::ColorInput;

    let fs = with_theme(r##"{ "brand": "#0a7755", "neutral": {} }"##);
    let seeds = resolve_seeds(&fs, &[], "theme").unwrap();

    let neutral = resolve_neutral(&fs, &seeds)
        .unwrap()
        .expect("a neutral ramp");

    assert_eq!(neutral.white, ColorInput::Css(DEFAULT_WHITE.to_string()));
    assert_eq!(neutral.black, ColorInput::Css(DEFAULT_BLACK.to_string()));
    assert_eq!(neutral.tint, None);
}

#[test]
fn has_no_neutral_ramp_when_the_config_has_no_block() {
    use crate::seeds::resolve_neutral;

    let fs = with_theme(r##"{ "brand": "#0a7755" }"##);
    let seeds = resolve_seeds(&fs, &[], "theme").unwrap();

    // No block means the project is not overriding its greys, which is different
    // from overriding them with the defaults: the shipped neutral ramp stands.
    assert_eq!(resolve_neutral(&fs, &seeds).unwrap().is_none(), true);
}

#[test]
fn takes_the_anchors_the_config_names_over_the_defaults() {
    use crate::seeds::resolve_neutral;
    use harmoni_core::ColorInput;

    let fs = with_theme(
        r##"{
          "brand": "#0a7755",
          "neutral": { "white": "oklch(0.97 0 0)", "black": "oklch(0.08 0 0)" }
        }"##,
    );

    let neutral = resolve_neutral(&fs, &[]).unwrap().expect("a neutral ramp");

    // A project that wants its greys to stop short of paper-white and true black
    // says so, and the defaults get out of the way.
    assert_eq!(
        neutral.white,
        ColorInput::Css("oklch(0.97 0 0)".to_string())
    );
    assert_eq!(
        neutral.black,
        ColorInput::Css("oklch(0.08 0 0)".to_string())
    );
}

#[test]
fn surfaces_a_failure_to_read_the_working_directory_for_the_neutral() {
    use crate::seeds::resolve_neutral;

    let fs = InMemoryFs::new();
    fs.fail_current_dir();

    assert!(matches!(
        resolve_neutral(&fs, &[]).unwrap_err(),
        CliError::Io(_)
    ));
}

#[test]
fn passes_a_tint_source_that_names_no_family_through_as_a_colour() {
    use crate::seeds::resolve_neutral;
    use harmoni_core::ColorInput;

    let fs = with_theme(
        r##"{
          "brand": "#0a7755",
          "neutral": { "tint": { "source": "#ff0066", "strength": 0.2 } }
        }"##,
    );
    let seeds = resolve_seeds(&fs, &[], "theme").unwrap();

    let neutral = resolve_neutral(&fs, &seeds)
        .unwrap()
        .expect("a neutral ramp");
    let tint = neutral.tint.expect("a tint");

    // Naming a family is the useful case, but a colour is still a colour — a
    // project tinting its greys toward something that is not one of its ramps
    // says so directly, and the engine parses it like any other input.
    assert_eq!(tint.source, ColorInput::Css("#ff0066".to_string()));
}

#[test]
fn surfaces_a_malformed_config_when_resolving_the_neutral() {
    use crate::seeds::resolve_neutral;

    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), b"{ not json }")
        .unwrap();

    // `resolve_seeds` happens to run first in the `theme` command and would catch
    // this, but that is the command's ordering rather than a guarantee — asked
    // directly, resolving the neutral reports a config it cannot read.
    assert!(resolve_neutral(&fs, &[]).is_err());
}
