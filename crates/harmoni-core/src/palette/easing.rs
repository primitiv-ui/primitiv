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
}

/// Which end of the ramp a family's acceleration is applied to.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Direction {
    EaseIn,
    EaseOut,
    EaseInOut,
}

/// Sample `easing` at `count` positions across the ramp.
///
/// Returns *sampled positions*, not a function, because not every family is
/// expressible as `f(t)`: `Arc` samples a quarter circle evenly in angle rather
/// than evenly in `t`, so it chooses its own distribution. Writing this as
/// `fn ease(t: f32) -> f32` would make that family impossible to add without
/// breaking the signature.
///
/// `count` must be at least 2; a single position has no interval to divide by.
/// `MIN_STEPS` is what guarantees that for every caller.
pub fn curve(easing: Easing, direction: Direction, count: usize) -> Vec<f32> {
    (0..count)
        .map(|i| {
            let t = i as f32 / (count - 1) as f32;
            match direction {
                Direction::EaseIn => ease_in(easing, t),
                // The same curve entered from the other end: reflect through
                // both axes rather than authoring a second set of formulae.
                Direction::EaseOut => 1.0 - ease_in(easing, 1.0 - t),
                // Both halves at half scale: the ease-in shape up to the
                // midpoint, its ease-out mirror after it.
                Direction::EaseInOut if t < 0.5 => ease_in(easing, 2.0 * t) / 2.0,
                Direction::EaseInOut => 1.0 - ease_in(easing, 2.0 - 2.0 * t) / 2.0,
            }
        })
        .collect()
}

/// A family's shape in its ease-in orientation — slow at 0, fast at 1. Every
/// other direction is derived from this one.
fn ease_in(easing: Easing, t: f32) -> f32 {
    match easing {
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
    }
}
