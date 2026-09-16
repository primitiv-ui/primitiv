use crate::api::generate::GenerateError;
use crate::color::input::{ColorInput, ColorInputError};
use crate::neutral::derive::{self, SoftNeutrals};
use crate::neutral::ramp::{self, RampOptions, TintMode};
use crate::neutral::tint;
use palette::Oklch as PaletteOklch;
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

/// How a neutral ramp's grey anchors are tinted before it is generated.
///
/// One source plus an angle, never two colour pickers (Harmoni build notes §11
/// decision 1): `spread` of 0 lays a single source over both anchors, and a
/// non-zero spread splits them into a duotone with the highlight at the source
/// hue **+** spread and the shadow at hue **−** spread.
#[derive(Debug, Clone, PartialEq)]
pub struct NeutralTint {
    /// The colour laid over the anchors, overwriting their chroma and hue while
    /// keeping their lightness.
    pub source: ColorInput,
    /// How far the anchors take the source colour, 0..1.
    pub strength: f32,
    /// Hue divergence between the two anchors, in degrees. 0 is a single source.
    pub spread: f32,
    /// How far chroma crests through the mid-tones, 0..1.
    pub bow: f32,
}

/// A neutral ramp in both modes, with the tint applied to its anchors first.
///
/// Composition the callers were each doing for themselves: which of the two tint
/// calls to make, the ±spread hue split, and the rule that **`bow` means nothing
/// without a tint**. Bow crests chroma through the mid-tones, and an untinted
/// ramp has no chroma to crest — so `None` carries no bow at all rather than
/// accepting one and quietly shaping nothing.
pub fn generate_tinted_neutral_pair(
    white: ColorInput,
    black: ColorInput,
    tint: Option<NeutralTint>,
    steps: usize,
) -> Result<PaletteSet, GenerateError> {
    let Some(tint) = tint else {
        return generate_neutral_pair(
            white,
            black,
            TintMode::Inherit,
            RampOptions { bow: 0.0 },
            steps,
        );
    };

    let white = white.to_oklch()?;
    let black = black.to_oklch()?;
    let source = tint.source.to_oklch()?;
    let soft = if tint.spread == 0.0 {
        tint::tint_neutrals(white, black, source, tint.strength)
    } else {
        tint::tint_neutrals_duotone(
            white,
            black,
            shift_hue(source, tint.spread),
            shift_hue(source, -tint.spread),
            tint.strength,
        )
    };

    generate_neutral_pair(
        as_input(soft.white),
        as_input(soft.black),
        TintMode::Inherit,
        RampOptions { bow: tint.bow },
        steps,
    )
}

/// A generated anchor back as an input, so the tinted pair feeds straight into
/// generation without a hex round trip in between.
fn as_input(color: PaletteOklch) -> ColorInput {
    ColorInput::Oklch {
        l: color.l,
        c: color.chroma,
        h: color.hue.into_degrees(),
    }
}

/// The same colour with its hue rotated by `degrees`.
fn shift_hue(color: PaletteOklch, degrees: f32) -> PaletteOklch {
    PaletteOklch::new(color.l, color.chroma, color.hue.into_degrees() + degrees)
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
