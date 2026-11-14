use std::path::Path;

use pretty_assertions::assert_eq;

use crate::commands::utilities::utilities;
use crate::error::CliError;
use crate::ports::fs::{FileSystem, InMemoryFs};
use crate::ports::output::InMemoryOutput;

/// An elements project that links its styles from `/primitiv`.
const ELEMENTS: &[u8] = br##"{
  "version": 1,
  "surface": "elements",
  "styles": { "enabled": true, "format": "css", "path": "static/primitiv", "url": "/primitiv" },
  "tokens": { "format": "css", "path": "static/primitiv/tokens.css" },
  "theme": {},
  "aliases": {},
  "registry": { "version": "0.1.0" }
}"##;

/// A project whose token layer is a Tailwind preset.
const TAILWIND: &[u8] = br##"{
  "version": 1,
  "surface": "react",
  "styles": { "enabled": true, "format": "tailwind", "path": "src/styles" },
  "tokens": { "format": "tailwind", "path": "src/styles/tokens.css" },
  "theme": {},
  "aliases": {},
  "registry": { "version": "0.1.0" }
}"##;

#[test]
fn streams_the_classes_to_stdout_with_no_config_and_no_destination() {
    let fs = InMemoryFs::new();
    let output = InMemoryOutput::new();

    utilities(&fs, &output, None).unwrap();

    let printed = String::from_utf8(output.captured()).unwrap();
    assert!(printed.starts_with("@layer primitiv.reset,"), "{printed}");
    assert!(printed.contains("@layer primitiv.utilities {"));
}

#[test]
fn writes_beside_the_configured_token_layer_and_prints_its_link() {
    let fs = InMemoryFs::new();
    let output = InMemoryOutput::new();
    fs.write(Path::new("primitiv.json"), ELEMENTS).unwrap();

    utilities(&fs, &output, None).unwrap();

    assert!(fs.exists(Path::new("static/primitiv/utilities.css")));
    assert_eq!(
        String::from_utf8(output.captured()).unwrap(),
        "Wrote static/primitiv/utilities.css. Link it from your page, after tokens.css:\n\n  \
         <link rel=\"stylesheet\" href=\"/primitiv/utilities.css\">\n\n\
         To keep it regenerated with the token layer, set \"utilities\": true in primitiv.json's tokens block.\n"
    );
}

#[test]
fn writes_where_out_says_without_a_link_it_cannot_know() {
    let fs = InMemoryFs::new();
    let output = InMemoryOutput::new();

    utilities(&fs, &output, Some(Path::new("public/utilities.css"))).unwrap();

    assert!(fs.exists(Path::new("public/utilities.css")));
    assert_eq!(
        String::from_utf8(output.captured()).unwrap(),
        "Wrote public/utilities.css.\n"
    );
}

#[test]
fn refuses_a_tailwind_project() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), TAILWIND).unwrap();

    let error = utilities(&fs, &InMemoryOutput::new(), None).unwrap_err();

    assert_eq!(
        error.to_string(),
        "utilities are for CSS and SCSS projects; Tailwind already writes these classes from Primitiv's tokens (--format tailwind)"
    );
}

#[test]
fn surfaces_a_write_failure() {
    let fs = InMemoryFs::new();
    fs.fail_writes_to(Path::new("public/utilities.css"));

    let error = utilities(&fs, &InMemoryOutput::new(), Some(Path::new("public/utilities.css")))
        .unwrap_err();

    assert!(matches!(error, CliError::Io(_)));
}

#[test]
fn surfaces_a_working_directory_that_cannot_be_read() {
    let fs = InMemoryFs::new();
    fs.fail_current_dir();

    let error = utilities(&fs, &InMemoryOutput::new(), None).unwrap_err();

    assert!(matches!(error, CliError::Io(_)));
}

/// A React project in plain CSS: its bundler imports the styles, so no URL.
const REACT: &[u8] = br##"{
  "version": 1,
  "surface": "react",
  "styles": { "enabled": true, "format": "css", "path": "src/styles" },
  "tokens": { "format": "css", "path": "src/styles/tokens.css", "utilities": true },
  "theme": {},
  "aliases": {},
  "registry": { "version": "0.1.0" }
}"##;

#[test]
fn says_to_import_it_where_there_is_no_url_and_skips_a_hint_already_taken() {
    let fs = InMemoryFs::new();
    let output = InMemoryOutput::new();
    fs.write(Path::new("primitiv.json"), REACT).unwrap();

    utilities(&fs, &output, None).unwrap();

    assert!(fs.exists(Path::new("src/styles/utilities.css")));
    assert_eq!(
        String::from_utf8(output.captured()).unwrap(),
        "Wrote src/styles/utilities.css. Import it after tokens.css.\n"
    );
}

#[test]
fn surfaces_a_stdout_failure() {
    let fs = InMemoryFs::new();
    let output = InMemoryOutput::new();
    output.fail_stdout();

    let error = utilities(&fs, &output, None).unwrap_err();

    assert!(matches!(error, CliError::Io(_)));
}
