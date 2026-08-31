use palette::Oklch;

use crate::audit::contrast::get_contrast_rating_for_step;
use crate::audit::foreground::get_best_foreground;
use crate::palette::generator::{
    resample, step_labels, Palette, Swatch, SwatchLabel, SwatchStep, DEFAULT_STEPS,
    TARGET_LIGHTNESS,
};

#[derive(Debug, Clone, Copy, PartialEq, Default)]
pub enum TintMode {
    #[default]
    Inherit,
    Achromatic,
}

/// Shaping parameters for [`generate_neutral_ramp`]. A struct (rather than a
/// trailing argument) so further shaping knobs can land without churning every
/// call site or the wasm signature.
#[derive(Debug, Clone, Copy, PartialEq, Default)]
pub struct RampOptions {
    /// Mid-tone chroma bow in `[0, 1]`. `0` keeps chroma a straight lerp between
    /// the anchors (the monotone default); a positive bow crests chroma through
    /// the mid-tones via a `4t(1−t)` parabola that is zero at both endpoints.
    pub bow: f32,
}

/// Interpolate a hue from `from` to `to` along the **shortest arc** in degrees.
/// Crossing the 0°/360° seam (e.g. 350° → 10°) rotates the short way (+20°
/// through 0°) rather than the long way (−340° through 180°).
fn lerp_hue_shortest(from: f32, to: f32, t: f32) -> f32 {
    let delta = ((to - from + 540.0) % 360.0) - 180.0;
    // Normalise to the (−180, 180] range `OklabHue::into_degrees` returns, so
    // the equal-hue case is bit-identical to the old single-hue ramp.
    ((from + delta * t + 180.0).rem_euclid(360.0)) - 180.0
}

/// Builds a neutral ramp of `steps` steps between the two soft anchors.
///
/// A ramp's length is a user knob, and a neutral ramp has to be able to follow
/// its solid companions: it sits beside brand/danger/... in one collection, so
/// a ten-step neutral against a seven-step brand would carry two different
/// label sets for one palette. Labels come from [`step_labels`], the same
/// ladder every solid ramp walks.
///
/// `steps` must be within `MIN_STEPS..=MAX_STEPS`. The `api` layer is what
/// guarantees that for every caller — the same arrangement
/// `generate_alpha_ramp_with_steps` uses.
pub fn generate_neutral_ramp_with_steps(
    soft_white: Oklch,
    soft_black: Oklch,
    tint: TintMode,
    options: RampOptions,
    steps: usize,
) -> Palette {
    let bow = options.bow.clamp(0.0, 1.0);
    let peak = soft_white.chroma.max(soft_black.chroma);
    let white_hue = soft_white.hue.into_degrees();
    let black_hue = soft_black.hue.into_degrees();
    let labels = step_labels(steps);
    let last = labels.len() - 1;
    // The authored curve is a *shape* sampled at ten points; read it at this
    // ramp's own resolution so one curve serves every length. At ten steps
    // `resample` returns the curve's own points, so nothing moves.
    let curve = resample(&TARGET_LIGHTNESS, steps);
    let curve_span = curve[0] - curve[last];
    let apply_tint = |c: f32| match tint {
        TintMode::Inherit => c,
        TintMode::Achromatic => 0.0,
    };
    let backgrounds: Vec<SwatchStep> = labels
        .iter()
        .enumerate()
        .map(|(i, &step)| {
            if i == 0 {
                SwatchStep::from_label(soft_white.l, apply_tint(soft_white.chroma), white_hue, step)
            } else if i == last {
                SwatchStep::from_label(soft_black.l, apply_tint(soft_black.chroma), black_hue, step)
            } else {
                let fraction = (curve[0] - curve[i]) / curve_span;
                let l = soft_white.l + (soft_black.l - soft_white.l) * fraction;
                let linear_c =
                    soft_white.chroma + (soft_black.chroma - soft_white.chroma) * fraction;
                // `4t(1−t)` is 0 at both anchors and 1 at the mid-tone, so the
                // bow crests chroma through the middle without moving endpoints.
                let crest = 4.0 * fraction * (1.0 - fraction);
                let c = linear_c + bow * peak * crest;
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
        lightness_curve: lightness_curve.to_vec(),
        max_recommended_light_padding: 0.0,
        max_recommended_dark_padding: 0.0,
        note: String::new(),
    }
}

/// Builds a neutral ramp at the engine's default length — what a caller gets
/// without asking for anything else. One implementation, so the fixed and
/// stepped forms cannot drift.
pub fn generate_neutral_ramp(
    soft_white: Oklch,
    soft_black: Oklch,
    tint: TintMode,
    options: RampOptions,
) -> Palette {
    generate_neutral_ramp_with_steps(soft_white, soft_black, tint, options, DEFAULT_STEPS)
}
