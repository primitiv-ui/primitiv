use palette::{IntoColor, LinSrgb, Oklch};
use serde::{Deserialize, Serialize};

use crate::audit::contrast::get_contrast_rating_for_step;
use crate::audit::foreground::{get_best_foreground, ForegroundSource};
use crate::color::output::{format_oklch, oklch_to_hex, oklch_to_rgb, Rgb};
use crate::ContrastResult;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SwatchLabel {
    Number(u16),
    Name(String),
}

impl From<u16> for SwatchLabel {
    fn from(n: u16) -> Self {
        SwatchLabel::Number(n)
    }
}

impl From<&str> for SwatchLabel {
    fn from(s: &str) -> Self {
        SwatchLabel::Name(s.to_string())
    }
}

#[derive(PartialEq, Debug, Clone, Serialize, Deserialize)]
pub struct SwatchStep {
    pub l: f32,
    pub c: f32,
    pub h: f32,
    pub label: SwatchLabel,
    /// The colour as a `#rrggbb` sRGB hex string.
    pub hex: String,
    /// The colour as gamma-encoded sRGB, channels in `0.0..=1.0`.
    pub rgb: Rgb,
    /// The colour as a CSS `oklch(L C H)` string.
    pub oklch: String,
}

impl SwatchStep {
    pub fn from_label<T: Into<SwatchLabel>>(l: f32, c: f32, h: f32, label: T) -> Self {
        let color = Oklch::new(l, c, h);
        Self {
            l,
            c,
            h,
            label: label.into(),
            hex: oklch_to_hex(color),
            rgb: oklch_to_rgb(color),
            oklch: format_oklch(color),
        }
    }
}

#[derive(PartialEq, Debug, Clone, Serialize, Deserialize)]
pub struct Swatch {
    pub l: f32,
    pub c: f32,
    pub h: f32,
    pub label: SwatchLabel,
    /// The colour as a `#rrggbb` sRGB hex string.
    pub hex: String,
    /// The colour as gamma-encoded sRGB, channels in `0.0..=1.0`.
    pub rgb: Rgb,
    /// The colour as a CSS `oklch(L C H)` string.
    pub oklch: String,
    pub best_foreground: SwatchStep,
    /// Which tier of the contrast audit produced `best_foreground`. Lets a
    /// consumer re-express the foreground as a variable alias (the ramp's own
    /// step, or a white/black anchor) rather than a baked colour.
    pub foreground_source: ForegroundSource,
    pub contrast_result: ContrastResult,
}

/// A generated palette is a sequence of `Swatch`es — the items on a
/// lightness scale for a single hue. Includes metadata computed once
/// for the entire palette (based on hue) rather than per-swatch, and the
/// lightness curve used to generate the palette.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Palette {
    pub swatches: Vec<Swatch>,
    pub lightness_curve: [f32; 10],
    pub max_recommended_light_padding: f32,
    pub max_recommended_dark_padding: f32,
    pub note: String,
}

const STEPS: [u16; 10] = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

pub const TARGET_LIGHTNESS: [f32; 10] =
    [0.97, 0.91, 0.83, 0.76, 0.67, 0.55, 0.45, 0.32, 0.22, 0.15];

pub const TARGET_CHROMA_SCALE: [f32; 10] =
    [0.12, 0.35, 0.65, 0.80, 0.92, 1.0, 0.92, 0.80, 0.65, 0.50];

/// Absolute OkLCH lightness of step 50 in a dark palette — the darkest
/// background, pinned regardless of the brand colour.
const DARK_BG_ANCHOR: f32 = 0.21;

/// Absolute OkLCH lightness of step 900 in a dark palette — the lightest
/// text step, pinned regardless of the brand colour.
const DARK_TEXT_ANCHOR: f32 = 0.94;

/// Default monotonic-ascending shape reference for a dark palette. Only
/// the curve's *shape* is consumed by `generate_dark_palette`; the
/// absolute endpoints come from `DARK_BG_ANCHOR` / `DARK_TEXT_ANCHOR`.
pub const TARGET_LIGHTNESS_DARK: [f32; 10] =
    [0.21, 0.25, 0.30, 0.37, 0.46, 0.55, 0.66, 0.77, 0.87, 0.94];

/// Binary search for the maximum chroma that stays within the sRGB gamut
/// for a given OkLCH lightness and hue.
pub fn max_in_gamut_chroma(lightness: f32, hue: f32) -> f32 {
    let mut lo: f32 = 0.0;
    let mut hi: f32 = 0.4;

    for _ in 0..20 {
        let mid = (lo + hi) / 2.0;
        let srgb: LinSrgb = Oklch::new(lightness, mid, hue).into_color();

        if srgb.red >= -0.001
            && srgb.red <= 1.001
            && srgb.green >= -0.001
            && srgb.green <= 1.001
            && srgb.blue >= -0.001
            && srgb.blue <= 1.001
        {
            lo = mid;
        } else {
            hi = mid;
        }
    }

    lo
}

fn apply_padding_to_lightness(
    lightness_scale: &[f32],
    light_padding: f32,
    dark_padding: f32,
) -> Vec<f32> {
    lightness_scale
        .iter()
        .enumerate()
        .map(|(i, &l)| {
            let n = i as f32 / (lightness_scale.len() as f32 - 1.0);
            let light_influence = (1.0 - n).powi(2);
            let dark_influence = n.powi(3);
            let delta = light_padding * light_influence - dark_padding * dark_influence;

            (l + delta).clamp(0.01, 0.99)
        })
        .collect()
}

fn get_max_recommended_light_padding(hue: f32) -> f32 {
    // Yellow/orange hues have less headroom
    if hue > 40.0 && hue < 100.0 {
        0.24
    } else {
        0.32
    }
}

fn get_max_recommended_dark_padding(hue: f32) -> f32 {
    if hue > 30.0 && hue < 90.0 {
        0.14
    } else {
        0.20
    }
}

pub fn validate_lightness_curve(lightness: [f32; 10]) -> Result<(), String> {
    // Check range: all values in [0.0, 1.0]
    // Array length is enforced by type system [f32; 10]
    for (i, &value) in lightness.iter().enumerate() {
        if value < 0.0 || value > 1.0 {
            return Err(format!("Lightness at index {} out of range: {}", i, value));
        }
    }
    Ok(())
}

/// Shared tail of palette generation: given the per-step background
/// colours, pick each swatch's best foreground via the contrast audit and
/// assemble the `Palette`. Independent of how `backgrounds` was derived.
fn assemble_palette(
    backgrounds: Vec<SwatchStep>,
    lightness_curve: [f32; 10],
    base_hue: f32,
    soft_white: Option<Oklch>,
    soft_black: Option<Oklch>,
) -> Palette {
    let dark_candidate = backgrounds
        .iter()
        .find(|background| background.label == SwatchLabel::Number(900))
        .expect("Palette must contain a 900 step to act as a dark candidate");

    let light_candidate = backgrounds
        .iter()
        .find(|background| background.label == SwatchLabel::Number(50))
        .expect("Palette must contain a 50 step to act as a light candidate");

    let custom_white = soft_white.map(|w| {
        SwatchStep::from_label(
            w.l,
            w.chroma,
            w.hue.into_degrees(),
            SwatchLabel::Name(String::from("White")),
        )
    });
    let custom_black = soft_black.map(|b| {
        SwatchStep::from_label(
            b.l,
            b.chroma,
            b.hue.into_degrees(),
            SwatchLabel::Name(String::from("Black")),
        )
    });

    let swatches: Vec<Swatch> = backgrounds
        .iter()
        .map(|background| {
            let recommendation = get_best_foreground(
                background,
                dark_candidate,
                light_candidate,
                custom_white.as_ref(),
                custom_black.as_ref(),
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

    Palette {
        swatches,
        lightness_curve,
        max_recommended_light_padding: get_max_recommended_light_padding(base_hue),
        max_recommended_dark_padding: get_max_recommended_dark_padding(base_hue),
        note: "".to_string(),
    }
}

pub fn generate_palette_with_scale(
    base_500: Oklch,
    lightness_scale: &[f32; 10],
    chroma_scale: &[f32],
    light_padding: f32,
    dark_padding: f32,
    soft_white: Option<Oklch>,
    soft_black: Option<Oklch>,
) -> Palette {
    let base_hue = base_500.hue.into_degrees();
    let base_chroma = base_500.chroma;
    let base_lightness = base_500.l;
    let adjusted_lightness =
        apply_padding_to_lightness(lightness_scale, light_padding, dark_padding);

    // Express the base chroma as a fraction of its gamut maximum,
    // so we can apply the same proportional saturation at every step.
    let base_gamut_max = max_in_gamut_chroma(base_lightness, base_hue);
    let base_ratio = if base_gamut_max > 0.001 {
        (base_chroma / base_gamut_max).min(1.0)
    } else {
        0.0
    };

    let backgrounds: Vec<SwatchStep> = STEPS
        .iter()
        .zip(adjusted_lightness.iter())
        .zip(chroma_scale.iter())
        .map(|((&step, &reference_lightness), &chroma_factor)| {
            let (final_lightness, final_chroma) = if step == 500 {
                (base_lightness, base_chroma)
            } else {
                let offset = reference_lightness - 0.55;
                let l = (base_lightness + offset).clamp(0.01, 0.99);
                let step_gamut_max = max_in_gamut_chroma(l, base_hue);
                // Use 95% of gamut max as a safety margin to avoid edge clipping
                let chroma = step_gamut_max * 0.95 * base_ratio * chroma_factor;
                (l, chroma)
            };

            let oklch_color = Oklch::new(final_lightness, final_chroma, base_hue);

            SwatchStep::from_label(
                oklch_color.l,
                oklch_color.chroma,
                oklch_color.hue.into_degrees(),
                step,
            )
        })
        .collect();

    assemble_palette(backgrounds, *lightness_scale, base_hue, soft_white, soft_black)
}

/// Generate a dark-mode palette using the anchored two-segment model:
/// step 50 is pinned to `DARK_BG_ANCHOR`, step 900 to `DARK_TEXT_ANCHOR`,
/// and step 500 to the brand's exact lightness. Each half is shaped by the
/// normalised `dark_curve`, guaranteeing reliably-dark backgrounds however
/// pale the brand is, while keeping the scale monotonic and harmonious.
///
/// `light_padding` / `dark_padding` pad the curve before the anchored model
/// runs, reshaping the steps between the fixed 50/500/900 anchors.
pub fn generate_dark_palette(
    base_500: Oklch,
    dark_curve: &[f32; 10],
    light_padding: f32,
    dark_padding: f32,
    soft_white: Option<Oklch>,
    soft_black: Option<Oklch>,
) -> Palette {
    let base_hue = base_500.hue.into_degrees();
    let base_chroma = base_500.chroma;
    let base_lightness = base_500.l;
    let adjusted_curve = apply_padding_to_lightness(dark_curve, light_padding, dark_padding);

    let base_gamut_max = max_in_gamut_chroma(base_lightness, base_hue);
    let base_ratio = if base_gamut_max > 0.001 {
        (base_chroma / base_gamut_max).min(1.0)
    } else {
        0.0
    };

    let backgrounds: Vec<SwatchStep> = STEPS
        .iter()
        .enumerate()
        .zip(TARGET_CHROMA_SCALE.iter())
        .map(|((i, &step), &chroma_factor)| {
            if step == 500 {
                return SwatchStep::from_label(base_lightness, base_chroma, base_hue, step);
            }

            // Lower half interpolates the dark background anchor up to the
            // brand; upper half interpolates the brand up to the text anchor.
            let l = if i < 5 {
                let frac = (adjusted_curve[i] - adjusted_curve[0])
                    / (adjusted_curve[5] - adjusted_curve[0]);
                DARK_BG_ANCHOR + frac * (base_lightness - DARK_BG_ANCHOR)
            } else {
                let frac = (adjusted_curve[i] - adjusted_curve[5])
                    / (adjusted_curve[9] - adjusted_curve[5]);
                base_lightness + frac * (DARK_TEXT_ANCHOR - base_lightness)
            };
            let l = l.clamp(0.01, 0.99);
            let step_gamut_max = max_in_gamut_chroma(l, base_hue);
            let chroma = step_gamut_max * 0.95 * base_ratio * chroma_factor;

            SwatchStep::from_label(l, chroma, base_hue, step)
        })
        .collect();

    assemble_palette(backgrounds, *dark_curve, base_hue, soft_white, soft_black)
}

pub fn generate_palette(base_500: Oklch, light_padding: f32, dark_padding: f32) -> Palette {
    generate_palette_with_scale(
        base_500,
        &TARGET_LIGHTNESS,
        &TARGET_CHROMA_SCALE,
        light_padding,
        dark_padding,
        None,
        None,
    )
}

pub fn generate_palette_with_light_padding(base_500: Oklch, light_padding: f32) -> Palette {
    generate_palette_with_scale(
        base_500,
        &TARGET_LIGHTNESS,
        &TARGET_CHROMA_SCALE,
        light_padding,
        0.0,
        None,
        None,
    )
}

pub fn generate_palette_with_dark_padding(base_500: Oklch, dark_padding: f32) -> Palette {
    generate_palette_with_scale(
        base_500,
        &TARGET_LIGHTNESS,
        &TARGET_CHROMA_SCALE,
        0.0,
        dark_padding,
        None,
        None,
    )
}

