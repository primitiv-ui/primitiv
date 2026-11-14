use std::path::Path;

use pretty_assertions::assert_eq;

use crate::commands::add::{AddOptions, add};
use crate::commands::remove::{RemoveOptions, remove};
use crate::error::CliError;
use crate::lock::Lock;
use crate::ports::fs::{FileSystem, InMemoryFs};
use crate::ports::output::InMemoryOutput;
use crate::ports::process::InMemoryProcessRunner;
use crate::ports::prompt::{Decision, InMemoryPrompt};
use crate::ports::registry::{EmbeddedRegistry, InMemoryRegistry};

/// A styled elements project: stylesheets under `static/primitiv`.
const ELEMENTS: &[u8] = br##"{
  "version": 1,
  "surface": "elements",
  "styles": { "enabled": true, "format": "css", "path": "static/primitiv", "url": "/primitiv" },
  "tokens": { "format": "css", "path": "static/primitiv/tokens.css" },
  "theme": {},
  "aliases": {},
  "registry": { "version": "0.1.0" }
}"##;

/// A project with `components` added through the real `add`, as a consumer's is.
fn project(config: &[u8], components: &[&str]) -> InMemoryFs {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), config).unwrap();
    add(
        &fs,
        &EmbeddedRegistry,
        &InMemoryOutput::new(),
        &InMemoryProcessRunner::new(),
        &InMemoryPrompt::new(Decision::Keep),
        false,
        &AddOptions {
            components: components.iter().map(|c| c.to_string()).collect(),
            ..Default::default()
        },
    )
    .unwrap();
    fs
}

fn options(components: &[&str]) -> RemoveOptions {
    RemoveOptions {
        components: components.iter().map(|c| c.to_string()).collect(),
        force: false,
    }
}

fn lock(fs: &InMemoryFs) -> Lock {
    Lock::parse(&fs.read(Path::new("primitiv.lock")).unwrap())
}

#[test]
fn deletes_a_components_files_and_takes_it_out_of_the_lock_and_the_index() {
    let fs = project(ELEMENTS, &["tooltip", "tabs"]);
    let output = InMemoryOutput::new();

    remove(&fs, &EmbeddedRegistry, &output, &options(&["tooltip"])).unwrap();

    assert!(!fs.exists(Path::new("static/primitiv/tooltip/styles.css")));
    assert!(!fs.exists(Path::new("static/primitiv/tooltip/contract.json")));
    assert!(fs.exists(Path::new("static/primitiv/tabs/styles.css")));
    let lock = lock(&fs);
    assert!(!lock.components.contains("tooltip"));
    assert!(lock.components.contains("tabs"));
    assert!(lock.files.keys().all(|file| !file.contains("/tooltip/")));
    assert_eq!(
        String::from_utf8(fs.read(Path::new("static/primitiv/index.css")).unwrap()).unwrap(),
        "@import \"./tabs/styles.css\";\n"
    );
    assert_eq!(
        String::from_utf8(output.captured()).unwrap(),
        "Removed tooltip:\n  \
         static/primitiv/tooltip/contract.json  deleted\n  \
         static/primitiv/tooltip/styles.css  deleted\n  \
         static/primitiv/index.css  updated\n\n\
         Take it out of your pages too: its markup, and its <script> tag if nothing else on the page uses it.\n"
    );
}

#[test]
fn refuses_a_component_that_is_not_installed() {
    let fs = project(ELEMENTS, &["tabs"]);

    let error = remove(&fs, &EmbeddedRegistry, &InMemoryOutput::new(), &options(&["tooltip"])).unwrap_err();

    assert!(matches!(error, CliError::NotFound(_)));
    assert_eq!(error.to_string(), "tooltip is not installed: primitiv.lock does not list it");
}

#[test]
fn refuses_a_component_another_installed_one_still_uses() {
    let fs = project(ELEMENTS, &["breadcrumb-overflow"]);

    let error = remove(&fs, &EmbeddedRegistry, &InMemoryOutput::new(), &options(&["dropdown"])).unwrap_err();

    assert!(matches!(error, CliError::Conflict(_)));
    assert_eq!(
        error.to_string(),
        "dropdown is used by breadcrumb-overflow: remove breadcrumb-overflow too, or keep dropdown"
    );
    assert!(fs.exists(Path::new("static/primitiv/dropdown/styles.css")));
}

#[test]
fn removes_a_component_with_the_one_that_uses_it() {
    let fs = project(ELEMENTS, &["breadcrumb-overflow"]);

    remove(
        &fs,
        &EmbeddedRegistry,
        &InMemoryOutput::new(),
        &options(&["dropdown", "breadcrumb-overflow"]),
    )
    .unwrap();

    let lock = lock(&fs);
    assert!(!lock.components.contains("dropdown"));
    assert!(!lock.components.contains("breadcrumb-overflow"));
    assert!(lock.components.contains("breadcrumb"));
}

#[test]
fn keeps_an_edited_file_unless_forced() {
    let fs = project(ELEMENTS, &["tooltip"]);
    fs.write(Path::new("static/primitiv/tooltip/styles.css"), b"/* mine */").unwrap();

    let error = remove(&fs, &EmbeddedRegistry, &InMemoryOutput::new(), &options(&["tooltip"])).unwrap_err();

    assert!(matches!(error, CliError::Conflict(_)));
    assert_eq!(
        error.to_string(),
        "you have edited files primitiv added; pass --force to delete them anyway:\n  \
         static/primitiv/tooltip/styles.css"
    );
    assert!(fs.exists(Path::new("static/primitiv/tooltip/contract.json")));

    remove(
        &fs,
        &EmbeddedRegistry,
        &InMemoryOutput::new(),
        &RemoveOptions { force: true, ..options(&["tooltip"]) },
    )
    .unwrap();

    assert!(!fs.exists(Path::new("static/primitiv/tooltip/styles.css")));
}

/// A styled React project, components in the default `src/components`.
const REACT: &[u8] = br##"{
  "version": 1,
  "surface": "react",
  "styles": { "enabled": true, "format": "css", "path": "src/styles/primitiv" },
  "tokens": { "format": "css", "path": "src/styles/primitiv/tokens.css" },
  "theme": {},
  "aliases": {},
  "registry": { "version": "0.1.0" }
}"##;

fn react_project(components: &[&str]) -> InMemoryFs {
    let fs = InMemoryFs::new();
    fs.write(Path::new("package.json"), b"{}").unwrap();
    fs.write(Path::new("primitiv.json"), REACT).unwrap();
    add(
        &fs,
        &EmbeddedRegistry,
        &InMemoryOutput::new(),
        &InMemoryProcessRunner::new(),
        &InMemoryPrompt::new(Decision::Keep),
        false,
        &AddOptions {
            components: components.iter().map(|c| c.to_string()).collect(),
            ..Default::default()
        },
    )
    .unwrap();
    fs
}

#[test]
fn takes_a_react_component_out_of_the_barrel() {
    let fs = react_project(&["kbd", "badge"]);
    let output = InMemoryOutput::new();

    remove(&fs, &EmbeddedRegistry, &output, &options(&["kbd"])).unwrap();

    assert!(!fs.exists(Path::new("src/components/kbd.tsx")));
    assert_eq!(
        String::from_utf8(fs.read(Path::new("src/components/index.ts")).unwrap()).unwrap(),
        "export * from \"./badge\";\n"
    );
    let printed = String::from_utf8(output.captured()).unwrap();
    assert!(printed.contains("  src/components/index.ts  updated\n"), "{printed}");
    assert!(printed.ends_with("\nTake it out of your imports too.\n"), "{printed}");
}

#[test]
fn empties_the_barrel_when_the_last_react_component_goes() {
    let fs = react_project(&["kbd"]);

    remove(&fs, &EmbeddedRegistry, &InMemoryOutput::new(), &options(&["kbd"])).unwrap();

    assert_eq!(fs.read(Path::new("src/components/index.ts")).unwrap(), b"");
}

#[test]
fn removes_a_headless_component_from_a_project_with_no_config() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.lock"), b"{ \"components\": [\"tabs\", \"tooltip\"], \"files\": {} }")
        .unwrap();
    let output = InMemoryOutput::new();

    remove(&fs, &EmbeddedRegistry, &output, &options(&["tabs", "tooltip"])).unwrap();

    assert!(lock(&fs).components.is_empty());
    assert_eq!(
        String::from_utf8(output.captured()).unwrap(),
        "Removed tabs, tooltip:\n\n\
         Take them out of your pages too: their markup, and each <script> tag if nothing else on the page uses it.\n"
    );
}

#[test]
fn drops_a_file_already_deleted_by_hand_from_the_lock() {
    let fs = project(ELEMENTS, &["tooltip"]);
    fs.remove_file(Path::new("static/primitiv/tooltip/styles.css")).unwrap();

    remove(&fs, &EmbeddedRegistry, &InMemoryOutput::new(), &options(&["tooltip"])).unwrap();

    assert!(lock(&fs).files.is_empty());
}

#[test]
fn surfaces_a_file_that_cannot_be_deleted() {
    let fs = project(ELEMENTS, &["tooltip"]);
    fs.fail_removes_to(Path::new("static/primitiv/tooltip/styles.css"));

    let error = remove(&fs, &EmbeddedRegistry, &InMemoryOutput::new(), &options(&["tooltip"])).unwrap_err();

    assert!(matches!(error, CliError::Io(_)));
}

#[test]
fn surfaces_a_registry_that_cannot_be_read() {
    let fs = project(ELEMENTS, &["tooltip"]);
    let registry = InMemoryRegistry::failing();

    let error = remove(&fs, &registry, &InMemoryOutput::new(), &options(&["tooltip"])).unwrap_err();

    assert!(matches!(error, CliError::Registry(_)));
}

#[test]
fn surfaces_a_working_directory_that_cannot_be_read() {
    let fs = InMemoryFs::new();
    fs.fail_current_dir();

    let error = remove(&fs, &EmbeddedRegistry, &InMemoryOutput::new(), &options(&["tabs"])).unwrap_err();

    assert!(matches!(error, CliError::Io(_)));
}

/// An elements project whose styles are not Primitiv's: nothing to re-index.
const HEADLESS: &[u8] = br##"{
  "version": 1,
  "surface": "elements",
  "styles": { "enabled": false, "format": "css", "path": "primitiv" },
  "tokens": { "format": "css", "path": "primitiv/tokens.css" },
  "theme": {},
  "aliases": {},
  "registry": { "version": "0.1.0" }
}"##;

#[test]
fn writes_no_index_for_a_project_that_does_not_copy_styles() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), HEADLESS).unwrap();
    fs.write(Path::new("primitiv.lock"), b"{ \"components\": [\"tabs\"], \"files\": {} }")
        .unwrap();

    remove(&fs, &EmbeddedRegistry, &InMemoryOutput::new(), &options(&["tabs"])).unwrap();

    assert!(!fs.exists(Path::new("primitiv/index.css")));
}

/// Run `remove tooltip` on a styled elements project with `fail` set up first,
/// and return the error.
fn failing(fail: impl Fn(&InMemoryFs, &InMemoryOutput)) -> CliError {
    let fs = project(ELEMENTS, &["tooltip", "tabs"]);
    let output = InMemoryOutput::new();
    fail(&fs, &output);
    remove(&fs, &EmbeddedRegistry, &output, &options(&["tooltip"])).unwrap_err()
}

#[test]
fn surfaces_every_failure_it_meets() {
    let config = failing(|fs, _| fs.write(Path::new("primitiv.json"), b"{ not json").unwrap());
    let lock = failing(|fs, _| fs.fail_reads_to(Path::new("primitiv.lock")));
    let file = failing(|fs, _| fs.fail_reads_to(Path::new("static/primitiv/tooltip/styles.css")));
    let index = failing(|fs, _| fs.fail_writes_to(Path::new("static/primitiv/index.css")));
    let lock_write = failing(|fs, _| fs.fail_writes_to(Path::new("primitiv.lock")));
    let stdout = failing(|_, output| output.fail_stdout());

    assert!(matches!(config, CliError::Config(_)), "{config}");
    for error in [lock, file, index, lock_write, stdout] {
        assert!(matches!(error, CliError::Io(_)), "{error}");
    }
}

#[test]
fn surfaces_a_registry_index_it_cannot_parse() {
    let fs = project(ELEMENTS, &["tooltip"]);

    let error = remove(
        &fs,
        &InMemoryRegistry::new(b"not json"),
        &InMemoryOutput::new(),
        &options(&["tooltip"]),
    )
    .unwrap_err();

    assert!(!matches!(error, CliError::Io(_)), "{error}");
}

#[test]
fn surfaces_a_barrel_it_cannot_write() {
    // Two components: the barrel is rewritten with the one that stays.
    let fs = react_project(&["kbd", "badge"]);
    fs.fail_writes_to(Path::new("src/components/index.ts"));
    let rewritten = remove(&fs, &EmbeddedRegistry, &InMemoryOutput::new(), &options(&["kbd"])).unwrap_err();
    // One component: the barrel is emptied.
    let fs = react_project(&["kbd"]);
    fs.fail_writes_to(Path::new("src/components/index.ts"));
    let emptied = remove(&fs, &EmbeddedRegistry, &InMemoryOutput::new(), &options(&["kbd"])).unwrap_err();

    assert!(matches!(rewritten, CliError::Io(_)));
    assert!(matches!(emptied, CliError::Io(_)));
}

#[test]
fn surfaces_a_components_folder_it_cannot_detect() {
    let fs = react_project(&["kbd"]);
    fs.write(Path::new("tsconfig.json"), b"{}").unwrap();
    fs.fail_reads_to(Path::new("tsconfig.json"));

    let error = remove(&fs, &EmbeddedRegistry, &InMemoryOutput::new(), &options(&["kbd"])).unwrap_err();

    assert!(matches!(error, CliError::Io(_)));
}
