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

/// Converts an OkLCH colour and an opacity to a `#rrggbbaa` sRGB hex string.
///
/// Eight digits rather than six, because that is what an alpha step *is* —
/// and what the shipped token layer holds for every `*-alpha` family
/// (`#236ce108` … `#236ce1eb`). The alpha byte is quantised the same way the
/// colour channels are, so a round-trip through this string reproduces the
/// value the emitter writes.
pub fn oklch_to_hex_alpha(color: Oklch, alpha: f32) -> String {
    let quantise = |channel: f32| (channel * 255.0).round() as u8;
    format!("{}{:02x}", oklch_to_hex(color), quantise(alpha))
}

/// Hue as a positive angle in `0..360`.
///
/// `palette` carries hue as `-180..180`, so every blue renders negative. That is
/// valid CSS and numerically equivalent, but an OkLCH string is something people
/// read and paste, and a negative angle reads as a mistake — every consumer was
/// normalising it by hand before this existed.
fn positive_hue(color: Oklch) -> f32 {
    let degrees = color.hue.into_degrees();
    if degrees < 0.0 {
        degrees + 360.0
    } else {
        degrees
    }
}

/// Decimal places a rendered component prefers.
const TIDY_PLACES: f32 = 10_000.0;

/// One component rounded to [`TIDY_PLACES`].
///
/// Safe to compute by multiplying: a hue of 360 scaled by ten thousand stays well
/// inside the range where an `f32` represents consecutive integers (2^24), which
/// the same trick at a million would not.
fn tidy(value: f32) -> f32 {
    (value * TIDY_PLACES).round() / TIDY_PLACES
}

/// Renders an OkLCH colour as a CSS `oklch(L C H)` string.
///
/// **Rounded to four decimal places where that reproduces the colour's own hex,
/// and rendered exactly where it would not.** Both halves of that matter:
///
/// - The rendered string has to reproduce its hex, because the token source is
///   authored in OkLCH and a consumer that cannot store it (Figma stores RGBA)
///   receives the hex this converts back to. At four places three of the hundred
///   shipped steps crossed an 8-bit rounding boundary and came back a unit out,
///   which would drift code and design apart invisibly.
///   `tests/ramp_regression.rs` gates the round trip.
/// - Rendering *everything* exactly was the first fix and reads badly: an `f32`'s
///   shortest exact form turns white's conversion noise into
///   `oklch(1 0.000000059604645 90)`, which lands in a published stylesheet as
///   `--primitiv-color-absolute-white`. Rounding further is worse again —
///   `(value * 1e6).round() / 1e6` breaks outright at that precision, and `{:.6}`
///   renders an honest `259.9` as `259.899994`.
///
/// So the tidy form wins unless it would move the colour, which is true of only
/// three shipped steps.
pub fn format_oklch(color: Oklch) -> String {
    // The hue stays a plain `f32` throughout: `Oklch` normalises its hue to
    // -180..180, so round-tripping a positive angle through it renders every blue
    // negative again — the very thing `positive_hue` exists to prevent.
    let (l, c, h) = (tidy(color.l), tidy(color.chroma), tidy(positive_hue(color)));
    if oklch_to_hex(Oklch::new(l, c, h)) == oklch_to_hex(color) {
        return format!("oklch({l} {c} {h})");
    }
    format!(
        "oklch({} {} {})",
        color.l,
        color.chroma,
        positive_hue(color)
    )
}

/// Renders an OkLCH colour with an alpha channel as a CSS `oklch(L C H / a)`
/// string, under the same round-to-tidy-unless-it-moves rule as
/// [`format_oklch`] — with alpha part of both the rounding and the comparison,
/// since it is an 8-bit channel in the hex too. The `/ a` slash-alpha form is how
/// alpha ramps carry their opacity into a stylesheet.
pub fn format_oklch_alpha(color: Oklch, alpha: f32) -> String {
    let (l, c, h, a) = (
        tidy(color.l),
        tidy(color.chroma),
        tidy(positive_hue(color)),
        tidy(alpha),
    );
    if oklch_to_hex_alpha(Oklch::new(l, c, h), a) == oklch_to_hex_alpha(color, alpha) {
        return format!("oklch({l} {c} {h} / {a})");
    }
    format!(
        "oklch({} {} {} / {})",
        color.l,
        color.chroma,
        positive_hue(color),
        alpha
    )
}
