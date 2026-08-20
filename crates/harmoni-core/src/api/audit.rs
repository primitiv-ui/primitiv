// Auditing entry points for adapters — per-swatch contrast, and per-ramp quality.

use crate::audit::contrast::{calculate_contrast_low_level, ContrastResult};
use crate::color::input::{ColorInput, ColorInputError};

// Ramp quality lives in `audit::ramp`; adapters reach it only through `api`, so
// the types travel with the function that produces them (RFC 0027 §3).
pub use crate::audit::ramp::{assess as assess_ramp, ForegroundCoverage, RampQuality, StepQuality};

pub fn audit_contrast(
    bg: ColorInput,
    fg: ColorInput,
) -> Result<ContrastResult, ColorInputError> {
    let bg_oklch = bg.to_oklch()?;
    let fg_oklch = fg.to_oklch()?;
    Ok(calculate_contrast_low_level(&bg_oklch, &fg_oklch))
}
