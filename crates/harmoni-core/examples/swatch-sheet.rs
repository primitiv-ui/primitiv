//! Dumps the data behind the docs-site COLOUR-01 specimen sheet: a range of
//! generated ramps, each swatch with the foreground THE ENGINE PAIRED WITH IT.
//!
//! This exists because the sheet's whole claim is that the engine did the
//! choosing. A hand-picked or threshold-derived foreground would produce a
//! visually similar image that is a lie about the exact thing it asserts, so
//! the illustration is built from this output rather than from anyone's eye.
//!
//! It generates from `packages/tokens/harmoni-seeds.json` — the same seeds the
//! shipped palette regenerates from — plus a few extra hues, so the sheet can
//! show a RANGE of ramps rather than only the five the product happens to ship.
//! The extras are marked `shipped: false` so the illustration can order or
//! caption them honestly.
//!
//! Neutral is deliberately absent: it comes from the `neutral` module, not
//! `generate_brand_pair`, and is not in the seed manifest. See that file's
//! `$notScoped.neutral`.
//!
//! Run:  cargo run -p harmoni-core --features swatch-sheet --example swatch-sheet

use harmoni_core::api::generate_brand_pair;
use harmoni_core::{oklch_to_hex, ColorInput};
use palette::Oklch;
use std::path::PathBuf;

/// Extra hues, so the sheet shows the engine's behaviour across the wheel
/// rather than only where this product's brand happens to sit.
const EXTRA_SEEDS: &[(&str, &str)] = &[
    ("violet", "#7c3aed"),
    ("magenta", "#c026d3"),
    ("lime", "#65a30d"),
    ("amber", "#d97706"),
    ("teal", "#0d9488"),
];

fn main() {
    let root = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../..");
    let seeds_path = root.join("packages/tokens/harmoni-seeds.json");
    let seeds: serde_json::Value =
        serde_json::from_str(&std::fs::read_to_string(&seeds_path).expect("the seed manifest"))
            .expect("valid JSON");

    let mut ramps: Vec<(String, String, bool)> = seeds["seeds"]
        .as_array()
        .expect("a seeds array")
        .iter()
        .map(|e| {
            (
                e["ramp"].as_str().expect("a ramp name").to_string(),
                e["seed"].as_str().expect("a seed colour").to_string(),
                true,
            )
        })
        .collect();
    ramps.extend(
        EXTRA_SEEDS
            .iter()
            .map(|(n, s)| (n.to_string(), s.to_string(), false)),
    );

    let mut out = Vec::new();
    for (ramp, seed, shipped) in &ramps {
        let pair = generate_brand_pair(ColorInput::Css(seed.clone()))
            .unwrap_or_else(|e| panic!("{ramp} ({seed}) should generate: {e:?}"));
        for (theme, palette) in [("light", &pair.light), ("dark", &pair.dark)] {
            let steps: Vec<serde_json::Value> = palette
                .swatches
                .iter()
                .map(|s| {
                    let fg = &s.best_foreground;
                    serde_json::json!({
                        "step": s.label.to_string(),
                        "hex": s.hex.to_lowercase(),
                        // The engine's pairing, rendered the same way the swatch is.
                        "foreground": oklch_to_hex(Oklch::new(fg.l, fg.c, fg.h)).to_lowercase(),
                        "foregroundSource": format!("{:?}", s.foreground_source),
                        "contrast": (s.contrast_result.ratio * 100.0).round() / 100.0,
                    })
                })
                .collect();
            out.push(serde_json::json!({
                "ramp": ramp, "theme": theme, "seed": seed, "shipped": shipped, "steps": steps,
            }));
        }
    }

    let dest = root.join("docs/generated/colour-01-swatch-sheet.json");
    std::fs::create_dir_all(dest.parent().expect("a parent")).expect("the output directory");
    std::fs::write(
        &dest,
        serde_json::to_string_pretty(&serde_json::json!({ "ramps": out })).expect("serialisable")
            + "\n",
    )
    .expect("writing the sheet");
    println!("wrote {} ramp/theme rows to {}", ramps.len() * 2, dest.display());
}
