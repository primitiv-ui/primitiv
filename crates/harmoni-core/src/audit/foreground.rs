use crate::SwatchStep;
use palette::color_difference::Wcag21RelativeContrast;
use palette::{IntoColor, LinSrgb, Oklch};

// New return type — rich information for the UI and strict AA guarantee
#[derive(Debug, Clone, PartialEq)]
pub struct ForegroundRecommendation {
    pub color: SwatchStep,
    pub contrast_ratio: f32,
    pub is_harmonious: bool, // true = used palette's own step 50 or 900
}

fn relative_luminance(l: f32, c: f32, h: f32) -> f32 {
    let lin: LinSrgb = Oklch::new(l, c, h).into_color();
    lin.relative_luminance().luma
}

/// WCAG 2.1 contrast ratio between two relative luminances, independent of
/// which one is lighter — `(lighter + 0.05) / (darker + 0.05)`. Candidates
/// can sit on either side of the background (a dark palette's step 900 is
/// lighter than its backgrounds; a light palette's is darker), so contrast
/// must be scored symmetrically.
fn wcag_contrast(lum_a: f32, lum_b: f32) -> f32 {
    let (lighter, darker) = if lum_a >= lum_b {
        (lum_a, lum_b)
    } else {
        (lum_b, lum_a)
    };
    (lighter + 0.05) / (darker + 0.05)
}

/// Picks the best foreground for `background` from a tiered candidate set:
/// the palette's harmonious dark (step 900) and light (step 50), then the
/// soft white/black primitives when supplied, then pure white/black as a
/// guaranteed AA-passing last resort. Pure white/black are always evaluated
/// last so that — for any sRGB-representable background — at least one
/// candidate clears the 4.5:1 threshold.
pub fn get_best_foreground(
    background: &SwatchStep,
    dark_candidate: &SwatchStep,
    light_candidate: &SwatchStep,
    custom_white: Option<&SwatchStep>,
    custom_black: Option<&SwatchStep>,
) -> ForegroundRecommendation {
    let bg_lum = relative_luminance(background.l, background.c, background.h);
    let dark_lum = relative_luminance(dark_candidate.l, dark_candidate.c, dark_candidate.h);
    let light_lum = relative_luminance(light_candidate.l, light_candidate.c, light_candidate.h);

    let ratio_dark = wcag_contrast(bg_lum, dark_lum);
    let ratio_light = wcag_contrast(bg_lum, light_lum);

    // 1. Prefer the harmonious dark candidate (palette's 900) if it meets AA.
    if ratio_dark >= 4.5 {
        return ForegroundRecommendation {
            color: dark_candidate.clone(),
            contrast_ratio: ratio_dark,
            is_harmonious: true,
        };
    }

    // 2. Otherwise prefer the harmonious light candidate (palette's 50).
    if ratio_light >= 4.5 {
        return ForegroundRecommendation {
            color: light_candidate.clone(),
            contrast_ratio: ratio_light,
            is_harmonious: true,
        };
    }

    // 3. Otherwise use the soft white primitive when one was supplied.
    if let Some(white) = custom_white {
        let ratio = (relative_luminance(white.l, white.c, white.h) + 0.05) / (bg_lum + 0.05);
        if ratio >= 4.5 {
            return ForegroundRecommendation {
                color: SwatchStep::from_label(white.l, white.c, white.h, "White"),
                contrast_ratio: ratio,
                is_harmonious: false,
            };
        }
    }

    // 4. Otherwise use the soft black primitive when one was supplied.
    if let Some(black) = custom_black {
        let ratio = (bg_lum + 0.05) / (relative_luminance(black.l, black.c, black.h) + 0.05);
        if ratio >= 4.5 {
            return ForegroundRecommendation {
                color: SwatchStep::from_label(black.l, black.c, black.h, "Black"),
                contrast_ratio: ratio,
                is_harmonious: false,
            };
        }
    }

    // 5/6. Pure white / pure black — the guaranteed AA-passing last resort.
    // For any sRGB-representable background, at least one of these clears
    // 4.5:1; this is guaranteed by the WCAG relative luminance formula.
    let ratio_white = (relative_luminance(1.0, 0.0, 0.0) + 0.05) / (bg_lum + 0.05);
    let ratio_black = (bg_lum + 0.05) / (relative_luminance(0.01, 0.0, 0.0) + 0.05);

    if ratio_white >= 4.5 && ratio_white >= ratio_black {
        return ForegroundRecommendation {
            color: SwatchStep::from_label(1.0, 0.0, 0.0, "White"),
            contrast_ratio: ratio_white,
            is_harmonious: false,
        };
    }

    if ratio_black >= 4.5 {
        return ForegroundRecommendation {
            color: SwatchStep::from_label(0.01, 0.0, 0.0, "Black"),
            contrast_ratio: ratio_black,
            is_harmonious: false,
        };
    }

    unreachable!("Pure white and pure black both failed AA — impossible for valid sRGB colors");
}
