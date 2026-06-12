use std::collections::BTreeMap;

use pretty_assertions::assert_eq;

use crate::format::Format;
use crate::registry::{ComponentEntry, DependsOn, RegistryIndex, Styles};

/// A registry index as `registry.json` carries it (RFC 0005 §6.2) — `button`
/// keeps an extra `contract` field to prove the richer per-component data the
/// index also holds is ignored by the `list`-facing type.
const INDEX: &[u8] = br##"{
  "version": "0.1.0",
  "components": {
    "button": { "version": "0.1.0", "contract": "contract.json" },
    "switch": { "version": "0.2.0" }
  }
}"##;

#[test]
fn parses_the_index_components_and_their_versions() {
    let index = RegistryIndex::parse(INDEX).unwrap();

    assert_eq!(
        index,
        RegistryIndex {
            version: "0.1.0".into(),
            components: BTreeMap::from([
                (
                    "button".into(),
                    ComponentEntry {
                        version: "0.1.0".into(),
                        depends_on: DependsOn::default(),
                        styles: Styles::default(),
                    },
                ),
                (
                    "switch".into(),
                    ComponentEntry {
                        version: "0.2.0".into(),
                        depends_on: DependsOn::default(),
                        styles: Styles::default(),
                    },
                ),
            ]),
        }
    );
}

#[test]
fn parses_each_components_transitive_component_dependencies() {
    const INDEX: &[u8] = br##"{
  "version": "0.1.0",
  "components": {
    "button": { "version": "0.1.0" },
    "field": { "version": "0.1.0", "dependsOn": { "components": ["button", "label"] } }
  }
}"##;

    let index = RegistryIndex::parse(INDEX).unwrap();

    assert_eq!(
        index.components["field"].depends_on.components,
        vec!["button".to_string(), "label".to_string()]
    );
    // A component with no `dependsOn` defaults to an empty dependency list.
    assert_eq!(
        index.components["button"].depends_on.components,
        Vec::<String>::new()
    );
}

#[test]
fn parses_each_components_npm_package_dependencies() {
    const INDEX: &[u8] = br##"{
  "version": "0.1.0",
  "components": {
    "button": { "version": "0.1.0", "dependsOn": { "packages": ["@primitiv-ui/react"] } },
    "icon": { "version": "0.1.0" }
  }
}"##;

    let index = RegistryIndex::parse(INDEX).unwrap();

    assert_eq!(
        index.components["button"].depends_on.packages,
        vec!["@primitiv-ui/react".to_string()]
    );
    // A component with no `dependsOn` defaults to an empty package list.
    assert_eq!(
        index.components["icon"].depends_on.packages,
        Vec::<String>::new()
    );
}

#[test]
fn parses_each_components_per_format_style_files() {
    const INDEX: &[u8] = br##"{
  "version": "0.1.0",
  "components": {
    "button": { "version": "0.1.0", "styles": { "formats": { "css": ["styles.css"], "scss": ["styles.scss"], "tailwind": ["styles.css"] } } },
    "icon": { "version": "0.1.0" }
  }
}"##;

    let index = RegistryIndex::parse(INDEX).unwrap();

    let button = &index.components["button"].styles.formats;
    assert_eq!(button.files(Format::Css), ["styles.css"]);
    assert_eq!(button.files(Format::Scss), ["styles.scss"]);
    assert_eq!(button.files(Format::Tailwind), ["styles.css"]);
    // A component with no styles block declares no files for any format.
    assert!(index.components["icon"].styles.formats.files(Format::Css).is_empty());
}

#[test]
fn parses_a_components_format_independent_react_surface() {
    const INDEX: &[u8] = br##"{
  "version": "0.1.0",
  "components": {
    "button": { "version": "0.1.0", "styles": { "react": ["button.recipe.ts", "button.tsx"] } },
    "icon": { "version": "0.1.0" }
  }
}"##;

    let index = RegistryIndex::parse(INDEX).unwrap();

    assert_eq!(
        index.components["button"].styles.react,
        vec!["button.recipe.ts".to_string(), "button.tsx".to_string()]
    );
    // A component with no styles block declares no React surface.
    assert!(index.components["icon"].styles.react.is_empty());
}

#[test]
fn errors_on_a_malformed_registry_index() {
    let error = RegistryIndex::parse(b"{ not json }").unwrap_err();

    assert_eq!(error.exit_code(), 7);
}
