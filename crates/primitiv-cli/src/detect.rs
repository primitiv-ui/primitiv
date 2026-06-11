use std::collections::BTreeMap;

use serde::Deserialize;

/// The slice of `tsconfig.json` / `jsconfig.json` the CLI reads to detect a
/// consumer's import alias (RFC 0005 §3.3). Only `compilerOptions.paths` is
/// modelled; every other key (and there are many) is ignored, so a real config
/// deserialises without listing its full schema.
#[derive(Debug, Deserialize)]
struct TsConfig {
    #[serde(rename = "compilerOptions")]
    compiler_options: Option<CompilerOptions>,
}

#[derive(Debug, Deserialize)]
struct CompilerOptions {
    /// The TypeScript path-mapping table — each alias maps to a list of target
    /// globs. A `BTreeMap` keeps the scan order deterministic regardless of the
    /// file's key order.
    paths: Option<BTreeMap<String, Vec<String>>>,
}

/// Detect the `components` import alias from the bytes of a `tsconfig.json` /
/// `jsconfig.json` (RFC 0005 §3.3 / D32). A pure function — no I/O — so it
/// unit-tests directly; the file reads live in [`components_alias`].
///
/// The rule mirrors the dominant Vite / Next.js convention: a root path mapping
/// `"<prefix>/*"` that resolves to the project source root (`./src/*`, `src/*`,
/// or `./*` for a Next.js app without a `src` dir) means generated code can
/// import components as `<prefix>/components`. The first such mapping (by sorted
/// alias key) wins.
///
/// Anything the rule cannot make sense of — a config that fails to parse, no
/// `compilerOptions.paths`, or no root-style mapping — yields `None`, the signal
/// to fall back to relative imports rather than invent an alias (RFC 0005 §3.3).
pub fn parse_components_alias(bytes: &[u8]) -> Option<String> {
    let config: TsConfig = serde_json::from_slice(bytes).ok()?;
    let paths = config.compiler_options?.paths?;
    paths
        .iter()
        .find_map(|(key, targets)| root_alias_prefix(key, targets))
        .map(|prefix| format!("{prefix}/components"))
}

/// If `key` is a root path mapping (`"<prefix>/*"` resolving to the source
/// root), return its `<prefix>`. The target's optional leading `./` is ignored,
/// so `./src/*` and `src/*` are treated alike.
fn root_alias_prefix<'a>(key: &'a str, targets: &[String]) -> Option<&'a str> {
    let prefix = key.strip_suffix("/*")?;
    let target = targets.first()?;
    let target = target.strip_prefix("./").unwrap_or(target);
    (target == "src/*" || target == "*").then_some(prefix)
}
