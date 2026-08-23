//! The property every curve preset rests on.
//!
//! A preset only chooses which shape the padding → anchoring chain works from,
//! so a family is free to look like anything — except that a lightness ramp
//! must keep its order. A curve that turns over renders 300 darker than 400; a
//! curve that plateaus renders two steps as the same colour. Both are the
//! defect the anchored model exists to prevent (RFC 0027 §12.2), and neither is
//! visible from any single family's formula.
//!
//! This gate is deliberately exhaustive rather than sampled: it is cheap, and
//! the failure it guards against is a single family × direction × length
//! combination that nobody would think to try by hand.

use harmoni_core::palette::easing::{curve, CurvePreset, Direction, Easing};
use harmoni_core::palette::generator::{MAX_STEPS, MIN_STEPS};

const FAMILIES: [Easing; 9] = [
    Easing::Linear,
    Easing::Quadratic,
    Easing::Cubic,
    Easing::Quartic,
    Easing::Quintic,
    Easing::Sine,
    Easing::Exponential,
    Easing::Circular,
    Easing::Arc,
];

const DIRECTIONS: [Direction; 3] = [
    Direction::EaseIn,
    Direction::EaseOut,
    Direction::EaseInOut,
];

/// Accents spanning the arc's whole range, plus the out-of-range values the
/// clamp has to absorb. Every other family ignores this.
const ACCENTS: [f32; 7] = [-1.0, 0.0, 0.25, 0.5, 0.75, 1.0, 2.0];

fn every_curve(mut check: impl FnMut(&CurvePreset, usize, &[f32])) {
    for easing in FAMILIES {
        for direction in DIRECTIONS {
            for accent in ACCENTS {
                for count in MIN_STEPS..=MAX_STEPS {
                    let preset = CurvePreset::new(easing, direction).with_accent(accent);
                    let samples = curve(&preset, count);
                    check(&preset, count, &samples);
                }
            }
        }
    }
}

#[test]
fn every_curve_stays_within_the_unit_interval() {
    every_curve(|preset, count, samples| {
        for (i, &s) in samples.iter().enumerate() {
            assert!(
                (0.0..=1.0).contains(&s),
                "{preset:?} at {count} steps: sample {i} is {s}, outside 0..=1"
            );
        }
    });
}

#[test]
fn every_curve_ascends_without_ever_turning_over() {
    every_curve(|preset, count, samples| {
        for pair in samples.windows(2) {
            assert!(
                pair[1] >= pair[0],
                "{preset:?} at {count} steps turns over: {samples:?}"
            );
        }
    });
}

#[test]
fn every_curve_spans_the_full_interval_end_to_end() {
    every_curve(|preset, count, samples| {
        assert_eq!(samples.len(), count, "{preset:?}: wrong sample count");
        assert_eq!(
            samples.first().copied(),
            Some(0.0),
            "{preset:?} at {count} steps does not start at 0"
        );
        assert_eq!(
            samples.last().copied(),
            Some(1.0),
            "{preset:?} at {count} steps does not reach 1"
        );
    });
}

/// A guard on the guard: if the sweep above ever stopped covering anything, the
/// three tests would pass vacuously and say nothing.
#[test]
fn the_gate_covers_every_family_direction_and_length() {
    let mut seen = 0;
    every_curve(|_, _, _| seen += 1);

    assert_eq!(
        seen,
        FAMILIES.len() * DIRECTIONS.len() * ACCENTS.len() * (MAX_STEPS - MIN_STEPS + 1)
    );
}

/// The claim the opt-in design rests on: the authored default is not any of the
/// nine presets, so `None` has to stay a separate case rather than becoming a
/// tenth entry in the list.
///
/// The absolute ramp values are pinned elsewhere — by `ramp_regression.rs` and
/// by primitiv-emit's goldens, which is what proves the token layer did not
/// move. What is checked here is the part those cannot see: that no preset
/// reproduces the default, so a caller who opts in always gets a real change.
#[test]
fn no_preset_reproduces_the_authored_default() {
    use harmoni_core::api::{generate_with_options, GenerateOptions};
    use harmoni_core::color::input::ColorInput;

    let brand = || ColorInput::Oklch {
        l: 0.55,
        c: 0.15,
        h: 240.0,
    };
    let default_options = GenerateOptions::default();
    assert_eq!(default_options.curve, None, "the default must stay opt-in");

    let authored = generate_with_options(brand(), default_options).unwrap();

    for easing in FAMILIES {
        for direction in DIRECTIONS {
            let preset = CurvePreset::new(easing, direction);
            let shaped = generate_with_options(
                brand(),
                GenerateOptions {
                    curve: Some(preset),
                    ..GenerateOptions::default()
                },
            )
            .unwrap();

            assert_ne!(
                shaped.swatches, authored.swatches,
                "{preset:?} reproduces the authored default, so opting into it does nothing"
            );
        }
    }
}
