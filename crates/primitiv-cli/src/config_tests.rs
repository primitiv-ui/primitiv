use std::collections::BTreeMap;
use std::path::Path;

use pretty_assertions::assert_eq;

use crate::config::{resolve, Config, Registry, Styles, Theme, Tokens};
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
                brand: "#0a7755".into(),
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

    assert_eq!(config.theme.brand, "#0a7755");
}
