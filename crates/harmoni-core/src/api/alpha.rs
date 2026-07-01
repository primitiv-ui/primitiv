use crate::alpha::ramp::{self, AlphaSwatch};
use crate::color::input::{ColorInput, ColorInputError};

/// Builds an alpha ramp from a single anchor colour (Path A). The adapter
/// boundary: takes a `ColorInput` so callers pass a CSS string, parses it to
/// OkLCH, then defers to [`ramp::generate_alpha_ramp`].
pub fn generate_alpha_ramp(anchor: ColorInput) -> Result<Vec<AlphaSwatch>, ColorInputError> {
    let anchor_oklch = anchor.to_oklch()?;
    Ok(ramp::generate_alpha_ramp(anchor_oklch))
}
