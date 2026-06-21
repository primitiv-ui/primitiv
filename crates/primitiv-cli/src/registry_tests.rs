use std::collections::BTreeMap;

use pretty_assertions::assert_eq;

use crate::format::Format;
use crate::registry::{ComponentEntry, DependsOn, PackageDep, RegistryIndex, Styles};

/// A registry index as `registry.json` carries it (RFC 0005 §6.2) — `button`
/// carries a `contract` field (the consumer API spec) while `switch` omits it.
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
                        contract: Some("contract.json".into()),
                    },
                ),
                (
                    "switch".into(),
                    ComponentEntry {
                        version: "0.2.0".into(),
                        depends_on: DependsOn::default(),
                        styles: Styles::default(),
                        contract: None,
                    },
                ),
            ]),
        }
    );
}

#[test]
fn parses_a_components_contract_file() {
    let index = RegistryIndex::parse(INDEX).unwrap();

    assert_eq!(
        index.components["button"].contract,
        Some("contract.json".to_string())
    );
    // A component with no `contract` field defaults to None.
    assert_eq!(index.components["switch"].contract, None);
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

    // A bare string package entry parses with no version pin.
    assert_eq!(
        index.components["button"].depends_on.packages,
        vec![PackageDep {
            name: "@primitiv-ui/react".to_string(),
            version: None,
        }]
    );
    // A component with no `dependsOn` defaults to an empty package list.
    assert_eq!(
        index.components["icon"].depends_on.packages,
        Vec::<PackageDep>::new()
    );
}

#[test]
fn parses_a_versioned_npm_package_dependency_alongside_a_bare_one() {
    const INDEX: &[u8] = br##"{
  "version": "0.1.0",
  "components": {
    "button": { "version": "0.1.0", "dependsOn": { "packages": [
      { "name": "@primitiv-ui/react", "version": "^0.1.0" },
      "class-variance-authority"
    ] } }
  }
}"##;

    let index = RegistryIndex::parse(INDEX).unwrap();

    assert_eq!(
        index.components["button"].depends_on.packages,
        vec![
            PackageDep {
                name: "@primitiv-ui/react".to_string(),
                version: Some("^0.1.0".to_string()),
            },
            PackageDep {
                name: "class-variance-authority".to_string(),
                version: None,
            },
        ]
    );
}

#[test]
fn package_dep_spec_pins_a_version_when_declared_and_is_bare_otherwise() {
    assert_eq!(
        PackageDep {
            name: "@primitiv-ui/react".to_string(),
            version: Some("^0.1.0".to_string()),
        }
        .spec(),
        "@primitiv-ui/react@^0.1.0"
    );
    assert_eq!(
        PackageDep {
            name: "class-variance-authority".to_string(),
            version: None,
        }
        .spec(),
        "class-variance-authority"
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
