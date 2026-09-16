//! One palette in, one file out — the whole-palette export a consumer outside this
//! workspace asks for.
//!
//! Everything else in this crate takes borrowed inputs, because its callers are
//! commands assembling data they already own. A consumer reaching in across a
//! language boundary cannot lend anything, so this module is the one owned-input
//! seam: [`ExportRequest`] holds its strings, and the borrowed [`ThemeRamps`] is
//! built here rather than by every caller.
//!
//! That is deliberate and load-bearing for the wasm binding. Every decision this
//! export makes — which serialiser, which colour form, how a request becomes ramps
//! — lives here, under this crate's 100% gate. The binding over it is then a pure
//! `map`/`map_err`, which matters because a `cdylib` cannot be tested natively at
//! all.

use serde::Deserialize;

use crate::pipeline::{
    NeutralRamp, ThemeRamps, emit_dtcg_ramps, emit_theme_ramps_css, emit_theme_ramps_scss,
    emit_theme_ramps_tailwind,
};
use harmoni_core::api::{GenerateError, NeutralTint};
use harmoni_core::ColorInput;

/// What a consumer wants written out.
///
/// The three cascade-based formats plus DTCG. They are one enum rather than four
/// functions because a consumer picks a format at run time from a control, and
/// because the colour form follows from the choice rather than being a separate
/// knob — see [`emit_export`].
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ExportFormat {
    Css,
    Scss,
    Tailwind,
    Dtcg,
}

impl ExportFormat {
    /// Parse a format by its lowercase name, `None` for anything else.
    ///
    /// A consumer picks this from a control, so the name crosses the boundary as a
    /// string. An unknown one is refused rather than defaulting to CSS: writing a
    /// stylesheet when someone asked for a token file is worse than saying no.
    pub fn parse(name: &str) -> Option<ExportFormat> {
        match name {
            "css" => Some(ExportFormat::Css),
            "scss" => Some(ExportFormat::Scss),
            "tailwind" => Some(ExportFormat::Tailwind),
            "dtcg" => Some(ExportFormat::Dtcg),
            _ => None,
        }
    }
}

/// A whole palette, owned: the seeded families, the ramp length, the neutral ramp
/// if the project has one, and the consumer's own semantic roles if it has those.
///
/// `seeds` is `(family, colour)` pairs in the caller's own order. `roles` is a
/// mode-keyed DTCG document whose leaves alias `{color.<family>.<step>}` — the
/// resolved form, because resolution is the engine's job and not this crate's.
#[derive(Debug, Clone, PartialEq)]
pub struct ExportRequest {
    pub seeds: Vec<(String, String)>,
    pub steps: usize,
    pub neutral: Option<NeutralRamp>,
    pub roles: Option<serde_json::Value>,
}

/// Serialise a whole palette in the requested format.
///
/// **The colour form is not the caller's choice, and that is the point.** A
/// stylesheet gets OkLCH so the cascade carries the precision the engine computed;
/// DTCG gets hex, because that is what a design tool's importer reads and what
/// Figma's variables panel shows. Offering the cross product would let a consumer
/// ask for a combination neither side wants.
///
/// DTCG also carries no roles. A DTCG document describes a palette for a design
/// tool to import as variables; a semantic layer aliasing custom properties has no
/// meaning there, and `emit_dtcg_ramps` deliberately takes none.
pub fn emit_export(
    request: &ExportRequest,
    format: ExportFormat,
) -> Result<String, GenerateError> {
    let seeds: Vec<(&str, &str)> = request
        .seeds
        .iter()
        .map(|(family, seed)| (family.as_str(), seed.as_str()))
        .collect();

    let ramps = ThemeRamps {
        seeds: &seeds,
        steps: request.steps,
        // Nothing to re-point: a consumer's own roles are emitted whole through
        // `roles`, and Primitiv's shipped Intent layer is not theirs to patch.
        intent: &serde_json::Value::Null,
        neutral: request.neutral.clone(),
        roles: request.roles.as_ref(),
    };

    // One total match, so there is no arm no test can reach. `ramps` is built for
    // the DTCG case too and simply unused: it borrows rather than generating, so it
    // costs nothing, where an early return would leave an `unreachable!()` behind.
    match format {
        ExportFormat::Css => emit_theme_ramps_css(&ramps),
        ExportFormat::Scss => emit_theme_ramps_scss(&ramps),
        ExportFormat::Tailwind => emit_theme_ramps_tailwind(&ramps),
        ExportFormat::Dtcg => emit_dtcg_ramps(&seeds, request.steps, request.neutral.clone()),
    }
}

/// What a consumer sends across a language boundary, in plain serde-shaped data.
///
/// Distinct from [`ExportRequest`] on purpose. The request speaks the engine's
/// vocabulary (`ColorInput`, `NeutralTint`), which is not deserialisable and should
/// not be: those types are how Rust talks about colour. This is the wire shape —
/// every colour a CSS string, which is what a caller has anyway.
///
/// It lives here rather than in the wasm binding because a `cdylib` cannot be unit
/// tested, so a conversion written there would be the one piece of this feature
/// outside the gate.
#[derive(Debug, Clone, PartialEq, Deserialize)]
pub struct ExportInput {
    pub seeds: Vec<SeedInput>,
    pub steps: usize,
    #[serde(default)]
    pub neutral: Option<NeutralInput>,
    #[serde(default)]
    pub roles: Option<serde_json::Value>,
}

/// One seeded family: the name its tokens take, and the colour its ramp is grown
/// from. `seed` rather than `colour`, matching `harmoni-seeds.json`.
#[derive(Debug, Clone, PartialEq, Deserialize)]
pub struct SeedInput {
    pub family: String,
    pub seed: String,
}

/// A neutral ramp's two anchors and its optional tint.
///
/// Both anchors are required, unlike `primitiv.json`'s neutral block where they may
/// be omitted. That block is hand-authored, so defaults are a convenience; a
/// consumer sending this has explicit anchors already, and requiring them keeps the
/// default values in one place instead of two that can drift.
#[derive(Debug, Clone, PartialEq, Deserialize)]
pub struct NeutralInput {
    pub white: String,
    pub black: String,
    #[serde(default)]
    pub tint: Option<TintInput>,
}

/// The colour laid over both anchors. `spread` and `bow` default to zero, so a
/// single-source tint needs only the two fields a consumer actually chose.
#[derive(Debug, Clone, PartialEq, Deserialize)]
pub struct TintInput {
    pub source: String,
    pub strength: f32,
    #[serde(default)]
    pub spread: f32,
    #[serde(default)]
    pub bow: f32,
}

impl From<ExportInput> for ExportRequest {
    fn from(input: ExportInput) -> Self {
        ExportRequest {
            seeds: input
                .seeds
                .into_iter()
                .map(|seed| (seed.family, seed.seed))
                .collect(),
            steps: input.steps,
            neutral: input.neutral.map(|neutral| NeutralRamp {
                white: ColorInput::Css(neutral.white),
                black: ColorInput::Css(neutral.black),
                tint: neutral.tint.map(|tint| NeutralTint {
                    source: ColorInput::Css(tint.source),
                    strength: tint.strength,
                    spread: tint.spread,
                    bow: tint.bow,
                }),
            }),
            roles: input.roles,
        }
    }
}
