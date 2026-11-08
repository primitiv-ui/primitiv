//! `add` on the elements surface (RFC 0033 §8.2): the markup snippet over
//! `@primitiv-ui/web` in place of the React wrapper.

use pretty_assertions::assert_eq;

use crate::commands::add::{AddOptions, add};
use crate::config::Surface;
use crate::error::CliError;
use crate::ports::fs::{FileSystem, InMemoryFs};
use crate::ports::output::InMemoryOutput;
use crate::ports::process::InMemoryProcessRunner;
use crate::ports::prompt::{Decision, InMemoryPrompt};
use crate::ports::registry::InMemoryRegistry;

/// `kbd` has an elements surface with no package (it has no behaviour, §8.3);
/// `tabs` has one over `@primitiv-ui/web`; `modal` has none yet.
const REGISTRY: &[u8] = br##"{
  "version": "0.1.0",
  "components": {
    "kbd": {
      "version": "0.1.0",
      "dependsOn": { "packages": [{ "name": "@primitiv-ui/react", "version": "^0.1.0" }] },
      "styles": {
        "packages": ["class-variance-authority"],
        "formats": { "css": ["styles.css"] },
        "react": ["kbd.recipe.ts", "kbd.tsx"]
      },
      "contract": "contract.json",
      "elements": { "files": ["kbd.html"] }
    },
    "tabs": {
      "version": "0.1.0",
      "dependsOn": { "packages": [{ "name": "@primitiv-ui/react", "version": "^0.1.0" }] },
      "styles": { "packages": ["class-variance-authority"], "formats": { "css": ["styles.css"] } },
      "elements": {
        "packages": [{ "name": "@primitiv-ui/web", "version": "^0.1.0" }],
        "files": ["tabs.html"]
      }
    },
    "modal": { "version": "0.1.0" },
    "confirm-dialog": { "version": "0.1.0", "dependsOn": { "components": ["modal"] }, "elements": { "files": ["confirm-dialog.html"] } }
  }
}"##;

/// Run `add` on the elements surface against an empty project.
fn add_elements(fs: &InMemoryFs, output: &InMemoryOutput, runner: &InMemoryProcessRunner, options: AddOptions) -> Result<(), CliError> {
    add(
        fs,
        &InMemoryRegistry::new(REGISTRY),
        output,
        runner,
        &InMemoryPrompt::new(Decision::Keep),
        false,
        &AddOptions { surface: Some(Surface::Elements), ..options },
    )
}

#[test]
fn rejects_a_component_with_no_elements_surface_yet() {
    let fs = InMemoryFs::new();
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();

    let error = add_elements(
        &fs,
        &output,
        &runner,
        AddOptions { components: vec!["modal".into()], dry_run: true, ..Default::default() },
    )
    .unwrap_err();

    assert!(
        matches!(&error, CliError::NotFound(message) if message == "component 'modal' has no elements surface yet"),
        "{error:?}"
    );
    assert_eq!(output.captured(), Vec::<u8>::new());
}

#[test]
fn rejects_a_dependency_with_no_elements_surface_yet() {
    // The dependency is what fails: the requested component has a surface.
    let fs = InMemoryFs::new();
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();

    let error = add_elements(
        &fs,
        &output,
        &runner,
        AddOptions { components: vec!["confirm-dialog".into()], dry_run: true, ..Default::default() },
    )
    .unwrap_err();

    assert!(
        matches!(&error, CliError::NotFound(message) if message.contains("'modal'")),
        "{error:?}"
    );
}

/// A project whose config chose the elements surface (RFC 0033 §8.2).
const ELEMENTS_CONFIG: &[u8] = br##"{
  "version": 1,
  "surface": "elements",
  "styles": { "enabled": true, "format": "css", "path": "primitiv" },
  "tokens": { "format": "css", "path": "primitiv/tokens.css" },
  "theme": {},
  "aliases": {},
  "registry": { "version": "0.1.0" }
}"##;

#[test]
fn takes_the_surface_from_the_project_config_without_the_flag() {
    let fs = InMemoryFs::new();
    fs.write(std::path::Path::new("primitiv.json"), ELEMENTS_CONFIG).unwrap();

    let error = add(
        &fs,
        &InMemoryRegistry::new(REGISTRY),
        &InMemoryOutput::new(),
        &InMemoryProcessRunner::new(),
        &InMemoryPrompt::new(Decision::Keep),
        false,
        &AddOptions { components: vec!["modal".into()], dry_run: true, ..Default::default() },
    )
    .unwrap_err();

    assert!(matches!(error, CliError::NotFound(_)), "{error:?}");
}

#[test]
fn plans_the_elements_packages_in_place_of_the_react_ones() {
    let fs = InMemoryFs::new();
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();

    add_elements(
        &fs,
        &output,
        &runner,
        AddOptions { components: vec!["kbd".into(), "tabs".into()], dry_run: true, ..Default::default() },
    )
    .unwrap();

    assert_eq!(
        String::from_utf8(output.captured()).unwrap(),
        "Resolved 2 components to add:\n  kbd   0.1.0\n  tabs  0.1.0\n\nPackages to ensure:\n  @primitiv-ui/web@^0.1.0\n"
    );
}
