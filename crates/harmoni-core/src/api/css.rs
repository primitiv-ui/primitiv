//! CSS colour-string conversion — the engine's answer to "what is this colour,
//! written for a stylesheet".
//!
//! Harmoni is OkLCH-first: every colour it generates is an OkLCH triple, and
//! `oklch()` is the form a stylesheet should carry. Adapters that emit CSS (the
//! `primitiv-emit` token emitter, the plugin's token export) need to turn a
//! colour they hold *as a string* — a DTCG `$value`, a user's `--brand` argument
//! — into that form. Doing it here keeps the conversion in the engine, so no
//! adapter grows a second opinion about what a colour is.

use palette::Oklch;

use crate::color::input::parse_css_with_alpha;
use crate::color::output::{format_oklch, format_oklch_alpha};
use crate::ColorInputError;

/// Convert any CSS-parseable colour string to its `oklch(L C H)` form.
///
/// The input is whatever CSS accepts — hex, `rgb()`, `hsl()`, a named colour,
/// or an `oklch()` string already; a colour carrying alpha renders in the
/// `oklch(L C H / a)` slash-alpha form. An unparseable input is an error rather than
/// a pass-through: the caller knows whether a non-colour (a DTCG alias, say) is
/// expected in its input, and that policy belongs with the caller.
pub fn to_css_oklch(input: &str) -> Result<String, ColorInputError> {
    let (color, alpha) = parse_css_with_alpha(input)?;
    Ok(oklch_with_alpha(color, alpha))
}

/// Render an already-parsed colour and alpha as its CSS `oklch()` form.
///
/// The opaque-versus-translucent choice lives here, once, so a caller that has
/// already parsed a colour (to ask something about it first) renders it exactly
/// as [`to_css_oklch`] would rather than re-deciding for itself.
pub fn oklch_with_alpha(color: Oklch, alpha: f32) -> String {
    if alpha >= 1.0 {
        format_oklch(color)
    } else {
        format_oklch_alpha(color, alpha)
    }
}
