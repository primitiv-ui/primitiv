use std::io;

/// The component-registry port — the seam `list` (and later `add`) loads the
/// registry index (`registry.json`, RFC 0005 §6) through.
///
/// v1 bakes the registry into the binary ([`EmbeddedRegistry`]); the GitHub-raw
/// HTTPS adapter and the `--registry <path>` override (RFC 0005 §6.4) slot in
/// behind this trait later. The fallible signature is for those remote adapters;
/// the embedded one cannot fail.
pub trait Registry {
    fn index(&self) -> io::Result<Vec<u8>>;

    /// Fetch a single component file's bytes — `r/<component>/<file>` in the
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
                "/../../registry/r/",
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
    registry_file!("switch", "styles.css"),
    registry_file!("switch", "styles.scss"),
    registry_file!("switch", "switch.recipe.ts"),
    registry_file!("switch", "switch.tsx"),
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
                    format!("registry has no file 'r/{component}/{file}'"),
                )
            })
    }
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
