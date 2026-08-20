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
            chroma_utilisation: Some(swatch.c / max_in_gamut_chroma(swatch.l, swatch.h, gamut)),
        })
        .collect();

    RampQuality { steps, gamut }
}
