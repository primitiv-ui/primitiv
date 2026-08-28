use palette::Oklch;
use serde::{Deserialize, Serialize};

use crate::color::output::{format_oklch_alpha, oklch_to_hex_alpha, oklch_to_rgb, Rgb};
use crate::palette::generator::{resample, step_labels, DEFAULT_STEPS};

/// The opacity curve shared by every alpha ramp (Path A). Dense at the subtle
/// end — hover, ghost and overlay state layers live in the low steps — and
/// accelerating toward opaque. One source of truth for the web preview, the
/// emitted tokens, and the Figma plugin.
pub const ALPHA_CURVE: [f32; 10] = [0.03, 0.06, 0.1, 0.14, 0.2, 0.3, 0.42, 0.55, 0.72, 0.92];


/// Builds an alpha ramp of `steps` steps, reading [`ALPHA_CURVE`] at whatever
/// resolution is asked for.
///
/// A ramp's length is a user knob and an alpha ramp has to follow its solid
/// companion, or the two families stop being parallel: a seven-step `accent`
/// beside a ten-step `accent-alpha` carries two different label sets for the
/// same ramp. Labels come from [`step_labels`] and opacities from
/// [`resample`], so both halves answer to the same length.
///
/// `steps` must be within `MIN_STEPS..=MAX_STEPS`; `resample` divides by
/// `steps - 1` and has no interval to work with below two. The `api` layer is
/// what guarantees that for every caller, the same arrangement
/// `generate_palette_with_steps` uses.
pub fn generate_alpha_ramp_with_steps(anchor: Oklch, steps: usize) -> Vec<AlphaSwatch> {
    step_labels(steps)
        .into_iter()
        .zip(resample(&ALPHA_CURVE, steps))
        .map(|(step, alpha)| AlphaSwatch {
            l: anchor.l,
            c: anchor.chroma,
            h: anchor.hue.into_degrees(),
            alpha,
            step,
            oklch: format_oklch_alpha(anchor, alpha),
            hex: oklch_to_hex_alpha(anchor, alpha),
            rgb: oklch_to_rgb(anchor),
        })
        .collect()
}

/// One step of an alpha ramp: a single anchor colour shown at one opacity.
/// Unlike `Swatch`, an alpha swatch carries no contrast/foreground data — its
/// effective contrast depends on whatever surface it is composited over.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct AlphaSwatch {
    pub l: f32,
    pub c: f32,
    pub h: f32,
    pub alpha: f32,
    pub step: u16,
    /// The anchor colour at this step's opacity, as `oklch(L C H / a)`.
    pub oklch: String,
    /// The anchor as a `#rrggbbaa` sRGB hex string — eight digits, because the
    /// opacity is part of the value. What the token layer ships.
    pub hex: String,
    /// The anchor as gamma-encoded sRGB, channels in `0.0..=1.0`. The opacity
    /// stays in `alpha`, so a consumer building an RGBA paint (Figma's
    /// `{ r, g, b, a }`) reads both rather than parsing `oklch` or `hex`.
    pub rgb: Rgb,
}

/// Builds an alpha ramp from a single anchor colour (Path A): the colour is
/// held constant across all ten steps while the opacity climbs [`ALPHA_CURVE`].
/// Neutral ramps pass their veil colour (soft-black in light, soft-white in
/// dark); brand ramps pass the brand's identity swatch.
pub fn generate_alpha_ramp(anchor: Oklch) -> Vec<AlphaSwatch> {
    generate_alpha_ramp_with_steps(anchor, DEFAULT_STEPS)
}
