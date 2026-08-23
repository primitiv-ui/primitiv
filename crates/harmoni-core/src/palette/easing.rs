//! Easing families for the lightness curve a ramp is generated from.
//!
//! A preset does not change the generation model: it only changes which shape
//! the padding → anchoring chain works from. Everything here is normalised —
//! `curve` returns positions in `0..=1`, ascending — so a caller is free to map
//! them onto a light ramp (which runs bright to dark) or a dark one (which runs
//! the other way) without the families needing to know which.

/// The shape of the lightness curve.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Easing {
    Linear,
    Quadratic,
    Cubic,
    Quartic,
    Quintic,
    Sine,
    Exponential,
    Circular,
    Arc,
}

/// The accent that makes `Arc` its own shape rather than a second name for
/// `Sine`.
///
/// The arc's accent sweeps it continuously from `Sine` ease-out at 0 to `Sine`
/// ease-in at 1, so both ends of the range duplicate a family that already
/// exists. The midpoint is the only default under which `Arc` contributes a
/// shape nothing else in the list can make.
pub const DEFAULT_ARC_ACCENT: f32 = 0.5;

/// Which end of the ramp a family's acceleration is applied to.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Direction {
    EaseIn,
    EaseOut,
    EaseInOut,
}

/// A chosen curve: a family, the end its acceleration is applied to, and — for
/// the one family that takes a parameter — its accent.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct CurvePreset {
    pub easing: Easing,
    pub direction: Direction,
    /// Only [`Easing::Arc`] reads this; every other family is a fixed shape.
    /// Outside `0..=1` the arc stops being monotonic, so it is clamped.
    pub accent: f32,
}

impl CurvePreset {
    pub fn new(easing: Easing, direction: Direction) -> Self {
        CurvePreset {
            easing,
            direction,
            accent: DEFAULT_ARC_ACCENT,
        }
    }

    pub fn with_accent(self, accent: f32) -> Self {
        CurvePreset { accent, ..self }
    }
}

/// Sample `preset` at `count` positions across the ramp.
///
/// Returns *sampled positions*, not a function, because not every family is
/// expressible as `f(t)`: `Arc` samples a quarter circle evenly in angle rather
/// than evenly in `t`, so it chooses its own distribution. Writing this as
/// `fn ease(t: f32) -> f32` would make that family impossible to add without
/// breaking the signature.
///
/// `count` must be at least 2; a single position has no interval to divide by.
/// `MIN_STEPS` is what guarantees that for every caller.
pub fn curve(preset: &CurvePreset, count: usize) -> Vec<f32> {
    let shape = |t: f32| ease_in(preset, t);

    (0..count)
        .map(|i| {
            let t = i as f32 / (count - 1) as f32;
            match preset.direction {
                Direction::EaseIn => shape(t),
                // The same curve entered from the other end: reflect through
                // both axes rather than authoring a second set of formulae.
                Direction::EaseOut => 1.0 - shape(1.0 - t),
                // Both halves at half scale: the ease-in shape up to the
                // midpoint, its ease-out mirror after it.
                Direction::EaseInOut if t < 0.5 => shape(2.0 * t) / 2.0,
                Direction::EaseInOut => 1.0 - shape(2.0 - 2.0 * t) / 2.0,
            }
        })
        .collect()
}

/// A family's shape in its ease-in orientation — slow at 0, fast at 1. Every
/// other direction is derived from this one.
fn ease_in(preset: &CurvePreset, t: f32) -> f32 {
    match preset.easing {
        Easing::Linear => t,
        Easing::Quadratic => t.powi(2),
        Easing::Cubic => t.powi(3),
        Easing::Quartic => t.powi(4),
        Easing::Quintic => t.powi(5),
        Easing::Sine => 1.0 - (t * std::f32::consts::FRAC_PI_2).cos(),
        // 2^(10t - 10) lands on 2^-10 rather than 0, so the zero is pinned:
        // anchoring reads the curve's own endpoints and a ramp whose curve
        // starts just off zero starts just off its anchor.
        Easing::Exponential if t == 0.0 => 0.0,
        Easing::Exponential => (10.0 * t - 10.0).exp2(),
        Easing::Circular => 1.0 - (1.0 - t * t).sqrt(),
        // The arc's own orientation is fast-at-zero, so its ease-in is that
        // shape entered from the other end — the same reflection `curve` uses.
        Easing::Arc => 1.0 - arc(1.0 - t, preset.accent),
    }
}

/// A quarter circle sampled evenly in **angle** rather than evenly in `t`,
/// which is what separates this family from `Circular` — the two trace the same
/// arc but place their steps differently, and where the steps land is exactly
/// what a preset controls.
///
/// From fettepalette's `pointOnCurve`, whose arc branch reduces to
/// `y = sin(θ + a)` for `θ = t·π/2`. Two departures from that source, both
/// forced by what a *lightness* ramp needs:
///
/// - **The accent is negated and clamped to `0..=1`.** `sin` turns over inside
///   the sampled window for a positive accent, which would run a ramp's
///   lightness back down: 300 coming out darker than 400.
/// - **The result is normalised over its own sampled span, not clamped into
///   `0..=1`.** Clamping — what the source does — parks several samples on one
///   value at any non-zero accent, and colliding steps are the defect the
///   anchored model exists to prevent (RFC 0027 §12.2).
///
/// At accent 0 this is `sin(t·π/2)`, which is the sine family exactly; at 1 it
/// is sine's other orientation. Only between them is it a shape of its own.
fn arc(t: f32, accent: f32) -> f32 {
    let a = accent.clamp(0.0, 1.0) * std::f32::consts::FRAC_PI_2;
    let at = |t: f32| (t * std::f32::consts::FRAC_PI_2 - a).sin();
    let (start, end) = (at(0.0), at(1.0));

    (at(t) - start) / (end - start)
}

/// Read a preset across a ramp's own lightness endpoints.
///
/// Families are normalised so one set of them serves both themes: a light ramp
/// runs bright to dark and a dark ramp runs the other way, and neither
/// direction is the families' business. `from` and `to` are the ramp's ends —
/// which the anchored model then pins its two halves to, so this decides the
/// shape between them and nothing else.
pub fn lightness_curve(preset: &CurvePreset, count: usize, from: f32, to: f32) -> Vec<f32> {
    curve(preset, count)
        .into_iter()
        .map(|t| from + t * (to - from))
        .collect()
}
