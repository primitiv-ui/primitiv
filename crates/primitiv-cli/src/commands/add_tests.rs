use std::io::{Read, Write};
use std::net::TcpListener;
use std::path::Path;
use std::thread;

use pretty_assertions::assert_eq;

use crate::commands::add::{add, classify_registry, AddOptions, RegistrySource};
use crate::error::CliError;
use crate::format::Format;
use crate::lock::Lock;
use crate::ports::fs::{FileSystem, InMemoryFs};
use crate::ports::output::InMemoryOutput;
use crate::ports::process::InMemoryProcessRunner;
use crate::ports::prompt::{Decision, InMemoryPrompt};
use crate::ports::registry::InMemoryRegistry;

/// Spin up a loopback HTTP server routing request paths to canned bodies (404 for
/// the rest), returning its `http://127.0.0.1:<port>` base URL — so `add`'s
/// HTTPS-registry path runs against a real socket without the network. Each
/// response sets `Connection: close`, so `ureq` opens a fresh connection per
/// request and the accept loop sees one request at a time.
fn serve_registry(routes: &[(&'static str, &'static str)]) -> String {
    let listener = TcpListener::bind("127.0.0.1:0").unwrap();
    let port = listener.local_addr().unwrap().port();
    let routes: Vec<(String, String)> = routes
        .iter()
        .map(|(path, body)| (path.to_string(), body.to_string()))
        .collect();
    thread::spawn(move || {
        for stream in listener.incoming() {
            let Ok(mut stream) = stream else { break };
            let mut scratch = [0u8; 1024];
            let read = stream.read(&mut scratch).unwrap_or(0);
            let request = String::from_utf8_lossy(&scratch[..read]);
            let path = request
                .lines()
                .next()
                .and_then(|line| line.split_whitespace().nth(1))
                .unwrap_or("");
            let response = match routes.iter().find(|(route, _)| route == path) {
                Some((_, body)) => format!(
                    "HTTP/1.1 200 OK\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}",
                    body.len()
                ),
                None => "HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\nConnection: close\r\n\r\n"
                    .to_string(),
            };
            let _ = stream.write_all(response.as_bytes());
        }
    });
    format!("http://127.0.0.1:{port}")
}

/// A registry of two independent components, neither depending on the other.
const FLAT: &[u8] = br##"{
  "version": "0.1.0",
  "components": {
    "button": { "version": "0.1.0" },
    "switch": { "version": "0.2.0" }
  }
}"##;

/// A registry where `field` pulls in two siblings, so resolving it exercises
/// transitive expansion (RFC 0005 §4.4).
const WITH_DEPS: &[u8] = br##"{
  "version": "0.1.0",
  "components": {
    "button": { "version": "0.1.0" },
    "label": { "version": "0.1.0" },
    "field": { "version": "0.3.0", "dependsOn": { "components": ["button", "label"] } }
  }
}"##;

/// A registry whose components declare the npm packages they need, including an
/// overlap so resolving both exercises dedup across package lists (RFC 0005 §4.4).
const WITH_PACKAGES: &[u8] = br##"{
  "version": "0.1.0",
  "components": {
    "button": { "version": "0.1.0", "dependsOn": { "packages": ["@primitiv-ui/react"] } },
    "icon": { "version": "0.2.0", "dependsOn": { "packages": ["@primitiv-ui/react", "@primitiv-ui/icons"] } }
  }
}"##;

/// A registry whose `button` declares a CSS stylesheet to copy (RFC 0005 §6.2),
/// so the style-copy path has something to fetch.
const WITH_STYLES: &[u8] = br##"{
  "version": "0.1.0",
  "components": {
    "button": { "version": "0.1.0", "styles": { "formats": { "css": ["styles.css"] } } }
  }
}"##;

/// A registry whose `button` declares **both** a package to install and a
/// stylesheet to copy, so `--styles-only` / `--no-styles` can be shown to skip
/// exactly one of the two effects.
const WITH_PACKAGE_AND_STYLES: &[u8] = br##"{
  "version": "0.1.0",
  "components": {
    "button": { "version": "0.1.0", "dependsOn": { "packages": ["@primitiv-ui/react"] }, "styles": { "formats": { "css": ["styles.css"] } } }
  }
}"##;

/// A registry whose `button` carries the full styled surface — a CSS stylesheet
/// and the format-independent React surface (recipe + wrapper, D55).
const WITH_STYLED_SURFACE: &[u8] = br##"{
  "version": "0.1.0",
  "components": {
    "button": { "version": "0.1.0", "styles": { "formats": { "css": ["styles.css"] }, "react": ["button.recipe.ts", "button.tsx"] } }
  }
}"##;

/// A registry whose `button` declares stylesheets for two formats, so a
/// `--format` override can be shown to select the non-default one.
const MULTI_FORMAT: &[u8] = br##"{
  "version": "0.1.0",
  "components": {
    "button": { "version": "0.1.0", "styles": { "formats": { "css": ["styles.css"], "scss": ["styles.scss"] } } }
  }
}"##;

/// A `tsconfig.json` mapping the `@/*` alias to `./src/*`, so the React surface
/// resolves to `src/components`.
const TSCONFIG: &[u8] = br#"{ "compilerOptions": { "paths": { "@/*": ["./src/*"] } } }"#;

/// A project config opting into CSS styles under `src/styles/primitiv` — what
/// `init` writes (RFC 0005 §3.1).
const CONFIG: &[u8] = br##"{
  "version": 1,
  "framework": "react",
  "styles": { "enabled": true, "format": "css", "path": "src/styles/primitiv" },
  "tokens": { "format": "css", "path": "src/styles/primitiv/tokens.css" },
  "theme": { "brand": "#0a7755" },
  "aliases": {},
  "registry": { "version": "0.1.0" }
}"##;

/// The same config with the styled surface opted out (`styles.enabled = false`).
const CONFIG_NO_STYLES: &[u8] = br##"{
  "version": 1,
  "framework": "react",
  "styles": { "enabled": false, "format": "css", "path": "src/styles/primitiv" },
  "tokens": { "format": "css", "path": "src/styles/primitiv/tokens.css" },
  "theme": { "brand": "#0a7755" },
  "aliases": {},
  "registry": { "version": "0.1.0" }
}"##;

/// A registry whose `button` declares a CSS stylesheet and a React surface
/// (recipe + wrapper), used to drive the dry-run refresh report.
const WITH_REACT_SURFACE: &[u8] = br##"{
  "version": "0.1.0",
  "components": {
    "button": { "version": "0.1.0", "styles": { "formats": { "css": ["styles.css"] }, "react": ["button.recipe.ts", "button.tsx"] } }
  }
}"##;

/// A project config opting into Tailwind styles under `src/styles/primitiv`.
const CONFIG_TAILWIND: &[u8] = br##"{
  "version": 1,
  "framework": "react",
  "styles": { "enabled": true, "format": "tailwind", "path": "src/styles/primitiv" },
  "tokens": { "format": "css", "path": "src/styles/primitiv/tokens.css" },
  "theme": { "brand": "#0a7755" },
  "aliases": {},
  "registry": { "version": "0.1.0" }
}"##;

/// A registry whose `button` declares a Tailwind stylesheet.
const WITH_TAILWIND_STYLES: &[u8] = br##"{
  "version": "0.1.0",
  "components": {
    "button": { "version": "0.1.0", "styles": { "formats": { "tailwind": ["styles.css"] } } }
  }
}"##;

/// A registry whose `button` declares a CSS stylesheet, the React surface, and
/// a `contract` file — the full styled bundle including the consumer API spec.
const WITH_CONTRACT: &[u8] = br##"{
  "version": "0.1.0",
  "components": {
    "button": {
      "version": "0.1.0",
      "contract": "contract.json",
      "styles": { "formats": { "css": ["styles.css"] }, "react": ["button.recipe.ts", "button.tsx"] }
    }
  }
}"##;

/// Turn string literals into the owned component list the command takes.
fn names(parts: &[&str]) -> Vec<String> {
    parts.iter().map(|part| part.to_string()).collect()
}

// The reporting/resolution tests run with `dry_run = true` so they exercise only
// the plan, never the install side effect; the install behaviour has its own
// tests below, driven through the recording process-runner fake.

#[test]
fn reports_a_single_resolved_component() {
    let fs = InMemoryFs::new();
    let registry = InMemoryRegistry::new(FLAT);
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            json: false,
            dry_run: true,
            ..Default::default()
        },
    )
    .unwrap();

    assert_eq!(
        String::from_utf8(output.captured()).unwrap(),
        "Resolved 1 component to add:\n  button  0.1.0\n",
    );
}

#[test]
fn lists_the_npm_packages_to_ensure_sorted_and_deduplicated() {
    let fs = InMemoryFs::new();
    let registry = InMemoryRegistry::new(WITH_PACKAGES);
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button", "icon"]),
            json: false,
            dry_run: true,
            ..Default::default()
        },
    )
    .unwrap();

    // The packages section lists the union of both components' deps — sorted and
    // with the shared `@primitiv-ui/react` appearing once.
    assert_eq!(
        String::from_utf8(output.captured()).unwrap(),
        "Resolved 2 components to add:\n  button  0.1.0\n  icon    0.2.0\n\n\
         Packages to ensure:\n  @primitiv-ui/icons\n  @primitiv-ui/react\n",
    );
}

#[test]
fn renders_the_plan_as_json_with_components_and_packages() {
    let fs = InMemoryFs::new();
    let registry = InMemoryRegistry::new(WITH_PACKAGES);
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button", "icon"]),
            json: true,
            dry_run: true,
            ..Default::default()
        },
    )
    .unwrap();

    assert_eq!(
        String::from_utf8(output.captured()).unwrap(),
        r#"{
  "components": [
    { "name": "button", "version": "0.1.0" },
    { "name": "icon", "version": "0.2.0" }
  ],
  "packages": [
    "@primitiv-ui/icons",
    "@primitiv-ui/react"
  ],
  "files": []
}
"#,
    );
}

#[test]
fn renders_json_with_an_empty_packages_array_when_there_are_none() {
    let fs = InMemoryFs::new();
    let registry = InMemoryRegistry::new(FLAT);
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            json: true,
            dry_run: true,
            ..Default::default()
        },
    )
    .unwrap();

    assert_eq!(
        String::from_utf8(output.captured()).unwrap(),
        r#"{
  "components": [
    { "name": "button", "version": "0.1.0" }
  ],
  "packages": [],
  "files": []
}
"#,
    );
}

#[test]
fn renders_json_dry_run_with_a_files_array_when_styles_are_configured() {
    use crate::lock::Lock;

    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG).unwrap();
    // stylesheet on disk, content matches lock → refresh; recipe absent → new.
    let stylesheet = Path::new("src/styles/primitiv/button/styles.css");
    let stylesheet_bytes = b".primitiv-button{}";
    fs.write(stylesheet, stylesheet_bytes).unwrap();
    let mut lock = Lock::default();
    lock.record("src/styles/primitiv/button/styles.css", stylesheet_bytes);
    lock.write(&fs, Path::new("primitiv.lock")).unwrap();
    let registry = InMemoryRegistry::new(WITH_REACT_SURFACE);
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            json: true,
            dry_run: true,
            ..Default::default()
        },
    )
    .unwrap();

    let out = String::from_utf8(output.captured()).unwrap();
    assert!(out.contains("\"files\""), "should include files array");
    assert!(
        out.contains("\"refresh\""),
        "matched file should be 'refresh'"
    );
    assert!(out.contains("\"new\""), "absent file should be 'new'");
    // Verify the exact JSON structure for the files section.
    assert!(
        out.contains("\"path\": \"src/styles/primitiv/button/styles.css\""),
        "stylesheet path should appear"
    );
}

#[test]
fn renders_json_without_a_files_key_on_a_non_dry_run() {
    // A non-dry-run `--json` call omits the "files" key entirely
    // (it only appears under --dry-run).
    let fs = InMemoryFs::new();
    let registry = InMemoryRegistry::new(FLAT);
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            json: true,
            dry_run: false,
            ..Default::default()
        },
    )
    .unwrap();

    let out = String::from_utf8(output.captured()).unwrap();
    assert!(
        !out.contains("\"files\""),
        "non-dry-run JSON should not have files key"
    );
    assert_eq!(
        out,
        r#"{
  "components": [
    { "name": "button", "version": "0.1.0" }
  ],
  "packages": []
}
"#,
    );
}

#[test]
fn reports_several_resolved_components_sorted_and_aligned() {
    let fs = InMemoryFs::new();
    let registry = InMemoryRegistry::new(FLAT);
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    // Requested out of order; the plan is sorted and the version column aligned.
    add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["switch", "button"]),
            json: false,
            dry_run: true,
            ..Default::default()
        },
    )
    .unwrap();

    assert_eq!(
        String::from_utf8(output.captured()).unwrap(),
        "Resolved 2 components to add:\n  button  0.1.0\n  switch  0.2.0\n",
    );
}

#[test]
fn pulls_in_transitive_component_dependencies() {
    let fs = InMemoryFs::new();
    let registry = InMemoryRegistry::new(WITH_DEPS);
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["field"]),
            json: false,
            dry_run: true,
            ..Default::default()
        },
    )
    .unwrap();

    assert_eq!(
        String::from_utf8(output.captured()).unwrap(),
        "Resolved 3 components to add:\n  button  0.1.0\n  field   0.3.0\n  label   0.1.0\n",
    );
}

#[test]
fn deduplicates_a_component_requested_and_pulled_in_as_a_dependency() {
    let fs = InMemoryFs::new();
    let registry = InMemoryRegistry::new(WITH_DEPS);
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    // `button` is both requested and a dependency of `field`: it appears once.
    add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["field", "button"]),
            json: false,
            dry_run: true,
            ..Default::default()
        },
    )
    .unwrap();

    assert_eq!(
        String::from_utf8(output.captured()).unwrap(),
        "Resolved 3 components to add:\n  button  0.1.0\n  field   0.3.0\n  label   0.1.0\n",
    );
}

#[test]
fn errors_when_a_requested_component_is_unknown() {
    let fs = InMemoryFs::new();
    let registry = InMemoryRegistry::new(FLAT);
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    let err = add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["nope"]),
            json: false,
            dry_run: true,
            ..Default::default()
        },
    )
    .unwrap_err();

    assert!(matches!(err, CliError::NotFound(_)));
}

#[test]
fn errors_when_a_dependency_is_missing_from_the_registry() {
    // `field` lists `label`, but the registry omits it: the transitive walk fails.
    const DANGLING: &[u8] = br##"{
  "version": "0.1.0",
  "components": {
    "field": { "version": "0.1.0", "dependsOn": { "components": ["label"] } }
  }
}"##;
    let fs = InMemoryFs::new();
    let registry = InMemoryRegistry::new(DANGLING);
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    let err = add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["field"]),
            json: false,
            dry_run: true,
            ..Default::default()
        },
    )
    .unwrap_err();

    assert!(matches!(err, CliError::NotFound(_)));
}

#[test]
fn errors_when_the_registry_is_unavailable() {
    let fs = InMemoryFs::new();
    let registry = InMemoryRegistry::failing();
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    let err = add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            json: false,
            dry_run: true,
            ..Default::default()
        },
    )
    .unwrap_err();

    assert!(matches!(err, CliError::Registry(_)));
}

#[test]
fn errors_on_a_malformed_registry_index() {
    let fs = InMemoryFs::new();
    let registry = InMemoryRegistry::new(b"{ not json }");
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    let err = add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            json: false,
            dry_run: true,
            ..Default::default()
        },
    )
    .unwrap_err();

    assert!(matches!(err, CliError::Registry(_)));
}

#[test]
fn surfaces_a_stdout_failure() {
    let fs = InMemoryFs::new();
    let registry = InMemoryRegistry::new(FLAT);
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);
    output.fail_stdout();

    let err = add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            json: false,
            dry_run: true,
            ..Default::default()
        },
    )
    .unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}

#[test]
fn installs_the_packages_with_the_detected_manager() {
    let fs = InMemoryFs::new();
    fs.set_current_dir(Path::new("project"));
    fs.write(Path::new("project/pnpm-lock.yaml"), b"").unwrap();
    let registry = InMemoryRegistry::new(WITH_PACKAGES);
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button", "icon"]),
            json: false,
            dry_run: false,
            ..Default::default()
        },
    )
    .unwrap();

    // One `pnpm add` invocation in the project directory installs the deduped,
    // sorted package set.
    assert_eq!(
        runner.calls(),
        vec![(
            "pnpm".to_string(),
            vec![
                "add".to_string(),
                "@primitiv-ui/icons".to_string(),
                "@primitiv-ui/react".to_string(),
            ],
            Path::new("project").to_path_buf(),
        )]
    );
}

#[test]
fn styles_only_copies_styles_without_installing_the_package() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG).unwrap();
    let registry = InMemoryRegistry::new(WITH_PACKAGE_AND_STYLES).with_file(
        "button",
        "styles.css",
        b".primitiv-button{}",
    );
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            styles_only: true,
            ..Default::default()
        },
    )
    .unwrap();

    // The package install is skipped despite `button` declaring one...
    assert!(runner.calls().is_empty());
    // ...but the stylesheet is still copied.
    assert_eq!(
        fs.read(Path::new("src/styles/primitiv/button/styles.css"))
            .unwrap(),
        b".primitiv-button{}"
    );
}

#[test]
fn no_styles_installs_the_package_without_copying_styles() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG).unwrap();
    let registry = InMemoryRegistry::new(WITH_PACKAGE_AND_STYLES).with_file(
        "button",
        "styles.css",
        b".primitiv-button{}",
    );
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            no_styles: true,
            ..Default::default()
        },
    )
    .unwrap();

    // The package is installed...
    assert_eq!(runner.calls().len(), 1);
    // ...but no stylesheet is copied.
    assert!(!fs.exists(Path::new("src/styles/primitiv/button/styles.css")));
}

#[test]
fn does_not_install_under_dry_run() {
    let fs = InMemoryFs::new();
    let registry = InMemoryRegistry::new(WITH_PACKAGES);
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            json: false,
            dry_run: true,
            ..Default::default()
        },
    )
    .unwrap();

    assert!(runner.calls().is_empty());
}

#[test]
fn does_not_install_when_no_component_needs_a_package() {
    let fs = InMemoryFs::new();
    let registry = InMemoryRegistry::new(FLAT);
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    // FLAT's components declare no packages, so even a non-dry run runs nothing.
    add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            json: false,
            dry_run: false,
            ..Default::default()
        },
    )
    .unwrap();

    assert!(runner.calls().is_empty());
}

#[test]
fn errors_when_the_package_manager_fails() {
    let fs = InMemoryFs::new();
    let registry = InMemoryRegistry::new(WITH_PACKAGES);
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);
    runner.fail();

    let err = add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            json: false,
            dry_run: false,
            ..Default::default()
        },
    )
    .unwrap_err();

    assert!(matches!(err, CliError::Install(_)));
}

#[test]
fn copies_the_configured_format_stylesheet_into_the_styles_path() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG).unwrap();
    let registry =
        InMemoryRegistry::new(WITH_STYLES).with_file("button", "styles.css", b".primitiv-button{}");
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            json: false,
            dry_run: false,
            ..Default::default()
        },
    )
    .unwrap();

    // The CSS lands under <styles.path>/<component>/ verbatim.
    assert_eq!(
        fs.read(Path::new("src/styles/primitiv/button/styles.css"))
            .unwrap(),
        b".primitiv-button{}"
    );
}

#[test]
fn does_not_copy_styles_when_the_project_opts_out() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG_NO_STYLES)
        .unwrap();
    let registry =
        InMemoryRegistry::new(WITH_STYLES).with_file("button", "styles.css", b".primitiv-button{}");
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            json: false,
            dry_run: false,
            ..Default::default()
        },
    )
    .unwrap();

    assert!(!fs.exists(Path::new("src/styles/primitiv/button/styles.css")));
}

#[test]
fn does_not_copy_styles_when_there_is_no_project_config() {
    let fs = InMemoryFs::new();
    // No primitiv.json: a headless-only install copies nothing.
    let registry =
        InMemoryRegistry::new(WITH_STYLES).with_file("button", "styles.css", b".primitiv-button{}");
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            json: false,
            dry_run: false,
            ..Default::default()
        },
    )
    .unwrap();

    assert!(!fs.exists(Path::new("src/styles/primitiv/button/styles.css")));
}

#[test]
fn errors_when_the_registry_cannot_serve_a_style_file() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG).unwrap();
    // The index declares styles.css but the registry serves no file bytes.
    let registry = InMemoryRegistry::new(WITH_STYLES);
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    let err = add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            json: false,
            dry_run: false,
            ..Default::default()
        },
    )
    .unwrap_err();

    assert!(matches!(err, CliError::Registry(_)));
}

#[test]
fn surfaces_a_directory_creation_failure_during_style_copy() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG).unwrap();
    fs.fail_create_dir_to(Path::new("src/styles/primitiv/button"));
    let registry =
        InMemoryRegistry::new(WITH_STYLES).with_file("button", "styles.css", b".primitiv-button{}");
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    let err = add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            json: false,
            dry_run: false,
            ..Default::default()
        },
    )
    .unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}

#[test]
fn surfaces_a_write_failure_during_style_copy() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG).unwrap();
    fs.fail_writes_to(Path::new("src/styles/primitiv/button/styles.css"));
    let registry =
        InMemoryRegistry::new(WITH_STYLES).with_file("button", "styles.css", b".primitiv-button{}");
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    let err = add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            json: false,
            dry_run: false,
            ..Default::default()
        },
    )
    .unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}

#[test]
fn errors_on_a_malformed_project_config_during_style_copy() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), b"{ not json }")
        .unwrap();
    let registry =
        InMemoryRegistry::new(WITH_STYLES).with_file("button", "styles.css", b".primitiv-button{}");
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    let err = add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            json: false,
            dry_run: false,
            ..Default::default()
        },
    )
    .unwrap_err();

    assert!(matches!(err, CliError::Config(_)));
}

#[test]
fn copies_the_react_surface_into_the_alias_resolved_components_directory() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG).unwrap();
    fs.write(Path::new("tsconfig.json"), TSCONFIG).unwrap();
    let registry = InMemoryRegistry::new(WITH_STYLED_SURFACE)
        .with_file("button", "styles.css", b".primitiv-button{}")
        .with_file(
            "button",
            "button.recipe.ts",
            b"export const button = cva();",
        )
        .with_file("button", "button.tsx", b"export function Button() {}");
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            ..Default::default()
        },
    )
    .unwrap();

    // The stylesheet still lands in the styles path...
    assert!(fs.exists(Path::new("src/styles/primitiv/button/styles.css")));
    // ...and the recipe + wrapper land flat in the alias-resolved components dir.
    assert_eq!(
        fs.read(Path::new("src/components/button.recipe.ts"))
            .unwrap(),
        b"export const button = cva();"
    );
    assert_eq!(
        fs.read(Path::new("src/components/button.tsx")).unwrap(),
        b"export function Button() {}"
    );
}

#[test]
fn copies_the_contract_into_the_components_directory() {
    // The contract.json (the consumer API spec) lands in the components directory
    // alongside the recipe and wrapper when the registry declares a `contract`.
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG).unwrap();
    fs.write(Path::new("tsconfig.json"), TSCONFIG).unwrap();
    let registry = InMemoryRegistry::new(WITH_CONTRACT)
        .with_file("button", "styles.css", b".primitiv-button{}")
        .with_file("button", "button.recipe.ts", b"export const button = cva();")
        .with_file("button", "button.tsx", b"export function Button() {}")
        .with_file("button", "contract.json", b"{\"name\":\"button\"}");
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            ..Default::default()
        },
    )
    .unwrap();

    // contract.json lands flat in the alias-resolved components directory,
    // co-located with the recipe and wrapper.
    assert_eq!(
        fs.read(Path::new("src/components/contract.json")).unwrap(),
        b"{\"name\":\"button\"}"
    );
}

#[test]
fn falls_back_to_a_root_components_directory_without_a_detectable_alias() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG).unwrap();
    // No tsconfig/jsconfig: the alias cannot be detected, so the React surface
    // falls back to the project-root `components` directory.
    let registry = InMemoryRegistry::new(WITH_STYLED_SURFACE)
        .with_file("button", "styles.css", b".primitiv-button{}")
        .with_file("button", "button.recipe.ts", b"recipe")
        .with_file("button", "button.tsx", b"wrapper");
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            ..Default::default()
        },
    )
    .unwrap();

    assert_eq!(
        fs.read(Path::new("components/button.tsx")).unwrap(),
        b"wrapper"
    );
}

#[test]
fn the_format_flag_overrides_the_config_stylesheet_format() {
    let fs = InMemoryFs::new();
    // The config selects CSS, but `--format scss` overrides it for this copy.
    fs.write(Path::new("primitiv.json"), CONFIG).unwrap();
    let registry =
        InMemoryRegistry::new(MULTI_FORMAT).with_file("button", "styles.scss", b"// scss");
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            format: Some(Format::Scss),
            ..Default::default()
        },
    )
    .unwrap();

    // The SCSS stylesheet is copied, and the CSS one is not.
    assert!(fs.exists(Path::new("src/styles/primitiv/button/styles.scss")));
    assert!(!fs.exists(Path::new("src/styles/primitiv/button/styles.css")));
}

#[test]
fn the_path_flag_overrides_the_config_styles_destination() {
    let fs = InMemoryFs::new();
    // The config writes under src/styles/primitiv, but --path redirects this run.
    fs.write(Path::new("primitiv.json"), CONFIG).unwrap();
    let registry =
        InMemoryRegistry::new(WITH_STYLES).with_file("button", "styles.css", b".primitiv-button{}");
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            path: Some("lib/styles".to_string()),
            ..Default::default()
        },
    )
    .unwrap();

    // The stylesheet lands under the overridden path, not the config's.
    assert!(fs.exists(Path::new("lib/styles/button/styles.css")));
    assert!(!fs.exists(Path::new("src/styles/primitiv/button/styles.css")));
}

#[test]
fn records_copied_files_in_the_lock() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG).unwrap();
    let registry =
        InMemoryRegistry::new(WITH_STYLES).with_file("button", "styles.css", b".primitiv-button{}");
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            ..Default::default()
        },
    )
    .unwrap();

    // primitiv.lock records the copied stylesheet so a re-add can detect edits.
    let lock = Lock::read(&fs, Path::new("primitiv.lock")).unwrap();
    assert!(
        lock.files
            .contains_key("src/styles/primitiv/button/styles.css")
    );
}

#[test]
fn records_installed_components_in_the_lock() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG).unwrap();
    let registry =
        InMemoryRegistry::new(WITH_STYLES).with_file("button", "styles.css", b".primitiv-button{}");
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            ..Default::default()
        },
    )
    .unwrap();

    // The component is recorded so `list` can mark it installed (RFC 0005 §2.5).
    let lock = Lock::read(&fs, Path::new("primitiv.lock")).unwrap();
    assert!(lock.components.contains("button"));
}

#[test]
fn the_registry_override_reads_from_a_repo_local_directory() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG).unwrap();
    // A repo-local registry under vendor/registry: index + the Button stylesheet.
    fs.write(Path::new("vendor/registry/registry.json"), WITH_STYLES).unwrap();
    fs.write(
        Path::new("vendor/registry/r/button/styles.css"),
        b".primitiv-button{ color: local }",
    )
    .unwrap();
    // The passed-in (embedded) registry fails: success proves the local one is used.
    let registry = InMemoryRegistry::failing();
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            registry: Some("vendor/registry".to_string()),
            ..Default::default()
        },
    )
    .unwrap();

    // The stylesheet copied into the project came from the local registry.
    assert_eq!(
        fs.read(Path::new("src/styles/primitiv/button/styles.css"))
            .unwrap(),
        b".primitiv-button{ color: local }"
    );
}

#[test]
fn the_registry_override_fetches_from_an_http_url() {
    // An `http(s)://` --registry value is served over the network through the
    // HttpsRegistry adapter; a loopback server stands in for GitHub raw.
    let base = serve_registry(&[
        (
            "/registry.json",
            r#"{ "version": "0.1.0", "components": { "button": { "version": "0.1.0", "styles": { "formats": { "css": ["styles.css"] } } } } }"#,
        ),
        ("/r/button/styles.css", ".primitiv-button{ color: served }"),
    ]);
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG).unwrap();
    // The passed-in registry fails: success proves the HTTP one is used.
    let registry = InMemoryRegistry::failing();
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            registry: Some(base),
            ..Default::default()
        },
    )
    .unwrap();

    assert_eq!(
        fs.read(Path::new("src/styles/primitiv/button/styles.css"))
            .unwrap(),
        b".primitiv-button{ color: served }"
    );
}

#[test]
fn classify_registry_routes_each_ref_form() {
    // Absent → the embedded registry.
    assert!(matches!(classify_registry(None), RegistrySource::Embedded));
    // An http(s):// value → a direct HTTPS base URL, verbatim.
    assert!(matches!(
        classify_registry(Some("http://127.0.0.1:8080")),
        RegistrySource::Https(url) if url == "http://127.0.0.1:8080"
    ));
    assert!(matches!(
        classify_registry(Some("https://cdn.example/registry")),
        RegistrySource::Https(url) if url == "https://cdn.example/registry"
    ));
    // A version tag → GitHub raw at that tag (with and without a leading `v`).
    assert!(matches!(
        classify_registry(Some("0.1.0")),
        RegistrySource::Https(url)
            if url == "https://raw.githubusercontent.com/primitiv-ui/primitiv/0.1.0/registry"
    ));
    assert!(matches!(
        classify_registry(Some("v1.2.3")),
        RegistrySource::Https(url) if url.ends_with("/v1.2.3/registry")
    ));
    // Anything else is a repo-local path — including a dotted, non-digit value.
    assert!(matches!(
        classify_registry(Some("vendor/registry")),
        RegistrySource::Local(path) if path == "vendor/registry"
    ));
    assert!(matches!(
        classify_registry(Some("./registry")),
        RegistrySource::Local(path) if path == "./registry"
    ));
}

#[test]
fn keeps_a_consumer_edited_file_on_re_add() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG).unwrap();
    let registry =
        InMemoryRegistry::new(WITH_STYLES).with_file("button", "styles.css", b".primitiv-button{}");
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);
    let dest = Path::new("src/styles/primitiv/button/styles.css");

    // First add writes the stylesheet and records its hash...
    add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            ..Default::default()
        },
    )
    .unwrap();
    // ...the consumer edits it...
    fs.write(dest, b".primitiv-button { color: red }").unwrap();
    // ...and a re-add leaves the edit untouched.
    add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            ..Default::default()
        },
    )
    .unwrap();

    assert_eq!(fs.read(dest).unwrap(), b".primitiv-button { color: red }");
}

#[test]
fn force_overwrites_a_consumer_edited_file_on_re_add() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG).unwrap();
    let registry =
        InMemoryRegistry::new(WITH_STYLES).with_file("button", "styles.css", b".primitiv-button{}");
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);
    let dest = Path::new("src/styles/primitiv/button/styles.css");

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            ..Default::default()
        },
    )
    .unwrap();
    fs.write(dest, b".primitiv-button { color: red }").unwrap();
    // --force overwrites the edit with the registry version.
    add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            force: true,
            ..Default::default()
        },
    )
    .unwrap();

    assert_eq!(fs.read(dest).unwrap(), b".primitiv-button{}");
}

#[test]
fn surfaces_a_failure_to_read_the_lock() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG).unwrap();
    fs.fail_reads_to(Path::new("primitiv.lock"));
    let registry =
        InMemoryRegistry::new(WITH_STYLES).with_file("button", "styles.css", b".primitiv-button{}");
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    let err = add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            ..Default::default()
        },
    )
    .unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}

#[test]
fn surfaces_a_failure_to_read_an_existing_target_during_refresh() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG).unwrap();
    // The target already exists, but reading it (to decide refresh vs keep) fails.
    let dest = Path::new("src/styles/primitiv/button/styles.css");
    fs.write(dest, b"pre-existing").unwrap();
    fs.fail_reads_to(dest);
    let registry =
        InMemoryRegistry::new(WITH_STYLES).with_file("button", "styles.css", b".primitiv-button{}");
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    let err = add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            ..Default::default()
        },
    )
    .unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}

#[test]
fn errors_when_the_registry_cannot_serve_a_react_file() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG).unwrap();
    // The stylesheet is served but the React surface is not, so the copy fails
    // in the React loop rather than the stylesheet loop.
    let registry = InMemoryRegistry::new(WITH_STYLED_SURFACE).with_file(
        "button",
        "styles.css",
        b".primitiv-button{}",
    );
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    let err = add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            ..Default::default()
        },
    )
    .unwrap_err();

    assert!(matches!(err, CliError::Registry(_)));
}

#[test]
fn surfaces_a_failure_to_resolve_the_components_directory() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG).unwrap();
    // The tsconfig read fails (not merely absent), so the alias resolution is a
    // hard I/O error rather than the relative-import fallback.
    fs.fail_reads_to(Path::new("tsconfig.json"));
    let registry = InMemoryRegistry::new(WITH_STYLED_SURFACE)
        .with_file("button", "styles.css", b".primitiv-button{}")
        .with_file("button", "button.recipe.ts", b"recipe")
        .with_file("button", "button.tsx", b"wrapper");
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    let err = add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            ..Default::default()
        },
    )
    .unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}

#[test]
fn surfaces_a_failure_to_read_the_working_directory_before_installing() {
    let fs = InMemoryFs::new();
    fs.fail_current_dir();
    let registry = InMemoryRegistry::new(WITH_PACKAGES);
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    let err = add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            json: false,
            dry_run: false,
            ..Default::default()
        },
    )
    .unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}

// ── dry-run refresh report ────────────────────────────────────────────────

#[test]
fn dry_run_appends_the_refresh_plan_with_per_file_status() {
    use crate::lock::Lock;

    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG).unwrap();

    // stylesheet — on disk, content matches lock → refresh
    let stylesheet = Path::new("src/styles/primitiv/button/styles.css");
    let stylesheet_bytes = b".primitiv-button{}";
    fs.write(stylesheet, stylesheet_bytes).unwrap();

    // wrapper — on disk but edited → keep
    let wrapper = Path::new("components/button.tsx");
    fs.write(wrapper, b"consumer edited").unwrap();

    // recipe — not on disk → new
    // (no write for components/button.recipe.ts)

    // Seed the lock: stylesheet recorded (matching), wrapper recorded with original bytes
    let mut lock = Lock::default();
    lock.record("src/styles/primitiv/button/styles.css", stylesheet_bytes);
    lock.record("components/button.tsx", b"original recipe");
    lock.write(&fs, Path::new("primitiv.lock")).unwrap();

    let registry = InMemoryRegistry::new(WITH_REACT_SURFACE);
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            dry_run: true,
            ..Default::default()
        },
    )
    .unwrap();

    let out = String::from_utf8(output.captured()).unwrap();
    // The plan header is still present
    assert!(
        out.contains("Resolved 1 component to add:"),
        "missing plan header"
    );
    // The refresh section appears
    assert!(out.contains("\nRefresh plan:\n"), "missing refresh section");
    // Each file gets the right status label
    assert!(
        out.contains("src/styles/primitiv/button/styles.css") && out.contains("refresh"),
        "stylesheet should be 'refresh'"
    );
    assert!(
        out.contains("components/button.recipe.ts") && out.contains("new"),
        "recipe should be 'new'"
    );
    assert!(
        out.contains("components/button.tsx") && out.contains("keep"),
        "wrapper should be 'keep'"
    );
}

#[test]
fn dry_run_has_no_refresh_plan_when_no_config_is_present() {
    let fs = InMemoryFs::new();
    // No primitiv.json: no styled surface → no refresh plan section
    let registry = InMemoryRegistry::new(WITH_REACT_SURFACE);
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            dry_run: true,
            ..Default::default()
        },
    )
    .unwrap();

    let out = String::from_utf8(output.captured()).unwrap();
    assert!(
        !out.contains("Refresh plan:"),
        "should not emit refresh section without config"
    );
}

#[test]
fn dry_run_has_no_refresh_plan_when_no_styles_flag_is_set() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG).unwrap();
    let registry = InMemoryRegistry::new(WITH_REACT_SURFACE);
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            dry_run: true,
            no_styles: true,
            ..Default::default()
        },
    )
    .unwrap();

    let out = String::from_utf8(output.captured()).unwrap();
    assert!(
        !out.contains("Refresh plan:"),
        "should not emit refresh section with --no-styles"
    );
}

#[test]
fn dry_run_has_no_refresh_plan_when_styles_are_disabled_in_config() {
    let fs = InMemoryFs::new();
    // Config present but styles.enabled = false: planned_files returns empty → no section.
    fs.write(Path::new("primitiv.json"), CONFIG_NO_STYLES)
        .unwrap();
    let registry = InMemoryRegistry::new(WITH_REACT_SURFACE);
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            dry_run: true,
            ..Default::default()
        },
    )
    .unwrap();

    let out = String::from_utf8(output.captured()).unwrap();
    assert!(
        !out.contains("Refresh plan:"),
        "should not emit refresh section when styles disabled"
    );
}

#[test]
fn dry_run_refresh_plan_covers_stylesheet_only_when_there_is_no_react_surface() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG).unwrap();
    // WITH_STYLES has only a CSS stylesheet — no React surface. The plan should
    // list the stylesheet file and omit the React block (exercises the has_react=false path).
    let registry = InMemoryRegistry::new(WITH_STYLES);
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            dry_run: true,
            ..Default::default()
        },
    )
    .unwrap();

    let out = String::from_utf8(output.captured()).unwrap();
    assert!(
        out.contains("\nRefresh plan:\n"),
        "should emit refresh section"
    );
    assert!(
        out.contains("src/styles/primitiv/button/styles.css"),
        "stylesheet should appear in plan"
    );
    assert!(out.contains("new"), "absent file should be 'new'");
}

#[test]
fn dry_run_with_force_labels_an_edited_file_as_overwrite() {
    use crate::lock::Lock;

    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG).unwrap();

    // stylesheet — on disk but consumer-edited; with --force it should show 'overwrite'
    let dest = Path::new("src/styles/primitiv/button/styles.css");
    fs.write(dest, b"consumer edited").unwrap();

    // Seed the lock with the original bytes so the current content looks edited
    let mut lock = Lock::default();
    lock.record(
        "src/styles/primitiv/button/styles.css",
        b".primitiv-button{}",
    );
    lock.write(&fs, Path::new("primitiv.lock")).unwrap();

    let registry = InMemoryRegistry::new(WITH_STYLES);
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            dry_run: true,
            force: true,
            ..Default::default()
        },
    )
    .unwrap();

    let out = String::from_utf8(output.captured()).unwrap();
    assert!(
        out.contains("overwrite"),
        "edited file with --force should be 'overwrite'"
    );
    assert!(
        !out.contains("keep"),
        "edited file with --force should not be 'keep'"
    );
}

// ── dry-run error-path coverage ───────────────────────────────────────────

#[test]
fn dry_run_surfaces_a_current_dir_failure() {
    let fs = InMemoryFs::new();
    fs.fail_current_dir();
    let registry = InMemoryRegistry::new(WITH_REACT_SURFACE);
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    let err = add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            dry_run: true,
            ..Default::default()
        },
    )
    .unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}

#[test]
fn dry_run_surfaces_a_config_read_failure_in_planned_files() {
    let fs = InMemoryFs::new();
    // primitiv.json exists but is unreadable: config::try_resolve errors.
    fs.write(Path::new("primitiv.json"), CONFIG).unwrap();
    fs.fail_reads_to(Path::new("primitiv.json"));
    let registry = InMemoryRegistry::new(WITH_REACT_SURFACE);
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    let err = add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            dry_run: true,
            ..Default::default()
        },
    )
    .unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}

#[test]
fn dry_run_surfaces_a_lock_read_failure() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG).unwrap();
    // Lock exists but is unreadable.
    fs.write(Path::new("primitiv.lock"), b"{}").unwrap();
    fs.fail_reads_to(Path::new("primitiv.lock"));
    let registry = InMemoryRegistry::new(WITH_STYLES);
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    let err = add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            dry_run: true,
            ..Default::default()
        },
    )
    .unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}

#[test]
fn dry_run_surfaces_a_classify_read_failure() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG).unwrap();
    // The stylesheet destination exists (so classify reads it) but is unreadable.
    let dest = Path::new("src/styles/primitiv/button/styles.css");
    fs.write(dest, b"content").unwrap();
    fs.fail_reads_to(dest);
    let registry = InMemoryRegistry::new(WITH_STYLES);
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    let err = add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            dry_run: true,
            ..Default::default()
        },
    )
    .unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}

#[test]
fn dry_run_surfaces_a_stdout_failure_writing_the_refresh_plan() {
    use crate::lock::Lock;

    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG).unwrap();
    // Seed lock with a file that won't exist on disk → status 'new', non-empty list.
    let mut lock = Lock::default();
    lock.record(
        "src/styles/primitiv/button/styles.css",
        b".primitiv-button{}",
    );
    lock.write(&fs, Path::new("primitiv.lock")).unwrap();
    let registry = InMemoryRegistry::new(WITH_STYLES);
    let output = InMemoryOutput::new();
    // Let the first write (the plan) succeed, then fail the second write (the
    // refresh plan section) to drive the stdout-error branch at line 118.
    output.fail_stdout_after(1);
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    let err = add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            dry_run: true,
            ..Default::default()
        },
    )
    .unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}

#[test]
fn dry_run_surfaces_a_components_dir_detection_failure_in_planned_files() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG).unwrap();
    // tsconfig exists but is unreadable: detect::components_path errors.
    fs.write(Path::new("tsconfig.json"), TSCONFIG).unwrap();
    fs.fail_reads_to(Path::new("tsconfig.json"));
    let registry = InMemoryRegistry::new(WITH_REACT_SURFACE);
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    let err = add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            dry_run: true,
            ..Default::default()
        },
    )
    .unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}

#[test]
fn an_interactive_overwrite_replaces_a_consumer_edited_file() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG).unwrap();
    let registry =
        InMemoryRegistry::new(WITH_STYLES).with_file("button", "styles.css", b".primitiv-button{}");
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let dest = Path::new("src/styles/primitiv/button/styles.css");

    // First add records the stylesheet, then the consumer edits it.
    let keep = InMemoryPrompt::new(Decision::Keep);
    add(
        &fs,
        &registry,
        &output,
        &runner,
        &keep,
        false,
        &AddOptions {
            components: names(&["button"]),
            ..Default::default()
        },
    )
    .unwrap();
    fs.write(dest, b".primitiv-button { color: red }").unwrap();

    // An interactive re-add where the consumer chooses overwrite takes the
    // registry version.
    let overwrite = InMemoryPrompt::new(Decision::Overwrite);
    add(
        &fs,
        &registry,
        &output,
        &runner,
        &overwrite,
        true,
        &AddOptions {
            components: names(&["button"]),
            ..Default::default()
        },
    )
    .unwrap();

    assert_eq!(fs.read(dest).unwrap(), b".primitiv-button{}");
    assert_eq!(overwrite.asked(), vec![dest.to_path_buf()]);
}

#[test]
fn an_interactive_keep_preserves_a_consumer_edited_file() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG).unwrap();
    let registry =
        InMemoryRegistry::new(WITH_STYLES).with_file("button", "styles.css", b".primitiv-button{}");
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let dest = Path::new("src/styles/primitiv/button/styles.css");

    let keep = InMemoryPrompt::new(Decision::Keep);
    add(
        &fs,
        &registry,
        &output,
        &runner,
        &keep,
        false,
        &AddOptions {
            components: names(&["button"]),
            ..Default::default()
        },
    )
    .unwrap();
    fs.write(dest, b".primitiv-button { color: red }").unwrap();

    // The consumer is asked and chooses keep, so the edit survives.
    let keep_again = InMemoryPrompt::new(Decision::Keep);
    add(
        &fs,
        &registry,
        &output,
        &runner,
        &keep_again,
        true,
        &AddOptions {
            components: names(&["button"]),
            ..Default::default()
        },
    )
    .unwrap();

    assert_eq!(fs.read(dest).unwrap(), b".primitiv-button { color: red }");
    assert_eq!(keep_again.asked(), vec![dest.to_path_buf()]);
}

#[test]
fn an_interactive_add_surfaces_a_prompt_failure_as_io() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG).unwrap();
    let registry =
        InMemoryRegistry::new(WITH_STYLES).with_file("button", "styles.css", b".primitiv-button{}");
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let dest = Path::new("src/styles/primitiv/button/styles.css");

    let keep = InMemoryPrompt::new(Decision::Keep);
    add(
        &fs,
        &registry,
        &output,
        &runner,
        &keep,
        false,
        &AddOptions {
            components: names(&["button"]),
            ..Default::default()
        },
    )
    .unwrap();
    fs.write(dest, b".primitiv-button { color: red }").unwrap();

    // The prompt itself fails (a broken stdin), surfacing as an I/O error.
    let failing = InMemoryPrompt::new(Decision::Keep);
    failing.fail();
    let err = add(
        &fs,
        &registry,
        &output,
        &runner,
        &failing,
        true,
        &AddOptions {
            components: names(&["button"]),
            ..Default::default()
        },
    )
    .unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}

// --- Tailwind wiring (RFC 0005 §4.3 / RFC 0009 §4.2 / RFC 0008 §2.5) ---

#[test]
fn no_wiring_flag_prints_the_snippet_after_a_tailwind_copy() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG_TAILWIND).unwrap();
    let registry =
        InMemoryRegistry::new(WITH_TAILWIND_STYLES).with_file("button", "styles.css", b".p{}");
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            no_wiring: true,
            ..Default::default()
        },
    )
    .unwrap();

    let out = String::from_utf8(output.captured()).unwrap();
    assert!(
        out.contains("@custom-variant dark"),
        "expected wiring snippet in output, got:\n{out}"
    );
    assert!(
        out.contains("@layer"),
        "expected layer order line in output, got:\n{out}"
    );
}

#[test]
fn non_interactive_tailwind_add_prints_the_snippet() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG_TAILWIND).unwrap();
    let registry =
        InMemoryRegistry::new(WITH_TAILWIND_STYLES).with_file("button", "styles.css", b".p{}");
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            ..Default::default()
        },
    )
    .unwrap();

    let out = String::from_utf8(output.captured()).unwrap();
    assert!(out.contains("@custom-variant dark"));
}

#[test]
fn css_format_add_does_not_print_the_wiring_snippet() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG).unwrap();
    let registry =
        InMemoryRegistry::new(WITH_STYLES).with_file("button", "styles.css", b".p{}");
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            ..Default::default()
        },
    )
    .unwrap();

    let out = String::from_utf8(output.captured()).unwrap();
    assert!(!out.contains("@custom-variant dark"));
}

#[test]
fn no_styles_flag_suppresses_the_wiring_snippet() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG_TAILWIND).unwrap();
    let registry = InMemoryRegistry::new(WITH_TAILWIND_STYLES);
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            no_styles: true,
            ..Default::default()
        },
    )
    .unwrap();

    let out = String::from_utf8(output.captured()).unwrap();
    assert!(!out.contains("@custom-variant dark"));
}

#[test]
fn dry_run_does_not_print_the_wiring_snippet() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG_TAILWIND).unwrap();
    let registry = InMemoryRegistry::new(WITH_TAILWIND_STYLES);
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            dry_run: true,
            ..Default::default()
        },
    )
    .unwrap();

    let out = String::from_utf8(output.captured()).unwrap();
    assert!(!out.contains("@custom-variant dark"));
}

#[test]
fn json_flag_suppresses_the_wiring_snippet() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG_TAILWIND).unwrap();
    let registry =
        InMemoryRegistry::new(WITH_TAILWIND_STYLES).with_file("button", "styles.css", b".p{}");
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            json: true,
            no_wiring: true,
            ..Default::default()
        },
    )
    .unwrap();

    let out = String::from_utf8(output.captured()).unwrap();
    assert!(!out.contains("@custom-variant dark"));
}

// --- interactive detect-and-patch (Tier 1) ---

#[test]
fn interactive_tailwind_add_patches_entry_css_on_confirm() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG_TAILWIND).unwrap();
    fs.write(Path::new("src/index.css"), b"@import \"tailwindcss\";\n").unwrap();
    let registry =
        InMemoryRegistry::new(WITH_TAILWIND_STYLES).with_file("button", "styles.css", b".p{}");
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep); // confirm defaults to yes

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        true, // interactive
        &AddOptions {
            components: names(&["button"]),
            ..Default::default()
        },
    )
    .unwrap();

    let patched = String::from_utf8(fs.read(Path::new("src/index.css")).unwrap()).unwrap();
    assert!(patched.contains("@custom-variant dark"), "entry CSS was not patched:\n{patched}");
    assert!(patched.contains("@import \"tailwindcss\""), "original import must be preserved");
    // Snippet was not also printed to stdout (the patch was applied)
    let out = String::from_utf8(output.captured()).unwrap();
    assert!(!out.contains("@custom-variant dark"), "snippet should not be in stdout when patched");
}

#[test]
fn interactive_tailwind_add_prints_snippet_when_consumer_declines() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG_TAILWIND).unwrap();
    fs.write(Path::new("src/index.css"), b"@import \"tailwindcss\";\n").unwrap();
    let registry =
        InMemoryRegistry::new(WITH_TAILWIND_STYLES).with_file("button", "styles.css", b".p{}");
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);
    prompt.deny_confirm(); // consumer says no

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        true,
        &AddOptions {
            components: names(&["button"]),
            ..Default::default()
        },
    )
    .unwrap();

    // Entry CSS was not patched
    let css = String::from_utf8(fs.read(Path::new("src/index.css")).unwrap()).unwrap();
    assert!(!css.contains("@custom-variant dark"));
    // Snippet was printed instead
    let out = String::from_utf8(output.captured()).unwrap();
    assert!(out.contains("@custom-variant dark"));
}

#[test]
fn interactive_tailwind_add_is_a_noop_when_wiring_already_present() {
    use crate::wiring::SNIPPET;
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG_TAILWIND).unwrap();
    let already_wired = format!("{SNIPPET}\n\n@import \"tailwindcss\";\n");
    fs.write(Path::new("src/index.css"), already_wired.as_bytes()).unwrap();
    let registry =
        InMemoryRegistry::new(WITH_TAILWIND_STYLES).with_file("button", "styles.css", b".p{}");
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        true,
        &AddOptions {
            components: names(&["button"]),
            ..Default::default()
        },
    )
    .unwrap();

    // Prompt was not consulted (already wired → no-op)
    assert!(prompt.confirmed().is_empty());
    // Snippet was not printed to stdout
    let out = String::from_utf8(output.captured()).unwrap();
    assert!(!out.contains("@custom-variant dark"));
}

#[test]
fn interactive_tailwind_add_prints_snippet_when_entry_css_not_found() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG_TAILWIND).unwrap();
    // No src/index.css or any candidate file present
    let registry =
        InMemoryRegistry::new(WITH_TAILWIND_STYLES).with_file("button", "styles.css", b".p{}");
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        true,
        &AddOptions {
            components: names(&["button"]),
            ..Default::default()
        },
    )
    .unwrap();

    // Prompt was not consulted (no entry CSS to patch)
    assert!(prompt.confirmed().is_empty());
    // Snippet was printed as the manual fallback
    let out = String::from_utf8(output.captured()).unwrap();
    assert!(out.contains("@custom-variant dark"));
}

#[test]
fn interactive_tailwind_confirm_error_surfaces_as_io_error() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG_TAILWIND).unwrap();
    fs.write(Path::new("src/index.css"), b"@import \"tailwindcss\";\n").unwrap();
    let registry =
        InMemoryRegistry::new(WITH_TAILWIND_STYLES).with_file("button", "styles.css", b".p{}");
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);
    prompt.fail(); // stdin is broken

    let err = add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        true,
        &AddOptions {
            components: names(&["button"]),
            ..Default::default()
        },
    )
    .unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}

#[test]
fn interactive_tailwind_json_mode_skips_snippet_when_no_entry_css() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG_TAILWIND).unwrap();
    // No entry CSS candidate present — json=true means no snippet
    let registry =
        InMemoryRegistry::new(WITH_TAILWIND_STYLES).with_file("button", "styles.css", b".p{}");
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        true, // interactive
        &AddOptions {
            components: names(&["button"]),
            json: true,
            ..Default::default()
        },
    )
    .unwrap();

    let out = String::from_utf8(output.captured()).unwrap();
    assert!(!out.contains("@custom-variant dark"));
}

#[test]
fn interactive_tailwind_write_failure_surfaces_as_io_error() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG_TAILWIND).unwrap();
    fs.write(Path::new("src/index.css"), b"@import \"tailwindcss\";\n").unwrap();
    fs.fail_writes_to(Path::new("src/index.css"));
    let registry =
        InMemoryRegistry::new(WITH_TAILWIND_STYLES).with_file("button", "styles.css", b".p{}");
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep); // confirms yes

    let err = add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        true,
        &AddOptions {
            components: names(&["button"]),
            ..Default::default()
        },
    )
    .unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}

#[test]
fn interactive_tailwind_stdout_error_on_not_found_snippet_surfaces_as_io() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG_TAILWIND).unwrap();
    // No entry CSS — not-found branch will try to write snippet to stdout
    let registry =
        InMemoryRegistry::new(WITH_TAILWIND_STYLES).with_file("button", "styles.css", b".p{}");
    let output = InMemoryOutput::new();
    // Plan output is the first write; snippet is the second — fail the second
    output.fail_stdout_after(1);
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    let err = add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        true,
        &AddOptions {
            components: names(&["button"]),
            ..Default::default()
        },
    )
    .unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}

#[test]
fn interactive_tailwind_read_error_on_entry_css_surfaces_as_io() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG_TAILWIND).unwrap();
    fs.write(Path::new("src/index.css"), b"@import \"tailwindcss\";\n").unwrap();
    fs.fail_reads_to(Path::new("src/index.css"));
    let registry =
        InMemoryRegistry::new(WITH_TAILWIND_STYLES).with_file("button", "styles.css", b".p{}");
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    let err = add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        true,
        &AddOptions {
            components: names(&["button"]),
            ..Default::default()
        },
    )
    .unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}

#[test]
fn interactive_tailwind_json_mode_skips_patch_when_entry_css_found() {
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG_TAILWIND).unwrap();
    fs.write(Path::new("src/index.css"), b"@import \"tailwindcss\";\n").unwrap();
    let registry =
        InMemoryRegistry::new(WITH_TAILWIND_STYLES).with_file("button", "styles.css", b".p{}");
    let output = InMemoryOutput::new();
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        true,
        &AddOptions {
            components: names(&["button"]),
            json: true,
            ..Default::default()
        },
    )
    .unwrap();

    // Entry CSS was not patched — json mode skips the confirm+write block
    let css = String::from_utf8(fs.read(Path::new("src/index.css")).unwrap()).unwrap();
    assert!(!css.contains("@custom-variant dark"));
    // Prompt was not consulted
    assert!(prompt.confirmed().is_empty());
}

#[test]
fn interactive_tailwind_decline_stdout_error_surfaces_as_io() {
    // Drives the ? error path on write_stdout in patch_wiring's decline (else) branch.
    // fail_stdout_after(1) lets the plan write succeed; the snippet write fails.
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG_TAILWIND).unwrap();
    fs.write(Path::new("src/index.css"), b"@import \"tailwindcss\";\n").unwrap();
    let registry =
        InMemoryRegistry::new(WITH_TAILWIND_STYLES).with_file("button", "styles.css", b".p{}");
    let output = InMemoryOutput::new();
    output.fail_stdout_after(1);
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);
    prompt.deny_confirm();

    let err = add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        true,
        &AddOptions {
            components: names(&["button"]),
            ..Default::default()
        },
    )
    .unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}

#[test]
fn no_wiring_stdout_error_surfaces_as_io() {
    // Drives the error path of the write_stdout ? on line 218 in offer_wiring:
    // no_wiring=true + json=false means the snippet write is the second write;
    // fail_stdout_after(1) makes it fail.
    let fs = InMemoryFs::new();
    fs.write(Path::new("primitiv.json"), CONFIG_TAILWIND).unwrap();
    let registry =
        InMemoryRegistry::new(WITH_TAILWIND_STYLES).with_file("button", "styles.css", b".p{}");
    let output = InMemoryOutput::new();
    output.fail_stdout_after(1);
    let runner = InMemoryProcessRunner::new();
    let prompt = InMemoryPrompt::new(Decision::Keep);

    let err = add(
        &fs,
        &registry,
        &output,
        &runner,
        &prompt,
        false,
        &AddOptions {
            components: names(&["button"]),
            no_wiring: true,
            ..Default::default()
        },
    )
    .unwrap_err();

    assert!(matches!(err, CliError::Io(_)));
}
