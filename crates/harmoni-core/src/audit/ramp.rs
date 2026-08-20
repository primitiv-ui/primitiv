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

use crate::color::gamut::{max_in_gamut_chroma, Gamut};
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
    let steps = palette
        .swatches
        .iter()
        .map(|swatch| StepQuality {
            label: swatch.label.clone(),
            chroma_utilisation: chroma_utilisation(swatch.l, swatch.c, swatch.h, gamut),
        })
        .collect();

    RampQuality { steps, gamut }
}
