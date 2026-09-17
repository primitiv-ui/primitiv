use std::path::{Path, PathBuf};

use crate::config::Config;
use crate::error::CliError;
use crate::palette::{locate, parse, ramps_only, record};
use crate::ports::fs::{FileSystem, InMemoryFs};

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

    let document = document.document();
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

    assert_eq!(located, Some(PathBuf::from("design/primitiv.palette.json")));
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

/// D10: the handoff is one command, not a command plus a hand-edited config key.
///
/// The insert is textual on purpose. `serde_json`'s `preserve_order` is a
/// workspace-wide hazard (it flips `primitiv-emit`'s token ordering and breaks
/// its goldens), so parsing and re-serialising would alphabetise every key and
/// rewrite a file the consumer owns — including the `$schema` line and any key
/// the CLI does not model. Asserted byte-for-byte rather than by `contains`,
/// because leaving the rest of the document alone is the whole claim.
#[test]
fn records_the_reference_without_disturbing_the_rest_of_the_config() {
    let fs = InMemoryFs::new();
    let config = Path::new("primitiv.json");
    fs.write(config, CONFIG_WITHOUT_PALETTE).unwrap();

    record(&fs, config, Path::new("design/primitiv.palette.json")).unwrap();

    let written = String::from_utf8(fs.read(config).unwrap()).unwrap();
    assert_eq!(
        written,
        String::from_utf8(CONFIG_WITHOUT_PALETTE.to_vec())
            .unwrap()
            .replace(
                r##""theme": { "brand": "#0a7755" }"##,
                r##""theme": { "brand": "#0a7755", "palette": "design/primitiv.palette.json" }"##,
            ),
    );
}

/// A theme block with nothing in it yet still has to take the key — and cannot
/// take the leading comma the populated case needs.
#[test]
fn records_the_reference_into_an_empty_theme_block() {
    let fs = InMemoryFs::new();
    let config = Path::new("primitiv.json");
    fs.write(config, br##"{ "theme": {}, "aliases": {} }"##)
        .unwrap();

    record(&fs, config, Path::new("p.json")).unwrap();

    assert_eq!(
        String::from_utf8(fs.read(config).unwrap()).unwrap(),
        r##"{ "theme": { "palette": "p.json" }, "aliases": {} }"##,
    );
}

/// Re-running with the reference the config already records writes nothing — the
/// common case of a project that was handed a palette once and builds every day.
#[test]
fn leaves_the_config_alone_when_the_reference_is_already_recorded() {
    let fs = InMemoryFs::new();
    let config = Path::new("primitiv.json");
    fs.write(config, CONFIG_WITH_PALETTE).unwrap();

    record(&fs, config, Path::new("design/primitiv.palette.json")).unwrap();

    assert_eq!(
        fs.read(config).unwrap(),
        CONFIG_WITH_PALETTE,
        "an unchanged reference should not rewrite the file"
    );
}

/// `--from` naming a different document replaces what was recorded. Keeping the
/// old one would mean the flag applied a palette for one run and the project
/// silently went back to the previous one on the next — the same wrong-colour
/// failure as never recording it.
#[test]
fn replaces_a_reference_that_names_a_different_document() {
    let fs = InMemoryFs::new();
    let config = Path::new("primitiv.json");
    fs.write(config, CONFIG_WITH_PALETTE).unwrap();

    record(&fs, config, Path::new("handoff-v2.json")).unwrap();

    assert_eq!(
        Config::parse(&fs.read(config).unwrap())
            .unwrap()
            .theme
            .palette
            .as_deref(),
        Some("handoff-v2.json"),
    );
}

/// A reference recorded before another key has a comma ending it; one recorded
/// last is bounded by the block instead. Both spans have to cover the entry
/// exactly, or a replacement leaves half the old one behind.
#[test]
fn replaces_a_reference_whichever_end_of_the_theme_block_it_sits_at() {
    for original in [
        r##"{ "theme": { "palette": "old.json", "brand": "#0a7755" } }"##,
        r##"{ "theme": { "brand": "#0a7755", "palette": "old.json" } }"##,
    ] {
        let fs = InMemoryFs::new();
        let config = Path::new("primitiv.json");
        fs.write(config, original.as_bytes()).unwrap();

        record(&fs, config, Path::new("new.json")).unwrap();

        let written = String::from_utf8(fs.read(config).unwrap()).unwrap();
        assert_eq!(written, original.replace("old.json", "new.json"));
    }
}

/// `record`'s own boundary: it is handed a path, not a parsed document, so text
/// with nothing to record into is answered rather than silently skipped —
/// skipping would leave D10 quietly unmet.
#[test]
fn refuses_to_record_into_text_with_no_theme_block() {
    for text in [
        &b"{ \"aliases\": {} }"[..],
        &b"{ \"theme\": 1 }"[..],
        &b"{ \"theme\": { \"brand\": \"x\" "[..],
    ] {
        let fs = InMemoryFs::new();
        let config = Path::new("primitiv.json");
        fs.write(config, text).unwrap();

        let error = record(&fs, config, Path::new("p.json")).unwrap_err();

        assert!(
            matches!(&error, CliError::Config(message) if message.contains("theme block")),
            "got: {error}"
        );
    }
}

/// A config that is not text at all cannot be spliced. Reported as the same
/// `Config` failure a malformed one is, naming the file.
#[test]
fn refuses_to_record_into_a_config_that_is_not_utf8() {
    let fs = InMemoryFs::new();
    let config = Path::new("primitiv.json");
    fs.write(config, &[0xff, 0xfe]).unwrap();

    let error = record(&fs, config, Path::new("p.json")).unwrap_err();

    assert!(matches!(error, CliError::Config(_)), "got: {error}");
}

/// The read and the write are both through the port, so both failures surface.
#[test]
fn surfaces_the_config_read_and_write_failures() {
    let fs = InMemoryFs::new();
    let config = Path::new("primitiv.json");
    fs.fail_reads_to(config);
    assert!(matches!(
        record(&fs, config, Path::new("p.json")).unwrap_err(),
        CliError::Io(_)
    ));

    let fs = InMemoryFs::new();
    fs.write(config, CONFIG_WITHOUT_PALETTE).unwrap();
    fs.fail_writes_to(config);
    assert!(matches!(
        record(&fs, config, Path::new("p.json")).unwrap_err(),
        CliError::Io(_)
    ));
}

/// The theme block legitimately nests — `neutral`, and `tint` inside that — which
/// is the whole reason the block is found by a brace scan rather than by matching
/// to the first `}`. Matching to the first one would end the block in the middle
/// of the tint and record the palette outside the theme entirely.
#[test]
fn records_into_a_theme_block_that_nests_a_neutral_ramp() {
    let fs = InMemoryFs::new();
    let config = Path::new("primitiv.json");
    fs.write(
        config,
        br##"{
  "version": 1,
  "framework": "react",
  "styles": { "enabled": true, "format": "css", "path": "s" },
  "tokens": { "format": "css", "path": "s/tokens.css" },
  "theme": { "brand": "#0a7755", "neutral": { "tint": { "source": "brand", "strength": 0.2 } } },
  "aliases": {},
  "registry": { "version": "0.1.0" }
}"##,
    )
    .unwrap();

    record(&fs, config, Path::new("p.json")).unwrap();

    let written = String::from_utf8(fs.read(config).unwrap()).unwrap();
    let config = Config::parse(written.as_bytes()).unwrap();
    assert_eq!(config.theme.palette.as_deref(), Some("p.json"));
    assert!(
        config.theme.neutral.is_some(),
        "the nested neutral ramp should survive, got: {written}"
    );
}

/// A palette as Harmoni exports one (RFC 0032 D3): the ramps under `color`, and
/// the roles the designer solved against them at the mode's root, exactly where
/// Primitiv's own Intent document puts them.
const RAMPS_AND_ROLES: &[u8] = br##"{
  "light": {
    "color": { "brand": { "500": { "$type": "color", "$value": "#0a7755" } } },
    "action": { "primary": { "$type": "color", "$value": "{color.brand.500}" } }
  }
}"##;

/// §7 q4: the choice belongs to the consumer's build, not the designer. Keeping
/// the ramps and dropping the roles is what lets a project take a palette's
/// colours while keeping Primitiv's own semantics.
#[test]
fn ramps_only_keeps_the_ramps_and_drops_the_roles() {
    let document = ramps_only(parse(RAMPS_AND_ROLES, Path::new("p.json")).unwrap()).document();

    let light = document["light"].as_object().unwrap();
    let keys: Vec<&String> = light.keys().collect();
    assert_eq!(keys, ["color"]);
    assert_eq!(light["color"]["brand"]["500"]["$value"], "#0a7755");
}
