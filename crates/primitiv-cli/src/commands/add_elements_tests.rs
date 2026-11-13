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
      "elements": { "example": "kbd.html" }
    },
    "tabs": {
      "version": "0.1.0",
      "dependsOn": { "packages": [{ "name": "@primitiv-ui/react", "version": "^0.1.0" }] },
      "styles": { "packages": ["class-variance-authority"], "formats": { "css": ["styles.css"] } },
      "elements": {
        "packages": [{ "name": "@primitiv-ui/web", "version": "^0.1.0" }],
        "example": "tabs.html"
      }
    },
    "modal": { "version": "0.1.0" },
    "confirm-dialog": { "version": "0.1.0", "dependsOn": { "components": ["modal"] }, "elements": { "example": "confirm-dialog.html" } }
  }
}"##;

/// Run `add` on the elements surface against an empty project.
fn add_elements(
    fs: &InMemoryFs,
    output: &InMemoryOutput,
    runner: &InMemoryProcessRunner,
    options: AddOptions,
) -> Result<(), CliError> {
    add(
        fs,
        &kbd_and_tabs_registry(),
        output,
        runner,
        &InMemoryPrompt::new(Decision::Keep),
        false,
        &AddOptions {
            surface: Some(Surface::Elements),
            ..options
        },
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
        AddOptions {
            components: vec!["modal".into()],
            dry_run: true,
            ..Default::default()
        },
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
        AddOptions {
            components: vec!["confirm-dialog".into()],
            dry_run: true,
            ..Default::default()
        },
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
    fs.write(std::path::Path::new("primitiv.json"), ELEMENTS_CONFIG)
        .unwrap();

    let error = add(
        &fs,
        &InMemoryRegistry::new(REGISTRY),
        &InMemoryOutput::new(),
        &InMemoryProcessRunner::new(),
        &InMemoryPrompt::new(Decision::Keep),
        false,
        &AddOptions {
            components: vec!["modal".into()],
            dry_run: true,
            ..Default::default()
        },
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
        AddOptions {
            components: vec!["kbd".into(), "tabs".into()],
            dry_run: true,
            styled: true,
            ..Default::default()
        },
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
    fs.write(std::path::Path::new("project/package.json"), b"{}")
        .unwrap();
    fs.write(std::path::Path::new("project/pnpm-lock.yaml"), b"")
        .unwrap();
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();

    add_elements(
        &fs,
        &output,
        &runner,
        AddOptions {
            components: vec!["tabs".into()],
            ..Default::default()
        },
    )
    .unwrap();

    assert_eq!(
        runner.calls(),
        vec![(
            "pnpm".to_string(),
            vec![
                "add".to_string(),
                "@primitiv-ui/web@^0.1.0".to_string(),
                "--silent".to_string()
            ],
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

    add_elements(
        &fs,
        &output,
        &runner,
        AddOptions {
            components: vec!["tabs".into()],
            ..Default::default()
        },
    )
    .unwrap();

    assert_eq!(runner.calls(), vec![]);
    assert!(
        String::from_utf8(output.captured()).unwrap().contains(&format!(
            "\nNo package.json here, so nothing was installed. Load the elements with:\n\n  \
             <script type=\"module\" src=\"https://cdn.jsdelivr.net/npm/@primitiv-ui/web@{}/dist/cdn/tabs.js\"></script>\n",
            env!("CARGO_PKG_VERSION")
        )),
        "{}",
        String::from_utf8(output.captured()).unwrap()
    );
}

#[test]
fn detects_the_elements_surface_without_a_config_or_a_package_json() {
    // A server-rendered project (a Spring app, say) that never ran `init`:
    // nothing in it says React, so `add` must not reach for npm.
    let fs = InMemoryFs::new();
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();

    add(
        &fs,
        &kbd_and_tabs_registry(),
        &output,
        &runner,
        &InMemoryPrompt::new(Decision::Keep),
        false,
        &AddOptions {
            components: vec!["tabs".into()],
            ..Default::default()
        },
    )
    .unwrap();

    assert_eq!(runner.calls(), vec![]);
    assert!(!fs.exists(std::path::Path::new("package.json")));
    assert!(
        String::from_utf8(output.captured())
            .unwrap()
            .contains("dist/cdn/tabs.js"),
        "{}",
        String::from_utf8(output.captured()).unwrap()
    );
}

#[test]
fn styled_without_a_config_asks_for_init_instead_of_copying_nothing() {
    // Without primitiv.json there is no folder to copy styles into; saying so
    // beats a run that prints nothing and writes nothing.
    let fs = InMemoryFs::new();
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();

    let error = add_elements(
        &fs,
        &output,
        &runner,
        AddOptions {
            components: vec!["tabs".into()],
            styled: true,
            ..Default::default()
        },
    )
    .unwrap_err();

    assert!(
        matches!(&error, CliError::Config(message) if message.contains("primitiv init --styles")),
        "{error:?}"
    );
    assert_eq!(output.captured(), Vec::<u8>::new());
    assert_eq!(runner.calls(), vec![]);
}

#[test]
fn loads_every_script_from_this_cli_s_own_release() {
    // The registry is baked into the CLI, so the release the CLI came from holds
    // every component's file and every fix since its floor. One version for
    // every run, too: a page adding components across runs never loads two.
    let registry = InMemoryRegistry::new(
        br##"{
  "version": "0.1.0",
  "components": {
    "tabs": { "version": "0.1.0", "elements": { "packages": [{ "name": "@primitiv-ui/web", "version": "^0.1.9" }], "example": "tabs.html" } }
  }
}"##,
    )
    .with_file("tabs", "tabs.html", b"<primitiv-tabs></primitiv-tabs>\n");
    let fs = InMemoryFs::new();
    let output = InMemoryOutput::new();

    add(
        &fs,
        &registry,
        &output,
        &InMemoryProcessRunner::new(),
        &InMemoryPrompt::new(Decision::Keep),
        false,
        &AddOptions {
            components: vec!["tabs".into()],
            surface: Some(Surface::Elements),
            ..Default::default()
        },
    )
    .unwrap();

    let captured = String::from_utf8(output.captured()).unwrap();
    assert!(
        captured.contains(&format!(
            "https://cdn.jsdelivr.net/npm/@primitiv-ui/web@{}/dist/cdn/tabs.js",
            env!("CARGO_PKG_VERSION")
        )),
        "{captured}"
    );
}

#[test]
fn loads_every_script_from_a_floor_newer_than_this_cli_s_release() {
    // Only an unreleased build can carry a component whose first release is
    // still to come: its file exists nowhere older, so that floor wins, and
    // every script takes it so the page downloads the shared chunk once.
    let registry = InMemoryRegistry::new(
        br##"{
  "version": "0.1.0",
  "components": {
    "tabs": { "version": "0.1.0", "elements": { "packages": [{ "name": "@primitiv-ui/web", "version": "^0.1.9" }], "example": "tabs.html" } },
    "collapsible": { "version": "0.1.0", "elements": { "packages": [{ "name": "@primitiv-ui/web", "version": "^99.0.10" }], "example": "collapsible.html" } }
  }
}"##,
    )
    .with_file("tabs", "tabs.html", b"<primitiv-tabs></primitiv-tabs>\n")
    .with_file("collapsible", "collapsible.html", b"<primitiv-collapsible></primitiv-collapsible>\n");
    let fs = InMemoryFs::new();
    let output = InMemoryOutput::new();

    add(
        &fs,
        &registry,
        &output,
        &InMemoryProcessRunner::new(),
        &InMemoryPrompt::new(Decision::Keep),
        false,
        &AddOptions {
            components: vec!["tabs".into(), "collapsible".into()],
            surface: Some(Surface::Elements),
            ..Default::default()
        },
    )
    .unwrap();

    let captured = String::from_utf8(output.captured()).unwrap();
    assert!(
        captured.contains(
            "  <script type=\"module\" src=\"https://cdn.jsdelivr.net/npm/@primitiv-ui/web@99.0.10/dist/cdn/collapsible.js\"></script>\n  \
             <script type=\"module\" src=\"https://cdn.jsdelivr.net/npm/@primitiv-ui/web@99.0.10/dist/cdn/tabs.js\"></script>\n"
        ),
        "{captured}"
    );
}

#[test]
fn loads_the_script_of_the_component_whose_elements_the_markup_uses() {
    // ConfirmDialog is a pre-arranged Modal: its markup is <primitiv-modal>, so
    // the script that defines it is modal.js, and there is no confirm-dialog.js.
    let registry = InMemoryRegistry::new(
        br##"{
  "version": "0.1.0",
  "components": {
    "confirm-dialog": { "version": "0.1.0", "elements": { "packages": [{ "name": "@primitiv-ui/web", "version": "^0.1.54" }], "definedBy": "modal", "example": "confirm-dialog.html" } }
  }
}"##,
    )
    .with_file("confirm-dialog", "confirm-dialog.html", b"<primitiv-modal></primitiv-modal>\n");
    let fs = InMemoryFs::new();
    let output = InMemoryOutput::new();

    add(
        &fs,
        &registry,
        &output,
        &InMemoryProcessRunner::new(),
        &InMemoryPrompt::new(Decision::Keep),
        false,
        &AddOptions {
            components: vec!["confirm-dialog".into()],
            surface: Some(Surface::Elements),
            ..Default::default()
        },
    )
    .unwrap();

    let captured = String::from_utf8(output.captured()).unwrap();
    assert!(
        captured.contains(&format!(
            "  <script type=\"module\" src=\"https://cdn.jsdelivr.net/npm/@primitiv-ui/web@{}/dist/cdn/modal.js\"></script>\n",
            env!("CARGO_PKG_VERSION")
        )),
        "{captured}"
    );
    assert!(!captured.contains("confirm-dialog.js"), "{captured}");
}

#[test]
fn prints_no_script_when_no_component_needs_a_package() {
    // Kbd has no behaviour (§8.3): there is no element to load.
    let fs = InMemoryFs::new();
    let output = InMemoryOutput::new();

    add_elements(
        &fs,
        &output,
        &InMemoryProcessRunner::new(),
        AddOptions {
            components: vec!["kbd".into()],
            ..Default::default()
        },
    )
    .unwrap();

    assert!(
        !String::from_utf8(output.captured())
            .unwrap()
            .contains("No package.json")
    );
}

#[test]
fn keeps_json_output_to_the_plan_without_a_package_json() {
    let fs = InMemoryFs::new();
    let output = InMemoryOutput::new();

    add_elements(
        &fs,
        &output,
        &InMemoryProcessRunner::new(),
        AddOptions {
            components: vec!["tabs".into()],
            json: true,
            ..Default::default()
        },
    )
    .unwrap();

    let captured = String::from_utf8(output.captured()).unwrap();
    serde_json::from_str::<serde_json::Value>(&captured)
        .unwrap_or_else(|error| panic!("{error}: {captured}"));
}

/// The registry with the bytes `kbd`'s files carry, React surface included.
fn kbd_registry() -> InMemoryRegistry {
    InMemoryRegistry::new(REGISTRY)
        .with_file("kbd", "styles.css", b".primitiv-kbd{}")
        .with_file(
            "kbd",
            "kbd.html",
            b"<kbd class=\"primitiv-kbd\">Kbd</kbd>\n",
        )
        .with_file("kbd", "contract.json", b"{}")
        .with_file("kbd", "kbd.recipe.ts", b"recipe")
        .with_file("kbd", "kbd.tsx", b"wrapper")
}

#[test]
fn copies_the_stylesheet_and_contract_into_one_folder_per_component() {
    let fs = InMemoryFs::new();
    fs.write(std::path::Path::new("primitiv.json"), ELEMENTS_CONFIG)
        .unwrap();

    add(
        &fs,
        &kbd_registry(),
        &InMemoryOutput::new(),
        &InMemoryProcessRunner::new(),
        &InMemoryPrompt::new(Decision::Keep),
        false,
        &AddOptions {
            components: vec!["kbd".into()],
            ..Default::default()
        },
    )
    .unwrap();

    let read = |path: &str| fs.read(std::path::Path::new(path)).ok();
    assert_eq!(
        read("primitiv/kbd/styles.css"),
        Some(b".primitiv-kbd{}".to_vec())
    );
    // The example markup is printed, not copied: nothing would import it.
    assert_eq!(read("primitiv/kbd/kbd.html"), None);
    assert_eq!(read("primitiv/kbd/contract.json"), Some(b"{}".to_vec()));
    // The React surface stays behind.
    assert_eq!(read("src/components/kbd.tsx"), None);
    assert_eq!(read("src/components/kbd.recipe.ts"), None);
    assert_eq!(read("src/components/kbd.contract.json"), None);
}

/// `kbd_registry` plus `tabs`'s files, for runs that install both.
fn kbd_and_tabs_registry() -> InMemoryRegistry {
    kbd_registry()
        .with_file("tabs", "styles.css", b".primitiv-tabs{}")
        .with_file(
            "tabs",
            "tabs.html",
            b"<primitiv-tabs>\n  <primitiv-tabs-list></primitiv-tabs-list>\n</primitiv-tabs>\n",
        )
}

/// Run a real (non-dry) elements `add` of `components` in `fs`.
fn run(fs: &InMemoryFs, output: &InMemoryOutput, components: &[&str]) {
    add(
        fs,
        &kbd_and_tabs_registry(),
        output,
        &InMemoryProcessRunner::new(),
        &InMemoryPrompt::new(Decision::Keep),
        false,
        &AddOptions {
            components: components.iter().map(|c| c.to_string()).collect(),
            ..Default::default()
        },
    )
    .unwrap();
}

#[test]
fn keeps_one_stylesheet_index_importing_every_installed_component() {
    // A page then needs one <link> for every component, however many runs added them.
    let fs = InMemoryFs::new();
    fs.write(std::path::Path::new("primitiv.json"), ELEMENTS_CONFIG)
        .unwrap();

    run(&fs, &InMemoryOutput::new(), &["tabs"]);
    run(&fs, &InMemoryOutput::new(), &["kbd"]);

    assert_eq!(
        String::from_utf8(fs.read(std::path::Path::new("primitiv/index.css")).unwrap()).unwrap(),
        "@import \"./kbd/styles.css\";\n@import \"./tabs/styles.css\";\n"
    );
}

#[test]
fn ends_by_printing_the_links_a_page_needs() {
    let fs = InMemoryFs::new();
    fs.write(std::path::Path::new("primitiv.json"), ELEMENTS_CONFIG)
        .unwrap();
    fs.write(std::path::Path::new("primitiv/tokens.css"), b":root{}")
        .unwrap();
    let output = InMemoryOutput::new();

    run(&fs, &output, &["kbd"]);

    assert!(
        String::from_utf8(output.captured()).unwrap().contains(
            "\nLink the styles from your page:\n\n  \
             <link rel=\"stylesheet\" href=\"primitiv/tokens.css\">\n  \
             <link rel=\"stylesheet\" href=\"primitiv/index.css\">\n"
        ),
        "{}",
        String::from_utf8(output.captured()).unwrap()
    );
}

/// A Spring Boot project's config: the styles live under its static folder,
/// which the server serves at the site root.
const SPRING_CONFIG: &[u8] = br##"{
  "version": 1,
  "surface": "elements",
  "styles": { "enabled": true, "format": "css", "path": "src/main/resources/static/primitiv", "url": "/primitiv" },
  "tokens": { "format": "css", "path": "src/main/resources/static/primitiv/tokens.css" },
  "theme": {},
  "aliases": {},
  "registry": { "version": "0.1.0" }
}"##;

#[test]
fn prints_the_links_at_the_url_the_styles_folder_is_served_at() {
    // The page asks the server for /primitiv/..., not for a path on disk.
    let fs = InMemoryFs::new();
    fs.write(std::path::Path::new("primitiv.json"), SPRING_CONFIG)
        .unwrap();
    fs.write(
        std::path::Path::new("src/main/resources/static/primitiv/tokens.css"),
        b":root{}",
    )
    .unwrap();
    let output = InMemoryOutput::new();

    run(&fs, &output, &["kbd"]);

    assert!(
        String::from_utf8(output.captured()).unwrap().contains(
            "\nLink the styles from your page:\n\n  \
             <link rel=\"stylesheet\" href=\"/primitiv/tokens.css\">\n  \
             <link rel=\"stylesheet\" href=\"/primitiv/index.css\">\n"
        ),
        "{}",
        String::from_utf8(output.captured()).unwrap()
    );
}

#[test]
fn keeps_the_file_paths_when_the_run_writes_somewhere_else() {
    // --path moves this run's files; the recorded URL belongs to the other folder.
    let fs = InMemoryFs::new();
    fs.write(std::path::Path::new("primitiv.json"), SPRING_CONFIG)
        .unwrap();
    let output = InMemoryOutput::new();

    add(
        &fs,
        &kbd_and_tabs_registry(),
        &output,
        &InMemoryProcessRunner::new(),
        &InMemoryPrompt::new(Decision::Keep),
        false,
        &AddOptions {
            components: vec!["kbd".into()],
            path: Some("elsewhere".into()),
            ..Default::default()
        },
    )
    .unwrap();

    assert!(
        String::from_utf8(output.captured())
            .unwrap()
            .contains("<link rel=\"stylesheet\" href=\"elsewhere/index.css\">"),
        "{}",
        String::from_utf8(output.captured()).unwrap()
    );
}

#[test]
fn prints_no_links_under_json() {
    let fs = InMemoryFs::new();
    fs.write(std::path::Path::new("primitiv.json"), ELEMENTS_CONFIG)
        .unwrap();
    fs.write(std::path::Path::new("primitiv/tokens.css"), b":root{}")
        .unwrap();
    let output = InMemoryOutput::new();

    add(
        &fs,
        &kbd_and_tabs_registry(),
        &output,
        &InMemoryProcessRunner::new(),
        &InMemoryPrompt::new(Decision::Keep),
        false,
        &AddOptions {
            components: vec!["kbd".into()],
            json: true,
            ..Default::default()
        },
    )
    .unwrap();

    let captured = String::from_utf8(output.captured()).unwrap();
    serde_json::from_str::<serde_json::Value>(&captured)
        .unwrap_or_else(|error| panic!("{error}: {captured}"));
}

#[test]
fn indexes_scss_as_scss_and_leaves_linking_to_the_build() {
    let fs = InMemoryFs::new();
    fs.write(
        std::path::Path::new("primitiv.json"),
        &String::from_utf8(ELEMENTS_CONFIG.to_vec())
            .unwrap()
            .replace(
                "\"format\": \"css\", \"path\": \"primitiv\"",
                "\"format\": \"scss\", \"path\": \"primitiv\"",
            )
            .into_bytes(),
    )
    .unwrap();
    fs.write(std::path::Path::new("primitiv/tokens.css"), b":root{}")
        .unwrap();
    let output = InMemoryOutput::new();
    let registry_json = String::from_utf8(REGISTRY.to_vec()).unwrap().replace(
        "\"formats\": { \"css\": [\"styles.css\"] },\n        \"react\"",
        "\"formats\": { \"css\": [\"styles.css\"], \"scss\": [\"styles.scss\"] },\n        \"react\"",
    );
    assert_ne!(registry_json.as_bytes(), REGISTRY, "fixture rewrite missed");
    let registry = InMemoryRegistry::new(registry_json.as_bytes())
        .with_file("kbd", "styles.scss", b".primitiv-kbd{}")
        .with_file("kbd", "kbd.html", b"<kbd></kbd>\n")
        .with_file("kbd", "contract.json", b"{}");

    add(
        &fs,
        &registry,
        &output,
        &InMemoryProcessRunner::new(),
        &InMemoryPrompt::new(Decision::Keep),
        false,
        &AddOptions {
            components: vec!["kbd".into()],
            ..Default::default()
        },
    )
    .unwrap();

    assert_eq!(
        fs.read(std::path::Path::new("primitiv/index.scss"))
            .unwrap(),
        b"@import \"./kbd/styles.scss\";\n".to_vec()
    );
    assert!(
        !String::from_utf8(output.captured())
            .unwrap()
            .contains("<link")
    );
}

#[test]
fn surfaces_a_failed_stylesheet_index_write() {
    let fs = InMemoryFs::new();
    fs.write(std::path::Path::new("primitiv.json"), ELEMENTS_CONFIG)
        .unwrap();
    fs.fail_writes_to(std::path::Path::new("primitiv/index.css"));

    let error = add(
        &fs,
        &kbd_and_tabs_registry(),
        &InMemoryOutput::new(),
        &InMemoryProcessRunner::new(),
        &InMemoryPrompt::new(Decision::Keep),
        false,
        &AddOptions {
            components: vec!["kbd".into()],
            ..Default::default()
        },
    )
    .unwrap_err();

    assert!(matches!(error, CliError::Io(_)), "{error:?}");
}

#[test]
fn surfaces_a_failed_cdn_script_message() {
    let fs = InMemoryFs::new();
    let output = InMemoryOutput::new();
    // The plan is the first write; the script message is the second.
    output.fail_stdout_after(1);

    let error = add_elements(
        &fs,
        &output,
        &InMemoryProcessRunner::new(),
        AddOptions {
            components: vec!["tabs".into()],
            ..Default::default()
        },
    )
    .unwrap_err();

    assert!(matches!(error, CliError::Io(_)), "{error:?}");
}

#[test]
fn surfaces_a_failed_link_message() {
    let fs = InMemoryFs::new();
    fs.write(std::path::Path::new("primitiv.json"), ELEMENTS_CONFIG)
        .unwrap();
    fs.write(std::path::Path::new("primitiv/tokens.css"), b":root{}")
        .unwrap();
    let output = InMemoryOutput::new();
    // The plan, then the files written; the links are the third write.
    output.fail_stdout_after(2);

    let error = add(
        &fs,
        &kbd_and_tabs_registry(),
        &output,
        &InMemoryProcessRunner::new(),
        &InMemoryPrompt::new(Decision::Keep),
        false,
        &AddOptions {
            components: vec!["kbd".into()],
            ..Default::default()
        },
    )
    .unwrap_err();

    assert!(matches!(error, CliError::Io(_)), "{error:?}");
}

#[test]
fn ends_by_printing_each_components_example_markup() {
    let fs = InMemoryFs::new();
    fs.write(std::path::Path::new("primitiv.json"), ELEMENTS_CONFIG)
        .unwrap();
    fs.write(std::path::Path::new("primitiv/tokens.css"), b":root{}")
        .unwrap();
    let output = InMemoryOutput::new();

    run(&fs, &output, &["kbd", "tabs"]);

    assert!(
        String::from_utf8(output.captured()).unwrap().ends_with(
            // Indented like the other printed blocks, every line of it.
            "\nExample markup for kbd:\n\n  <kbd class=\"primitiv-kbd\">Kbd</kbd>\n\
             \nExample markup for tabs:\n\n  <primitiv-tabs>\n    <primitiv-tabs-list></primitiv-tabs-list>\n  </primitiv-tabs>\n"
        ),
        "{}",
        String::from_utf8(output.captured()).unwrap()
    );
}

#[test]
fn surfaces_an_example_the_registry_cannot_serve() {
    let fs = InMemoryFs::new();
    fs.write(std::path::Path::new("primitiv.json"), ELEMENTS_CONFIG)
        .unwrap();
    // Every file but the example.
    let registry = InMemoryRegistry::new(REGISTRY)
        .with_file("kbd", "styles.css", b".primitiv-kbd{}")
        .with_file("kbd", "contract.json", b"{}");

    let error = add(
        &fs,
        &registry,
        &InMemoryOutput::new(),
        &InMemoryProcessRunner::new(),
        &InMemoryPrompt::new(Decision::Keep),
        false,
        &AddOptions {
            components: vec!["kbd".into()],
            ..Default::default()
        },
    )
    .unwrap_err();

    assert!(matches!(error, CliError::Registry(_)), "{error:?}");
}

/// `tabs` with the styled example the registry ships: classes on every part,
/// and the label span the stylesheet trims.
fn styled_tabs_registry() -> InMemoryRegistry {
    kbd_registry()
        .with_file("tabs", "styles.css", b".primitiv-tabs{}")
        .with_file(
            "tabs",
            "tabs.html",
            b"<primitiv-tabs value=\"one\" class=\"primitiv-tabs primitiv-tabs--md\">\n  \
              <primitiv-tabs-trigger value=\"one\">\n    \
              <button type=\"button\" class=\"primitiv-tabs__trigger\">\n      \
              <span class=\"primitiv-tabs__trigger-label\">One</span>\n    \
              </button>\n  \
              </primitiv-tabs-trigger>\n\
              </primitiv-tabs>\n",
        )
}

/// A headless elements run (no config, no `--styled`) of `components`.
fn headless(fs: &InMemoryFs, output: &InMemoryOutput, components: &[&str]) -> Result<(), CliError> {
    add(
        fs,
        &styled_tabs_registry(),
        output,
        &InMemoryProcessRunner::new(),
        &InMemoryPrompt::new(Decision::Keep),
        false,
        &AddOptions {
            components: components.iter().map(|c| c.to_string()).collect(),
            surface: Some(Surface::Elements),
            ..Default::default()
        },
    )
}

#[test]
fn headless_by_default_copies_no_stylesheet() {
    let fs = InMemoryFs::new();

    headless(&fs, &InMemoryOutput::new(), &["tabs"]).unwrap();

    assert!(
        fs.read(std::path::Path::new("primitiv/tabs/styles.css"))
            .is_err()
    );
    assert!(fs.read(std::path::Path::new("primitiv/index.css")).is_err());
}

#[test]
fn headless_prints_the_markup_without_the_registry_classes() {
    let fs = InMemoryFs::new();
    let output = InMemoryOutput::new();

    headless(&fs, &output, &["tabs"]).unwrap();

    let captured = String::from_utf8(output.captured()).unwrap();
    assert!(
        captured.ends_with(
            "\nExample markup for tabs:\n\n  \
             <primitiv-tabs value=\"one\">\n    \
             <primitiv-tabs-trigger value=\"one\">\n      \
             <button type=\"button\">\n        \
             One\n      \
             </button>\n    \
             </primitiv-tabs-trigger>\n  \
             </primitiv-tabs>\n"
        ),
        "{captured}"
    );
}

#[test]
fn headless_points_at_the_styled_install_before_the_markup() {
    // Headless is the default, so a run that copied no styles says how to get them.
    let fs = InMemoryFs::new();
    let output = InMemoryOutput::new();

    headless(&fs, &output, &["tabs"]).unwrap();

    let captured = String::from_utf8(output.captured()).unwrap();
    let hint = captured
        .find("\nAdd --styled to copy each component's stylesheet and print its classed markup.\n")
        .expect(&captured);
    assert!(hint < captured.find("Example markup for tabs").unwrap(), "{captured}");
}

#[test]
fn a_styled_run_prints_no_styled_hint() {
    let fs = InMemoryFs::new();
    fs.write(std::path::Path::new("primitiv.json"), ELEMENTS_CONFIG)
        .unwrap();
    let output = InMemoryOutput::new();

    run(&fs, &output, &["tabs"]);

    assert!(!String::from_utf8(output.captured()).unwrap().contains("Add --styled"));
}

#[test]
fn headless_skips_a_component_with_no_behaviour_and_says_so() {
    let fs = InMemoryFs::new();
    let output = InMemoryOutput::new();

    headless(&fs, &output, &["kbd"]).unwrap();

    assert_eq!(output.captured(), Vec::<u8>::new());
    assert_eq!(
        String::from_utf8(output.captured_stderr()).unwrap(),
        "kbd has no behaviour, so its headless form is plain HTML. \
         Add --styled for Primitiv's styling.\n"
    );
    assert!(
        fs.read(std::path::Path::new("primitiv/kbd/styles.css"))
            .is_err()
    );
}

#[test]
fn headless_plans_only_the_components_with_behaviour() {
    let fs = InMemoryFs::new();
    let output = InMemoryOutput::new();

    add(
        &fs,
        &styled_tabs_registry(),
        &output,
        &InMemoryProcessRunner::new(),
        &InMemoryPrompt::new(Decision::Keep),
        false,
        &AddOptions {
            components: vec!["kbd".into(), "tabs".into()],
            surface: Some(Surface::Elements),
            dry_run: true,
            ..Default::default()
        },
    )
    .unwrap();

    assert_eq!(
        String::from_utf8(output.captured()).unwrap(),
        "Resolved 1 component to add:\n  tabs  0.1.0\n\nPackages to ensure:\n  @primitiv-ui/web@^0.1.0\n"
    );
}

#[test]
fn surfaces_a_failed_no_behaviour_note() {
    let output = InMemoryOutput::new();
    output.fail_stderr();

    let error = headless(&InMemoryFs::new(), &output, &["kbd"]).unwrap_err();

    assert!(matches!(error, CliError::Io(_)), "{error:?}");
}

#[test]
fn styled_flag_copies_the_stylesheet_over_a_headless_config() {
    let fs = InMemoryFs::new();
    fs.write(
        std::path::Path::new("primitiv.json"),
        &String::from_utf8(ELEMENTS_CONFIG.to_vec())
            .unwrap()
            .replace("\"enabled\": true", "\"enabled\": false")
            .into_bytes(),
    )
    .unwrap();

    add(
        &fs,
        &styled_tabs_registry(),
        &InMemoryOutput::new(),
        &InMemoryProcessRunner::new(),
        &InMemoryPrompt::new(Decision::Keep),
        false,
        &AddOptions {
            components: vec!["kbd".into()],
            surface: Some(Surface::Elements),
            styled: true,
            ..Default::default()
        },
    )
    .unwrap();

    assert_eq!(
        fs.read(std::path::Path::new("primitiv/kbd/styles.css"))
            .ok(),
        Some(b".primitiv-kbd{}".to_vec())
    );
}

#[test]
fn a_config_without_styles_is_headless() {
    // What `init --surface elements` writes unless styling is asked for.
    let fs = InMemoryFs::new();
    fs.write(
        std::path::Path::new("primitiv.json"),
        &String::from_utf8(ELEMENTS_CONFIG.to_vec())
            .unwrap()
            .replace("\"enabled\": true", "\"enabled\": false")
            .into_bytes(),
    )
    .unwrap();

    add(
        &fs,
        &styled_tabs_registry(),
        &InMemoryOutput::new(),
        &InMemoryProcessRunner::new(),
        &InMemoryPrompt::new(Decision::Keep),
        false,
        &AddOptions {
            components: vec!["tabs".into()],
            ..Default::default()
        },
    )
    .unwrap();

    assert!(
        fs.read(std::path::Path::new("primitiv/tabs/styles.css"))
            .is_err()
    );
}

#[test]
fn serves_a_file_in_the_folder_under_its_url_and_any_other_where_it_is() {
    use crate::commands::add::served_at;
    let folder = "src/main/resources/static/primitiv";

    assert_eq!(
        served_at("src/main/resources/static/primitiv/tabs/styles.css", folder, Some("/primitiv/")),
        "/primitiv/tabs/styles.css"
    );
    assert_eq!(
        served_at("assets/tokens.css", folder, Some("/primitiv")),
        "assets/tokens.css"
    );
    assert_eq!(
        served_at("src/main/resources/static/primitiv/index.css", folder, None),
        "src/main/resources/static/primitiv/index.css"
    );
}

#[test]
fn surfaces_a_package_json_it_cannot_read_while_detecting_the_surface() {
    // Missing means "not React"; unreadable is an error, not a guess.
    let fs = InMemoryFs::new();
    fs.write(std::path::Path::new("package.json"), b"{}").unwrap();
    fs.fail_reads_to(std::path::Path::new("package.json"));
    let output = InMemoryOutput::new();

    let error = add(
        &fs,
        &kbd_and_tabs_registry(),
        &output,
        &InMemoryProcessRunner::new(),
        &InMemoryPrompt::new(Decision::Keep),
        false,
        &AddOptions {
            components: vec!["tabs".into()],
            ..Default::default()
        },
    )
    .unwrap_err();

    assert!(matches!(error, CliError::Io(_)), "{error:?}");
    assert_eq!(output.captured(), Vec::<u8>::new());
}

#[test]
fn headless_drops_the_lines_a_styling_wrapper_stood_on() {
    let styled = "<dialog class=\"modal\">\n  <span class=\"modal__header\">\n    <h2 class=\"title\">Title</h2>\n  </span>\n\n  <p>Body</p>\n</dialog>\n";

    let headless = crate::commands::add::without_classes(styled);

    assert_eq!(headless, "<dialog>\n    <h2>Title</h2>\n\n  <p>Body</p>\n</dialog>\n");
}

#[test]
fn headless_keeps_the_closing_tag_of_a_span_that_keeps_an_attribute() {
    let styled = "<span class=\"control\">\n  <input class=\"input\">\n  <span class=\"icon\" aria-hidden=\"true\"><svg></svg></span>\n</span>\n<div class=\"list\"><span class=\"label\">Vue</span></div>\n";

    let headless = crate::commands::add::without_classes(styled);

    assert_eq!(
        headless,
        "  <input>\n  <span aria-hidden=\"true\"><svg></svg></span>\n<div>Vue</div>\n"
    );
}

#[test]
fn records_a_headless_add_in_the_lock_though_it_copies_no_file() {
    // Nothing lands on disk for a headless element, but the project still uses
    // it: the lock is what `list` reads to say so.
    let fs = InMemoryFs::new();
    fs.set_current_dir(std::path::Path::new("site"));
    let output = InMemoryOutput::new();

    add_elements(
        &fs,
        &output,
        &InMemoryProcessRunner::new(),
        AddOptions {
            components: vec!["tabs".into()],
            ..Default::default()
        },
    )
    .unwrap();

    let lock = String::from_utf8(fs.read(std::path::Path::new("site/primitiv.lock")).unwrap()).unwrap();
    assert!(lock.contains("\"components\": [\n    \"tabs\"\n  ]"), "{lock}");
}

#[test]
fn names_the_component_that_brought_in_a_dependency_with_no_behaviour() {
    // Confirm Dialog's markup holds Buttons: asking for it brings Button in, and
    // the note about Button must say why it is there at all.
    let registry = InMemoryRegistry::new(
        br##"{
  "version": "0.1.0",
  "components": {
    "kbd": { "version": "0.1.0", "elements": { "example": "kbd.html" } },
    "shortcut": { "version": "0.1.0", "dependsOn": { "components": ["kbd"] }, "elements": { "packages": [{ "name": "@primitiv-ui/web", "version": "^0.1.0" }], "example": "shortcut.html" } }
  }
}"##,
    )
    .with_file("kbd", "kbd.html", b"<kbd>K</kbd>\n")
    .with_file("shortcut", "shortcut.html", b"<primitiv-shortcut></primitiv-shortcut>\n");
    let fs = InMemoryFs::new();
    let output = InMemoryOutput::new();

    add(
        &fs,
        &registry,
        &output,
        &InMemoryProcessRunner::new(),
        &InMemoryPrompt::new(Decision::Keep),
        false,
        &AddOptions {
            components: vec!["shortcut".into()],
            surface: Some(Surface::Elements),
            ..Default::default()
        },
    )
    .unwrap();

    assert_eq!(
        String::from_utf8(output.captured_stderr()).unwrap(),
        "kbd, which shortcut uses, has no behaviour, so its headless form is plain HTML. \
         Add --styled for Primitiv's styling.\n"
    );
}

#[test]
fn surfaces_a_lock_a_headless_add_cannot_read_or_write() {
    for fail in [InMemoryFs::fail_reads_to, InMemoryFs::fail_writes_to] {
        let fs = InMemoryFs::new();
        fs.set_current_dir(std::path::Path::new("site"));
        fail(&fs, std::path::Path::new("site/primitiv.lock"));

        let error = add_elements(
            &fs,
            &InMemoryOutput::new(),
            &InMemoryProcessRunner::new(),
            AddOptions {
                components: vec!["tabs".into()],
                ..Default::default()
            },
        )
        .unwrap_err();

        assert!(matches!(error, CliError::Io(_)), "{error:?}");
    }
}
