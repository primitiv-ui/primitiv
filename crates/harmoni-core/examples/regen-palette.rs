//! Regenerates the committed brand ramps in `packages/tokens/src/palette.json`
//! from `packages/tokens/harmoni-seeds.json`.
//!
//! Each step is written as the engine's own **`oklch()`**, not its hex, because
//! the token source is OkLCH-first. That is not cosmetic: the engine holds a
//! ramp's hue constant (RFC 0027 step 4) and 8-bit hex cannot carry it, so a
//! stored hex moved `brand/light/50` 4.6 degrees off its ramp's hue — on 90 of
//! the 100 steps. Converting back for Figma is safe by construction:
//! `format_oklch` renders a string that reproduces its own hex, gated by
//! `tests/ramp_regression.rs`.
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

/// Every ramp to generate, as `(name, seed)`: the semantic `seeds`, then the
/// colour `library`, whose `sameAs` entries take their twin's seed.
fn ramp_seeds(seeds: &serde_json::Value) -> Vec<(String, String)> {
    let semantic: Vec<(String, String)> = seeds["seeds"]
        .as_array()
        .expect("a seeds array")
        .iter()
        .map(|entry| {
            (
                entry["ramp"].as_str().expect("a ramp name").to_string(),
                entry["seed"].as_str().expect("a seed colour").to_string(),
            )
        })
        .collect();
    let library = seeds["library"].as_array().into_iter().flatten().map(|entry| {
        let ramp = entry["ramp"].as_str().expect("a ramp name").to_string();
        let seed = match (entry["seed"].as_str(), entry["sameAs"].as_str()) {
            (Some(seed), _) => seed.to_string(),
            (None, Some(twin)) => semantic
                .iter()
                .find(|(name, _)| name == twin)
                .unwrap_or_else(|| panic!("{ramp}: `sameAs: {twin}` names no seeded ramp"))
                .1
                .clone(),
            (None, None) => panic!("{ramp}: a library entry needs `seed` or `sameAs`"),
        };
        (ramp, seed)
    });
    semantic.clone().into_iter().chain(library).collect()
}

/// Every `(theme, ramp, step)` whose colour the regenerated palettes replace.
fn targets(seeds: &serde_json::Value) -> Vec<((String, String, String), String)> {
    let mut out = Vec::new();
    for (ramp, seed) in ramp_seeds(seeds) {
        let pair = generate_brand_pair(ColorInput::Css(seed.clone()))
            .unwrap_or_else(|e| panic!("{ramp} ({seed}) should generate: {e:?}"));

        for (theme, palette) in [("light", &pair.light), ("dark", &pair.dark)] {
            for swatch in &palette.swatches {
                out.push((
                    (theme.to_string(), ramp.clone(), swatch.label.to_string()),
                    swatch.oklch.clone(),
                ));
            }
        }
    }
    out
}

/// Inserts an empty-valued block for every targeted ramp the document lacks,
/// just before each theme's `transparent` primitive, so the rewrite pass below
/// has lines to fill. A ramp joins the palette once and is rewritten in place
/// from then on, like every other.
fn insert_missing_ramps(
    source: &str,
    wanted: &std::collections::HashMap<(String, String, String), String>,
    order: &[String],
) -> String {
    let mut steps: std::collections::BTreeMap<(String, String), Vec<String>> = Default::default();
    for (theme, ramp, step) in wanted.keys() {
        steps.entry((theme.clone(), ramp.clone())).or_default().push(step.clone());
    }
    let mut present = std::collections::HashSet::new();
    let mut theme = String::new();
    for line in source.lines() {
        if let Some(key) = opened_key(line, 2) {
            theme = key.to_string();
        } else if let Some(key) = opened_key(line, 6) {
            present.insert((theme.clone(), key.to_string()));
        }
    }
    let mut out = String::with_capacity(source.len());
    theme.clear();
    for line in source.lines() {
        if let Some(key) = opened_key(line, 2) {
            theme = key.to_string();
        }
        if opened_key(line, 6) == Some("transparent") {
            // In manifest order, so the library reads red → rose.
            for ramp in order {
                let key = (theme.clone(), ramp.clone());
                if present.contains(&key) {
                    continue;
                }
                let Some(labels) = steps.get(&key) else { continue };
                let mut labels = labels.clone();
                labels.sort_by_key(|l| l.parse::<u32>().unwrap_or(u32::MAX));
                out.push_str(&format!("      \"{ramp}\": {{\n"));
                for (i, label) in labels.iter().enumerate() {
                    let comma = if i + 1 < labels.len() { "," } else { "" };
                    out.push_str(&format!(
                        "        \"{label}\": {{\n          \"$type\": \"color\",\n          \"$value\": \"\"\n        }}{comma}\n"
                    ));
                }
                out.push_str("      },\n");
            }
        }
        out.push_str(line);
        out.push('\n');
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
    let ordered = targets(&seeds);
    let mut order: Vec<String> = Vec::new();
    for ((_, ramp, _), _) in &ordered {
        if !order.contains(ramp) {
            order.push(ramp.clone());
        }
    }
    let wanted: std::collections::HashMap<_, _> = ordered.into_iter().collect();

    let source = insert_missing_ramps(
        &std::fs::read_to_string(&palette_path).expect("read palette"),
        &wanted,
        &order,
    );
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
