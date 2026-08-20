//! Ramp quality metrics (RFC 0027).
//!
//! The engine has always been rigorous about one quality question — every
//! `Swatch` carries an accessible foreground and its contrast rating — but that
//! is *per swatch*. Nothing measured the **ramp**: whether it holds its hue,
//! whether its steps are far enough apart to be distinct surfaces, whether it is
//! as colourful as the hue permits. So a ramp could degrade silently, and one
//! did: RFC 0010's gamut-tolerance fix cost `info` 41% of its light-end chroma
//! and survived months in `main` because nothing was watching.
//!
//! [`assess`] is that measurement, in the engine rather than in a reporting
//! script, so the tests, the CI report and (later) the picker all read the same
//! numbers (RFC 0027 D1).

use palette::{IntoColor, Oklch, Srgb};

use crate::color::gamut::{max_in_gamut_chroma, Gamut};
use crate::color::output::oklch_to_rgb;
use crate::palette::generator::{Palette, SwatchLabel};

/// Quality metrics for a single step of a ramp.
#[derive(Debug, Clone, PartialEq)]
pub struct StepQuality {
    /// The step this describes, so a failure names a swatch rather than an index.
    pub label: SwatchLabel,
    /// Chroma actually used, as a fraction of what the gamut allows at this
    /// step's lightness and hue: `1.0` rides the boundary, `0.5` leaves half on
    /// the table, `0.0` is grey.
    ///
    /// Measured against the gamut rather than against a committed baseline, so
    /// it needs no reference palette, the bar cannot drift, and it answers "is
    /// this ramp as colourful as this hue permits?" rather than only "did this
    /// change?" (RFC 0027 D2).
    ///
    /// `None` where the gamut permits no chroma at this lightness (pure white in
    /// Display-P3), because the question has no answer there — `0.0` would read
    /// as "grey when it could be colourful" and `1.0` as "riding the boundary".
    /// Values above `1.0` are meaningful and deliberately not clamped: the step
    /// wants more chroma than the gamut has, so it will be mapped on the way to
    /// the screen.
    pub chroma_utilisation: Option<f32>,
    /// Distance in OkLCH lightness from the previous step, in engine units
    /// (`0.0..=1.0`), or `None` for the first step. Steps exist to be
    /// distinguishable surfaces; where this collapses toward zero, neighbouring
    /// steps are effectively one colour.
    ///
    /// Absolute, not signed: a dark palette climbs in lightness rather than
    /// falling, and a signed delta reported every healthy dark ramp as a defect
    /// (RFC 0027 §2).
    pub delta_l: Option<f32>,
    /// How far the rendered hue sits from the hue the engine intended, in
    /// degrees, measured the short way round the colour circle.
    ///
    /// The engine holds hue *exactly* by construction, so every degree here
    /// appears during quantisation to 8-bit sRGB. Measuring only the intended
    /// hue therefore reports a flawless engine, and measuring only the rendered
    /// hue blames the ramp definition for what the gamut mapping did — the gap
    /// between them is the diagnostic (RFC 0027 D3).
    pub hue_error: f32,
}

/// Quality metrics for a whole ramp, judged against one [`Gamut`].
#[derive(Debug, Clone, PartialEq)]
pub struct RampQuality {
    /// Per-step metrics, in ramp order.
    pub steps: Vec<StepQuality>,
    /// The gamut these metrics were measured against. Carried so a report can
    /// never present sRGB numbers as if they were Display-P3 ones.
    pub gamut: Gamut,
}

/// The colour a browser actually paints: the requested OkLCH quantised to 8-bit
/// sRGB and read back. Equivalent to round-tripping through the swatch's hex —
/// hex *is* that quantisation — but without a fallible string parse in the
/// middle of a metric that must always produce a number.
fn rendered_oklch(l: f32, c: f32, h: f32) -> Oklch {
    let rgb = oklch_to_rgb(Oklch::new(l, c, h));
    let quantise = |channel: f32| (channel * 255.0).round() / 255.0;
    Srgb::new(quantise(rgb.r), quantise(rgb.g), quantise(rgb.b)).into_color()
}

/// Angular distance between two hues in degrees, the short way round: 359° and
/// 1° are 2° apart, not 358°.
fn hue_distance(a: f32, b: f32) -> f32 {
    let diff = (a - b).rem_euclid(360.0);
    if diff > 180.0 {
        360.0 - diff
    } else {
        diff
    }
}

/// What fraction of the chroma available at `(l, h)` a step's `c` actually uses.
/// `None` where the gamut permits none, which would otherwise divide by zero and
/// hand every aggregate a `NaN`.
fn chroma_utilisation(l: f32, c: f32, h: f32, gamut: Gamut) -> Option<f32> {
    let available = max_in_gamut_chroma(l, h, gamut);
    (available > 0.0).then(|| c / available)
}

/// Measures the quality of an already-generated `palette` against `gamut`.
///
/// Takes a `Palette` rather than a seed so assessment stays separate from
/// generation: the same function can judge a freshly generated ramp, the
/// committed `palette.json`, or a palette imported from elsewhere (RFC 0027 §3).
pub fn assess(palette: &Palette, gamut: Gamut) -> RampQuality {
    let mut previous_l: Option<f32> = None;
    let mut steps = Vec::with_capacity(palette.swatches.len());

    for swatch in &palette.swatches {
        let rendered = rendered_oklch(swatch.l, swatch.c, swatch.h);

        steps.push(StepQuality {
            label: swatch.label.clone(),
            chroma_utilisation: chroma_utilisation(swatch.l, swatch.c, swatch.h, gamut),
            delta_l: previous_l.map(|previous: f32| (previous - swatch.l).abs()),
            hue_error: hue_distance(rendered.hue.into_degrees(), swatch.h),
        });
        previous_l = Some(swatch.l);
    }

    RampQuality { steps, gamut }
}
