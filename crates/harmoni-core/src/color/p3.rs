// Display-P3 colour output for the OKLCH picker's wide-gamut mode (RFC 0010
// §7). Display-P3 shares sRGB's D65 white point and transfer function but uses
// the wider DCI-P3 primaries, so it can show saturated reds/greens sRGB cannot.
// The picker paints its P3 charts from these bytes onto a `display-p3` canvas
// so the sRGB→P3 "extended" band renders faithfully on capable displays — the
// colour maths stays in the one Rust engine (Principle 1).

use palette::convert::IntoColorUnclamped;
use palette::num::Real;
use palette::rgb::{Primaries, Rgb, RgbSpace, RgbStandard};
use palette::white_point::{Any, D65};
use palette::{Oklch, Yxy};

use crate::color::output::Rgb as OutputRgb;

/// The Display-P3 RGB standard: DCI-P3 primaries, D65 white point, sRGB
/// transfer function. Defined via the `palette` crate's custom-primaries
/// support so the engine owns the wide-gamut conversion (RFC 0010 §7).
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct DisplayP3;

impl<T: Real> Primaries<T> for DisplayP3 {
    fn red() -> Yxy<Any, T> {
        Yxy::new(T::from_f64(0.680), T::from_f64(0.320), T::from_f64(0.2289746))
    }
    fn green() -> Yxy<Any, T> {
        Yxy::new(T::from_f64(0.265), T::from_f64(0.690), T::from_f64(0.6917385))
    }
    fn blue() -> Yxy<Any, T> {
        Yxy::new(T::from_f64(0.150), T::from_f64(0.060), T::from_f64(0.0792869))
    }
}

impl RgbSpace for DisplayP3 {
    type Primaries = DisplayP3;
    type WhitePoint = D65;
    // The RGB↔XYZ matrices are derived from the primaries above (the default
    // `None`), which keeps `red`/`green`/`blue` load-bearing rather than dead
    // code an explicit matrix would shadow.
}

impl RgbStandard for DisplayP3 {
    type Space = DisplayP3;
    // Display-P3 is gamma-encoded with the sRGB transfer function.
    type TransferFn = palette::encoding::Srgb;
}

/// Converts an OkLCH colour to gamma-encoded Display-P3, clamping each channel
/// into `0.0..=1.0`. The counterpart to `oklch_to_rgb`, for the picker's
/// wide-gamut paint.
pub fn oklch_to_p3_rgb(color: Oklch) -> OutputRgb {
    let p3: Rgb<DisplayP3> = color.into_color_unclamped();
    OutputRgb {
        r: p3.red.clamp(0.0, 1.0),
        g: p3.green.clamp(0.0, 1.0),
        b: p3.blue.clamp(0.0, 1.0),
    }
}
