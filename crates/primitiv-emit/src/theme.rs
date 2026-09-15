//! `primitiv theme` — turn a Harmoni palette into theme-token overrides.

use harmoni_core::Palette;

use crate::token::Token;

/// Which of the engine's renderings of a swatch a token carries.
///
/// Both are computed by the engine and describe the same colour; they differ in
/// who is going to read them.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ColorForm {
    /// `oklch(L C H)` — what a stylesheet gets, the token layer being OkLCH-first.
    Oklch,
    /// `#rrggbb` — what a DTCG document for an importer gets. Hex is the form the
    /// token ecosystem reads, and the form Figma's own variables panel shows; the
    /// engine's rendered OkLCH reproduces it exactly, so nothing is lost by
    /// handing a consumer the hex instead.
    Hex,
}

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
/// The value read is whichever rendering `form` names. Either way it is one the
/// engine computed: converting between them here would put a round trip in front
/// of a value that is already exact.
///
/// The value read is the swatch's `oklch`, not its `hex`: the engine holds the
/// colour exactly and renders both, so converting the hex back would put an
/// 8-bit round trip in front of a value that is already right. It also keeps the
/// override layer in the same form as the base layer the emitter writes.
pub fn ramp_tokens(family: &str, palette: &Palette, form: ColorForm) -> Vec<Token> {
    palette
        .swatches
        .iter()
        .map(|swatch| {
            let value = match form {
                ColorForm::Oklch => &swatch.oklch,
                ColorForm::Hex => &swatch.hex,
            };
            Token::new(&["color", family, &swatch.label.to_string()], value)
        })
        .collect()
}
