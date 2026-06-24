use palette::Oklch;

use crate::neutral::derive::SoftNeutrals;

pub fn tint_neutrals(
    white: Oklch,
    black: Oklch,
    source: Oklch,
    strength: f32,
) -> SoftNeutrals {
    let strength = strength.clamp(0.0, 1.0);
    let hue = source.hue.into_degrees();
    SoftNeutrals {
        white: Oklch::new(white.l, source.chroma * 0.08 * strength, hue),
        black: Oklch::new(black.l, source.chroma * 0.05 * strength, hue),
    }
}

/// Layer two independent tint anchors onto already-chosen white/black ends — a
/// *highlight* governing the light end and a *shadow* governing the dark end —
/// so the ramp can lean one way through the highlights and another through the
/// shadows. Collapses to [`tint_neutrals`] when the two anchors coincide.
pub fn tint_neutrals_duotone(
    white: Oklch,
    black: Oklch,
    highlight: Oklch,
    shadow: Oklch,
    strength: f32,
) -> SoftNeutrals {
    let strength = strength.clamp(0.0, 1.0);
    SoftNeutrals {
        white: Oklch::new(
            white.l,
            highlight.chroma * 0.08 * strength,
            highlight.hue.into_degrees(),
        ),
        black: Oklch::new(
            black.l,
            shadow.chroma * 0.05 * strength,
            shadow.hue.into_degrees(),
        ),
    }
}
