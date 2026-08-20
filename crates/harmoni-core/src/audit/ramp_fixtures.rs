//! Shared palette fixtures for the ramp-quality tests. Pure data — no
//! assertions and no helpers that hide a behaviour under test.

use crate::audit::contrast::get_contrast_result;
use crate::audit::foreground::ForegroundSource;
use crate::palette::generator::{Palette, Swatch, SwatchStep};

/// Builds a swatch whose `hex`/`rgb`/`oklch` are the engine's genuine
/// quantisation of `(l, c, h)` — the rendered values the audit measures — with
/// a caller-chosen foreground contrast ratio so coverage can be driven directly.
pub fn swatch(label: u16, l: f32, c: f32, h: f32, contrast_ratio: f32) -> Swatch {
    let step = SwatchStep::from_label(l, c, h, label);
    Swatch {
        l: step.l,
        c: step.c,
        h: step.h,
        label: step.label.clone(),
        hex: step.hex.clone(),
        rgb: step.rgb,
        oklch: step.oklch.clone(),
        best_foreground: step,
        foreground_source: ForegroundSource::Step900,
        contrast_result: get_contrast_result(contrast_ratio),
    }
}

/// Wraps swatches in a `Palette`, filling the generation metadata the quality
/// metrics never read.
pub fn palette(swatches: Vec<Swatch>) -> Palette {
    Palette {
        swatches,
        lightness_curve: [0.0; 10],
        max_recommended_light_padding: 0.0,
        max_recommended_dark_padding: 0.0,
        note: String::new(),
    }
}
