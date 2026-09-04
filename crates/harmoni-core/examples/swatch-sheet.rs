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
use palette::{IntoColor, Oklch, Srgb};
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

    write_hue_drift(&root);
}

/// The COLOUR-02 counter-example: the same seed built the way a ramp gets built
/// by hand, so the drift is MEASURED rather than drawn.
///
/// The brief asks for "realistic hue drift, roughly 30 degrees", and warns
/// against caricature — if the wrong ramp looks obviously broken it proves
/// nothing, because no reader believes they would ship it. So the drift is
/// MEASURED out of a real mechanism rather than drawn to a target.
///
/// The first attempt mixed the seed toward pure white and pure black in sRGB
/// and drifted **3.2 degrees** — nothing. Mixing toward a neutral holds hue
/// almost perfectly, so that is not where hand-built ramps go wrong.
///
/// What does it: mixing toward a TINTED white and a TINTED black. Reach for
/// the "off-white" and the "rich black" already in your palette — a cool paper
/// white, a near-black with some warmth in it — and every step inherits a
/// little of that cast, more at the ends than the middle. It is exactly what
/// building a ramp out of colours you already have looks like, and the hue
/// span falls out of the arithmetic rather than being chosen.
fn write_hue_drift(root: &PathBuf) {
    const SEED: &str = "#236ce1";
    // ONE shared domain for both tracks. Scaling each track to its own data
    // would rig the comparison: the held row's ten identical hues would spread
    // across the full width and prove the opposite of the point.
    const HUE_MIN: f32 = 243.0;
    const HUE_MAX: f32 = 289.0;
    // Mix factors toward white (light half) and black (dark half). Chosen to
    // land near the shipped ramp's lightness spacing so the two rows compare
    // like for like — the difference on show has to be hue, not lightness.
    const TOWARD_WHITE: [(&str, f32); 5] =
        [("50", 0.94), ("100", 0.82), ("200", 0.64), ("300", 0.46), ("400", 0.24)];
    const TOWARD_BLACK: [(&str, f32); 4] =
        [("600", 0.26), ("700", 0.52), ("800", 0.74), ("900", 0.88)];

    // The two ends a designer reaches for: a cool paper white and a warm rich
    // black. Neither is neutral, and that is the whole mechanism.
    let paper: Srgb<f32> = Srgb::<u8>::new(0xfb, 0xf7, 0xff).into_format();
    let rich: Srgb<f32> = Srgb::<u8>::new(0x14, 0x10, 0x06).into_format();
    let seed_rgb: Srgb<f32> = Srgb::<u8>::new(0x23, 0x6c, 0xe1).into_format();
    let mix = |target: Srgb<f32>, t: f32| Srgb::new(
        seed_rgb.red + (target.red - seed_rgb.red) * t,
        seed_rgb.green + (target.green - seed_rgb.green) * t,
        seed_rgb.blue + (target.blue - seed_rgb.blue) * t,
    );
    let describe = |rgb: Srgb<f32>, step: &str| {
        let oklch: Oklch = rgb.into_color();
        serde_json::json!({
            "step": step,
            "hex": oklch_to_hex(oklch).to_lowercase(),
            "hue": (oklch.hue.into_positive_degrees() * 10.0).round() / 10.0,
        })
    };

    let mut drifting = Vec::new();
    for (step, t) in TOWARD_WHITE {
        drifting.push(describe(mix(paper, t), step));
    }
    drifting.push(describe(seed_rgb, "500"));
    for (step, t) in TOWARD_BLACK {
        drifting.push(describe(mix(rich, t), step));
    }

    let pair = generate_brand_pair(ColorInput::Css(SEED.to_string())).expect("the brand seed");
    let held: Vec<serde_json::Value> = pair
        .light
        .swatches
        .iter()
        .map(|s| serde_json::json!({
            "step": s.label.to_string(),
            "hex": s.hex.to_lowercase(),
            // Swatch.h is signed (-180..180); normalise so the two rows compare.
            "hue": (((s.h % 360.0) + 360.0) % 360.0 * 10.0).round() / 10.0,
        }))
        .collect();

    let span = |rows: &[serde_json::Value]| {
        let hues: Vec<f32> = rows.iter().map(|r| r["hue"].as_f64().expect("a hue") as f32).collect();
        let (lo, hi) = hues.iter().fold((f32::MAX, f32::MIN), |(l, h), v| (l.min(*v), h.max(*v)));
        ((hi - lo) * 10.0).round() / 10.0
    };
    // A HUE SWEEP for the track's background. The track has to read as a hue
    // SCALE, not as a step axis: sitting under the tiles at the same width, a
    // plain rule invites the eye to map marker position to the tile above it,
    // which is a different quantity entirely and makes the diagram look broken.
    // Painting the actual spectrum removes the ambiguity — nobody reads a
    // spectrum as a row of steps.
    //
    // Sampled at the SEED's own lightness and chroma so the band is the same
    // blue family the diagram is about, not a generic rainbow.
    let seed_oklch: Oklch = seed_rgb.into_color();
    let sweep: Vec<serde_json::Value> = (0..=23)
        .map(|i| {
            let hue = HUE_MIN + (HUE_MAX - HUE_MIN) * (i as f32 / 23.0);
            serde_json::json!({
                "hue": (hue * 10.0).round() / 10.0,
                "hex": oklch_to_hex(Oklch::new(seed_oklch.l, seed_oklch.chroma, hue)).to_lowercase(),
            })
        })
        .collect();

    let dest = root.join("docs/generated/colour-02-hue-drift.json");
    std::fs::write(
        &dest,
        serde_json::to_string_pretty(&serde_json::json!({
            "seed": SEED,
            "drifting": { "how": "seed mixed in sRGB toward a cool paper white (#fbf7ff) and a warm rich black (#141006) — building a ramp from colours you already have",
                          "hueSpanDegrees": span(&drifting), "steps": drifting },
            "held": { "how": "harmoni-core generate_brand_pair, light palette",
                      "hueSpanDegrees": span(&held), "steps": held },
            "track": { "how": "hue sweep at the seed's own L and C — the background of the hue scale",
                       "hueMin": HUE_MIN, "hueMax": HUE_MAX, "samples": sweep },
        }))
        .expect("serialisable") + "\n",
    )
    .expect("writing the drift comparison");
    println!("wrote the COLOUR-02 comparison to {}", dest.display());
}
