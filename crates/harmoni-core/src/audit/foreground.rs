use crate::palette::generator::SwatchLabel;
use crate::SwatchStep;
use palette::color_difference::Wcag21RelativeContrast;
use palette::{IntoColor, LinSrgb, Oklch};
use serde::{Deserialize, Serialize};

/// Which tier of the fallback in [`get_best_foreground`] produced a
/// recommendation. A consumer (the plugin) maps this to an alias target —
/// the ramp's own step, or the soft/pure white/black anchor — so the chosen
/// foreground can be re-expressed as a Figma variable alias rather than a
/// baked colour. `Step900`/`Step50` are the harmonious tiers.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ForegroundSource {
    Step900,
    Step50,
    SoftWhite,
    SoftBlack,
    PureWhite,
    PureBlack,
}

// New return type — rich information for the UI and strict AA guarantee
#[derive(Debug, Clone, PartialEq)]
pub struct ForegroundRecommendation {
    pub color: SwatchStep,
    pub contrast_ratio: f32,
    pub source: ForegroundSource,
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

/// A ramp step that is readable against some other surface, with the contrast it
/// achieves there.
#[derive(Debug, Clone, PartialEq)]
pub struct ReadableStep {
    /// Which step of the ramp this is, so a consumer can re-express it as an
    /// alias (`{color.brand.600}`) rather than baking the colour.
    pub label: SwatchLabel,
    pub color: SwatchStep,
    pub contrast_ratio: f32,
}

/// The step of `ramp` to use for a role that must clear `threshold` against
/// `surface` — a link colour, a muted-text colour, a border (RFC 0027 §7).
///
/// [`get_best_foreground`] answers a different question: "what text goes on this
/// solid fill", drawing from the ramp's ends and the white/black anchors. It has
/// no answer for "which *mid-ramp* step is readable on some *other* surface",
/// which is the shape all three of those roles have — so they were hand-picked in
/// the semantic tier with nothing checking them, and all three drifted below
/// threshold silently.
///
/// Returns `None` when no step clears, which is the guarantee: a role that cannot
/// be satisfied says so instead of handing back the closest near-miss.
/// What a colour is used for. WCAG 2.2 sets a different bar for each, so this
/// is what a contrast number has to be read against — the same 4.71:1 is AA as
/// body copy, AAA at heading size, and comfortably past the non-text bar.
///
/// Large text is 18pt, or 14pt bold (WCAG 2.2 §1.4.3). Non-text is the
/// boundary of a control or a meaningful graphic (§1.4.11).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ContrastUse {
    BodyText,
    LargeText,
    NonText,
}

/// A WCAG conformance level.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Level {
    Aa,
    Aaa,
}

/// What a measured ratio actually achieves for a given use.
///
/// `LargeTextOnly` is the honest middle that a pass/fail badge cannot express:
/// the colour clears the large-text bar but not the body-text one, so it is
/// right for a heading and wrong for a paragraph.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Grade {
    Aaa,
    Aa,
    LargeTextOnly,
    Fail,
}

impl ContrastUse {
    /// The ratio this use must reach to satisfy `level`.
    ///
    /// `None` where the standard defines no such bar: §1.4.11 has a single 3:1
    /// requirement and no enhanced tier, and reporting a number there would
    /// invent a standard that does not exist.
    pub fn floor(self, level: Level) -> Option<f32> {
        match (self, level) {
            (ContrastUse::BodyText, Level::Aa) => Some(4.5),
            (ContrastUse::BodyText, Level::Aaa) => Some(7.0),
            (ContrastUse::LargeText, Level::Aa) => Some(3.0),
            (ContrastUse::LargeText, Level::Aaa) => Some(4.5),
            (ContrastUse::NonText, Level::Aa) => Some(3.0),
            (ContrastUse::NonText, Level::Aaa) => None,
        }
    }
}

/// What `ratio` achieves when the colour is used as `r#use`.
///
/// Reported as a level rather than a number because a level is what a designer
/// decides on; the ratio is the evidence behind it. Non-text never reports
/// `Aaa` — §1.4.11 has no such tier.
pub fn grade(ratio: f32, r#use: ContrastUse) -> Grade {
    if let Some(enhanced) = r#use.floor(Level::Aaa) {
        if ratio >= enhanced {
            return Grade::Aaa;
        }
    }

    let minimum = r#use
        .floor(Level::Aa)
        .expect("every use defines an AA bar");
    if ratio >= minimum {
        return Grade::Aa;
    }

    // Body text is the only use with a bar below its own: a ratio that misses
    // 4.5:1 may still be a genuine AA pass at heading size.
    let large = ContrastUse::LargeText
        .floor(Level::Aa)
        .expect("large text defines an AA bar");
    if r#use == ContrastUse::BodyText && ratio >= large {
        return Grade::LargeTextOnly;
    }

    Grade::Fail
}

/// The ramp is a plain slice of colours rather than a `Palette` because that is
/// all this needs — the foreground pairing a `Palette` also carries is a
/// different question. Taking the narrower type is what lets a caller ask about
/// a ramp it did not generate, such as the one the token layer ships.
pub fn readable_step(
    ramp: &[SwatchStep],
    surface: &SwatchStep,
    threshold: f32,
) -> Option<ReadableStep> {
    let surface_luminance = relative_luminance(surface.l, surface.c, surface.h);

    ramp.iter()
        .map(|swatch| {
            let ratio = wcag_contrast(
                surface_luminance,
                relative_luminance(swatch.l, swatch.c, swatch.h),
            );
            (swatch, ratio)
        })
        .filter(|(_, ratio)| *ratio >= threshold)
        // The *quietest* step that clears, not the first one found. A role wants
        // the least contrast that still passes — a border pushed to body-text
        // weight passes a floor and looks like a mistake. Ramp order matches
        // increasing contrast only while the ramp and the surface share a theme,
        // so ordering cannot be relied on to give this for free.
        .min_by(|(_, a), (_, b)| a.total_cmp(b))
        .map(|(swatch, ratio)| ReadableStep {
            label: swatch.label.clone(),
            color: SwatchStep::from_label(swatch.l, swatch.c, swatch.h, swatch.label.clone()),
            contrast_ratio: ratio,
        })
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
            source: ForegroundSource::Step900,
        };
    }

    // 2. Otherwise prefer the harmonious light candidate (palette's 50).
    if ratio_light >= 4.5 {
        return ForegroundRecommendation {
            color: light_candidate.clone(),
            contrast_ratio: ratio_light,
            source: ForegroundSource::Step50,
        };
    }

    // 3. Otherwise use the soft white primitive when one was supplied.
    if let Some(white) = custom_white {
        let ratio = (relative_luminance(white.l, white.c, white.h) + 0.05) / (bg_lum + 0.05);
        if ratio >= 4.5 {
            return ForegroundRecommendation {
                color: SwatchStep::from_label(white.l, white.c, white.h, "White"),
                contrast_ratio: ratio,
                source: ForegroundSource::SoftWhite,
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
                source: ForegroundSource::SoftBlack,
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
            source: ForegroundSource::PureWhite,
        };
    }

    if ratio_black >= 4.5 {
        return ForegroundRecommendation {
            color: SwatchStep::from_label(0.01, 0.0, 0.0, "Black"),
            contrast_ratio: ratio_black,
            source: ForegroundSource::PureBlack,
        };
    }

    unreachable!("Pure white and pure black both failed AA — impossible for valid sRGB colors");
}
