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

#[test]
fn installs_only_the_elements_packages_in_a_project_with_a_package_json() {
    // cva belongs to the React recipe, which the elements surface does not copy.
    let fs = InMemoryFs::new();
    fs.set_current_dir(std::path::Path::new("project"));
    fs.write(std::path::Path::new("project/package.json"), b"{}").unwrap();
    fs.write(std::path::Path::new("project/pnpm-lock.yaml"), b"").unwrap();
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();

    add_elements(&fs, &output, &runner, AddOptions { components: vec!["tabs".into()], ..Default::default() }).unwrap();

    assert_eq!(
        runner.calls(),
        vec![(
            "pnpm".to_string(),
            vec!["add".to_string(), "@primitiv-ui/web@^0.1.0".to_string(), "--silent".to_string()],
            std::path::Path::new("project").to_path_buf(),
        )]
    );
}

#[test]
fn prints_a_pinned_cdn_script_instead_of_installing_without_a_package_json() {
    // A plain HTML or server-rendered project has no package manager to run.
    let fs = InMemoryFs::new();
    fs.set_current_dir(std::path::Path::new("site"));
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();

    add_elements(&fs, &output, &runner, AddOptions { components: vec!["tabs".into()], ..Default::default() }).unwrap();

    assert_eq!(runner.calls(), vec![]);
    assert!(
        String::from_utf8(output.captured()).unwrap().ends_with(
            "\nNo package.json here, so nothing was installed. Load the elements with:\n\n  \
             <script type=\"module\" src=\"https://cdn.jsdelivr.net/npm/@primitiv-ui/web@0.1.0/dist/primitiv-web.js\"></script>\n"
        ),
        "{}",
        String::from_utf8(output.captured()).unwrap()
    );
}

#[test]
fn prints_no_script_when_no_component_needs_a_package() {
    // Kbd has no behaviour (§8.3): there is no element to load.
    let fs = InMemoryFs::new();
    let output = InMemoryOutput::new();

    add_elements(&fs, &output, &InMemoryProcessRunner::new(), AddOptions { components: vec!["kbd".into()], ..Default::default() }).unwrap();

    assert!(!String::from_utf8(output.captured()).unwrap().contains("No package.json"));
}

#[test]
fn keeps_json_output_to_the_plan_without_a_package_json() {
    let fs = InMemoryFs::new();
    let output = InMemoryOutput::new();

    add_elements(&fs, &output, &InMemoryProcessRunner::new(), AddOptions { components: vec!["tabs".into()], json: true, ..Default::default() }).unwrap();

    let captured = String::from_utf8(output.captured()).unwrap();
    serde_json::from_str::<serde_json::Value>(&captured).unwrap_or_else(|error| panic!("{error}: {captured}"));
}

/// The registry with the bytes `kbd`'s files carry, React surface included.
fn kbd_registry() -> InMemoryRegistry {
    InMemoryRegistry::new(REGISTRY)
        .with_file("kbd", "styles.css", b".primitiv-kbd{}")
        .with_file("kbd", "kbd.html", b"<kbd class=\"primitiv-kbd\">Kbd</kbd>\n")
        .with_file("kbd", "contract.json", b"{}")
        .with_file("kbd", "kbd.recipe.ts", b"recipe")
        .with_file("kbd", "kbd.tsx", b"wrapper")
}

#[test]
fn copies_the_stylesheet_snippet_and_contract_into_one_folder_per_component() {
    let fs = InMemoryFs::new();
    fs.write(std::path::Path::new("primitiv.json"), ELEMENTS_CONFIG).unwrap();

    add(
        &fs,
        &kbd_registry(),
        &InMemoryOutput::new(),
        &InMemoryProcessRunner::new(),
        &InMemoryPrompt::new(Decision::Keep),
        false,
        &AddOptions { components: vec!["kbd".into()], ..Default::default() },
    )
    .unwrap();

    let read = |path: &str| fs.read(std::path::Path::new(path)).ok();
    assert_eq!(read("primitiv/kbd/styles.css"), Some(b".primitiv-kbd{}".to_vec()));
    assert_eq!(read("primitiv/kbd/kbd.html"), Some(b"<kbd class=\"primitiv-kbd\">Kbd</kbd>\n".to_vec()));
    assert_eq!(read("primitiv/kbd/contract.json"), Some(b"{}".to_vec()));
    // The React surface stays behind.
    assert_eq!(read("src/components/kbd.tsx"), None);
    assert_eq!(read("src/components/kbd.recipe.ts"), None);
    assert_eq!(read("src/components/kbd.contract.json"), None);
}
