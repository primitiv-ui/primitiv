use std::collections::BTreeMap;
use std::io;
use std::path::Path;

use serde::Deserialize;

use crate::error::CliError;
use crate::ports::fs::FileSystem;

/// The config files `init` reads to detect an import alias, in precedence order:
/// a TypeScript project's `tsconfig.json` is authoritative; a JavaScript
/// project's `jsconfig.json` is the fallback (RFC 0005 §3.3).
const CONFIG_FILES: [&str; 2] = ["tsconfig.json", "jsconfig.json"];

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

/// Detect the consumer's `components` import alias by reading `tsconfig.json`
/// then `jsconfig.json` from `dir` through the [`FileSystem`] port (RFC 0005
/// §3.3 / D32). The first config that exists is authoritative — its parse result
/// is returned even when it carries no alias, so a present `tsconfig.json`
/// without a root mapping does not fall through to `jsconfig.json`.
///
/// A `NotFound` at a level ascends to the next candidate; any other read error
/// is a hard [`CliError::Io`] (the filesystem is broken, not merely aliasless).
/// With neither file present the result is `Ok(None)` — the cue to fall back to
/// relative imports.
pub fn components_alias(fs: &impl FileSystem, dir: &Path) -> Result<Option<String>, CliError> {
    for name in CONFIG_FILES {
        match fs.read(&dir.join(name)) {
            Ok(bytes) => return Ok(parse_components_alias(&bytes)),
            Err(error) if error.kind() == io::ErrorKind::NotFound => continue,
            Err(error) => return Err(CliError::Io(error)),
        }
    }
    Ok(None)
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
