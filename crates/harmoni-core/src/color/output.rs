// Color output abstraction — converts the engine's internal OkLCH
// representation into the sRGB-based formats consumers render with.
// The counterpart to `input.rs`.

use palette::{IntoColor, Oklch, Srgb};
use serde::{Deserialize, Serialize};

/// Gamma-encoded sRGB, every channel in `0.0..=1.0`. This is the form
/// Figma fills and variables expect, and what CSS hex encodes.
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct Rgb {
    pub r: f32,
    pub g: f32,
    pub b: f32,
}

/// Converts an OkLCH colour to gamma-encoded sRGB, clamping each channel
/// into `0.0..=1.0`. Generated palette swatches are in-gamut by
/// construction; the clamp only absorbs floating-point rounding and
/// guards against out-of-gamut inputs such as custom soft neutrals.
pub fn oklch_to_rgb(color: Oklch) -> Rgb {
    let srgb: Srgb = color.into_color();
    Rgb {
        r: srgb.red.clamp(0.0, 1.0),
        g: srgb.green.clamp(0.0, 1.0),
        b: srgb.blue.clamp(0.0, 1.0),
    }
}

/// Converts an OkLCH colour to a `#rrggbb` sRGB hex string.
pub fn oklch_to_hex(color: Oklch) -> String {
    let rgb = oklch_to_rgb(color);
    let quantise = |channel: f32| (channel * 255.0).round() as u8;
    format!(
        "#{:02x}{:02x}{:02x}",
        quantise(rgb.r),
        quantise(rgb.g),
        quantise(rgb.b)
    )
}

/// Renders an OkLCH colour as a CSS `oklch(L C H)` string, with each
/// component rounded to four decimal places.
pub fn format_oklch(color: Oklch) -> String {
    let round = |value: f32| (value * 10_000.0).round() / 10_000.0;
    format!(
        "oklch({} {} {})",
        round(color.l),
        round(color.chroma),
        round(color.hue.into_degrees())
    )
}

/// Renders an OkLCH colour with an alpha channel as a CSS
/// `oklch(L C H / a)` string, every component (alpha included) rounded to
/// four decimal places. The `/ a` slash-alpha form is how alpha ramps carry
/// their opacity into a stylesheet.
pub fn format_oklch_alpha(color: Oklch, alpha: f32) -> String {
    let round = |value: f32| (value * 10_000.0).round() / 10_000.0;
    format!(
        "oklch({} {} {} / {})",
        round(color.l),
        round(color.chroma),
        round(color.hue.into_degrees()),
        round(alpha)
    )
}
