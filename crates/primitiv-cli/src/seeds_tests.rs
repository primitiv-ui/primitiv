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
    fs.write(Path::new("primitiv.json"), config.as_bytes()).unwrap();
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

    let seeds = resolve_seeds(&fs, &[("brand".to_string(), "#ff0066".to_string())], "theme")
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

    let seeds = resolve_seeds(&fs, &[("brand".to_string(), "#0a7755".to_string())], "theme")
        .unwrap();

    assert_eq!(seeds, vec![("brand".to_string(), "#0a7755".to_string())]);
}

#[test]
fn refuses_a_neutral_seed_in_the_config_for_the_reason_it_refuses_the_flag() {
    let fs = with_theme(r##"{ "brand": "#0a7755", "neutral": "#888888" }"##);

    let message = match resolve_seeds(&fs, &[], "theme") {
        Err(CliError::Usage(message)) => message,
        other => panic!("expected a usage error, got {other:?}"),
    };

    // The same explanation the `--neutral` flag gives: its ramp comes from a
    // different model, not a single colour.
    assert!(message.contains("primitiv.json"), "{message}");
    assert!(message.contains("hue-tint"), "{message}");
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
    fs.write(Path::new("primitiv.json"), b"{ not json }").unwrap();

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
