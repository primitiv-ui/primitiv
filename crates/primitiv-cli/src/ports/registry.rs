use std::io;
use std::path::{Path, PathBuf};

use crate::ports::fs::FileSystem;

/// The component-registry port — the seam `list` and `add` load the registry
/// index (`registry.json`, RFC 0005 §6) through.
///
/// v1 bakes the registry into the binary ([`EmbeddedRegistry`]); the
/// `--registry <path>` override reads a repo-local registry directory
/// ([`LocalRegistry`], RFC 0005 §6.4), and the GitHub-raw HTTPS adapter slots in
/// behind this trait later. The fallible signature is for those non-embedded
/// adapters; the embedded one cannot fail.
pub trait Registry {
    fn index(&self) -> io::Result<Vec<u8>>;

    /// Fetch a single component file's bytes — `components/<component>/<file>` in the
    /// registry layout (RFC 0005 §6.1), the per-component artefacts `add` copies
    /// into a project. A file the registry doesn't carry is a `NotFound`.
    fn file(&self, component: &str, file: &str) -> io::Result<Vec<u8>>;
}

/// The registry baked into the binary at build time (RFC 0005 §6.4, v1) — the
/// same embed strategy `tokens` uses for the design-system DTCG.
pub struct EmbeddedRegistry;

const INDEX: &str = include_str!(concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/../../registry/registry.json"
));

/// Embed a registry file's bytes under its `(component, file)` key — the path is
/// derived from the key, so the two cannot drift.
macro_rules! registry_file {
    ($component:literal, $file:literal) => {
        (
            $component,
            $file,
            include_str!(concat!(
                env!("CARGO_MANIFEST_DIR"),
                "/../../registry/components/",
                $component,
                "/",
                $file
            )),
        )
    };
}

/// Every per-component file baked into the binary (RFC 0005 §6.1) — the
/// per-format stylesheets and the format-independent React surface (recipe +
/// wrapper) `add` copies. Looked up by `(component, file)`; entries grow as
/// later `add` slices copy more artefacts (e.g. the contract). Tailwind reuses
/// each component's `styles.css`, so no separate file is embedded for it.
const FILES: &[(&str, &str, &str)] = &[
    registry_file!("button", "styles.css"),
    registry_file!("button", "styles.scss"),
    registry_file!("button", "button.recipe.ts"),
    registry_file!("button", "button.tsx"),
    registry_file!("button", "contract.json"),
    registry_file!("field", "styles.css"),
    registry_file!("field", "styles.scss"),
    registry_file!("field", "field.recipe.ts"),
    registry_file!("field", "field.tsx"),
    registry_file!("field", "contract.json"),
    registry_file!("input", "styles.css"),
    registry_file!("input", "styles.scss"),
    registry_file!("input", "input.recipe.ts"),
    registry_file!("input", "input.tsx"),
    registry_file!("input", "contract.json"),
    registry_file!("input-group", "styles.css"),
    registry_file!("input-group", "styles.scss"),
    registry_file!("input-group", "input-group.recipe.ts"),
    registry_file!("input-group", "input-group.tsx"),
    registry_file!("input-group", "contract.json"),
    registry_file!("switch", "styles.css"),
    registry_file!("switch", "styles.scss"),
    registry_file!("switch", "switch.recipe.ts"),
    registry_file!("switch", "switch.tsx"),
    registry_file!("switch", "contract.json"),
    registry_file!("checkbox", "styles.css"),
    registry_file!("checkbox", "styles.scss"),
    registry_file!("checkbox", "checkbox.recipe.ts"),
    registry_file!("checkbox", "checkbox.tsx"),
    registry_file!("checkbox", "contract.json"),
    registry_file!("radio", "styles.css"),
    registry_file!("radio", "styles.scss"),
    registry_file!("radio", "radio.recipe.ts"),
    registry_file!("radio", "radio.tsx"),
    registry_file!("radio", "contract.json"),
    registry_file!("tabs", "styles.css"),
    registry_file!("tabs", "styles.scss"),
    registry_file!("tabs", "tabs.recipe.ts"),
    registry_file!("tabs", "tabs.tsx"),
    registry_file!("tabs", "contract.json"),
    registry_file!("divider", "styles.css"),
    registry_file!("divider", "styles.scss"),
    registry_file!("divider", "divider.recipe.ts"),
    registry_file!("divider", "divider.tsx"),
    registry_file!("divider", "contract.json"),
    registry_file!("table", "styles.css"),
    registry_file!("table", "styles.scss"),
    registry_file!("table", "table.recipe.ts"),
    registry_file!("table", "table.tsx"),
    registry_file!("table", "contract.json"),
    registry_file!("prose", "styles.css"),
    registry_file!("prose", "styles.scss"),
    registry_file!("prose", "prose.recipe.ts"),
    registry_file!("prose", "prose.tsx"),
    registry_file!("prose", "contract.json"),
    registry_file!("inline-code", "styles.css"),
    registry_file!("inline-code", "styles.scss"),
    registry_file!("inline-code", "inline-code.recipe.ts"),
    registry_file!("inline-code", "inline-code.tsx"),
    registry_file!("inline-code", "contract.json"),
    registry_file!("modal", "styles.css"),
    registry_file!("modal", "styles.scss"),
    registry_file!("modal", "modal.recipe.ts"),
    registry_file!("modal", "modal.tsx"),
    registry_file!("modal", "contract.json"),
    registry_file!("toggle-group", "styles.css"),
    registry_file!("toggle-group", "styles.scss"),
    registry_file!("toggle-group", "toggle-group.recipe.ts"),
    registry_file!("toggle-group", "toggle-group.tsx"),
    registry_file!("toggle-group", "contract.json"),
    registry_file!("accordion", "styles.css"),
    registry_file!("accordion", "styles.scss"),
    registry_file!("accordion", "accordion.recipe.ts"),
    registry_file!("accordion", "accordion.tsx"),
    registry_file!("accordion", "contract.json"),
];

impl Registry for EmbeddedRegistry {
    fn index(&self) -> io::Result<Vec<u8>> {
        Ok(INDEX.as_bytes().to_vec())
    }

    fn file(&self, component: &str, file: &str) -> io::Result<Vec<u8>> {
        FILES
            .iter()
            .find(|(c, f, _)| *c == component && *f == file)
            .map(|(_, _, bytes)| bytes.as_bytes().to_vec())
            .ok_or_else(|| {
                io::Error::new(
                    io::ErrorKind::NotFound,
                    format!("registry has no file 'components/{component}/{file}'"),
                )
            })
    }
}

/// A [`Registry`] backed by a repo-local directory (RFC 0005 §6.4) — the
/// `--registry <path>` override for monorepo dogfooding / offline use. It reads
/// `<base>/registry.json` and per-component `<base>/components/<component>/<file>` through
/// the [`FileSystem`] port, so it runs on `OsFs` in the bin and `InMemoryFs` in
/// tests. A missing index or file surfaces as the port's `NotFound`, which the
/// consumer maps to a [`CliError::Registry`](crate::error::CliError::Registry).
pub struct LocalRegistry<'a, F: FileSystem> {
    fs: &'a F,
    base: PathBuf,
}

impl<'a, F: FileSystem> LocalRegistry<'a, F> {
    /// A registry rooted at `base` (the directory holding `registry.json`).
    pub fn new(fs: &'a F, base: impl AsRef<Path>) -> Self {
        Self {
            fs,
            base: base.as_ref().to_path_buf(),
        }
    }
}

impl<F: FileSystem> Registry for LocalRegistry<'_, F> {
    fn index(&self) -> io::Result<Vec<u8>> {
        self.fs.read(&self.base.join("registry.json"))
    }

    fn file(&self, component: &str, file: &str) -> io::Result<Vec<u8>> {
        self.fs
            .read(&self.base.join("components").join(component).join(file))
    }
}

/// A [`Registry`] served over HTTP(S) (RFC 0005 §6.4) — the registry fetched
/// from the network, e.g. GitHub raw at the pinned tag. It GETs
/// `<base>/registry.json` and per-component `<base>/components/<component>/<file>` with a
/// blocking `ureq` request; a transport failure or non-2xx status surfaces as an
/// `io::Error`, which the consumer maps to a
/// [`CliError::Registry`](crate::error::CliError::Registry). The base URL is
/// injected — production points at GitHub raw, tests at a loopback server — so
/// the fetch path is covered without reaching the network.
pub struct HttpsRegistry {
    base: String,
}

impl HttpsRegistry {
    /// A registry rooted at `base` (the URL prefix holding `registry.json`), with
    /// no trailing slash.
    pub fn new(base: impl Into<String>) -> Self {
        Self { base: base.into() }
    }

    /// GET `<base>/<rel>` and read the whole body, mapping any `ureq` error to an
    /// `io::Error`.
    fn get(&self, rel: &str) -> io::Result<Vec<u8>> {
        let url = format!("{}/{rel}", self.base);
        let mut response = ureq::get(&url).call().map_err(to_io)?;
        response.body_mut().read_to_vec().map_err(to_io)
    }
}

impl Registry for HttpsRegistry {
    fn index(&self) -> io::Result<Vec<u8>> {
        self.get("registry.json")
    }

    fn file(&self, component: &str, file: &str) -> io::Result<Vec<u8>> {
        self.get(&format!("components/{component}/{file}"))
    }
}

/// Map a `ureq` transport / non-2xx-status error to the [`Registry`] port's
/// `io::Error`.
fn to_io(error: ureq::Error) -> io::Error {
    io::Error::other(error.to_string())
}

/// An in-memory [`Registry`] fake for command-layer tests (RFC 0007 §2.2): it
/// serves a caller-supplied index, or fails, so `list`'s formatting and its
/// registry-load error branch are driven without the embedded content.
#[cfg(test)]
pub struct InMemoryRegistry {
    index: Vec<u8>,
    files: std::collections::HashMap<(String, String), Vec<u8>>,
    fail: bool,
}

#[cfg(test)]
impl InMemoryRegistry {
    /// A registry that serves `index`.
    pub fn new(index: &[u8]) -> Self {
        Self {
            index: index.to_vec(),
            files: std::collections::HashMap::new(),
            fail: false,
        }
    }

    /// Add a component file the registry will serve through
    /// [`file`](Registry::file), so `add`'s copy path is driven without the
    /// embedded content.
    pub fn with_file(mut self, component: &str, file: &str, bytes: &[u8]) -> Self {
        self.files
            .insert((component.to_string(), file.to_string()), bytes.to_vec());
        self
    }

    /// A registry whose [`index`](Registry::index) fails, modelling an
    /// unreachable remote registry.
    pub fn failing() -> Self {
        Self {
            index: Vec::new(),
            files: std::collections::HashMap::new(),
            fail: true,
        }
    }
}

#[cfg(test)]
impl Registry for InMemoryRegistry {
    fn index(&self) -> io::Result<Vec<u8>> {
        if self.fail {
            return Err(io::Error::new(
                io::ErrorKind::NotFound,
                "registry unavailable",
            ));
        }
        Ok(self.index.clone())
    }

    fn file(&self, component: &str, file: &str) -> io::Result<Vec<u8>> {
        self.files
            .get(&(component.to_string(), file.to_string()))
            .cloned()
            .ok_or_else(|| io::Error::new(io::ErrorKind::NotFound, "registry file unavailable"))
    }
}
