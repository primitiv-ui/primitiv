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
}

/// The registry baked into the binary at build time (RFC 0005 §6.4, v1) — the
/// same embed strategy `tokens` uses for the design-system DTCG.
pub struct EmbeddedRegistry;

const INDEX: &str = include_str!(concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/../../registry/registry.json"
));

impl Registry for EmbeddedRegistry {
    fn index(&self) -> io::Result<Vec<u8>> {
        Ok(INDEX.as_bytes().to_vec())
    }
}

/// An in-memory [`Registry`] fake for command-layer tests (RFC 0007 §2.2): it
/// serves a caller-supplied index, or fails, so `list`'s formatting and its
/// registry-load error branch are driven without the embedded content.
#[cfg(test)]
pub struct InMemoryRegistry {
    index: Vec<u8>,
    fail: bool,
}

#[cfg(test)]
impl InMemoryRegistry {
    /// A registry that serves `index`.
    pub fn new(index: &[u8]) -> Self {
        Self {
            index: index.to_vec(),
            fail: false,
        }
    }

    /// A registry whose [`index`](Registry::index) fails, modelling an
    /// unreachable remote registry.
    pub fn failing() -> Self {
        Self {
            index: Vec::new(),
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
}
