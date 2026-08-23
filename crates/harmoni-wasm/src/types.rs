// Mirror types that hold the Tsify derives for the wasm boundary.
//
// harmoni-core is a pure Rust library and must not depend on wasm-bindgen
// or tsify. These structs shadow the core types field-for-field, add the
// Tsify derives needed for TypeScript generation + the wasm ABI, and
// expose `From<core::..>` impls so wasm entry points can convert at the
// boundary.

use harmoni_core as core;
use serde::{Deserialize, Serialize};
use tsify::Tsify;

/// The shape of the lightness curve a ramp is generated from. Passed *into* the
/// engine, so it converts core-ward.
#[derive(Tsify, Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub enum Easing {
    Linear,
    Quadratic,
    Cubic,
    Quartic,
    Quintic,
    Sine,
    Exponential,
    Circular,
    Arc,
}

impl From<Easing> for core::Easing {
    fn from(value: Easing) -> Self {
        match value {
            Easing::Linear => core::Easing::Linear,
            Easing::Quadratic => core::Easing::Quadratic,
            Easing::Cubic => core::Easing::Cubic,
            Easing::Quartic => core::Easing::Quartic,
            Easing::Quintic => core::Easing::Quintic,
            Easing::Sine => core::Easing::Sine,
            Easing::Exponential => core::Easing::Exponential,
            Easing::Circular => core::Easing::Circular,
            Easing::Arc => core::Easing::Arc,
        }
    }
}

/// Which end of the ramp a family's acceleration is applied to.
#[derive(Tsify, Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub enum Direction {
    EaseIn,
    EaseOut,
    EaseInOut,
}

impl From<Direction> for core::Direction {
    fn from(value: Direction) -> Self {
        match value {
            Direction::EaseIn => core::Direction::EaseIn,
            Direction::EaseOut => core::Direction::EaseOut,
            Direction::EaseInOut => core::Direction::EaseInOut,
        }
    }
}

/// A chosen curve: a family, the end its acceleration is applied to, and — for
/// the one family that takes a parameter — its accent.
#[derive(Tsify, Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct CurvePreset {
    pub easing: Easing,
    pub direction: Direction,
    /// Only [`Easing::Arc`] reads this; every other family is a fixed shape.
    pub accent: f32,
}

impl From<CurvePreset> for core::CurvePreset {
    fn from(value: CurvePreset) -> Self {
        core::CurvePreset::new(value.easing.into(), value.direction.into())
            .with_accent(value.accent)
    }
}

/// What a colour is being used for, which is what decides the bar it must
/// clear. Passed *into* the engine, so it converts core-ward.
#[derive(Tsify, Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub enum ContrastUse {
    BodyText,
    LargeText,
    NonText,
}

impl From<ContrastUse> for core::ContrastUse {
    fn from(value: ContrastUse) -> Self {
        match value {
            ContrastUse::BodyText => core::ContrastUse::BodyText,
            ContrastUse::LargeText => core::ContrastUse::LargeText,
            ContrastUse::NonText => core::ContrastUse::NonText,
        }
    }
}

/// What a measured ratio achieves for a given use. `LargeTextOnly` is the
/// honest middle a pass/fail badge cannot express.
#[derive(Tsify, Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub enum Grade {
    Aaa,
    Aa,
    LargeTextOnly,
    Fail,
}

impl From<core::Grade> for Grade {
    fn from(value: core::Grade) -> Self {
        match value {
            core::Grade::Aaa => Grade::Aaa,
            core::Grade::Aa => Grade::Aa,
            core::Grade::LargeTextOnly => Grade::LargeTextOnly,
            core::Grade::Fail => Grade::Fail,
        }
    }
}

#[derive(Tsify, Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Default)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub enum TintMode {
    #[default]
    Inherit,
    Achromatic,
}

impl From<core::TintMode> for TintMode {
    fn from(value: core::TintMode) -> Self {
        match value {
            core::TintMode::Inherit => TintMode::Inherit,
            core::TintMode::Achromatic => TintMode::Achromatic,
        }
    }
}

impl From<TintMode> for core::TintMode {
    fn from(value: TintMode) -> Self {
        match value {
            TintMode::Inherit => core::TintMode::Inherit,
            TintMode::Achromatic => core::TintMode::Achromatic,
        }
    }
}

/// Mirror of `core::api::Gamut` — the display gamut a picker chart renders
/// against (RFC 0010 §7). Carries the Tsify derives so it crosses the wasm
/// boundary as the picker's sRGB/P3 toggle value.
#[derive(Tsify, Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Default)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub enum Gamut {
    #[default]
    Srgb,
    DisplayP3,
}

impl From<core::api::Gamut> for Gamut {
    fn from(value: core::api::Gamut) -> Self {
        match value {
            core::api::Gamut::Srgb => Gamut::Srgb,
            core::api::Gamut::DisplayP3 => Gamut::DisplayP3,
        }
    }
}

impl From<Gamut> for core::api::Gamut {
    fn from(value: Gamut) -> Self {
        match value {
            Gamut::Srgb => core::api::Gamut::Srgb,
            Gamut::DisplayP3 => core::api::Gamut::DisplayP3,
        }
    }
}

#[derive(Tsify, Debug, Clone, Serialize, Deserialize, PartialEq)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct OklchTriple {
    pub l: f32,
    pub c: f32,
    pub h: f32,
    pub hex: String,
    pub rgb: Rgb,
    pub oklch: String,
}

pub fn oklch_triple(color: palette::Oklch) -> OklchTriple {
    OklchTriple {
        l: color.l,
        c: color.chroma,
        h: color.hue.into_degrees(),
        hex: core::oklch_to_hex(color),
        rgb: core::oklch_to_rgb(color).into(),
        oklch: core::format_oklch(color),
    }
}

#[derive(Tsify, Debug, Clone, Serialize, Deserialize, PartialEq)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct SoftNeutrals {
    pub white: OklchTriple,
    pub black: OklchTriple,
}

impl From<core::SoftNeutrals> for SoftNeutrals {
    fn from(value: core::SoftNeutrals) -> Self {
        SoftNeutrals {
            white: oklch_triple(value.white),
            black: oklch_triple(value.black),
        }
    }
}

#[derive(Tsify, Debug, Clone, Serialize, Deserialize, PartialEq)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub enum SwatchLabel {
    Number(u16),
    Name(String),
}

impl From<core::SwatchLabel> for SwatchLabel {
    fn from(value: core::SwatchLabel) -> Self {
        match value {
            core::SwatchLabel::Number(n) => SwatchLabel::Number(n),
            core::SwatchLabel::Name(s) => SwatchLabel::Name(s),
        }
    }
}

#[derive(Tsify, Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct Rgb {
    pub r: f32,
    pub g: f32,
    pub b: f32,
}

impl From<core::Rgb> for Rgb {
    fn from(value: core::Rgb) -> Self {
        Rgb {
            r: value.r,
            g: value.g,
            b: value.b,
        }
    }
}

#[derive(Tsify, PartialEq, Debug, Clone, Serialize, Deserialize)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct SwatchStep {
    pub l: f32,
    pub c: f32,
    pub h: f32,
    pub label: SwatchLabel,
    pub hex: String,
    pub rgb: Rgb,
    pub oklch: String,
}

/// A ramp the caller holds, wrapped because `Vec<T>` is not a first-class
/// wasm-abi type for anything but primitives.
///
/// Taking the steps rather than a brand colour is deliberate: it lets a caller
/// ask about a ramp this engine did not generate — such as the one the token
/// layer ships, which is not reproducible from its seed.
#[derive(Tsify, Debug, Clone, Serialize, Deserialize, PartialEq)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct Ramp {
    pub steps: Vec<SwatchStep>,
}

/// A ramp step that is readable against some other surface, with the contrast
/// it achieves there.
#[derive(Tsify, Debug, Clone, Serialize, Deserialize, PartialEq)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct ReadableStep {
    /// Which step of the ramp this is, so a consumer can re-express it as an
    /// alias (`{color.brand.600}`) rather than baking the colour.
    pub label: SwatchLabel,
    pub color: SwatchStep,
    pub contrast_ratio: f32,
}

impl From<core::ReadableStep> for ReadableStep {
    fn from(value: core::ReadableStep) -> Self {
        ReadableStep {
            label: value.label.into(),
            color: value.color.into(),
            contrast_ratio: value.contrast_ratio,
        }
    }
}

/// Inbound, for entry points that ask a question *about* a ramp the caller
/// holds. Only `l`, `c`, `h` and the label are read: `hex`, `rgb` and `oklch`
/// are derived, and a step assembled in JS can carry values that disagree with
/// its own coordinates, so they are rebuilt rather than trusted.
impl From<SwatchStep> for core::SwatchStep {
    fn from(value: SwatchStep) -> Self {
        core::SwatchStep::from_label(value.l, value.c, value.h, core::SwatchLabel::from(value.label))
    }
}

impl From<SwatchLabel> for core::SwatchLabel {
    fn from(value: SwatchLabel) -> Self {
        match value {
            SwatchLabel::Number(n) => core::SwatchLabel::Number(n),
            SwatchLabel::Name(s) => core::SwatchLabel::Name(s),
        }
    }
}

impl From<core::SwatchStep> for SwatchStep {
    fn from(value: core::SwatchStep) -> Self {
        SwatchStep {
            l: value.l,
            c: value.c,
            h: value.h,
            label: value.label.into(),
            hex: value.hex,
            rgb: value.rgb.into(),
            oklch: value.oklch,
        }
    }
}

#[derive(Tsify, PartialEq, Debug, Clone, Serialize, Deserialize)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct ContrastResult {
    pub ratio: f32,
    pub display_ratio: String,
    pub rating: String,
}

impl From<core::ContrastResult> for ContrastResult {
    fn from(value: core::ContrastResult) -> Self {
        ContrastResult {
            ratio: value.ratio,
            display_ratio: value.display_ratio,
            rating: value.rating,
        }
    }
}

#[derive(Tsify, Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub enum ForegroundSource {
    Step900,
    Step50,
    SoftWhite,
    SoftBlack,
    PureWhite,
    PureBlack,
}

impl From<core::ForegroundSource> for ForegroundSource {
    fn from(value: core::ForegroundSource) -> Self {
        match value {
            core::ForegroundSource::Step900 => ForegroundSource::Step900,
            core::ForegroundSource::Step50 => ForegroundSource::Step50,
            core::ForegroundSource::SoftWhite => ForegroundSource::SoftWhite,
            core::ForegroundSource::SoftBlack => ForegroundSource::SoftBlack,
            core::ForegroundSource::PureWhite => ForegroundSource::PureWhite,
            core::ForegroundSource::PureBlack => ForegroundSource::PureBlack,
        }
    }
}

#[derive(Tsify, PartialEq, Debug, Clone, Serialize, Deserialize)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct Swatch {
    pub l: f32,
    pub c: f32,
    pub h: f32,
    pub label: SwatchLabel,
    pub hex: String,
    pub rgb: Rgb,
    pub oklch: String,
    pub best_foreground: SwatchStep,
    pub foreground_source: ForegroundSource,
    pub contrast_result: ContrastResult,
}

impl From<core::Swatch> for Swatch {
    fn from(value: core::Swatch) -> Self {
        Swatch {
            l: value.l,
            c: value.c,
            h: value.h,
            label: value.label.into(),
            hex: value.hex,
            rgb: value.rgb.into(),
            oklch: value.oklch,
            best_foreground: value.best_foreground.into(),
            foreground_source: value.foreground_source.into(),
            contrast_result: value.contrast_result.into(),
        }
    }
}

#[derive(Tsify, Debug, Clone, Serialize, Deserialize, PartialEq)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct Palette {
    pub swatches: Vec<Swatch>,
    pub lightness_curve: Vec<f32>,
    pub max_recommended_light_padding: f32,
    pub max_recommended_dark_padding: f32,
    pub note: String,
}

impl From<core::Palette> for Palette {
    fn from(value: core::Palette) -> Self {
        Palette {
            swatches: value.swatches.into_iter().map(Into::into).collect(),
            lightness_curve: value.lightness_curve,
            max_recommended_light_padding: value.max_recommended_light_padding,
            max_recommended_dark_padding: value.max_recommended_dark_padding,
            note: value.note,
        }
    }
}

#[derive(Tsify, PartialEq, Debug, Clone, Serialize, Deserialize)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct AlphaSwatch {
    pub l: f32,
    pub c: f32,
    pub h: f32,
    pub alpha: f32,
    pub step: u16,
    pub oklch: String,
}

impl From<core::AlphaSwatch> for AlphaSwatch {
    fn from(value: core::AlphaSwatch) -> Self {
        AlphaSwatch {
            l: value.l,
            c: value.c,
            h: value.h,
            alpha: value.alpha,
            step: value.step,
            oklch: value.oklch,
        }
    }
}

#[derive(Tsify, PartialEq, Debug, Clone, Serialize, Deserialize)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct AlphaRamp {
    pub swatches: Vec<AlphaSwatch>,
}

impl From<Vec<core::AlphaSwatch>> for AlphaRamp {
    fn from(value: Vec<core::AlphaSwatch>) -> Self {
        AlphaRamp {
            swatches: value.into_iter().map(Into::into).collect(),
        }
    }
}

#[derive(Tsify, Debug, Clone, Serialize, Deserialize, PartialEq)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct PaletteSet {
    pub light: Palette,
    pub dark: Palette,
}

impl From<core::PaletteSet> for PaletteSet {
    fn from(value: core::PaletteSet) -> Self {
        PaletteSet {
            light: value.light.into(),
            dark: value.dark.into(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_named_step_passed_in_keeps_its_name() {
        // An exhaustive match forces both arms to exist; only Number was driven
        // by a behaviour, so this covers the one the compiler made us write.
        // Named steps are real — the white/black anchors carry names, not
        // numbers — so a ramp containing one must survive the boundary.
        let named = SwatchStep {
            l: 1.0,
            c: 0.0,
            h: 0.0,
            label: SwatchLabel::Name("White".to_string()),
            hex: "#ffffff".to_string(),
            rgb: Rgb { r: 1.0, g: 1.0, b: 1.0 },
            oklch: "oklch(1 0 0)".to_string(),
        };

        let converted = core::SwatchStep::from(named);

        assert_eq!(converted.label, core::SwatchLabel::Name("White".to_string()));
    }

    #[test]
    fn readable_step_carries_the_label_so_a_role_can_alias_rather_than_bake() {
        let core_step = core::ReadableStep {
            label: core::SwatchLabel::Number(600),
            color: core::SwatchStep::from_label(0.45, 0.14, 259.0, 600u16),
            contrast_ratio: 6.04,
        };

        let wasm_step: ReadableStep = core_step.clone().into();

        // The label is the point: a consumer writes {color.brand.600} rather
        // than baking the hex, so it has to survive the boundary.
        assert_eq!(wasm_step.label, SwatchLabel::Number(600));
        assert_eq!(wasm_step.contrast_ratio, 6.04);
        assert_eq!(wasm_step.color.hex, core_step.color.hex);
    }

    #[test]
    fn a_step_passed_in_has_its_derived_fields_recomputed_not_trusted() {
        // hex, rgb and oklch are derived from l/c/h. A caller assembling a step
        // in JS can set them inconsistently, so the inbound conversion rebuilds
        // them rather than believing what it was handed.
        let claimed = SwatchStep {
            l: 0.55,
            c: 0.12,
            h: 30.0,
            label: SwatchLabel::Number(500),
            hex: "#000000".to_string(),
            rgb: Rgb { r: 0.0, g: 0.0, b: 0.0 },
            oklch: "oklch(0 0 0)".to_string(),
        };

        let converted = core::SwatchStep::from(claimed);
        let honest = core::SwatchStep::from_label(0.55, 0.12, 30.0, 500u16);

        assert_eq!(converted.hex, honest.hex);
        assert_eq!(converted.oklch, honest.oklch);
        assert_ne!(converted.hex, "#000000");
    }

    #[test]
    fn every_easing_family_maps_to_a_distinct_core_family() {
        // A copy-paste slip that points two arms at the same core variant is
        // the realistic failure here, and it would silently hand a caller a
        // curve it did not choose. Distinctness is what catches that.
        let families = [
            Easing::Linear, Easing::Quadratic, Easing::Cubic, Easing::Quartic,
            Easing::Quintic, Easing::Sine, Easing::Exponential, Easing::Circular,
            Easing::Arc,
        ];

        let mut seen: Vec<core::Easing> = Vec::new();
        for family in families {
            let mapped = core::Easing::from(family);
            assert!(!seen.contains(&mapped), "{family:?} duplicates an earlier family");
            seen.push(mapped);
        }
        assert_eq!(seen.len(), 9);
        assert_eq!(core::Easing::from(Easing::Arc), core::Easing::Arc);
    }

    #[test]
    fn every_direction_maps_to_a_distinct_core_direction() {
        let directions = [Direction::EaseIn, Direction::EaseOut, Direction::EaseInOut];

        let mut seen: Vec<core::Direction> = Vec::new();
        for direction in directions {
            let mapped = core::Direction::from(direction);
            assert!(!seen.contains(&mapped), "{direction:?} duplicates an earlier direction");
            seen.push(mapped);
        }
        assert_eq!(seen.len(), 3);
    }

    #[test]
    fn contrast_use_converts_into_core_because_a_caller_chooses_it() {
        // A use is passed *in* — it is the caller stating what the colour is
        // for — so it needs a conversion the other way from every other mirror.
        assert_eq!(
            core::ContrastUse::from(ContrastUse::BodyText),
            core::ContrastUse::BodyText
        );
        assert_eq!(
            core::ContrastUse::from(ContrastUse::LargeText),
            core::ContrastUse::LargeText
        );
        assert_eq!(
            core::ContrastUse::from(ContrastUse::NonText),
            core::ContrastUse::NonText
        );
    }

    #[test]
    fn grade_converts_from_core_including_the_honest_middle() {
        // LargeTextOnly is the variant a pass/fail badge cannot express, so it
        // is the one that must survive the boundary intact.
        assert_eq!(Grade::from(core::Grade::Aaa), Grade::Aaa);
        assert_eq!(Grade::from(core::Grade::Aa), Grade::Aa);
        assert_eq!(
            Grade::from(core::Grade::LargeTextOnly),
            Grade::LargeTextOnly
        );
        assert_eq!(Grade::from(core::Grade::Fail), Grade::Fail);
    }

    #[test]
    fn swatch_label_number_converts_from_core() {
        let core_label = core::SwatchLabel::Number(500);
        let wasm_label: SwatchLabel = core_label.into();
        assert_eq!(wasm_label, SwatchLabel::Number(500));
    }

    #[test]
    fn swatch_label_name_converts_from_core() {
        let core_label = core::SwatchLabel::Name("White".to_string());
        let wasm_label: SwatchLabel = core_label.into();
        assert_eq!(wasm_label, SwatchLabel::Name("White".to_string()));
    }

    #[test]
    fn swatch_step_converts_from_core_preserving_all_fields() {
        let core_step = core::SwatchStep::from_label(0.55, 0.12, 30.0, 500u16);
        let wasm_step: SwatchStep = core_step.clone().into();

        assert_eq!(wasm_step.l, 0.55);
        assert_eq!(wasm_step.c, 0.12);
        assert_eq!(wasm_step.h, 30.0);
        assert_eq!(wasm_step.label, SwatchLabel::Number(500));
        assert_eq!(wasm_step.hex, core_step.hex);
        assert_eq!(wasm_step.oklch, core_step.oklch);
        assert_eq!(wasm_step.rgb, Rgb::from(core_step.rgb));
    }

    #[test]
    fn swatch_converts_from_core_preserving_colour_format_fields() {
        let palette = core::api::generate(core::ColorInput::Css("#3b82f6".to_string()))
            .expect("valid input should produce a palette");
        let core_swatch = palette.swatches[5].clone();
        let wasm_swatch: Swatch = core_swatch.clone().into();

        assert_eq!(wasm_swatch.hex, core_swatch.hex);
        assert_eq!(wasm_swatch.oklch, core_swatch.oklch);
        assert_eq!(wasm_swatch.rgb, Rgb::from(core_swatch.rgb));
    }

    #[test]
    fn foreground_source_converts_every_variant_from_core() {
        let cases = [
            (core::ForegroundSource::Step900, ForegroundSource::Step900),
            (core::ForegroundSource::Step50, ForegroundSource::Step50),
            (core::ForegroundSource::SoftWhite, ForegroundSource::SoftWhite),
            (core::ForegroundSource::SoftBlack, ForegroundSource::SoftBlack),
            (core::ForegroundSource::PureWhite, ForegroundSource::PureWhite),
            (core::ForegroundSource::PureBlack, ForegroundSource::PureBlack),
        ];
        for (core_value, expected) in cases {
            assert_eq!(ForegroundSource::from(core_value), expected);
        }
    }

    #[test]
    fn swatch_converts_from_core_preserving_foreground_source() {
        let palette = core::api::generate(core::ColorInput::Css("#3b82f6".to_string()))
            .expect("valid input should produce a palette");
        let core_swatch = palette.swatches[5].clone();
        let wasm_swatch: Swatch = core_swatch.clone().into();

        assert_eq!(
            wasm_swatch.foreground_source,
            ForegroundSource::from(core_swatch.foreground_source),
        );
    }

    #[test]
    fn tint_mode_inherit_round_trips_through_conversions() {
        let core_value = core::TintMode::Inherit;
        let wasm_value: TintMode = core_value.into();
        assert_eq!(wasm_value, TintMode::Inherit);

        let core_again: core::TintMode = wasm_value.into();
        assert_eq!(core_again, core::TintMode::Inherit);
    }

    #[test]
    fn tint_mode_achromatic_round_trips_through_conversions() {
        let core_value = core::TintMode::Achromatic;
        let wasm_value: TintMode = core_value.into();
        assert_eq!(wasm_value, TintMode::Achromatic);

        let core_again: core::TintMode = wasm_value.into();
        assert_eq!(core_again, core::TintMode::Achromatic);
    }

    #[test]
    fn gamut_srgb_round_trips_through_conversions() {
        let core_value = core::api::Gamut::Srgb;
        let wasm_value: Gamut = core_value.into();
        assert_eq!(wasm_value, Gamut::Srgb);

        let core_again: core::api::Gamut = wasm_value.into();
        assert_eq!(core_again, core::api::Gamut::Srgb);
    }

    #[test]
    fn gamut_display_p3_round_trips_through_conversions() {
        let core_value = core::api::Gamut::DisplayP3;
        let wasm_value: Gamut = core_value.into();
        assert_eq!(wasm_value, Gamut::DisplayP3);

        let core_again: core::api::Gamut = wasm_value.into();
        assert_eq!(core_again, core::api::Gamut::DisplayP3);
    }

    #[test]
    fn soft_neutrals_converts_from_core_preserving_oklch_components() {
        let core_value = core::SoftNeutrals {
            white: palette::Oklch::new(0.95, 0.02, 240.0),
            black: palette::Oklch::new(0.10, 0.005, 240.0),
        };
        let wasm_value: SoftNeutrals = core_value.into();
        assert!((wasm_value.white.l - 0.95).abs() < 1e-5);
        assert!((wasm_value.white.c - 0.02).abs() < 1e-5);
        assert!((wasm_value.black.l - 0.10).abs() < 1e-5);
        assert!((wasm_value.black.c - 0.005).abs() < 1e-5);
    }

    #[test]
    fn soft_neutrals_converts_from_core_with_colour_format_fields() {
        let white = palette::Oklch::new(0.95, 0.02, 240.0);
        let black = palette::Oklch::new(0.10, 0.005, 240.0);
        let wasm_value: SoftNeutrals = core::SoftNeutrals { white, black }.into();

        assert_eq!(wasm_value.white.hex, core::oklch_to_hex(white));
        assert_eq!(wasm_value.white.oklch, core::format_oklch(white));
        assert_eq!(wasm_value.black.rgb, Rgb::from(core::oklch_to_rgb(black)));
    }

    #[test]
    fn palette_set_converts_from_core_preserving_both_palettes() {
        let core_set = core::api::generate_pair(
            core::ColorInput::Css("#3b82f6".to_string()),
            &core::palette::generator::TARGET_LIGHTNESS,
            &core::palette::generator::TARGET_LIGHTNESS_DARK,
            core::api::GenerateOptions::default(),
        )
        .expect("valid input should produce a palette set");

        let wasm_set: PaletteSet = core_set.clone().into();

        let expected_light: Palette = core_set.light.into();
        let expected_dark: Palette = core_set.dark.into();
        assert_eq!(wasm_set.light, expected_light);
        assert_eq!(wasm_set.dark, expected_dark);
    }

    #[test]
    fn alpha_swatch_converts_from_core_preserving_all_fields() {
        let core_ramp = core::api::generate_alpha_ramp(core::ColorInput::Css(
            "oklch(0.2 0.03 260)".to_string(),
        ))
        .expect("valid anchor should produce a ramp");
        let core_swatch = core_ramp[0].clone();
        let wasm_swatch: AlphaSwatch = core_swatch.clone().into();

        assert_eq!(wasm_swatch.l, core_swatch.l);
        assert_eq!(wasm_swatch.c, core_swatch.c);
        assert_eq!(wasm_swatch.h, core_swatch.h);
        assert_eq!(wasm_swatch.alpha, core_swatch.alpha);
        assert_eq!(wasm_swatch.step, core_swatch.step);
        assert_eq!(wasm_swatch.oklch, core_swatch.oklch);
    }

    #[test]
    fn alpha_ramp_converts_from_a_core_swatch_vec() {
        let core_ramp = core::api::generate_alpha_ramp(core::ColorInput::Css(
            "oklch(0.2 0.03 260)".to_string(),
        ))
        .expect("valid anchor should produce a ramp");
        let wasm_ramp: AlphaRamp = core_ramp.clone().into();

        assert_eq!(wasm_ramp.swatches.len(), core_ramp.len());
        assert_eq!(wasm_ramp.swatches[9].alpha, core_ramp[9].alpha);
    }

    #[test]
    fn contrast_result_converts_from_core_preserving_all_fields() {
        let core_result = core::ContrastResult {
            ratio: 4.54,
            display_ratio: "4.54:1".to_string(),
            rating: "AA".to_string(),
        };
        let wasm_result: ContrastResult = core_result.into();
        assert_eq!(
            wasm_result,
            ContrastResult {
                ratio: 4.54,
                display_ratio: "4.54:1".to_string(),
                rating: "AA".to_string(),
            }
        );
    }
}

/// Mirror of `core::StepQuality` — one step's ramp-quality metrics
/// (RFC 0027 §3). `label` is flattened to its token-path string rather than
/// mirroring `SwatchLabel`, because every consumer of this type renders it.
#[derive(Tsify, Debug, Clone, Serialize, Deserialize, PartialEq)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct StepQuality {
    pub label: String,
    pub chroma_demand: Option<f32>,
    pub chroma_utilisation: Option<f32>,
    pub rendered_l: f32,
    pub rendered_c: f32,
    pub rendered_h: f32,
    pub delta_l: Option<f32>,
    pub hue_error: f32,
}

impl From<core::StepQuality> for StepQuality {
    fn from(value: core::StepQuality) -> Self {
        StepQuality {
            label: value.label.to_string(),
            chroma_demand: value.chroma_demand,
            chroma_utilisation: value.chroma_utilisation,
            rendered_l: value.rendered_l,
            rendered_c: value.rendered_c,
            rendered_h: value.rendered_h,
            delta_l: value.delta_l,
            hue_error: value.hue_error,
        }
    }
}

/// Mirror of `core::ForegroundCoverage` — how many of a ramp's steps carry an
/// accessible foreground, by WCAG rating (RFC 0027 §3).
#[derive(Tsify, Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct ForegroundCoverage {
    pub aaa: usize,
    pub aa: usize,
    pub fail: usize,
}

impl From<core::ForegroundCoverage> for ForegroundCoverage {
    fn from(value: core::ForegroundCoverage) -> Self {
        ForegroundCoverage {
            aaa: value.aaa,
            aa: value.aa,
            fail: value.fail,
        }
    }
}

/// Mirror of `core::RampQuality` — what a hue can and cannot do as a ramp in a
/// given gamut, which is what the picker states to a designer at pick time
/// (RFC 0027 §6).
#[derive(Tsify, Debug, Clone, Serialize, Deserialize, PartialEq)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct RampQuality {
    pub steps: Vec<StepQuality>,
    pub hue_span_intended: Option<f32>,
    pub hue_span_rendered: Option<f32>,
    pub min_delta_l: Option<f32>,
    pub mean_chroma_utilisation: Option<f32>,
    pub mean_chroma_demand: Option<f32>,
    pub foreground_coverage: ForegroundCoverage,
    pub gamut: Gamut,
}

impl From<core::RampQuality> for RampQuality {
    fn from(value: core::RampQuality) -> Self {
        RampQuality {
            steps: value.steps.into_iter().map(Into::into).collect(),
            hue_span_intended: value.hue_span_intended,
            hue_span_rendered: value.hue_span_rendered,
            min_delta_l: value.min_delta_l,
            mean_chroma_utilisation: value.mean_chroma_utilisation,
            mean_chroma_demand: value.mean_chroma_demand,
            foreground_coverage: value.foreground_coverage.into(),
            gamut: value.gamut.into(),
        }
    }
}

/// Mirror of `core::ChromaHeadroom` — what a ramp step's scale asked for against
/// what the gamut granted it (RFC 0027 §6).
#[derive(Tsify, Debug, Clone, Serialize, Deserialize, PartialEq)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct ChromaHeadroom {
    pub label: String,
    pub requested: f32,
    pub granted: f32,
}

/// A whole ramp's headroom. Wrapped in a struct rather than returned as a bare
/// `Vec`, which is not a first-class wasm-abi return type — the same reason
/// `AlphaRamp` exists.
#[derive(Tsify, Debug, Clone, Serialize, Deserialize, PartialEq)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct ChromaHeadroomReport {
    pub steps: Vec<ChromaHeadroom>,
}

impl From<core::ChromaHeadroom> for ChromaHeadroom {
    fn from(value: core::ChromaHeadroom) -> Self {
        ChromaHeadroom {
            label: value.label.to_string(),
            requested: value.requested,
            granted: value.granted,
        }
    }
}
