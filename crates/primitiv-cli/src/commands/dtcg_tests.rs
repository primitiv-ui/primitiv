use std::path::Path;

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

    dtcg(&fs, &seeds(), out).unwrap();

    let expected = emit_dtcg_ramps(&[("brand", "#0a7755"), ("danger", "#db2424")]).unwrap();
    assert_eq!(fs.read(out).unwrap(), expected.into_bytes());
}

#[test]
fn surfaces_an_unparseable_seed() {
    let fs = InMemoryFs::new();

    let err = dtcg(
        &fs,
        &[("brand".to_string(), "not-a-colour".to_string())],
        Path::new("palette.json"),
    )
    .unwrap_err();

    assert!(matches!(err, CliError::InvalidColor(_)));
}

#[test]
fn surfaces_a_write_failure() {
    let fs = InMemoryFs::new();
    let out = Path::new("palette.json");
    fs.fail_writes_to(out);

    let err = dtcg(&fs, &seeds(), out).unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}
