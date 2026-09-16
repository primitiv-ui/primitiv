use crate::api::generate::GenerateError;
use crate::color::input::{ColorInput, ColorInputError};
use crate::neutral::derive::{self, SoftNeutrals};
use crate::neutral::ramp::{self, RampOptions, TintMode};
use crate::neutral::tint;
use crate::api::generate::PaletteSet;
use crate::palette::generator::{Palette, MAX_STEPS, MIN_STEPS};

/// Builds a neutral ramp of `steps` steps between the two soft anchors, so a
/// neutral ramp can match the length of the solid ramps it sits beside — the
/// labels come from the same ladder, and the two families line up step for
/// step.
///
/// The length is checked here rather than in `neutral::ramp`, which is what
/// lets that module resample without a guard — the same arrangement
/// `generate_alpha_ramp_with_steps` and `curves_for` use. `steps` outside
/// `MIN_STEPS..=MAX_STEPS` is rejected rather than clamped, so a caller finds
/// out it asked for something the model cannot express.
pub fn generate_neutral_ramp_with_steps(
    white: ColorInput,
    black: ColorInput,
    tint: TintMode,
    options: RampOptions,
    steps: usize,
) -> Result<Palette, GenerateError> {
    if !(MIN_STEPS..=MAX_STEPS).contains(&steps) {
        return Err(GenerateError::UnsupportedStepCount(steps));
    }

    let soft_white = white.to_oklch()?;
    let soft_black = black.to_oklch()?;
    Ok(ramp::generate_neutral_ramp_with_steps(
        soft_white, soft_black, tint, options, steps,
    ))
}

/// A neutral ramp in both modes, from one pair of soft anchors.
///
/// The dark half is the SAME two anchors **swapped**, not the light half
/// reversed. Those are different things and only one of them is right: every step
/// of a ramp holds a fixed semantic role (background → component bg → border →
/// solid → text), so reversing the array would hand every step a new job. Running
/// the generator the other way between the same endpoints keeps each step's role
/// and re-derives the curve for a dark substrate — the ends coincide, the
/// mid-tones do not.
///
/// This rule already existed, in the Harmoni plugin's own wasm adapter, which is
/// the problem it solves: a colour decision living in a TypeScript caller is a
/// second source of truth, and the CLI needed the same rule. It lives here now so
/// both callers share one implementation.
///
/// Tinting is deliberately NOT done here. The anchors arrive already tinted (via
/// [`tint_neutrals`] or [`tint_neutrals_duotone`]), because the tint source is a
/// colour the caller has resolved — a ramp step, in the plugin's case — and
/// resolving it is not this function's business.
pub fn generate_neutral_pair(
    white: ColorInput,
    black: ColorInput,
    tint: TintMode,
    options: RampOptions,
    steps: usize,
) -> Result<PaletteSet, GenerateError> {
    let light = generate_neutral_ramp_with_steps(
        white.clone(),
        black.clone(),
        tint,
        options,
        steps,
    )?;
    let dark = generate_neutral_ramp_with_steps(black, white, tint, options, steps)?;
    Ok(PaletteSet { light, dark })
}

pub fn generate_neutral_ramp(
    white: ColorInput,
    black: ColorInput,
    tint: TintMode,
    options: RampOptions,
) -> Result<Palette, ColorInputError> {
    let soft_white = white.to_oklch()?;
    let soft_black = black.to_oklch()?;
    Ok(ramp::generate_neutral_ramp(
        soft_white, soft_black, tint, options,
    ))
}

pub fn tint_neutrals_duotone(
    white: ColorInput,
    black: ColorInput,
    highlight: ColorInput,
    shadow: ColorInput,
    strength: f32,
) -> Result<SoftNeutrals, ColorInputError> {
    let white_oklch = white.to_oklch()?;
    let black_oklch = black.to_oklch()?;
    let highlight_oklch = highlight.to_oklch()?;
    let shadow_oklch = shadow.to_oklch()?;
    Ok(tint::tint_neutrals_duotone(
        white_oklch,
        black_oklch,
        highlight_oklch,
        shadow_oklch,
        strength,
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
