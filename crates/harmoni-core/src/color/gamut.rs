//! Gamut membership and the chroma boundary — the pure colour-space maths
//! behind the OKLCH picker's overlays (RFC 0010) and the ramp-quality metrics
//! (RFC 0027 §4).
//!
//! This sits in `color` rather than `api` because two different layers need it:
//! `api::gamut` paints the picker's charts from it, and `audit::ramp` measures
//! how much of the available chroma a generated ramp actually uses. One
//! implementation, so the picker and the audit cannot disagree about where the
//! boundary is (RFC 0027 D1).

use palette::convert::IntoColorUnclamped;
use palette::encoding::Linear;
use palette::rgb::Rgb as PaletteRgb;
use palette::{LinSrgb, Oklch};

use crate::color::p3::DisplayP3;

/// The display gamut a colour is judged against (RFC 0010 §7). sRGB is the v1
/// default; Display-P3 is the additive wide-gamut mode.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Gamut {
    /// The standard sRGB gamut Harmoni computes everywhere else.
    Srgb,
    /// The wider Display-P3 gamut (`crate::color::p3::DisplayP3`).
    DisplayP3,
}

/// Whether a linear-RGB triple sits inside its unit cube, with a small epsilon
/// absorbing floating-point error at the faces.
///
/// The epsilon is held at float-conversion scale (`1e-5`). A looser tolerance
/// (the old `1e-3`) is ~100× the genuine round-trip error and admits *out-of-
/// gamut* near-black colours: their linear channels are all tiny, so a chromatic
/// dark whose limiting channel is only slightly negative still sits within an
/// absolute `±1e-3`. That spurious near-black chroma spiked the picker's Hue-
/// chart boundary at the bottom edge; tightening it collapses the gamut to the
/// black point as it should, while every genuine boundary is unchanged — the
/// limiting channel crosses zero steeply there (RFC 0010 §10).
fn linear_in_gamut(red: f32, green: f32, blue: f32) -> bool {
    (-1e-5..=1.000_01).contains(&red)
        && (-1e-5..=1.000_01).contains(&green)
        && (-1e-5..=1.000_01).contains(&blue)
}

/// Whether an OkLCH `(lightness, chroma, hue)` is inside the given `gamut`,
/// tested on the **unclamped** linear channels: the clamped conversion the
/// renderer uses snaps every channel into range, which would hide every
/// out-of-gamut colour.
pub fn in_gamut(lightness: f32, chroma: f32, hue: f32, gamut: Gamut) -> bool {
    let color = Oklch::new(lightness, chroma, hue);
    match gamut {
        Gamut::Srgb => {
            let rgb: LinSrgb = color.into_color_unclamped();
            linear_in_gamut(rgb.red, rgb.green, rgb.blue)
        }
        Gamut::DisplayP3 => {
            let rgb: PaletteRgb<Linear<DisplayP3>> = color.into_color_unclamped();
            linear_in_gamut(rgb.red, rgb.green, rgb.blue)
        }
    }
}

/// The maximum chroma that keeps an OkLCH lightness and hue inside `gamut` — the
/// boundary curve the picker overlays, the cutoff its painters use to mark
/// out-of-gamut pixels, and the denominator of the audit's chroma-utilisation
/// metric (RFC 0027 §4).
///
/// Binary search over chroma testing the unclamped linear channels (see
/// [`in_gamut`]). This is deliberately separate from
/// `palette::generator::max_in_gamut_chroma`, whose clamped form the generated
/// palettes depend on (RFC 0010 §3).
pub fn max_in_gamut_chroma(lightness: f32, hue: f32, gamut: Gamut) -> f32 {
    let mut lo: f32 = 0.0;
    let mut hi: f32 = 0.4;

    for _ in 0..20 {
        let mid = (lo + hi) / 2.0;
        if in_gamut(lightness, mid, hue, gamut) {
            lo = mid;
        } else {
            hi = mid;
        }
    }

    lo
}
