use std::collections::BTreeMap;
use std::path::Path;

use pretty_assertions::assert_eq;

use crate::config::{resolve, try_resolve, Config, NeutralEntry, Registry, Styles, Theme, Tokens};
use crate::format::Format;
use crate::ports::fs::{FileSystem, InMemoryFs};

/// A complete `primitiv.json` as `init` would write it (RFC 0005 §3.1), used to
/// drive the full typed shape in one parse.
const FULL: &[u8] = br##"{
  "$schema": "https://primitiv-ui.dev/schema/primitiv.json",
  "version": 1,
  "framework": "react",
  "styles": { "enabled": true, "format": "css", "path": "src/styles/primitiv" },
  "tokens": { "format": "css", "path": "src/styles/primitiv/tokens.css" },
  "theme": { "brand": "#0a7755" },
  "aliases": { "components": "@/components" },
  "registry": { "version": "0.1.0" }
}"##;

#[test]
fn should_parse_a_full_primitiv_json_document() {
    let config = Config::parse(FULL).unwrap();

    assert_eq!(
        config,
        Config {
            version: 1,
            framework: "react".into(),
            styles: Styles {
                enabled: true,
                format: Format::Css,
                path: "src/styles/primitiv".into(),
            },
            tokens: Tokens {
                format: Format::Css,
                path: "src/styles/primitiv/tokens.css".into(),
            },
            theme: Theme {
                seeds: BTreeMap::from([("brand".into(), "#0a7755".into())]),
                neutral: None,
            },
            aliases: BTreeMap::from([("components".into(), "@/components".into())]),
            registry: Registry {
                version: "0.1.0".into(),
            },
        }
    );
}

#[test]
fn should_error_when_the_document_is_not_valid_json() {
    let error = Config::parse(b"{ not json }").unwrap_err();

    assert_eq!(error.exit_code(), 5);
}

#[test]
fn should_resolve_a_config_in_the_starting_directory() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("project/primitiv.json"), FULL).unwrap();

    let config = resolve(&fs, Path::new("project")).unwrap();

    assert_eq!(config.theme.seeds.get("brand").map(String::as_str), Some("#0a7755"));
}

#[test]
fn should_walk_up_to_a_parent_directory_to_find_the_config() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("project/primitiv.json"), FULL).unwrap();

    let config = resolve(&fs, Path::new("project/packages/app")).unwrap();

    assert_eq!(config.registry.version, "0.1.0");
}

#[test]
fn should_error_with_the_search_root_when_no_config_exists_anywhere() {
    let fs = InMemoryFs::new();

    let error = resolve(&fs, Path::new("project/app")).unwrap_err();

    assert_eq!(error.exit_code(), 5);
    assert_eq!(
        error.to_string(),
        "no primitiv.json found in project/app or any parent directory"
    );
}

#[test]
fn should_propagate_a_read_error_other_than_not_found() {
    let fs = InMemoryFs::new();
    let path = Path::new("project/primitiv.json");
    fs.write(path, FULL).unwrap();
    fs.fail_reads_to(path);

    let error = resolve(&fs, Path::new("project")).unwrap_err();

    assert_eq!(error.exit_code(), 4);
}

#[test]
fn try_resolve_returns_the_config_when_one_is_found() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("project/primitiv.json"), FULL).unwrap();

    let config = try_resolve(&fs, Path::new("project/app")).unwrap();

    assert_eq!(
        config.unwrap().theme.seeds.get("brand").map(String::as_str),
        Some("#0a7755")
    );
}

#[test]
fn try_resolve_returns_none_when_no_config_exists() {
    let fs = InMemoryFs::new();

    let config = try_resolve(&fs, Path::new("project/app")).unwrap();

    assert_eq!(config, None);
}

#[test]
fn try_resolve_still_errors_on_a_malformed_config() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("project/primitiv.json"), b"{ not json }").unwrap();

    let error = try_resolve(&fs, Path::new("project")).unwrap_err();

    assert_eq!(error.exit_code(), 5);
}

#[test]
fn try_resolve_propagates_a_read_error_other_than_not_found() {
    let fs = InMemoryFs::new();
    let path = Path::new("project/primitiv.json");
    fs.write(path, FULL).unwrap();
    fs.fail_reads_to(path);

    let error = try_resolve(&fs, Path::new("project")).unwrap_err();

    assert_eq!(error.exit_code(), 4);
}

#[test]
fn should_carry_a_seed_for_every_ramp_family_the_theme_block_names() {
    let config = Config::parse(
        br##"{
          "version": 1,
          "framework": "react",
          "styles": { "enabled": true, "format": "css", "path": "src/styles/primitiv" },
          "tokens": { "format": "css", "path": "src/styles/primitiv/tokens.css" },
          "theme": { "brand": "#0a7755", "danger": "#db2424" },
          "aliases": {},
          "registry": { "version": "0.1.0" }
        }"##,
    )
    .unwrap();

    // Keyed by family rather than a field per colour, so `RAMP_FAMILIES` stays the
    // one place the vocabulary lives — the flags and the config cannot disagree.
    assert_eq!(config.theme.seeds.get("brand").map(String::as_str), Some("#0a7755"));
    assert_eq!(config.theme.seeds.get("danger").map(String::as_str), Some("#db2424"));
}

#[test]
fn should_parse_a_neutral_block_beside_the_family_seeds() {
    let config = Config::parse(
        br##"{
          "version": 1,
          "framework": "react",
          "styles": { "enabled": true, "format": "css", "path": "s" },
          "tokens": { "format": "css", "path": "t.css" },
          "theme": {
            "brand": "#236ce1",
            "neutral": {
              "tint": { "source": "brand", "strength": 0.2, "spread": 0, "bow": 0.1 }
            }
          },
          "aliases": {},
          "registry": { "version": "0.1.0" }
        }"##,
    )
    .unwrap();

    // `neutral` is structured where a seed is a single string, so it is a named
    // field rather than another entry in the flattened map — and naming it keeps
    // it out of `seeds`, which every family key still falls into.
    assert_eq!(config.theme.seeds.get("brand").map(String::as_str), Some("#236ce1"));
    assert_eq!(config.theme.seeds.get("neutral"), None);
    let neutral = match config.theme.neutral.expect("a neutral block") {
        NeutralEntry::Ramp(neutral) => neutral,
        other => panic!("expected a ramp block, got {other:?}"),
    };
    let tint = neutral.tint.expect("a tint");
    assert_eq!(tint.source, "brand");
    assert_eq!(tint.strength, 0.2);
    assert_eq!(tint.bow, 0.1);
}
