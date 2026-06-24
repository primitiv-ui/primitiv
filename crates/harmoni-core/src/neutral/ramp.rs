use palette::Oklch;

use crate::audit::contrast::get_contrast_rating_for_step;
use crate::audit::foreground::get_best_foreground;
use crate::palette::generator::{Palette, Swatch, SwatchLabel, SwatchStep, TARGET_LIGHTNESS};

#[derive(Debug, Clone, Copy, PartialEq, Default)]
pub enum TintMode {
    #[default]
    Inherit,
    Achromatic,
}

const STEPS: [u16; 10] = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

/// Interpolate a hue from `from` to `to` along the **shortest arc** in degrees.
/// Crossing the 0°/360° seam (e.g. 350° → 10°) rotates the short way (+20°
/// through 0°) rather than the long way (−340° through 180°).
fn lerp_hue_shortest(from: f32, to: f32, t: f32) -> f32 {
    let delta = ((to - from + 540.0) % 360.0) - 180.0;
    // Normalise to the (−180, 180] range `OklabHue::into_degrees` returns, so
    // the equal-hue case is bit-identical to the old single-hue ramp.
    ((from + delta * t + 180.0).rem_euclid(360.0)) - 180.0
}

pub fn generate_neutral_ramp(soft_white: Oklch, soft_black: Oklch, tint: TintMode) -> Palette {
    let white_hue = soft_white.hue.into_degrees();
    let black_hue = soft_black.hue.into_degrees();
    let last = STEPS.len() - 1;
    let curve_span = TARGET_LIGHTNESS[0] - TARGET_LIGHTNESS[last];
    let apply_tint = |c: f32| match tint {
        TintMode::Inherit => c,
        TintMode::Achromatic => 0.0,
    };
    let backgrounds: Vec<SwatchStep> = STEPS
        .iter()
        .enumerate()
        .map(|(i, &step)| {
            if i == 0 {
                SwatchStep::from_label(soft_white.l, apply_tint(soft_white.chroma), white_hue, step)
            } else if i == last {
                SwatchStep::from_label(soft_black.l, apply_tint(soft_black.chroma), black_hue, step)
            } else {
                let fraction = (TARGET_LIGHTNESS[0] - TARGET_LIGHTNESS[i]) / curve_span;
                let l = soft_white.l + (soft_black.l - soft_white.l) * fraction;
                let c = soft_white.chroma + (soft_black.chroma - soft_white.chroma) * fraction;
                let hue = lerp_hue_shortest(white_hue, black_hue, fraction);
                SwatchStep::from_label(l, apply_tint(c), hue, step)
            }
        })
        .collect();

    let dark_candidate = backgrounds
        .iter()
        .find(|bg| bg.label == SwatchLabel::Number(900))
        .expect("neutral ramp must include a 900 step");

    let light_candidate = backgrounds
        .iter()
        .find(|bg| bg.label == SwatchLabel::Number(50))
        .expect("neutral ramp must include a 50 step");

    let soft_white_candidate = SwatchStep::from_label(
        soft_white.l,
        soft_white.chroma,
        soft_white.hue.into_degrees(),
        SwatchLabel::Name(String::from("White")),
    );
    let soft_black_candidate = SwatchStep::from_label(
        soft_black.l,
        soft_black.chroma,
        soft_black.hue.into_degrees(),
        SwatchLabel::Name(String::from("Black")),
    );

    let swatches: Vec<Swatch> = backgrounds
        .iter()
        .map(|background| {
            let recommendation = get_best_foreground(
                background,
                dark_candidate,
                light_candidate,
                Some(&soft_white_candidate),
                Some(&soft_black_candidate),
            );
            let contrast_result = get_contrast_rating_for_step(background, &recommendation.color);
            Swatch {
                l: background.l,
                c: background.c,
                h: background.h,
                label: background.label.clone(),
                hex: background.hex.clone(),
                rgb: background.rgb,
                oklch: background.oklch.clone(),
                best_foreground: recommendation.color,
                foreground_source: recommendation.source,
                contrast_result,
            }
        })
        .collect();

    let lightness_curve = [
        soft_white.l,
        soft_white.l,
        soft_white.l,
        soft_white.l,
        soft_white.l,
        soft_white.l,
        soft_white.l,
        soft_white.l,
        soft_white.l,
        soft_black.l,
    ];

    Palette {
        swatches,
        lightness_curve,
        max_recommended_light_padding: 0.0,
        max_recommended_dark_padding: 0.0,
        note: String::new(),
    }
}
