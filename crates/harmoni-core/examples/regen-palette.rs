//! Regenerates the committed brand ramps in `packages/tokens/src/palette.json`
//! from `packages/tokens/harmoni-seeds.json`.
//!
//! Until this existed the palette was not reproducible: the seeds were entered
//! interactively in the Harmoni Figma plugin and only the OUTPUT was ever
//! committed, so an engine fix could not be flowed into the shipped tokens
//! without hand-editing a hundred hex values.
//!
//! It rewrites **only** the ramps named in the manifest, in both themes. Every
//! other family is left exactly as committed, and deliberately so:
//!
//!   - `neutral` / `neutral-alpha` come from the `neutral` module, not
//!     `generate_brand_pair` — a different input shape entirely.
//!   - `brand-alpha` is the *seed* at the alpha curve's opacities, so it is
//!     anchored to a colour that regeneration does not move.
//!   - `white` / `black` / `absolute-*` / `transparent` are primitives.
//!
//! The file is edited **as text**, one `$value` line at a time, rather than being
//! parsed and re-serialised. Re-serialising needs serde_json's `preserve_order`
//! feature to keep the key order, and Cargo unifies features across the whole
//! workspace build — turning it on here silently flips `primitiv-emit`'s token
//! ordering from sorted to insertion order and breaks five of its goldens. A
//! line-oriented edit needs no feature at all and touches nothing else.
//!
//! Run:  cargo run -p harmoni-core --features regen-palette --example regen-palette

use std::path::PathBuf;

use harmoni_core::api::generate_brand_pair;
use harmoni_core::ColorInput;

fn repo_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../..")
}

/// Every `(theme, ramp, step)` whose colour the regenerated palettes replace.
fn targets(seeds: &serde_json::Value) -> Vec<((String, String, String), String)> {
    let mut out = Vec::new();
    for entry in seeds["seeds"].as_array().expect("a seeds array") {
        let ramp = entry["ramp"].as_str().expect("a ramp name");
        let seed = entry["seed"].as_str().expect("a seed colour");
        let pair = generate_brand_pair(ColorInput::Css(seed.to_string()))
            .unwrap_or_else(|e| panic!("{ramp} ({seed}) should generate: {e:?}"));

        for (theme, palette) in [("light", &pair.light), ("dark", &pair.dark)] {
            for swatch in &palette.swatches {
                out.push((
                    (theme.to_string(), ramp.to_string(), swatch.label.to_string()),
                    swatch.hex.to_lowercase(),
                ));
            }
        }
    }
    out
}

/// The key a line opens, when it opens an object at exactly `indent` spaces.
fn opened_key(line: &str, indent: usize) -> Option<&str> {
    let rest = line.strip_prefix(&" ".repeat(indent))?;
    if rest.starts_with(' ') || !rest.ends_with(": {") {
        return None;
    }
    rest.strip_prefix('"')?.split('"').next()
}

fn main() {
    let root = repo_root();
    let seeds_path = root.join("packages/tokens/harmoni-seeds.json");
    let palette_path = root.join("packages/tokens/src/palette.json");

    let seeds: serde_json::Value =
        serde_json::from_str(&std::fs::read_to_string(&seeds_path).expect("read seeds"))
            .expect("parse seeds");
    let wanted: std::collections::HashMap<_, _> = targets(&seeds).into_iter().collect();

    let source = std::fs::read_to_string(&palette_path).expect("read palette");
    let (mut theme, mut ramp, mut step) = (String::new(), String::new(), String::new());
    let (mut changed, mut written) = (0usize, 0usize);
    let mut out = String::with_capacity(source.len());

    for line in source.lines() {
        // Depths in this document: theme 2, "color" 4, ramp 6, step 8, leaf 10.
        if let Some(key) = opened_key(line, 2) {
            theme = key.to_string();
        } else if let Some(key) = opened_key(line, 6) {
            ramp = key.to_string();
        } else if let Some(key) = opened_key(line, 8) {
            step = key.to_string();
        }

        let leaf = line.trim_start().starts_with("\"$value\"") && line.starts_with("          ");
        if leaf {
            if let Some(next) = wanted.get(&(theme.clone(), ramp.clone(), step.clone())) {
                let replacement = format!("          \"$value\": \"{next}\"");
                let replacement = if line.ends_with(',') {
                    replacement + ","
                } else {
                    replacement
                };
                if replacement != line {
                    changed += 1;
                }
                written += 1;
                out.push_str(&replacement);
                out.push('\n');
                continue;
            }
        }
        out.push_str(line);
        out.push('\n');
    }

    assert_eq!(
        written,
        wanted.len(),
        "expected to rewrite every generated step; the document shape must have changed"
    );

    std::fs::write(&palette_path, out).expect("write palette");
    println!("{written} step(s) matched, {changed} changed, in {}", palette_path.display());
}
