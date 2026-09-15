//! Re-pointing the semantic layer when a ramp is not ten steps long.
//!
//! Primitiv's own scale is ten, and the shipped Intent layer is written against
//! it: `action/primary/hover` aliases `{color.brand.600}`, `disabled` aliases
//! `{color.brand.200}`, and so on. Ask the engine for a ramp of any other length
//! and those steps stop existing — a seven-step ramp labels
//! `50, 100, 300, 500, 630, 770, 900`, so `var(--primitiv-color-brand-600)`
//! resolves to nothing and the role silently keeps whatever the base layer had.
//!
//! Ten is in fact the **only** length at which the shipped Intent layer resolves
//! completely. Even nine and eleven lose 600, 700 and 800.

/// The label closest to `wanted` among the ones a ramp actually has.
///
/// Ties go to the **higher** label. A role that cannot land on its own step is
/// better served by more contrast than less: a higher step is darker in the light
/// ramp and lighter in the dark one, so it reads more strongly against its own
/// mode's surface either way.
pub fn nearest_label(wanted: u16, available: &[u16]) -> u16 {
    available
        .iter()
        .copied()
        .min_by_key(|label| (label.abs_diff(wanted), u16::MAX - label))
        .unwrap_or(wanted)
}
