use crate::alpha::ramp::{self, AlphaSwatch};
use crate::api::generate::GenerateError;
use crate::color::input::{ColorInput, ColorInputError};
use crate::palette::generator::{MAX_STEPS, MIN_STEPS};

/// Builds an alpha ramp of `steps` steps from a single anchor colour, so an
/// alpha ramp can match the length of the solid ramp it accompanies.
///
/// The length is checked here rather than in `alpha::ramp`, which is what lets
/// that module resample without a guard — the same arrangement `curves_for`
/// uses for palette generation. `steps` outside `MIN_STEPS..=MAX_STEPS` is
/// rejected rather than clamped, so a caller finds out it asked for something
/// the model cannot express.
pub fn generate_alpha_ramp_with_steps(
    anchor: ColorInput,
    steps: usize,
) -> Result<Vec<AlphaSwatch>, GenerateError> {
    if !(MIN_STEPS..=MAX_STEPS).contains(&steps) {
        return Err(GenerateError::UnsupportedStepCount(steps));
    }

    let anchor_oklch = anchor.to_oklch()?;
    Ok(ramp::generate_alpha_ramp_with_steps(anchor_oklch, steps))
}

/// Builds an alpha ramp from a single anchor colour (Path A). The adapter
/// boundary: takes a `ColorInput` so callers pass a CSS string, parses it to
/// OkLCH, then defers to [`ramp::generate_alpha_ramp`].
pub fn generate_alpha_ramp(anchor: ColorInput) -> Result<Vec<AlphaSwatch>, ColorInputError> {
    let anchor_oklch = anchor.to_oklch()?;
    Ok(ramp::generate_alpha_ramp(anchor_oklch))
}
