use std::collections::BTreeMap;

use serde::Deserialize;

use crate::error::CliError;

/// The registry index (`registry.json`, RFC 0005 §6.2) — the manifest of the
/// components available to install and their versions. Only the fields `list`
/// surfaces are modelled; the richer per-component data (`dependsOn`, `formats`,
/// `contract`) is ignored here and read by `add` when it lands, so the index can
/// carry it without this type changing.
#[derive(Debug, Deserialize, PartialEq)]
pub struct RegistryIndex {
    pub version: String,
    pub components: BTreeMap<String, ComponentEntry>,
}

/// One component's entry in the index — its independently-pinned version and
/// what it depends on (RFC 0005 §6.2).
#[derive(Debug, Deserialize, PartialEq)]
pub struct ComponentEntry {
    pub version: String,
    /// The siblings `add` must pull in alongside this component (§4.4). Absent
    /// in the JSON means none, so a minimal `{ "version": … }` entry still
    /// parses (the same forward-compatibility the `list`-facing fields rely on).
    #[serde(rename = "dependsOn", default)]
    pub depends_on: DependsOn,
}

/// What a component needs pulled in alongside it (RFC 0005 §6.2). Only the
/// sibling `components` are modelled today — `add`'s transitive resolution
/// (§4.4) walks them; the `packages` / `tokens` fields the index also carries
/// are read by later `add` slices, so the index keeps them without this type
/// changing.
#[derive(Debug, Deserialize, PartialEq, Default)]
pub struct DependsOn {
    #[serde(default)]
    pub components: Vec<String>,
}

impl RegistryIndex {
    /// Parse the bytes of a `registry.json` into the typed index. A pure
    /// function — no I/O — so it unit-tests directly; fetching the bytes lives
    /// behind the [`Registry`](crate::ports::registry::Registry) port. A
    /// malformed document maps to [`CliError::Registry`].
    pub fn parse(bytes: &[u8]) -> Result<RegistryIndex, CliError> {
        serde_json::from_slice(bytes).map_err(|error| CliError::Registry(error.to_string()))
    }
}
