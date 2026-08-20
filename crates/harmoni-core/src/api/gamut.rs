//! Gamut rendering helpers for the OKLCH colour picker (RFC 0010).
//!
//! These paint flat RGBA buffers a `<canvas>` can blit directly via
//! `ImageData`, and re-expose `color::gamut`'s boundary primitive so the picker
//! can overlay it as a curve. The colour maths lives in the engine rather than
//! a second colour library in JS — one source of truth (RFC 0010 §1,
//! Principle 1).

use palette::Oklch;

use crate::color::gamut::in_gamut;
use crate::color::output::{oklch_to_rgb, Rgb};
use crate::color::p3::oklch_to_p3_rgb;

// The gamut primitive itself lives in `color::gamut`, so the ramp audit can
// measure against the same boundary these charts paint (RFC 0027 D1). Re-exported
// here because adapters reach the engine only through `api` — they must not
// import from `color` directly.
pub use crate::color::gamut::{max_in_gamut_chroma, Gamut};

/// Quantises a `0.0..=1.0` channel to a `u8`, matching `oklch_to_hex`.
fn to_byte(channel: f32) -> u8 {
    (channel * 255.0).round() as u8
}

/// Converts an OkLCH colour to the displayable RGB of the given `gamut`. P3
/// pixels carry Display-P3 coordinates the picker blits onto a `display-p3`
/// canvas, so the sRGB→P3 extended band renders faithfully (RFC 0010 §7).
fn paint_color(color: Oklch, gamut: Gamut) -> Rgb {
    match gamut {
        Gamut::Srgb => oklch_to_rgb(color),
        Gamut::DisplayP3 => oklch_to_p3_rgb(color),
    }
}

/// Paints the hue spectrum at a fixed lightness and chroma, as a flat RGBA
/// buffer of `width * 4` bytes (4 bytes per pixel). Columns map hue
/// `0..360` left→right, sampled at pixel centres. In-gamut pixels carry their
/// `gamut` colour at full alpha; out-of-gamut pixels are transparent (four zero
/// bytes), the boundary coming from `max_in_gamut_chroma` for that `gamut`.
pub fn paint_hue_strip(l: f32, c: f32, width: usize, gamut: Gamut) -> Vec<u8> {
    let mut buffer = vec![0u8; width * 4];
    for px in 0..width {
        let hue = (px as f32 + 0.5) / width as f32 * 360.0;
        if in_gamut(l, c, hue, gamut) {
            let rgb = paint_color(Oklch::new(l, c, hue), gamut);
            let i = px * 4;
            buffer[i] = to_byte(rgb.r);
            buffer[i + 1] = to_byte(rgb.g);
            buffer[i + 2] = to_byte(rgb.b);
            buffer[i + 3] = 255;
        }
    }
    buffer
}

/// Paints the lightness sweep at a fixed chroma and hue, as a flat RGBA buffer
/// of `width * 4` bytes — the painted track behind the picker's L slider.
/// Columns map lightness `l_min..l_max` left→right, sampled at pixel centres, so
/// a clamped slider (e.g. the near-white anchor) paints only its own range and
/// the track never shows a value the thumb can't reach; pass `0.0, 1.0` for the
/// full sweep. In-`gamut` pixels carry their colour at full alpha, out-of-gamut
/// ones are transparent. The boundary shifts with `c`/`h`, so the slider
/// repaints as the other axes move (RFC 0010 §2).
pub fn paint_lightness_strip(
    c: f32,
    h: f32,
    width: usize,
    gamut: Gamut,
    l_min: f32,
    l_max: f32,
) -> Vec<u8> {
    let mut buffer = vec![0u8; width * 4];
    for px in 0..width {
        let lightness = l_min + (px as f32 + 0.5) / width as f32 * (l_max - l_min);
        if in_gamut(lightness, c, h, gamut) {
            let rgb = paint_color(Oklch::new(lightness, c, h), gamut);
            let i = px * 4;
            buffer[i] = to_byte(rgb.r);
            buffer[i + 1] = to_byte(rgb.g);
            buffer[i + 2] = to_byte(rgb.b);
            buffer[i + 3] = 255;
        }
    }
    buffer
}

/// Paints the chroma sweep at a fixed lightness and hue, as a flat RGBA buffer
/// of `width * 4` bytes — the painted track behind the picker's C slider.
/// Columns map chroma `0.0..c_max` left→right, sampled at pixel centres. The
/// boundary depends only on `(l, h)`, so it is found once; columns beyond it are
/// transparent. The slider repaints as the L and H axes move (RFC 0010 §2).
pub fn paint_chroma_strip(l: f32, h: f32, width: usize, c_max: f32, gamut: Gamut) -> Vec<u8> {
    let mut buffer = vec![0u8; width * 4];
    let max_chroma = max_in_gamut_chroma(l, h, gamut);
    for px in 0..width {
        let chroma = (px as f32 + 0.5) / width as f32 * c_max;
        if chroma <= max_chroma {
            let rgb = paint_color(Oklch::new(l, chroma, h), gamut);
            let i = px * 4;
            buffer[i] = to_byte(rgb.r);
            buffer[i + 1] = to_byte(rgb.g);
            buffer[i + 2] = to_byte(rgb.b);
            buffer[i + 3] = 255;
        }
    }
    buffer
}

/// Paints the OkLCH lightness×hue plane for a fixed chroma — the picker's
/// Chroma chart — as a flat RGBA buffer of `width * height * 4` bytes (row-major,
/// 4 bytes per pixel). Columns map hue `0..360` left→right; rows map lightness
/// `1.0..0.0` top→bottom, so the lightest colours sit along the top. Pixels are
/// sampled at their centres; out-of-`gamut` pixels are transparent. Each pixel is
/// tested directly with [`in_gamut`] — one conversion, not a per-pixel chroma
/// search — so this plane is no costlier than the others (RFC 0010 §2).
pub fn paint_lh_plane(c: f32, width: usize, height: usize, gamut: Gamut) -> Vec<u8> {
    let mut buffer = vec![0u8; width * height * 4];
    for px in 0..width {
        let hue = (px as f32 + 0.5) / width as f32 * 360.0;
        for py in 0..height {
            let lightness = 1.0 - (py as f32 + 0.5) / height as f32;
            if in_gamut(lightness, c, hue, gamut) {
                let rgb = paint_color(Oklch::new(lightness, c, hue), gamut);
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

/// Paints the OkLCH chroma×hue plane for a fixed lightness — the picker's
/// Lightness chart — as a flat RGBA buffer of `width * height * 4` bytes
/// (row-major, 4 bytes per pixel). Columns map hue `0..360` left→right; rows map
/// chroma `c_max..0.0` top→bottom, so the most saturated colours sit along the
/// top (the same chroma orientation as the L×C plane). Pixels are sampled at
/// their centres; out-of-`gamut` pixels are transparent. The boundary depends on
/// `(lightness, hue)`, so it is found once per column (RFC 0010 §2).
pub fn paint_ch_plane(l: f32, width: usize, height: usize, c_max: f32, gamut: Gamut) -> Vec<u8> {
    let mut buffer = vec![0u8; width * height * 4];
    for px in 0..width {
        let hue = (px as f32 + 0.5) / width as f32 * 360.0;
        // Lightness is fixed across the plane, so the boundary depends only on
        // the column's hue — compute it once per column, not per pixel.
        let max_chroma = max_in_gamut_chroma(l, hue, gamut);
        for py in 0..height {
            let chroma = c_max * (1.0 - (py as f32 + 0.5) / height as f32);
            if chroma <= max_chroma {
                let rgb = paint_color(Oklch::new(l, chroma, hue), gamut);
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

/// Paints the OkLCH lightness×chroma plane for a fixed hue, as a flat RGBA
/// buffer of `width * height * 4` bytes (row-major, 4 bytes per pixel). Columns
/// map lightness `0.0..1.0` left→right; rows map chroma `c_max..0.0`
/// top→bottom, so the most saturated colours sit along the top. Pixels are
/// sampled at their centres; out-of-`gamut` pixels are transparent.
pub fn paint_lc_plane(hue: f32, width: usize, height: usize, c_max: f32, gamut: Gamut) -> Vec<u8> {
    let mut buffer = vec![0u8; width * height * 4];
    for px in 0..width {
        let lightness = (px as f32 + 0.5) / width as f32;
        // Hue is fixed across the plane, so the boundary depends only on the
        // column's lightness — compute it once per column, not per pixel.
        let max_chroma = max_in_gamut_chroma(lightness, hue, gamut);
        for py in 0..height {
            let chroma = c_max * (1.0 - (py as f32 + 0.5) / height as f32);
            if chroma <= max_chroma {
                let rgb = paint_color(Oklch::new(lightness, chroma, hue), gamut);
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
