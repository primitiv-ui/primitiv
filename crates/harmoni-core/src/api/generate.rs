// Palette generation entry points for adapters.

use palette::Oklch;

use crate::color::input::{ColorInput, ColorInputError};
use crate::palette::generator::{
    generate_dark_palette, generate_palette_with_scale, Palette, TARGET_CHROMA_SCALE,
    TARGET_LIGHTNESS, TARGET_LIGHTNESS_DARK, validate_lightness_curve,
};

#[derive(Debug, Clone, Default, PartialEq)]
pub struct GenerateOptions {
    pub light_padding: f32,
    pub dark_padding: f32,
    pub soft_white: Option<Oklch>,
    pub soft_black: Option<Oklch>,
}

/// A light palette paired with its dark-mode counterpart, both derived
/// from the same brand colour in a single call.
#[derive(Debug, Clone, PartialEq)]
pub struct PaletteSet {
    pub light: Palette,
    pub dark: Palette,
}

pub fn generate(input: ColorInput) -> Result<Palette, ColorInputError> {
    generate_with_options(input, GenerateOptions::default())
}

pub fn generate_with_options(
    input: ColorInput,
    options: GenerateOptions,
) -> Result<Palette, ColorInputError> {
    let oklch = input.to_oklch()?;
    Ok(generate_palette_with_scale(
        oklch,
        &TARGET_LIGHTNESS,
        &TARGET_CHROMA_SCALE,
        options.light_padding,
        options.dark_padding,
        options.soft_white,
        options.soft_black,
    ))
}

/// Generate a light palette and its anchored dark counterpart together.
/// The light side uses the offset model; the dark side uses the anchored
/// two-segment model. Both share the brand colour at step 500.
pub fn generate_pair(
    input: ColorInput,
    light_curve: &[f32; 10],
    dark_curve: &[f32; 10],
    options: GenerateOptions,
) -> Result<PaletteSet, ColorInputError> {
    let oklch = input.to_oklch()?;
    let light = generate_palette_with_scale(
        oklch,
        light_curve,
        &TARGET_CHROMA_SCALE,
        options.light_padding,
        options.dark_padding,
        options.soft_white,
        options.soft_black,
    );
    let dark = generate_dark_palette(
        oklch,
        dark_curve,
        options.light_padding,
        options.dark_padding,
        options.soft_white,
        options.soft_black,
    );

    Ok(PaletteSet { light, dark })
}

/// Generate a brand's paired light + dark palette using the system default
/// theme curves (`TARGET_LIGHTNESS` for light, `TARGET_LIGHTNESS_DARK` for
/// dark). This is the entry point `primitiv theme --brand` builds on: the
/// curve choice lives here in the engine, so the CLI passes only the brand.
pub fn generate_brand_pair(input: ColorInput) -> Result<PaletteSet, ColorInputError> {
    generate_pair(
        input,
        &TARGET_LIGHTNESS,
        &TARGET_LIGHTNESS_DARK,
        GenerateOptions::default(),
    )
}

pub fn generate_with_lightness(
    input: ColorInput,
    lightness: [f32; 10],
    options: GenerateOptions,
) -> Result<Palette, ColorInputError> {
    // Validate lightness curve before processing
    validate_lightness_curve(lightness)
        .map_err(|e| ColorInputError::InvalidCss(e))?;

    let oklch = input.to_oklch()?;
    Ok(generate_palette_with_scale(
        oklch,
        &lightness,
        &TARGET_CHROMA_SCALE,
        options.light_padding,
        options.dark_padding,
        options.soft_white,
        options.soft_black,
    ))
}
