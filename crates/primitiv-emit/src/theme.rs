//! `primitiv theme` — turn a Harmoni palette into theme-token overrides.

use harmoni_core::Palette;

use crate::token::Token;

/// Map a Harmoni palette to one ramp family's theme tokens: each swatch becomes a
/// `--primitiv-color-<family>-<step>` custom property carrying the swatch's own
/// `oklch()` (RFC 0006 §5.1). These names are the stable override surface — base
/// intent tokens reference them, so re-skinning a ramp re-skins every role built
/// on it, with no new emitter machinery: `action/danger/*` is already
/// `var(--primitiv-color-danger-*)`.
///
/// `family` is the palette family the seed stands for (`brand`, `danger`,
/// `warning`, `success`, `info`) rather than a fixed `brand`, so a project can
/// re-seed as many of its ramps as it has colours for.
///
/// The value read is the swatch's `oklch`, not its `hex`: the engine holds the
/// colour exactly and renders both, so converting the hex back would put an
/// 8-bit round trip in front of a value that is already right. It also keeps the
/// override layer in the same form as the base layer the emitter writes.
pub fn ramp_tokens(family: &str, palette: &Palette) -> Vec<Token> {
    palette
        .swatches
        .iter()
        .map(|swatch| Token::new(&["color", family, &swatch.label.to_string()], &swatch.oklch))
        .collect()
}
