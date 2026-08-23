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
    let _ = (easing, direction);

    (0..count)
        .map(|i| i as f32 / (count - 1) as f32)
        .collect()
}
