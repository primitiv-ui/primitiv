//! The colour library: seventeen named hue ramps shipped in the token layer
//! beside the semantic ones (`brand`, `danger`, ...), for consumers to build with.
//!
//! The library is derived, not picked. Five hues *are* the semantic ramps —
//! `red` is generated from `danger`'s seed, and so on — so the token layer never
//! carries two almost-identical reds. The other twelve sit evenly between those
//! five anchors on the hue wheel, with lightness and relative chroma
//! interpolated from their two neighbours; the manifest records the resulting
//! seeds, and these tests hold the committed palette to them.

use std::path::PathBuf;

use harmoni_core::api::generate_brand_pair;
use harmoni_core::ColorInput;

fn read_json(relative: &str) -> serde_json::Value {
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../..").join(relative);
    let raw = std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("{}: {e}", path.display()));
    serde_json::from_str(&raw).unwrap_or_else(|e| panic!("{}: {e}", path.display()))
}

fn manifest() -> serde_json::Value {
    read_json("packages/tokens/harmoni-seeds.json")
}

fn library() -> Vec<serde_json::Value> {
    manifest()["library"]
        .as_array()
        .expect("the manifest should carry a `library` array")
        .clone()
}

/// A library entry's seed: its own, or the seed of the semantic ramp it names.
fn resolved_seed(entry: &serde_json::Value) -> String {
    if let Some(seed) = entry["seed"].as_str() {
        return seed.to_string();
    }
    let twin = entry["sameAs"].as_str().expect("a library entry needs `seed` or `sameAs`");
    manifest()["seeds"]
        .as_array()
        .expect("a seeds array")
        .iter()
        .find(|s| s["ramp"] == twin)
        .unwrap_or_else(|| panic!("`sameAs: {twin}` names no ramp in `seeds`"))["seed"]
        .as_str()
        .expect("a seed colour")
        .to_string()
}

fn committed(palette: &serde_json::Value, theme: &str, ramp: &str, step: &str) -> String {
    palette[theme]["color"][ramp][step]["$value"]
        .as_str()
        .unwrap_or_else(|| panic!("palette.json has no {theme}/{ramp}/{step}"))
        .to_string()
}

#[test]
fn the_library_names_seventeen_hues_in_wheel_order() {
    let names: Vec<String> = library()
        .iter()
        .map(|entry| entry["ramp"].as_str().expect("a ramp name").to_string())
        .collect();

    assert_eq!(
        names,
        [
            "red", "orange", "amber", "yellow", "lime", "green", "emerald", "teal", "cyan",
            "sky", "blue", "indigo", "violet", "purple", "fuchsia", "pink", "rose",
        ]
    );
}

#[test]
fn the_five_anchor_hues_are_the_semantic_ramps_themselves() {
    let shared: Vec<(String, String)> = library()
        .iter()
        .filter_map(|entry| {
            Some((
                entry["ramp"].as_str()?.to_string(),
                entry["sameAs"].as_str()?.to_string(),
            ))
        })
        .collect();

    assert_eq!(
        shared,
        [
            ("red".to_string(), "danger".to_string()),
            ("amber".to_string(), "warning".to_string()),
            ("green".to_string(), "success".to_string()),
            ("cyan".to_string(), "info".to_string()),
            ("blue".to_string(), "brand".to_string()),
        ]
    );
}

#[test]
fn every_library_ramp_in_the_palette_reproduces_from_its_seed() {
    // `regen-palette` writes these; this fails if palette.json is hand-edited or
    // the engine moves without the palette being regenerated.
    let palette = read_json("packages/tokens/src/palette.json");
    for entry in library() {
        let ramp = entry["ramp"].as_str().unwrap();
        let seed = resolved_seed(&entry);
        let pair = generate_brand_pair(ColorInput::Css(seed.clone()))
            .unwrap_or_else(|e| panic!("{ramp} ({seed}) should generate: {e:?}"));
        for (theme, generated) in [("light", &pair.light), ("dark", &pair.dark)] {
            for swatch in &generated.swatches {
                let step = swatch.label.to_string();
                assert_eq!(
                    committed(&palette, theme, ramp, &step),
                    swatch.oklch,
                    "{theme}/{ramp}/{step} does not match what its seed generates — \
                     run `cargo run -p harmoni-core --features regen-palette --example regen-palette`",
                );
            }
        }
    }
}

#[test]
fn a_shared_hue_carries_exactly_its_twins_colours() {
    let palette = read_json("packages/tokens/src/palette.json");
    for entry in library() {
        let Some(twin) = entry["sameAs"].as_str() else { continue };
        let ramp = entry["ramp"].as_str().unwrap();
        for theme in ["light", "dark"] {
            for step in ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900"] {
                assert_eq!(
                    committed(&palette, theme, ramp, step),
                    committed(&palette, theme, twin, step),
                    "{theme}/{ramp}/{step} has drifted from {twin}",
                );
            }
        }
    }
}
