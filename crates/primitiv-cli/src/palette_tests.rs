use std::path::Path;

use crate::error::CliError;
use crate::palette::parse;

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
