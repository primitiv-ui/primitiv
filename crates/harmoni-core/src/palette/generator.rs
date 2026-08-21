use palette::Oklch;
use serde::{Deserialize, Serialize};

use crate::audit::contrast::get_contrast_rating_for_step;
use crate::color::gamut::{max_in_gamut_chroma, Gamut};
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

impl std::fmt::Display for SwatchLabel {
    /// Render a label to its token path segment: a numeric step as its digits
    /// (`Number(500)` → `500`), a named step as the name verbatim.
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SwatchLabel::Number(n) => write!(f, "{n}"),
            SwatchLabel::Name(name) => write!(f, "{name}"),
        }
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

/// How close to the gamut boundary a generated step is allowed to sit. A small
/// margin, so 8-bit quantisation at hex time cannot nudge a step back out.
const GAMUT_SAFETY_MARGIN: f32 = 0.95;

/// Headroom applied to every non-seed step's requested chroma. Kept from the
/// original chroma model so that fixing the gamut search below changes only the
/// steps that were genuinely out of gamut, and leaves every step that already
/// rendered faithfully byte-identical.
const CHROMA_HEADROOM: f32 = 0.95;

/// Places step `index` on the anchored two-segment lightness model: the ramp's
/// two ends pinned to `start_anchor` and `end_anchor`, step 500 pinned to the
/// brand's own lightness, and each half shaped by `curve`.
///
/// Anchoring rather than shifting is what keeps a ramp usable for any seed. The
/// light side used to translate the whole curve so 500 landed on the brand,
/// which works only while the brand sits near the curve's own midpoint: a seed
/// lighter than about 0.60 pushed its top steps past the clamp, where three or
/// four of them collided on one lightness and rendered as the same colour. The
/// dark side has always anchored, for the same reason in the other direction —
/// a pale brand must still get dark backgrounds (RFC 0027 §12.2).
///
/// Both halves read the same way: start at the half's own anchor and travel
/// toward the brand by however far along the curve this step sits. A curve whose
/// half has no span gives no shape to travel along, so the half collapses onto
/// its anchor — which is what a flat curve means, and keeps the division safe.
fn anchored_lightness(
    index: usize,
    curve: &[f32],
    base_lightness: f32,
    start_anchor: f32,
    end_anchor: f32,
) -> f32 {
    let (anchor, anchor_index) = if index < 5 {
        (start_anchor, 0)
    } else {
        (end_anchor, curve.len() - 1)
    };

    let span = curve[5] - curve[anchor_index];
    let fraction = if span == 0.0 {
        0.0
    } else {
        (curve[index] - curve[anchor_index]) / span
    };

    anchor + fraction * (base_lightness - anchor)
}

/// A step's chroma: what the ramp asks for, held inside the sRGB gamut.
///
/// The cap is applied **here, in OkLCH, at constant lightness and hue**. That is
/// the whole point: the alternative is to request whatever the chroma scale says
/// and let per-channel clamping absorb the excess when the colour is written to
/// hex — which reduces chroma *and moves hue*, because the channels do not clip
/// evenly. Every degree of the ramps' rendered hue drift came from that clamp
/// (RFC 0027 §11.1); capping in OkLCH gives up the same unrenderable chroma
/// while holding the hue exactly.
fn chroma_within_gamut(requested: f32, lightness: f32, hue: f32, gamut: Gamut) -> f32 {
    let ceiling = max_in_gamut_chroma(lightness, hue, gamut) * GAMUT_SAFETY_MARGIN;
    requested.min(ceiling)
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

/// What a step's chroma scale asked for, and what the gamut allowed it to keep.
///
/// Generation caps the request and then discards it, so nothing downstream can
/// see *why* a step is quiet — a deliberately tapered scale and a hue the gamut
/// cannot hold look identical in the output. The picker needs both numbers to
/// tell a designer their cyan will mute at the light end before they build a
/// system on it (RFC 0027 §6).
#[derive(Debug, Clone, PartialEq)]
pub struct ChromaHeadroom {
    pub label: SwatchLabel,
    /// The chroma the ramp's scale asked for at this step.
    pub requested: f32,
    /// What survived the gamut cap. Equal to `requested` wherever the gamut had
    /// room; below it wherever the hue ran out.
    pub granted: f32,
}

/// One step's derived geometry, shared by generation and by
/// [`chroma_headroom`] so the two cannot disagree about what the ramp asks for.
struct StepPlan {
    label: SwatchLabel,
    lightness: f32,
    requested_chroma: f32,
    granted_chroma: f32,
}

/// Derives every step of a light ramp: its lightness from the anchored curve,
/// the chroma its scale asks for, and what the gamut grants.
fn plan_light_ramp(
    base_500: Oklch,
    lightness_scale: &[f32; 10],
    chroma_scale: &[f32],
    light_padding: f32,
    dark_padding: f32,
    gamut: Gamut,
) -> Vec<StepPlan> {
    let base_hue = base_500.hue.into_degrees();
    let base_chroma = base_500.chroma;
    let base_lightness = base_500.l;
    let adjusted = apply_padding_to_lightness(lightness_scale, light_padding, dark_padding);

    STEPS
        .iter()
        .enumerate()
        .zip(chroma_scale.iter())
        .map(|((index, &step), &chroma_factor)| {
            if step == 500 {
                return StepPlan {
                    label: step.into(),
                    lightness: base_lightness,
                    requested_chroma: base_chroma,
                    granted_chroma: base_chroma,
                };
            }

            let lightness = anchored_lightness(
                index,
                &adjusted,
                base_lightness,
                adjusted[0],
                adjusted[9],
            )
            .clamp(0.01, 0.99);
            let requested_chroma = base_chroma * CHROMA_HEADROOM * chroma_factor;

            StepPlan {
                label: step.into(),
                lightness,
                requested_chroma,
                granted_chroma: chroma_within_gamut(requested_chroma, lightness, base_hue, gamut),
            }
        })
        .collect()
}

/// Per-step chroma headroom for the ramp `base_500` would seed — what each step
/// asks for against what the gamut allows (RFC 0027 §6).
/// `gamut` is a *what-if*: generation always targets sRGB, but asking the same
/// question of Display-P3 is what lets the picker state the trade-off between
/// them rather than leaving a designer to discover it (RFC 0027 §6).
pub fn chroma_headroom(
    base_500: Oklch,
    light_padding: f32,
    dark_padding: f32,
    gamut: Gamut,
) -> Vec<ChromaHeadroom> {
    plan_light_ramp(
        base_500,
        &TARGET_LIGHTNESS,
        &TARGET_CHROMA_SCALE,
        light_padding,
        dark_padding,
        gamut,
    )
    .into_iter()
    .map(|plan| ChromaHeadroom {
        label: plan.label,
        requested: plan.requested_chroma,
        granted: plan.granted_chroma,
    })
    .collect()
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

    // Generation always targets sRGB; the gamut parameter exists for the
    // picker's what-if comparison, not to make the shipped palette configurable.
    let backgrounds: Vec<SwatchStep> = plan_light_ramp(
        base_500,
        lightness_scale,
        chroma_scale,
        light_padding,
        dark_padding,
        Gamut::Srgb,
    )
    .into_iter()
    .map(|plan| SwatchStep::from_label(plan.lightness, plan.granted_chroma, base_hue, plan.label))
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
            let l = anchored_lightness(
                i,
                &adjusted_curve,
                base_lightness,
                DARK_BG_ANCHOR,
                DARK_TEXT_ANCHOR,
            )
            .clamp(0.01, 0.99);
            let requested = base_chroma * CHROMA_HEADROOM * chroma_factor;

            SwatchStep::from_label(
                l,
                chroma_within_gamut(requested, l, base_hue, Gamut::Srgb),
                base_hue,
                step,
            )
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

