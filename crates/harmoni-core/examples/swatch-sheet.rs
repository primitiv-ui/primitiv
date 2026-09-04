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

/// The COLOUR-02 counter-example: a ramp built the way ramps get built by
/// hand, so the drift is MEASURED rather than drawn.
///
/// The brief asks for "realistic hue drift, roughly 30 degrees" and forbids
/// caricature — if the wrong ramp looks obviously broken it proves nothing,
/// because no reader believes they would ship it. THREE MECHANISMS WERE TRIED;
/// the first two are recorded because both look right on paper and fail:
///
///  1. Mix the seed toward pure white and pure black in sRGB — the obvious
///     guess at "built by hand". Drifts **3.2 degrees**. Mixing toward a
///     NEUTRAL holds hue almost perfectly, so this is not where ramps go wrong.
///  2. Mix toward a TINTED white and black. Drifts 35.7 degrees, which sounds
///     right and looks wrong: the mix factor is tiny mid-ramp, so ALL of that
///     span sits in the two end steps (24 and 12 degrees) while six of the
///     middle eight stay within 2.4. Eight of ten swatches were visually
///     identical to the held ramp. **A range is not a drift.**
///  3. Interpolate in sRGB between two hand-picked ends through the seed.
///     Worse: 24.5 degrees, middle seven within 3.7. Blending a pale end into
///     a saturated seed snaps the hue to the saturated one almost at once.
///
/// What is used: TAKE THE REAL RAMP'S LIGHTNESS AND CHROMA, AND DRIFT ONLY THE
/// HUE, steadily, step by step. That is what picking each step by eye in a
/// colour picker actually produces — the designer matches the lightness they
/// want and lets the hue wander — and it is the only construction that isolates
/// the one variable this diagram is about. Both rows then differ in hue and
/// nothing else, so the comparison cannot be accused of smuggling in a
/// lightness or saturation difference, and the drift spreads evenly across the
/// hue track instead of hiding in two outliers.
///
/// The offset is pinned to 0 at step 500 so both ramps share the seed exactly,
/// as the real ones do.
fn write_hue_drift(root: &PathBuf) {
    const SEED: &str = "#236ce1";
    // A CONSTANT drift per step, symmetric about the seed. An earlier version
    // ran +16 to 0 across five steps and 0 to -15 across four, which pinned the
    // seed at 500 but made every gap in the dark half wider than every gap in
    // the light half — visible on the track as rings that are not evenly
    // spread. One constant is worth more here than the pinned 500, which is
    // invisible in the diagram anyway: the two ramps' 500s now differ by 1.6
    // degrees, which no eye can see, and the rings space evenly.
    const DRIFT_PER_STEP: f32 = 3.2;
    const STEPS: usize = 10;
    // Half the domain, in degrees either side of the seed. Centred on the seed
    // so the HELD row's stack lands dead centre of the scale and the drifting
    // row scatters symmetrically around it. Centring on nothing in particular
    // put the held stack at 37% and made it look misplaced.
    const HUE_HALF_SPAN: f32 = 20.0;

    let seed_rgb: Srgb<f32> = Srgb::<u8>::new(0x23, 0x6c, 0xe1).into_format();
    let seed_oklch: Oklch = seed_rgb.into_color();
    let seed_hue = seed_oklch.hue.into_positive_degrees();

    let pair = generate_brand_pair(ColorInput::Css(SEED.to_string())).expect("the brand seed");
    let real = &pair.light.swatches;

    // Hue offset per step: one constant wander, symmetric about the seed.
    let centre = (STEPS - 1) as f32 / 2.0;
    let offset = |i: usize| -> f32 { (centre - i as f32) * DRIFT_PER_STEP };
    let drifting: Vec<serde_json::Value> = real
        .iter()
        .enumerate()
        .map(|(i, sw)| {
            // Same L, same C, drifted H. One variable.
            let drifted = Oklch::new(sw.l, sw.c, seed_hue + offset(i));
            serde_json::json!({
                "step": sw.label.to_string(),
                "hex": oklch_to_hex(drifted).to_lowercase(),
                "hue": ((seed_hue + offset(i)) * 10.0).round() / 10.0,
            })
        })
        .collect();

    let pair = generate_brand_pair(ColorInput::Css(SEED.to_string())).expect("the brand seed");
    let held: Vec<serde_json::Value> = pair
        .light
        .swatches
        .iter()
        .map(|s| {
            serde_json::json!({
                "step": s.label.to_string(),
                "hex": s.hex.to_lowercase(),
                // Swatch.h is signed (-180..180); normalise so the two rows compare.
                "hue": (((s.h % 360.0) + 360.0) % 360.0 * 10.0).round() / 10.0,
            })
        })
        .collect();

    let span = |rows: &[serde_json::Value]| {
        let hues: Vec<f32> = rows
            .iter()
            .map(|r| r["hue"].as_f64().expect("a hue") as f32)
            .collect();
        let (lo, hi) = hues
            .iter()
            .fold((f32::MAX, f32::MIN), |(l, h), v| (l.min(*v), h.max(*v)));
        ((hi - lo) * 10.0).round() / 10.0
    };

    // A HUE SWEEP for the track's background. The track has to read as a hue
    // SCALE, not as a step axis: sitting under the tiles at the same width, a
    // plain rule invites the eye to map marker position to the tile above it,
    // which is a different quantity entirely and makes the diagram look broken.
    // Painting the actual spectrum removes the ambiguity — nobody reads a
    // spectrum as a row of steps. Sampled at the SEED's own lightness and
    // chroma so the band is the blue family the diagram is about.
    let hue_min = seed_hue - HUE_HALF_SPAN;
    let hue_max = seed_hue + HUE_HALF_SPAN;
    let sweep: Vec<serde_json::Value> = (0..=23)
        .map(|i| {
            let hue = hue_min + (hue_max - hue_min) * (i as f32 / 23.0);
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
            "drifting": { "how": "the real ramp's lightness and chroma with a constant 3.2 degrees of hue drift per step, symmetric about the seed — what picking each step by eye produces, and the only construction that isolates hue",
                          "hueSpanDegrees": span(&drifting), "steps": drifting },
            "held": { "how": "harmoni-core generate_brand_pair, light palette",
                      "hueSpanDegrees": span(&held), "steps": held },
            "track": { "how": "hue sweep at the seed's own L and C — the background of the hue scale",
                       "hueMin": (hue_min * 10.0).round() / 10.0,
                       "hueMax": (hue_max * 10.0).round() / 10.0,
                       "samples": sweep },
        }))
        .expect("serialisable") + "\n",
    )
    .expect("writing the drift comparison");
    println!("wrote the COLOUR-02 comparison to {}", dest.display());
}
