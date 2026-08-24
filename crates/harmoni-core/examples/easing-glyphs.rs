//! Print the polyline geometry for the `Harmoni / Easing Glyph` Figma set.
//!
//! The glyph is a 12x12 box holding one sampled polyline per preset, so the
//! set is derived from the engine rather than drawn by hand. Run it and feed
//! the JSON to the Figma bridge.
//!
//! It was three bars until 2026-08-24. Quantised to the pixel grid the glyph
//! renders on, three samples produced only eight distinct marks across the 27
//! variants — with `count == 3` the ends are always 0 and 1, so the middle
//! sample carried everything and all nine `EaseInOut` variants drew the same
//! picture. See the component description in Figma for the full account.

use harmoni_core::{curve, CurvePreset, Direction, Easing};

/// Samples per glyph — enough for a smooth line in a 12 px box.
const SAMPLES: usize = 17;

const EASINGS: [(&str, Easing); 9] = [
    ("Linear", Easing::Linear),
    ("Quadratic", Easing::Quadratic),
    ("Cubic", Easing::Cubic),
    ("Quartic", Easing::Quartic),
    ("Quintic", Easing::Quintic),
    ("Sine", Easing::Sine),
    ("Exponential", Easing::Exponential),
    ("Circular", Easing::Circular),
    ("Arc", Easing::Arc),
];

const DIRECTIONS: [(&str, Direction); 3] = [
    ("Ease in", Direction::EaseIn),
    ("Ease out", Direction::EaseOut),
    ("Ease in-out", Direction::EaseInOut),
];

/// Sample the curve into the glyph's 1..=10 px height range.
fn heights(preset: &CurvePreset) -> Vec<f32> {
    curve(preset, SAMPLES)
        .into_iter()
        .map(|t| 1.0 + t * 9.0)
        .collect()
}

fn main() {
    println!("{{");
    let mut first = true;
    for (ename, easing) in EASINGS {
        for (dname, direction) in DIRECTIONS {
            let values: Vec<String> = heights(&CurvePreset::new(easing, direction))
                .iter()
                .map(|v| format!("{v:.3}"))
                .collect();
            if !first {
                println!(",");
            }
            first = false;
            print!(
                "  \"Easing={ename}, Direction={dname}\": [{}]",
                values.join(",")
            );
        }
    }
    println!("\n}}");
}
