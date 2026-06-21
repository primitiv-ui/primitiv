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
    /// The opt-in styled bundle (RFC 0005 §6.2): the per-format stylesheet and
    /// the React surface `add` copies. Defaulted, so a headless-only entry
    /// parses; the `packages` key the block also carries is read by a later
    /// `add` slice.
    #[serde(default)]
    pub styles: Styles,
    /// The consumer API specification file (RFC 0005 §6.2 / RFC 0004 §3) —
    /// `contract.json` — copied into the components directory alongside the
    /// recipe and wrapper so tooling can read it co-located. `None` when the
    /// entry does not declare one (headless-only installs).
    #[serde(default)]
    pub contract: Option<String>,
}

/// A component's styled bundle (RFC 0005 §6.2): the per-format stylesheet `add`
/// copies into the styles path, and the **format-independent React surface**
/// (recipe + wrapper, D55) it copies into the components directory. The
/// `packages` key lists npm packages the styled surface requires (e.g.
/// `class-variance-authority`); `add` installs them alongside the headless
/// dependencies when styles are enabled.
#[derive(Debug, Deserialize, PartialEq, Default)]
pub struct Styles {
    #[serde(default)]
    pub packages: Vec<String>,
    #[serde(default)]
    pub formats: Formats,
    #[serde(default)]
    pub react: Vec<String>,
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
    pub packages: Vec<PackageDep>,
}

/// A package a component depends on (RFC 0005 §6.2) — the npm name plus an
/// optional version range. The range is the **version safeguard**: `add`
/// installs `name@range`, so a consumer adding a component is never left on a
/// `@primitiv-ui/react` too old to carry that component's exports (the skew that
/// shipped a "has no exported member" error). Deserializes from either a bare
/// string (`"@primitiv-ui/react"` → no pin) or an object
/// (`{ "name": …, "version": "^0.1.0" }`), so existing string entries still parse.
#[derive(Debug, Deserialize, PartialEq, Clone)]
#[serde(from = "PackageDepRepr")]
pub struct PackageDep {
    pub name: String,
    pub version: Option<String>,
}

impl PackageDep {
    /// The package-manager install spec: `name@version` when a version range is
    /// declared, otherwise the bare `name` (install the latest).
    pub fn spec(&self) -> String {
        match &self.version {
            Some(version) => format!("{}@{version}", self.name),
            None => self.name.clone(),
        }
    }
}

/// The on-the-wire shape a [`PackageDep`] deserializes from — a bare name string
/// or a `{ name, version }` object — collapsed into `PackageDep` by the `From`
/// impl below (the `#[serde(from)]` seam).
#[derive(Deserialize)]
#[serde(untagged)]
enum PackageDepRepr {
    Name(String),
    Detailed {
        name: String,
        #[serde(default)]
        version: Option<String>,
    },
}

impl From<PackageDepRepr> for PackageDep {
    fn from(repr: PackageDepRepr) -> Self {
        match repr {
            PackageDepRepr::Name(name) => PackageDep {
                name,
                version: None,
            },
            PackageDepRepr::Detailed { name, version } => PackageDep { name, version },
        }
    }
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
