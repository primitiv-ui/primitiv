use std::collections::BTreeMap;

use serde::Deserialize;

use crate::error::CliError;
use crate::format::Format;

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
    /// The opt-in styled bundle (RFC 0005 §6.2): the per-format stylesheet `add`
    /// copies. Defaulted, so a headless-only entry parses; the `packages` and
    /// `react` keys the block also carries are read by a later `add` slice.
    #[serde(default)]
    pub styles: Styles,
}

/// A component's styled bundle (RFC 0005 §6.2). Only the per-format stylesheet
/// list `add` copies is modelled today; the rest of the block (`packages`,
/// `react`) is ignored until the slices that consume it land.
#[derive(Debug, Deserialize, PartialEq, Default)]
pub struct Styles {
    #[serde(default)]
    pub formats: Formats,
}

/// The style files a component declares per output format (RFC 0005 §6.2). Each
/// list defaults to empty, so a component with no styles for a format parses.
#[derive(Debug, Deserialize, PartialEq, Default)]
pub struct Formats {
    #[serde(default)]
    pub css: Vec<String>,
    #[serde(default)]
    pub scss: Vec<String>,
    #[serde(default)]
    pub tailwind: Vec<String>,
}

impl Formats {
    /// The style files declared for `format` — empty when the component carries
    /// no styles for it.
    pub fn files(&self, format: Format) -> &[String] {
        match format {
            Format::Css => &self.css,
            Format::Scss => &self.scss,
            Format::Tailwind => &self.tailwind,
        }
    }
}

/// What a component needs pulled in alongside it (RFC 0005 §6.2): the sibling
/// `components` `add`'s transitive resolution (§4.4) walks, and the npm
/// `packages` it must ensure are installed (the headless library). The `tokens`
/// flag the index also carries is read by a later `add` slice, so the index
/// keeps it without this type changing. Both lists default to empty, so a
/// minimal `dependsOn` (or none) still parses.
#[derive(Debug, Deserialize, PartialEq, Default)]
pub struct DependsOn {
    #[serde(default)]
    pub components: Vec<String>,
    #[serde(default)]
    pub packages: Vec<String>,
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
