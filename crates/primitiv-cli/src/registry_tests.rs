use std::collections::BTreeMap;

use pretty_assertions::assert_eq;

use crate::registry::{ComponentEntry, RegistryIndex};

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
                ("button".into(), ComponentEntry { version: "0.1.0".into() }),
                ("switch".into(), ComponentEntry { version: "0.2.0".into() }),
            ]),
        }
    );
}

#[test]
fn errors_on_a_malformed_registry_index() {
    let error = RegistryIndex::parse(b"{ not json }").unwrap_err();

    assert_eq!(error.exit_code(), 7);
}
