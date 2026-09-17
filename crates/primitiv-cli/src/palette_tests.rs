use std::path::{Path, PathBuf};

use crate::config::Config;
use crate::error::CliError;
use crate::palette::{locate, parse};

/// The identity block (RFC 0032 D13) sits at the document root beside the modes,
/// which is where DTCG puts `$extensions` — and the emitter's `flatten_modes`
/// reads every root key as a mode. Left in, "$extensions" would be emitted as a
/// theme scope of its own.
#[test]
fn drops_the_documents_own_metadata_so_it_is_never_read_as_a_mode() {
    let document = parse(
        br##"{
          "light": { "color": { "brand": { "500": { "$type": "color", "$value": "#0a7755" } } } },
          "$extensions": { "dev.primitiv.harmoni": { "project": "kestrel" } }
        }"##,
        Path::new("primitiv.palette.json"),
    )
    .unwrap();

    let modes: Vec<&String> = document.as_object().unwrap().keys().collect();
    assert_eq!(modes, ["light"]);
}

/// A hand-edited or truncated palette document is a project file the consumer
/// can go and look at, so the message has to name it — "expected value at line
/// 3" alone does not say which of their files is broken.
#[test]
fn names_the_file_when_the_document_is_not_valid_json() {
    let error = parse(b"{ not json", Path::new("design/primitiv.palette.json")).unwrap_err();

    assert!(
        matches!(&error, CliError::Config(message) if message.starts_with("design/primitiv.palette.json:")),
        "expected the path to lead the message, got: {error}"
    );
}

/// Valid JSON that is not an object parses fine and then has no modes to read.
/// Worth its own answer rather than a panic: a `[ ... ]` document is what a
/// generic DTCG exporter that wrote a token *array* would produce, so the
/// consumer needs to be told what shape was expected, not shown a crash.
#[test]
fn rejects_a_document_that_is_not_keyed_by_mode() {
    let error = parse(b"[]", Path::new("primitiv.palette.json")).unwrap_err();

    assert!(
        matches!(&error, CliError::Config(message) if message.contains("keyed by mode")),
        "expected the expected shape to be named, got: {error}"
    );
}

/// A config that records where the palette lives (D2/D10), so `tokens` picks it
/// up on every run without the flag being retyped.
const CONFIG_WITH_PALETTE: &[u8] = br##"{
  "version": 1,
  "framework": "react",
  "styles": { "enabled": true, "format": "css", "path": "src/styles/primitiv" },
  "tokens": { "format": "css", "path": "src/styles/primitiv/tokens.css" },
  "theme": { "brand": "#0a7755", "palette": "design/primitiv.palette.json" },
  "aliases": {},
  "registry": { "version": "0.1.0" }
}"##;

/// The flag is how a designer's freshly-delivered file is tried, so it has to
/// beat whatever the project recorded last time — otherwise the only way to look
/// at a new palette is to edit the config first.
#[test]
fn the_from_flag_wins_over_the_reference_the_config_records() {
    let config = Config::parse(CONFIG_WITH_PALETTE).unwrap();

    let located = locate(Some(Path::new("handoff.json")), Some(&config));

    assert_eq!(located, Some(PathBuf::from("handoff.json")));
}

/// D2/D10's whole point: once recorded, the palette is part of the project's
/// recipe, so a bare `primitiv tokens` re-applies it.
#[test]
fn falls_back_to_the_reference_the_config_records() {
    let config = Config::parse(CONFIG_WITH_PALETTE).unwrap();

    let located = locate(None, Some(&config));

    assert_eq!(
        located,
        Some(PathBuf::from("design/primitiv.palette.json"))
    );
}

/// A project that has never been handed a palette is the ordinary case. Guessing
/// at the conventional `primitiv.palette.json` here would let a stray file in a
/// parent directory re-skin a
/// build that never asked for one.
#[test]
fn locates_nothing_when_neither_a_flag_nor_a_reference_names_one() {
    let config = Config::parse(CONFIG_WITHOUT_PALETTE).unwrap();

    assert_eq!(locate(None, Some(&config)), None);
    assert_eq!(locate(None, None), None);
}

/// The same config without the palette key, so the absent case is driven by a
/// real document rather than a hand-built struct.
const CONFIG_WITHOUT_PALETTE: &[u8] = br##"{
  "version": 1,
  "framework": "react",
  "styles": { "enabled": true, "format": "css", "path": "src/styles/primitiv" },
  "tokens": { "format": "css", "path": "src/styles/primitiv/tokens.css" },
  "theme": { "brand": "#0a7755" },
  "aliases": {},
  "registry": { "version": "0.1.0" }
}"##;
