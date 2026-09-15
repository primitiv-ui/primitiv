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
