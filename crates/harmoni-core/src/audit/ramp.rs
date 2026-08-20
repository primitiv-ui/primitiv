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
    /// Chroma the generator *asked for*, as a fraction of what the gamut allows
    /// at this step's lightness and hue: `1.0` rides the boundary, `0.5` leaves
    /// half on the table, `0.0` is grey — and anything above `1.0` is a demand
    /// the gamut cannot meet.
    ///
    /// Measured against the gamut rather than against a committed baseline, so
    /// it needs no reference palette, the bar cannot drift, and it answers "is
    /// this ramp as colourful as this hue permits?" rather than only "did this
    /// change?" (RFC 0027 D2).
    ///
    /// `None` where the gamut permits no chroma at this lightness (pure white in
    /// Display-P3), because the question has no answer there — `0.0` would read
    /// as "grey when it could be colourful" and `1.0` as "riding the boundary".
    /// Values above `1.0` are meaningful and deliberately not clamped — they are
    /// the whole reason this is measured separately from
    /// [`Self::chroma_utilisation`]. The excess is absorbed by clamping on the
    /// way to the screen, and that clamp is where hue drift comes from.
    pub chroma_demand: Option<f32>,
    /// Chroma the ramp *actually gets*, as a fraction of what the gamut allows —
    /// measured on the rendered colour, against the boundary at that colour's own
    /// lightness and hue, so it never meaningfully exceeds `1.0`.
    ///
    /// The boundary is deliberately re-read there rather than shared with
    /// [`Self::chroma_demand`]: gamut mapping moves lightness as well as chroma,
    /// and dividing the rendered chroma by the boundary at the *intended*
    /// lightness mixes two different colours into one ratio — which reads above
    /// `1.0` whenever the mapping lands somewhere the gamut is wider.
    ///
    /// This is the quality metric: the honest answer to "is this ramp as
    /// colourful as this hue permits?" (RFC 0027 §4). Demand answers a different
    /// question — "did the generator ask for something impossible?" — and the
    /// gap between the two is chroma the generator asked for and did not get, the
    /// same intended-versus-rendered diagnostic the hue metrics use (RFC 0027 D3).
    pub chroma_utilisation: Option<f32>,
    /// The OkLCH lightness a browser actually paints — the requested colour
    /// quantised to 8-bit sRGB and read back. Reported alongside the metrics so
    /// a consumer never has to round-trip the hex itself and end up measuring
    /// against a second, disagreeing implementation (RFC 0027 D1).
    pub rendered_l: f32,
    /// The chroma a browser actually paints. Below the requested chroma wherever
    /// the gamut could not meet the demand.
    pub rendered_c: f32,
    /// The hue a browser actually paints, as a bearing in `0..360`. Normalised
    /// here rather than in each consumer: the renderer hands back `-180..180`,
    /// which reads as a negative hue for anything just short of a full turn.
    pub rendered_h: f32,
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

/// How many of a ramp's steps have an accessible foreground, by WCAG rating.
///
/// The engine has always guaranteed this — across the ten shipped ramps there is
/// not a single failure — but nothing stated it, so nothing could notice it
/// breaking. Counted from each swatch's own `ContrastResult`, not re-derived
/// from its ratio, so the audit and the contrast module cannot disagree about
/// where AA ends and AAA begins (RFC 0027 D1).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct ForegroundCoverage {
    /// Steps whose recommended foreground clears 7:1.
    pub aaa: usize,
    /// Steps whose recommended foreground clears 4.5:1 but not 7:1.
    pub aa: usize,
    /// Steps with no accessible foreground at all. Zero on every shipped ramp.
    pub fail: usize,
}

impl ForegroundCoverage {
    /// Whether every step has an accessible foreground.
    pub fn is_complete(&self) -> bool {
        self.fail == 0
    }
}

/// Quality metrics for a whole ramp, judged against one [`Gamut`].
#[derive(Debug, Clone, PartialEq)]
pub struct RampQuality {
    /// Per-step metrics, in ramp order.
    pub steps: Vec<StepQuality>,
    /// How many degrees of hue the ramp's *definition* spans, or `None` when
    /// fewer than two steps carry enough chroma to have a meaningful hue.
    pub hue_span_intended: Option<f32>,
    /// How many degrees of hue the ramp spans once quantised to 8-bit sRGB —
    /// what a browser actually paints, and the only one of the two that can be
    /// wrong. `None` under the same condition as [`Self::hue_span_intended`].
    ///
    /// `None` rather than `0.0` for a ramp with no colour in it, because a grey
    /// ramp holds hue perfectly and would otherwise score as the best ramp in
    /// the system (RFC 0027 §2).
    pub hue_span_rendered: Option<f32>,
    /// The tightest [`StepQuality::delta_l`] anywhere in the ramp, or `None` for
    /// a ramp with fewer than two steps. A minimum rather than a mean: one
    /// collapsed pair is a defect however well spaced the rest of the ramp is.
    pub min_delta_l: Option<f32>,
    /// The mean [`StepQuality::chroma_demand`] across every step that has
    /// one, or `None` when no step does.
    ///
    /// The mean [`StepQuality::chroma_utilisation`] across every step that has
    /// one, or `None` when no step does — the headline answer to "is this ramp as
    /// colourful as this hue permits?", and the metric that pulls against the hue
    /// metrics by design: a grey ramp scores perfectly on hue and near zero here,
    /// so the two must be read together (RFC 0027 §8).
    pub mean_chroma_utilisation: Option<f32>,
    /// The mean over-ask across the ramp. Well above `1.0` means the generator is
    /// requesting chroma the gamut does not have, not that the ramp is colourful.
    pub mean_chroma_demand: Option<f32>,
    /// Whether every step has an accessible foreground, and at what rating.
    pub foreground_coverage: ForegroundCoverage,
    /// The gamut these metrics were measured against. Carried so a report can
    /// never present sRGB numbers as if they were Display-P3 ones.
    pub gamut: Gamut,
}

/// The mean of a set of measurements, or `None` when there were none to average.
fn mean(values: impl Iterator<Item = f32>) -> Option<f32> {
    let values: Vec<f32> = values.collect();
    (!values.is_empty()).then(|| values.iter().sum::<f32>() / values.len() as f32)
}

/// Below this chroma a step carries no meaningful hue — quantisation can push a
/// near-grey to any hue at all — so including it in a hue span measures noise.
const CHROMATIC_FLOOR: f32 = 0.02;

/// The spread of a set of hues in degrees, or `None` when fewer than two were
/// supplied and a span is therefore undefined.
///
/// Hue is a circle, so the spread is the **smallest arc containing every hue** —
/// found as `360°` minus the widest empty gap between neighbours — not the
/// distance between the numeric extremes. Subtracting the extremes puts a seam
/// in the measurement: a tight red ramp either side of 0°, or a cyan ramp either
/// side of the half turn once the renderer has normalised to `-180..180`, both
/// score as a near-full-circle swing. Normalising to `0..360` first only moves
/// the seam; taking the widest gap removes it.
fn hue_span(hues: &[f32]) -> Option<f32> {
    if hues.len() < 2 {
        return None;
    }

    let mut sorted: Vec<f32> = hues.iter().map(|hue| hue.rem_euclid(360.0)).collect();
    sorted.sort_by(|a, b| a.total_cmp(b));

    // Gaps between neighbours, plus the one that closes the circle from the
    // last hue back round to the first.
    let wrap_gap = sorted[0] + 360.0 - sorted[sorted.len() - 1];
    let widest_gap = sorted
        .windows(2)
        .map(|pair| pair[1] - pair[0])
        .fold(wrap_gap, f32::max);

    Some(360.0 - widest_gap)
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

/// What fraction of the chroma available at `(l, h)` a given `c` represents.
/// `None` where the gamut permits none, which would otherwise divide by zero and
/// hand every aggregate a `NaN`.
fn chroma_fraction(l: f32, c: f32, h: f32, gamut: Gamut) -> Option<f32> {
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
    let mut foreground_coverage = ForegroundCoverage::default();
    let mut intended_hues: Vec<f32> = Vec::new();
    let mut rendered_hues: Vec<f32> = Vec::new();

    for swatch in &palette.swatches {
        let rendered = rendered_oklch(swatch.l, swatch.c, swatch.h);
        let rendered_h = rendered.hue.into_degrees().rem_euclid(360.0);

        steps.push(StepQuality {
            label: swatch.label.clone(),
            chroma_demand: chroma_fraction(swatch.l, swatch.c, swatch.h, gamut),
            chroma_utilisation: chroma_fraction(rendered.l, rendered.chroma, rendered_h, gamut),
            rendered_l: rendered.l,
            rendered_c: rendered.chroma,
            rendered_h,
            delta_l: previous_l.map(|previous: f32| (previous - swatch.l).abs()),
            hue_error: hue_distance(rendered_h, swatch.h),
        });
        previous_l = Some(swatch.l);

        match swatch.contrast_result.rating.as_str() {
            "AAA" => foreground_coverage.aaa += 1,
            "AA" => foreground_coverage.aa += 1,
            _ => foreground_coverage.fail += 1,
        }

        if swatch.c > CHROMATIC_FLOOR {
            intended_hues.push(swatch.h);
        }
        if rendered.chroma > CHROMATIC_FLOOR {
            rendered_hues.push(rendered_h);
        }
    }

    let min_delta_l = steps
        .iter()
        .filter_map(|step| step.delta_l)
        .fold(None, |tightest: Option<f32>, delta| {
            Some(tightest.map_or(delta, |t| t.min(delta)))
        });

    RampQuality {
        foreground_coverage,
        mean_chroma_utilisation: mean(steps.iter().filter_map(|step| step.chroma_utilisation)),
        mean_chroma_demand: mean(steps.iter().filter_map(|step| step.chroma_demand)),
        min_delta_l,
        steps,
        hue_span_intended: hue_span(&intended_hues),
        hue_span_rendered: hue_span(&rendered_hues),
        gamut,
    }
}
