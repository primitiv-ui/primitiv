use std::path::Path;

use harmoni_core::api::DEFAULT_STEPS;
use primitiv_emit::emit_dtcg_ramps;

use crate::commands::dtcg::dtcg;
use crate::error::CliError;
use crate::ports::fs::{FileSystem, InMemoryFs};

/// The seeds most of these cases use, in the shape `dtcg` takes.
fn seeds() -> Vec<(String, String)> {
    vec![
        ("brand".to_string(), "#0a7755".to_string()),
        ("danger".to_string(), "#db2424".to_string()),
    ]
}

#[test]
fn writes_the_dtcg_document_to_the_out_path() {
    let fs = InMemoryFs::new();
    let out = Path::new("tokens/palette.json");

    dtcg(&fs, &seeds(), out, DEFAULT_STEPS).unwrap();

    let expected = emit_dtcg_ramps(
        &[("brand", "#0a7755"), ("danger", "#db2424")],
        DEFAULT_STEPS,
        None,
    )
    .unwrap();
    assert_eq!(fs.read(out).unwrap(), expected.into_bytes());
}

#[test]
fn surfaces_an_unparseable_seed() {
    let fs = InMemoryFs::new();

    let err = dtcg(
        &fs,
        &[("brand".to_string(), "not-a-colour".to_string())],
        Path::new("palette.json"),
        DEFAULT_STEPS,
    )
    .unwrap_err();

    assert!(matches!(err, CliError::InvalidColor(_)));
}

#[test]
fn surfaces_a_write_failure() {
    let fs = InMemoryFs::new();
    let out = Path::new("palette.json");
    fs.fail_writes_to(out);

    let err = dtcg(&fs, &seeds(), out, DEFAULT_STEPS).unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}

#[test]
fn refuses_to_run_with_no_seed_from_either_a_flag_or_the_config() {
    let fs = InMemoryFs::new();

    let err = dtcg(&fs, &[], Path::new("palette.json"), DEFAULT_STEPS).unwrap_err();

    assert!(matches!(err, CliError::Usage(_)));
}

#[test]
fn exports_a_ramp_of_the_requested_length() {
    let fs = InMemoryFs::new();
    let out = Path::new("palette.json");

    dtcg(&fs, &[("brand".to_string(), "#0a7755".to_string())], out, 5).unwrap();

    // A five-step ramp labels 50, 100, 300, 500, 900 — so the document carries
    // exactly those and none of the decades a ten-step ramp would have.
    let written = String::from_utf8(fs.read(out).unwrap()).unwrap();
    assert!(written.contains("\"300\""), "{written}");
    assert!(!written.contains("\"200\""), "{written}");
}

#[test]
fn refuses_a_step_count_the_engine_does_not_support() {
    let fs = InMemoryFs::new();

    let err = dtcg(
        &fs,
        &[("brand".to_string(), "#0a7755".to_string())],
        Path::new("palette.json"),
        99,
    )
    .unwrap_err();

    // The engine's bound, in the engine's words — not a second copy here.
    assert!(matches!(err, CliError::Usage(_)), "{err:?}");
    assert!(err.to_string().contains("32"), "{err}");
}

/// `theme` honours `primitiv.json`'s `neutral` block; `dtcg` must too, or the one
/// route out of the CLI and into a design tool hands over a palette with no greys.
/// The two commands read the same config, so they cannot be allowed to disagree
/// about what a project's palette contains.
#[test]
fn writes_the_projects_neutral_ramp_from_the_config() {
    let fs = InMemoryFs::new();
    fs.write(
        Path::new("primitiv.json"),
        br##"{
          "version": 1,
          "framework": "react",
          "styles": { "enabled": true, "format": "css", "path": "s" },
          "tokens": { "format": "css", "path": "t.css" },
          "theme": {
            "brand": "#0a7755",
            "neutral": { "tint": { "source": "brand", "strength": 0.5 } }
          },
          "aliases": {},
          "registry": { "version": "0.1.0" }
        }"##,
    )
    .unwrap();
    let out = Path::new("tokens/palette.json");

    dtcg(&fs, &[], out, DEFAULT_STEPS).unwrap();

    let written = String::from_utf8(fs.read(out).unwrap()).unwrap();
    let parsed: serde_json::Value = serde_json::from_str(&written).unwrap();
    for mode in ["light", "dark"] {
        assert!(
            parsed[mode]["color"]["neutral"]["500"]["$value"].is_string(),
            "{mode} mode carries no neutral ramp: {written}"
        );
    }
}

/// The config's neutral block is resolved here too, so its errors have to reach the
/// caller rather than being swallowed into a document with no greys. `theme` holds
/// the same line; both commands read the same block, so both owe the same answer.
#[test]
fn surfaces_a_malformed_neutral_block_rather_than_ignoring_it() {
    let fs = InMemoryFs::new();
    fs.write(
        Path::new("primitiv.json"),
        br##"{
          "version": 1, "framework": "react",
          "styles": { "enabled": true, "format": "css", "path": "s" },
          "tokens": { "format": "css", "path": "t.css" },
          "theme": { "brand": "#0a7755", "neutral": "#888888" },
          "aliases": {}, "registry": { "version": "0.1.0" }
        }"##,
    )
    .unwrap();

    let err = dtcg(&fs, &[], Path::new("palette.json"), DEFAULT_STEPS).unwrap_err();

    assert!(matches!(err, CliError::Usage(_)), "{err:?}");
    // A single colour is the wrong shape for a ramp grown between two anchors, and
    // the message says where the block goes instead of only that it is wrong.
    assert!(err.to_string().contains("two anchors"), "{err}");
}
