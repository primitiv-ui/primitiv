use palette::Oklch;
use serde::{Deserialize, Serialize};

use crate::color::output::format_oklch_alpha;

/// The opacity curve shared by every alpha ramp (Path A). Dense at the subtle
/// end — hover, ghost and overlay state layers live in the low steps — and
/// accelerating toward opaque. One source of truth for the web preview, the
/// emitted tokens, and the Figma plugin.
pub const ALPHA_CURVE: [f32; 10] = [0.03, 0.06, 0.1, 0.14, 0.2, 0.3, 0.42, 0.55, 0.72, 0.92];

const STEPS: [u16; 10] = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

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
}

/// Builds an alpha ramp from a single anchor colour (Path A): the colour is
/// held constant across all ten steps while the opacity climbs [`ALPHA_CURVE`].
/// Neutral ramps pass their veil colour (soft-black in light, soft-white in
/// dark); brand ramps pass the brand's identity swatch.
pub fn generate_alpha_ramp(anchor: Oklch) -> Vec<AlphaSwatch> {
    STEPS
        .iter()
        .zip(ALPHA_CURVE)
        .map(|(&step, alpha)| AlphaSwatch {
            l: anchor.l,
            c: anchor.chroma,
            h: anchor.hue.into_degrees(),
            alpha,
            step,
            oklch: format_oklch_alpha(anchor, alpha),
        })
        .collect()
}
