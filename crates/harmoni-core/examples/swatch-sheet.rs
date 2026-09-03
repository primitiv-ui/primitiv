//! Dumps the data behind the docs-site COLOUR-01 specimen sheet: a range of
//! generated ramps, each swatch with the foreground THE ENGINE PAIRED WITH IT.
//!
//! This exists because the sheet's whole claim is that the engine did the
//! choosing. A hand-picked or threshold-derived foreground would produce a
//! visually similar image that is a lie about the exact thing it asserts, so
//! the illustration is built from this output rather than from anyone's eye.
//!
//! It generates from `docs/generated/colour-01-seeds.json` — the step-500 of
//! each ramp READ OUT OF THE FIGMA `Primitives / Palette` collection — so the
//! sheet illustrates what the design file actually holds. It then CHECKS those
//! against `packages/tokens/harmoni-seeds.json` and fails if the two disagree,
//! because a divergence means the design file and the committed palette have
//! drifted apart and the sheet would quietly keep showing the old one.
//!
//! A few extra hues are appended so the sheet CAN show a range beyond the five
//! the product ships. They are marked `shipped: false`; the illustration
//! currently uses only the five.
//!
//! Neutral is deliberately absent: it comes from the `neutral` module, not
//! `generate_brand_pair`, so feeding its 500 through here would produce a
//! plausible ramp that is not the shipped neutral. Its own 500 also differs
//! between light and dark, where every chromatic ramp shares one seed.
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
    let read = |rel: &str| -> serde_json::Value {
        let path = root.join(rel);
        serde_json::from_str(
            &std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("reading {rel}: {e}")),
        )
        .unwrap_or_else(|e| panic!("parsing {rel}: {e}"))
    };
    let pairs = |v: &serde_json::Value| -> Vec<(String, String)> {
        v["seeds"]
            .as_array()
            .expect("a seeds array")
            .iter()
            .map(|e| {
                (
                    e["ramp"].as_str().expect("a ramp name").to_string(),
                    e["seed"].as_str().expect("a seed colour").to_lowercase(),
                )
            })
            .collect()
    };

    // The design file is the source; the manifest is the cross-check.
    let from_figma = pairs(&read("docs/generated/colour-01-seeds.json"));
    let mut from_manifest = pairs(&read("packages/tokens/harmoni-seeds.json"));
    let mut sorted = from_figma.clone();
    sorted.sort();
    from_manifest.sort();
    assert_eq!(
        sorted, from_manifest,
        "the 500s captured from Figma and the committed seed manifest disagree — \
         the design file and the shipped palette have drifted, and the swatch \
         sheet would illustrate the wrong one. Reconcile before regenerating."
    );

    let mut ramps: Vec<(String, String, bool)> = from_figma
        .into_iter()
        .map(|(ramp, seed)| (ramp, seed, true))
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
