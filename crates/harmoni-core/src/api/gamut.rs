//! Gamut rendering helpers for the OKLCH colour picker (RFC 0010).
//!
//! These paint flat RGBA buffers a `<canvas>` can blit directly via
//! `ImageData`, and re-expose the sRGB gamut-boundary primitive the picker
//! overlays as a curve. The colour maths lives here so the picker renders
//! from engine output rather than a second colour library in JS — one source
//! of truth (RFC 0010 §1, Principle 1).

use palette::convert::IntoColorUnclamped;
use palette::{LinSrgb, Oklch};

use crate::color::output::oklch_to_rgb;

/// The maximum chroma that keeps an OkLCH lightness and hue inside the sRGB
/// gamut — the boundary curve the picker overlays, and the cutoff its painters
/// use to mark out-of-gamut pixels.
///
/// Binary search over chroma testing the **unclamped** linear-sRGB channels:
/// the clamped conversion the renderer uses snaps every channel into range,
/// which would hide every out-of-gamut colour. This is deliberately separate
/// from `palette::generator::max_in_gamut_chroma`, whose clamped form the
/// generated palettes depend on (RFC 0010 §3).
pub fn max_in_gamut_chroma(lightness: f32, hue: f32) -> f32 {
    let mut lo: f32 = 0.0;
    let mut hi: f32 = 0.4;

    for _ in 0..20 {
        let mid = (lo + hi) / 2.0;
        let srgb: LinSrgb = Oklch::new(lightness, mid, hue).into_color_unclamped();

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

/// Quantises a `0.0..=1.0` channel to a `u8`, matching `oklch_to_hex`.
fn to_byte(channel: f32) -> u8 {
    (channel * 255.0).round() as u8
}

/// Paints the hue spectrum at a fixed lightness and chroma, as a flat RGBA
/// buffer of `width * 4` bytes (4 bytes per pixel). Columns map hue
/// `0..360` left→right, sampled at pixel centres. In-gamut pixels carry their
/// sRGB colour at full alpha; out-of-gamut pixels are transparent (four zero
/// bytes), the boundary coming from `max_in_gamut_chroma`.
pub fn paint_hue_strip(l: f32, c: f32, width: usize) -> Vec<u8> {
    let mut buffer = vec![0u8; width * 4];
    for px in 0..width {
        let hue = (px as f32 + 0.5) / width as f32 * 360.0;
        if c <= max_in_gamut_chroma(l, hue) {
            let rgb = oklch_to_rgb(Oklch::new(l, c, hue));
            let i = px * 4;
            buffer[i] = to_byte(rgb.r);
            buffer[i + 1] = to_byte(rgb.g);
            buffer[i + 2] = to_byte(rgb.b);
            buffer[i + 3] = 255;
        }
    }
    buffer
}

/// Paints the OkLCH lightness×chroma plane for a fixed hue, as a flat RGBA
/// buffer of `width * height * 4` bytes (row-major, 4 bytes per pixel). Columns
/// map lightness `0.0..1.0` left→right; rows map chroma `c_max..0.0`
/// top→bottom, so the most saturated colours sit along the top. Pixels are
/// sampled at their centres; out-of-gamut pixels are transparent.
pub fn paint_lc_plane(hue: f32, width: usize, height: usize, c_max: f32) -> Vec<u8> {
    let mut buffer = vec![0u8; width * height * 4];
    for px in 0..width {
        let lightness = (px as f32 + 0.5) / width as f32;
        // Hue is fixed across the plane, so the boundary depends only on the
        // column's lightness — compute it once per column, not per pixel.
        let max_chroma = max_in_gamut_chroma(lightness, hue);
        for py in 0..height {
            let chroma = c_max * (1.0 - (py as f32 + 0.5) / height as f32);
            if chroma <= max_chroma {
                let rgb = oklch_to_rgb(Oklch::new(lightness, chroma, hue));
                let i = (py * width + px) * 4;
                buffer[i] = to_byte(rgb.r);
                buffer[i + 1] = to_byte(rgb.g);
                buffer[i + 2] = to_byte(rgb.b);
                buffer[i + 3] = 255;
            }
        }
    }
    buffer
}
