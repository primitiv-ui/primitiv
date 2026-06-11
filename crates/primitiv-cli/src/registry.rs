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

/// One component's entry in the index — its independently-pinned version
/// (RFC 0005 §6.2).
#[derive(Debug, Deserialize, PartialEq)]
pub struct ComponentEntry {
    pub version: String,
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
