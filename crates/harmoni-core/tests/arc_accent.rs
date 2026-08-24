//! Properties of `Easing::Arc`'s accent that no single-point assertion catches.
//!
//! `palette::easing_tests::arc` already pins the two ends and the midpoint at
//! specific sample values. What it cannot show is the *shape of the sweep*
//! between them, and that shape is the reason `DEFAULT_ARC_ACCENT` is 0.5.
//! These guards exist because the 2026-08-24 easing-glyph rebuild raised the
//! default as a suspected bug — the default arc draws as very nearly a straight
//! line — and answering it needed facts the unit tests do not state.
//!
//! Read the endpoint mapping carefully: it is RELATIVE TO `Direction`, which is
//! what makes the prose easy to get wrong. Under `EaseOut` accent 0 gives
//! `Sine` ease-out; under `EaseIn` the same accent gives `Sine` ease-in. Both
//! are the same fact seen through the direction flip.

use harmoni_core::{curve, CurvePreset, Direction, Easing, DEFAULT_ARC_ACCENT};

/// Enough samples that a shape difference cannot hide between them.
const SAMPLES: usize = 33;

fn shape(easing: Easing, direction: Direction) -> Vec<f32> {
    curve(&CurvePreset::new(easing, direction), SAMPLES)
}

fn arc(accent: f32, direction: Direction) -> Vec<f32> {
    curve(
        &CurvePreset::new(Easing::Arc, direction).with_accent(accent),
        SAMPLES,
    )
}

fn max_diff(a: &[f32], b: &[f32]) -> f32 {
    a.iter()
        .zip(b)
        .map(|(x, y)| (x - y).abs())
        .fold(0.0, f32::max)
}

/// How far a shape strays from a straight line — the measure of whether `Arc`
/// is contributing anything at a given accent.
fn deviation_from_linear(accent: f32) -> f32 {
    max_diff(
        &arc(accent, Direction::EaseIn),
        &shape(Easing::Linear, Direction::EaseIn),
    )
}

/// The claim in `DEFAULT_ARC_ACCENT`'s doc comment, pinned in BOTH directions
/// so the next reader cannot take one of them for the whole truth.
#[test]
fn the_endpoint_mapping_is_relative_to_direction() {
    for (direction, at_zero, at_one) in [
        (Direction::EaseOut, Direction::EaseOut, Direction::EaseIn),
        (Direction::EaseIn, Direction::EaseIn, Direction::EaseOut),
    ] {
        assert!(
            max_diff(&arc(0.0, direction), &shape(Easing::Sine, at_zero)) < 1e-6,
            "under {direction:?}, accent 0 should reproduce Sine {at_zero:?}"
        );
        assert!(
            max_diff(&arc(1.0, direction), &shape(Easing::Sine, at_one)) < 1e-6,
            "under {direction:?}, accent 1 should reproduce Sine {at_one:?}"
        );
    }
}

/// The default is the FLATTEST point of the sweep, not the most distinctive
/// one. That is deliberate — see `DEFAULT_ARC_ACCENT` — but it is the opposite
/// of what "contributes a shape nothing else can make" suggests at a glance,
/// so it is pinned rather than left to be rediscovered as a bug.
#[test]
fn the_default_accent_is_the_flattest_point_of_the_sweep() {
    let default = deviation_from_linear(DEFAULT_ARC_ACCENT);

    for step in 0..=20 {
        let accent = step as f32 / 20.0;
        if (accent - DEFAULT_ARC_ACCENT).abs() < 1e-6 {
            continue;
        }
        assert!(
            deviation_from_linear(accent) > default,
            "accent {accent} strays {:.4} from linear, less than the default's {default:.4}",
            deviation_from_linear(accent)
        );
    }

    assert!(
        default < 0.03,
        "at the default the arc is within a hair of straight: {default:.4}"
    );
}

/// The sweep is symmetric about the default, which is what makes 0.5 the only
/// accent that does not lean the shape toward one end — the job [`Direction`]
/// already does.
#[test]
fn the_sweep_is_symmetric_about_the_default() {
    for step in 1..=5 {
        let offset = step as f32 / 10.0;
        let below = deviation_from_linear(DEFAULT_ARC_ACCENT - offset);
        let above = deviation_from_linear(DEFAULT_ARC_ACCENT + offset);
        assert!(
            (below - above).abs() < 1e-5,
            "offset {offset}: {below:.5} below vs {above:.5} above"
        );
    }
}
