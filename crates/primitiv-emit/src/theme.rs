//! `primitiv theme` — turn a Harmoni palette into theme-token overrides.

use harmoni_core::Palette;

use crate::token::Token;

/// Map a Harmoni palette to its brand-ramp theme tokens: each swatch becomes a
/// `--primitiv-color-brand-<step>` custom property carrying the swatch's own
/// `oklch()` (RFC 0006 §5.1). These names are the stable override surface — base
/// intent tokens reference them, so re-skinning the ramp re-skins the system.
///
/// The value read is the swatch's `oklch`, not its `hex`: the engine holds the
/// colour exactly and renders both, so converting the hex back would put an
/// 8-bit round trip in front of a value that is already right. It also keeps the
/// override layer in the same form as the base layer the emitter writes.
pub fn brand_tokens(palette: &Palette) -> Vec<Token> {
    palette
        .swatches
        .iter()
        .map(|swatch| Token::new(&["color", "brand", &swatch.label.to_string()], &swatch.oklch))
        .collect()
}
