use crate::color::input::{ColorInput, ColorInputError};
use crate::neutral::derive::{self, SoftNeutrals};
use crate::neutral::ramp::{self, RampOptions, TintMode};
use crate::neutral::tint;
use crate::palette::generator::Palette;

pub fn generate_neutral_ramp(
    white: ColorInput,
    black: ColorInput,
    tint: TintMode,
) -> Result<Palette, ColorInputError> {
    let soft_white = white.to_oklch()?;
    let soft_black = black.to_oklch()?;
    Ok(ramp::generate_neutral_ramp(
        soft_white,
        soft_black,
        tint,
        RampOptions::default(),
    ))
}

pub fn derive_soft_neutrals(
    brand: ColorInput,
    softness: f32,
) -> Result<SoftNeutrals, ColorInputError> {
    let brand_oklch = brand.to_oklch()?;
    Ok(derive::derive_soft_neutrals(brand_oklch, softness))
}

pub fn tint_neutrals(
    white: ColorInput,
    black: ColorInput,
    source: ColorInput,
    strength: f32,
) -> Result<SoftNeutrals, ColorInputError> {
    let white_oklch = white.to_oklch()?;
    let black_oklch = black.to_oklch()?;
    let source_oklch = source.to_oklch()?;
    Ok(tint::tint_neutrals(
        white_oklch,
        black_oklch,
        source_oklch,
        strength,
    ))
}
