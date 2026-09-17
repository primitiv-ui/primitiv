//! One palette in, one file out — the whole-palette export a consumer outside this
//! workspace asks for.
//!
//! **The palette crosses as VALUES, not as a recipe** (RFC 0032 D1). The caller
//! has already rendered every step — the plugin generates a ramp to show it — so
//! sending seeds and a step count would have this crate generate the same colours
//! a second time, from a curve the wire shape has no way to carry. It also means a
//! family is just a name here: `accent` needs no seed flag, because nothing is
//! re-derived from a seed.
//!
//! Everything else in this crate takes borrowed inputs, because its callers are
//! commands assembling data they already own. A consumer reaching in across a
//! language boundary cannot lend anything, so this module is the one owned-input
//! seam: [`ExportRequest`] holds its strings.
//!
//! That is deliberate and load-bearing for the wasm binding. Every decision this
//! export makes — which serialiser, which colour form, how a request becomes a
//! document — lives here, under this crate's 100% gate. The binding over it is
//! then a pure `map`/`map_err`, which matters because a `cdylib` cannot be tested
//! natively at all.

use serde::Deserialize;
use serde_json::Value;

use crate::alias::link_aliases;
use crate::css::Scope;
use crate::css::emit_theme_css;
use crate::dtcg::{dtcg_document_with, tokens_from_dtcg};
use crate::mode::{Axis, scope_selectors};
use crate::scss::emit_theme_scss;
use crate::tailwind::emit_theme_tailwind;
use crate::token::Token;
use crate::value::format_color;

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

/// One rendered step of a ramp: the label its token takes, and the colour the
/// engine produced for it as a CSS string.
#[derive(Debug, Clone, PartialEq)]
pub struct ExportStep {
    pub step: String,
    pub value: String,
}

/// One ramp, rendered in both modes. The two lists are separate rather than a
/// step-keyed map because a ramp is read in scale order and a map would sort
/// `"100"` before `"50"`.
#[derive(Debug, Clone, PartialEq)]
pub struct ExportRamp {
    pub family: String,
    pub light: Vec<ExportStep>,
    pub dark: Vec<ExportStep>,
}

/// Where a palette came from, travelling with the file (RFC 0032 D13) so "are
/// these current, and whose are they" has an answer months later.
#[derive(Debug, Clone, PartialEq)]
pub struct ExportIdentity {
    pub project: String,
    pub name: String,
    pub engine: String,
    pub exported_at: String,
}

/// A whole palette, owned: every ramp's rendered steps, the consumer's own
/// semantic roles if it solved any, and where the file came from.
///
/// `roles` is a mode-keyed DTCG document whose leaves alias
/// `{color.<family>.<step>}` — the resolved form, because resolution is the
/// engine's job and not this crate's.
#[derive(Debug, Clone, PartialEq)]
pub struct ExportRequest {
    pub ramps: Vec<ExportRamp>,
    pub roles: Option<Value>,
    pub identity: Option<ExportIdentity>,
}

/// The modes a palette is written in, in the order every export writes them.
const MODES: [&str; 2] = ["light", "dark"];

/// The group every ramp's tokens live under.
const RAMPS: &str = "color";

/// The vendor key the identity block hangs under, namespaced as DTCG's
/// `$extensions` requires so it cannot collide with another tool's metadata.
const VENDOR: &str = "dev.primitiv.harmoni";

/// Serialise a whole palette in the requested format.
///
/// **The colour form is not the caller's choice, and that is the point.** A
/// stylesheet gets OkLCH so the cascade carries the precision the engine computed;
/// DTCG keeps the values exactly as handed over, because that is what a design
/// tool's importer reads and what Figma's variables panel shows.
///
/// Infallible, unlike the seed-based export it replaces: nothing is generated
/// here, so there is no colour to reject. A value this crate cannot parse reaches
/// the file as written, which is `format_color`'s standing policy — the caller
/// knows what it sent, and refusing a whole palette over one string would be a
/// worse answer than writing it.
pub fn emit_export(request: &ExportRequest, format: ExportFormat) -> String {
    match format {
        ExportFormat::Css => emit_theme_css(&scopes(request)),
        ExportFormat::Scss => emit_theme_scss(&scopes(request)),
        ExportFormat::Tailwind => emit_theme_tailwind(&scopes(request)),
        ExportFormat::Dtcg => {
            dtcg_document_with(&modes(request, Form::AsGiven), &extensions(request))
        }
    }
}

/// Which rendering of a value a format takes.
#[derive(Clone, Copy)]
enum Form {
    /// `oklch(L C H)` — what a stylesheet gets.
    Oklch,
    /// Exactly what the caller sent, which is hex for a DTCG document.
    AsGiven,
}

/// The paired light + dark theme scopes a stylesheet is written from.
fn scopes(request: &ExportRequest) -> Vec<Scope> {
    modes(request, Form::Oklch)
        .into_iter()
        .map(|(mode, tokens)| Scope {
            selectors: scope_selectors(&Axis::Theme, &mode),
            // A role aliasing `{color.brand.500}` becomes a `var()` reference here,
            // exactly as the shipped Intent layer's own roles do.
            tokens: link_aliases(tokens),
        })
        .collect()
}

/// Each mode's tokens: every ramp's steps, then the roles solved against them.
///
/// Roles go through `tokens_from_dtcg` in both forms, which converts a raw colour
/// leaf to OkLCH even on the DTCG path. That is not a leak: Harmoni solves a role
/// to a `(ramp, step)` coordinate, so its leaves are aliases, and an alias is not
/// a colour for `format_color` to touch. A caller sending a raw colour there gets
/// it in the form a stylesheet would take, which is still a valid DTCG value.
fn modes(request: &ExportRequest, form: Form) -> Vec<(String, Vec<Token>)> {
    MODES
        .iter()
        .map(|mode| {
            let mut tokens: Vec<Token> = request
                .ramps
                .iter()
                .flat_map(|ramp| {
                    let steps = if *mode == "dark" {
                        &ramp.dark
                    } else {
                        &ramp.light
                    };
                    steps.iter().map(|step| {
                        let value = match form {
                            Form::Oklch => format_color(&step.value),
                            Form::AsGiven => step.value.clone(),
                        };
                        Token::new(&[RAMPS, &ramp.family, &step.step], &value)
                    })
                })
                .collect();
            if let Some(roles) = &request.roles {
                tokens.extend(tokens_from_dtcg(&roles[mode]));
            }
            ((*mode).to_string(), tokens)
        })
        .collect()
}

/// The `$extensions` entries the identity becomes, or nothing where the caller
/// sent none.
fn extensions(request: &ExportRequest) -> Vec<(Vec<String>, String)> {
    let Some(identity) = &request.identity else {
        return Vec::new();
    };
    [
        ("project", &identity.project),
        ("name", &identity.name),
        ("engine", &identity.engine),
        ("exportedAt", &identity.exported_at),
    ]
    .into_iter()
    .map(|(key, value)| (vec![VENDOR.to_string(), key.to_string()], value.clone()))
    .collect()
}

/// What a consumer sends across a language boundary, in plain serde-shaped data.
///
/// Distinct from [`ExportRequest`] so the wire shape can carry `camelCase` and
/// defaults without those leaking into the type the emitter reasons about. It
/// lives here rather than in the wasm binding because a `cdylib` cannot be unit
/// tested, so a conversion written there would be the one piece of this feature
/// outside the gate.
#[derive(Debug, Clone, PartialEq, Deserialize)]
pub struct ExportInput {
    pub ramps: Vec<RampInput>,
    #[serde(default)]
    pub roles: Option<Value>,
    #[serde(default)]
    pub identity: Option<IdentityInput>,
}

/// One ramp on the wire.
#[derive(Debug, Clone, PartialEq, Deserialize)]
pub struct RampInput {
    pub family: String,
    pub light: Vec<StepInput>,
    pub dark: Vec<StepInput>,
}

/// One rendered step on the wire.
#[derive(Debug, Clone, PartialEq, Deserialize)]
pub struct StepInput {
    pub step: String,
    pub value: String,
}

/// The identity block on the wire, `camelCase` as a JavaScript caller writes it.
#[derive(Debug, Clone, PartialEq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IdentityInput {
    pub project: String,
    pub name: String,
    pub engine: String,
    pub exported_at: String,
}

impl From<ExportInput> for ExportRequest {
    fn from(input: ExportInput) -> Self {
        ExportRequest {
            ramps: input
                .ramps
                .into_iter()
                .map(|ramp| ExportRamp {
                    family: ramp.family,
                    light: ramp.light.into_iter().map(step).collect(),
                    dark: ramp.dark.into_iter().map(step).collect(),
                })
                .collect(),
            roles: input.roles,
            identity: input.identity.map(|identity| ExportIdentity {
                project: identity.project,
                name: identity.name,
                engine: identity.engine,
                exported_at: identity.exported_at,
            }),
        }
    }
}

/// One step across the boundary.
fn step(input: StepInput) -> ExportStep {
    ExportStep {
        step: input.step,
        value: input.value,
    }
}
