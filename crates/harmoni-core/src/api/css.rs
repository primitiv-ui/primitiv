//! CSS colour-string conversion — the engine's answer to "what is this colour,
//! written for a stylesheet".
//!
//! Harmoni is OkLCH-first: every colour it generates is an OkLCH triple, and
//! `oklch()` is the form a stylesheet should carry. Adapters that emit CSS (the
//! `primitiv-emit` token emitter, the plugin's token export) need to turn a
//! colour they hold *as a string* — a DTCG `$value`, a user's `--brand` argument
//! — into that form. Doing it here keeps the conversion in the engine, so no
//! adapter grows a second opinion about what a colour is.

use crate::color::input::ColorInput;
use crate::color::output::format_oklch;
use crate::ColorInputError;

/// Convert any CSS-parseable colour string to its `oklch(L C H)` form.
///
/// The input is whatever CSS accepts — hex, `rgb()`, `hsl()`, a named colour,
/// or an `oklch()` string already. An unparseable input is an error rather than
/// a pass-through: the caller knows whether a non-colour (a DTCG alias, say) is
/// expected in its input, and that policy belongs with the caller.
pub fn to_css_oklch(input: &str) -> Result<String, ColorInputError> {
    Ok(format_oklch(
        ColorInput::Css(input.to_string()).to_oklch()?,
    ))
}
