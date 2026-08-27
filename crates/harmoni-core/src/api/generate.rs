// Palette generation entry points for adapters.

use palette::Oklch;

use crate::color::input::{ColorInput, ColorInputError};
use crate::palette::easing::{lightness_curve, CurvePreset};
use crate::palette::generator::{
    generate_dark_palette, generate_palette_with_scale, resample, Palette, DEFAULT_STEPS,
    MAX_STEPS, MIN_STEPS, TARGET_CHROMA_SCALE, TARGET_LIGHTNESS, TARGET_LIGHTNESS_DARK,
    validate_lightness_curve,
};

// What each step of the ramp a colour would seed asks for, against what the
// gamut grants — the picker's chroma-headroom feedback (RFC 0027 §6).
pub use crate::palette::generator::{chroma_headroom, ChromaHeadroom};

/// Why a generate call could not produce a palette.
///
/// Kept separate from `ColorInputError` because not every way of asking for an
/// impossible palette is a bad colour — a curve out of range and an
/// unsupported ramp length are their own mistakes, and reporting them as
/// `InvalidCss` told the caller the wrong thing.
#[derive(Debug, Clone, PartialEq)]
pub enum GenerateError {
    InvalidColor(ColorInputError),
    InvalidCurve(String),
    UnsupportedStepCount(usize),
}

impl From<ColorInputError> for GenerateError {
    fn from(value: ColorInputError) -> Self {
        GenerateError::InvalidColor(value)
    }
}

impl std::fmt::Display for GenerateError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            GenerateError::InvalidColor(ColorInputError::InvalidCss(css)) => {
                write!(f, "Invalid colour: {css}")
            }
            GenerateError::InvalidCurve(reason) => write!(f, "{reason}"),
            GenerateError::UnsupportedStepCount(steps) => write!(
                f,
                "Step count must be between {MIN_STEPS} and {MAX_STEPS}, got {steps}"
            ),
        }
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct GenerateOptions {
    pub light_padding: f32,
    pub dark_padding: f32,
    pub soft_white: Option<Oklch>,
    pub soft_black: Option<Oklch>,
    /// How many steps the ramp should have, within `MIN_STEPS..=MAX_STEPS`.
    pub steps: usize,
    /// Which shape to build the ramp from. `None` — the default — keeps the
    /// hand-authored curves this engine has always used, so a caller that asks
    /// for nothing gets exactly what it got before presets existed. Note that
    /// `None` is not `Some(Linear)`: the authored curves are not straight
    /// lines, and no preset reproduces them.
    pub curve: Option<CurvePreset>,
}

impl Default for GenerateOptions {
    fn default() -> Self {
        GenerateOptions {
            light_padding: 0.0,
            dark_padding: 0.0,
            soft_white: None,
            soft_black: None,
            steps: DEFAULT_STEPS,
            curve: None,
        }
    }
}

/// The default curves read at `steps` resolution, or an error if the length is
/// outside what the model supports.
fn curves_for(steps: usize) -> Result<(Vec<f32>, Vec<f32>), GenerateError> {
    if !(MIN_STEPS..=MAX_STEPS).contains(&steps) {
        return Err(GenerateError::UnsupportedStepCount(steps));
    }

    Ok((
        resample(&TARGET_LIGHTNESS, steps),
        resample(&TARGET_CHROMA_SCALE, steps),
    ))
}

/// A theme's lightness scale: the caller's preset read across the authored
/// curve's own endpoints, or that authored curve itself where none was asked
/// for. A preset chooses the shape between a ramp's ends; it does not move the
/// ends, which is what keeps every preset comparable to the default.
fn lightness_scale(authored: &[f32], steps: usize, preset: Option<&CurvePreset>) -> Vec<f32> {
    match preset {
        None => resample(authored, steps),
        Some(preset) => {
            lightness_curve(preset, steps, authored[0], authored[authored.len() - 1])
        }
    }
}

/// A light palette paired with its dark-mode counterpart, both derived
/// from the same brand colour in a single call.
#[derive(Debug, Clone, PartialEq)]
pub struct PaletteSet {
    pub light: Palette,
    pub dark: Palette,
}

pub fn generate(input: ColorInput) -> Result<Palette, GenerateError> {
    generate_with_options(input, GenerateOptions::default())
}

pub fn generate_with_options(
    input: ColorInput,
    options: GenerateOptions,
) -> Result<Palette, GenerateError> {
    let (_, chroma) = curves_for(options.steps)?;
    let lightness = lightness_scale(&TARGET_LIGHTNESS, options.steps, options.curve.as_ref());
    let oklch = input.to_oklch()?;
    Ok(generate_palette_with_scale(
        oklch,
        &lightness,
        &chroma,
        options.light_padding,
        options.dark_padding,
        options.soft_white,
        options.soft_black,
    ))
}

/// Generate a light palette and its anchored dark counterpart together.
/// The light side uses the offset model; the dark side uses the anchored
/// two-segment model. Both share the brand colour at step 500.
/// Both curves' length is the ramp's length — where a caller supplies a curve,
/// that curve decides the step count, not `options.steps`.
pub fn generate_pair(
    input: ColorInput,
    light_curve: &[f32],
    dark_curve: &[f32],
    options: GenerateOptions,
) -> Result<PaletteSet, GenerateError> {
    if light_curve.len() != dark_curve.len() {
        return Err(GenerateError::InvalidCurve(String::from(
            "Light and dark curves must have the same number of steps",
        )));
    }
    let (_, chroma) = curves_for(light_curve.len())?;
    let oklch = input.to_oklch()?;

    Ok(pair_from_curves(
        oklch,
        light_curve,
        dark_curve,
        &chroma,
        &options,
    ))
}

/// The infallible core of pair generation: everything that can go wrong has
/// already been checked by the time this runs, which is what lets
/// `generate_brand_pair` keep the narrower `ColorInputError` — its curves are
/// the built-in ones, so a step count cannot be wrong.
fn pair_from_curves(
    oklch: Oklch,
    light_curve: &[f32],
    dark_curve: &[f32],
    chroma_scale: &[f32],
    options: &GenerateOptions,
) -> PaletteSet {
    PaletteSet {
        light: generate_palette_with_scale(
            oklch,
            light_curve,
            chroma_scale,
            options.light_padding,
            options.dark_padding,
            options.soft_white,
            options.soft_black,
        ),
        dark: generate_dark_palette(
            oklch,
            dark_curve,
            options.light_padding,
            options.dark_padding,
            options.soft_white,
            options.soft_black,
        ),
    }
}

/// Generate a brand's paired light + dark palette using the system default
/// theme curves (`TARGET_LIGHTNESS` for light, `TARGET_LIGHTNESS_DARK` for
/// dark). This is the entry point `primitiv theme --brand` builds on: the
/// curve choice lives here in the engine, so the CLI passes only the brand.
pub fn generate_brand_pair(input: ColorInput) -> Result<PaletteSet, ColorInputError> {
    let oklch = input.to_oklch()?;

    Ok(pair_from_curves(
        oklch,
        &TARGET_LIGHTNESS,
        &TARGET_LIGHTNESS_DARK,
        &TARGET_CHROMA_SCALE,
        &GenerateOptions::default(),
    ))
}

/// A light/dark pair from the default curves, read at `options.steps`.
pub fn generate_brand_pair_with_options(
    input: ColorInput,
    options: GenerateOptions,
) -> Result<PaletteSet, GenerateError> {
    curves_for(options.steps)?;
    let light = lightness_scale(&TARGET_LIGHTNESS, options.steps, options.curve.as_ref());
    let dark = lightness_scale(&TARGET_LIGHTNESS_DARK, options.steps, options.curve.as_ref());

    generate_pair(input, &light, &dark, options)
}

pub fn generate_with_lightness(
    input: ColorInput,
    lightness: [f32; 10],
    options: GenerateOptions,
) -> Result<Palette, GenerateError> {
    validate_lightness_curve(lightness).map_err(GenerateError::InvalidCurve)?;

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
