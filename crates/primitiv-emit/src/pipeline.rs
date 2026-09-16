use std::collections::BTreeMap;

use harmoni_core::ColorInput;
use harmoni_core::api::{
    GenerateError, GenerateOptions, NeutralTint, PaletteSet, generate_brand_pair_with_options,
    generate_tinted_neutral_pair,
};
use harmoni_core::palette::generator::step_labels;
use serde_json::Value;

use crate::alias::link_aliases;
use crate::component::{Component, emit_component_css};
use crate::css::{Scope, emit_css, emit_theme_css};
use crate::dtcg::{dtcg_document, flatten_modes, tokens_from_dtcg};
use crate::mode::{Axis, scope_selectors};
use crate::scss::{emit_scss, emit_theme_scss};
use crate::steps::realias;
use crate::tailwind::{emit_tailwind, emit_theme_tailwind};
use crate::theme::{ColorForm, ramp_tokens};
use crate::token::Token;

/// The routed DTCG documents for a token emit. Routing comes from the CLI (the
/// `figma-token-sync` collection table): single-mode documents (`primitives`,
/// `interaction`) form the mode-independent base; the theme-axis documents
/// (`palette`, `intent`) and the density-axis document (`context`) are keyed by
/// their mode.
pub struct TokenSources<'a> {
    pub base: &'a [Value],
    pub theme: &'a [Value],
    pub density: &'a [Value],
}

/// Emit the full shared token surface as canonical CSS (RFC 0006 §4, RFC 0008
/// §3.1, RFC 0009 §2.2): the mode-independent base in `:root`, then one block
/// per theme mode and per density mode, with aliases linked as `var()`
/// references — all inside `@layer primitiv.tokens`.
pub fn emit_tokens_css(sources: &TokenSources) -> String {
    emit_css(&token_scopes(sources))
}

/// Emit the same shared token surface as SCSS (RFC 0006 §4.2): the canonical CSS
/// followed by `$primitiv-*` variables resolving to the custom properties — the
/// thinnest adapter over the CSS, identical values across both formats.
pub fn emit_tokens_scss(sources: &TokenSources) -> String {
    emit_scss(&token_scopes(sources))
}

/// Emit the shared theme-token surface as a Tailwind v4 `@theme` preset
/// (RFC 0006 §4.2, RFC 0009 §4.2). The preset maps token **names**, not values
/// — Tailwind utilities resolve the `--primitiv-*` custom properties at runtime,
/// so a mode swaps automatically — so every name is emitted once, collected
/// across the mode-independent base and every theme / density mode (the
/// duplicate names a mode pair shares collapse in [`emit_tailwind`]).
pub fn emit_tailwind_tokens(sources: &TokenSources) -> String {
    let mut tokens = Vec::new();
    for document in sources.base {
        tokens.extend(tokens_from_dtcg(document));
    }
    for document in sources.theme.iter().chain(sources.density) {
        for (_, mode_tokens) in flatten_modes(document) {
            tokens.extend(mode_tokens);
        }
    }
    emit_tailwind(&tokens)
}

/// Emit `primitiv theme` brand overrides from their paired light + dark DTCG
/// documents (RFC 0006 §5.1–5.2, RFC 0008 §5): build the theme-axis scopes
/// (default mode sharing `:root`, the rest as `[data-theme="..."]` blocks) with
/// aliases linked, and serialise them into the `primitiv.theme` layer — the
/// separate overrides file that beats the base palette by layer order.
pub fn emit_theme_overrides_css(documents: &[Value]) -> String {
    emit_theme_css(&axis_scopes(&Axis::Theme, documents))
}

/// A project's neutral ramp — the one ramp that is generated *between* two
/// anchors rather than from a seed, which is why it has never had a `--neutral`
/// flag: it takes a different model, not a different colour.
///
/// The vocabulary is the engine's own ([`NeutralTint`]) rather than a parallel
/// copy, so there is one description of a tint in the workspace and the emitter
/// cannot drift from what the generator accepts.
#[derive(Debug, Clone, PartialEq)]
pub struct NeutralRamp {
    /// The light anchor the ramp runs from.
    pub white: ColorInput,
    /// The dark anchor it runs to.
    pub black: ColorInput,
    /// The tint laid over both anchors, or `None` for an untinted grey.
    pub tint: Option<NeutralTint>,
}

/// What a `theme` emit generates from.
pub struct ThemeRamps<'a> {
    /// `(family, seed)` pairs — `[("brand", "#0a7755"), ("danger", "#db2424")]` —
    /// so a project re-seeds as many of its ramps as it has colours for.
    pub seeds: &'a [(&'a str, &'a str)],
    /// How many steps each ramp carries, within the engine's supported range.
    pub steps: usize,
    /// The Intent document, so roles aliasing a step a shortened ramp no longer
    /// has can be re-pointed at one it does. Consulted only where a step actually
    /// moved, so at the default length it contributes nothing.
    pub intent: &'a serde_json::Value,
    /// The project's neutral ramp, when it has one to override.
    pub neutral: Option<NeutralRamp>,
}

/// Emit `primitiv theme` ramp overrides as CSS (RFC 0005 §2.4, RFC 0006
/// §4.2/§5): generate each seeded family's paired light + dark ramps through the
/// Harmoni-backed emitter, and serialise both modes as `primitiv.theme` scopes.
///
/// Every family lands in the same two scopes, because a stylesheet wants one
/// `[data-theme]` block per mode rather than one per ramp.
///
/// **A non-default step count also re-points the semantic layer.** Only 10, 18 and
/// 26 steps label all nine decades; every other supported length drops some of
/// them — nine and eleven each lose three — so without this those roles point at
/// custom properties that no longer exist and silently keep whatever the base
/// layer had. See [`crate::steps`].
pub fn emit_theme_ramps_css(ramps: &ThemeRamps) -> Result<String, GenerateError> {
    Ok(emit_theme_css(&ramp_scopes(ramps)?))
}

/// Emit `primitiv theme` ramp overrides as SCSS (RFC 0005 §2.4, RFC 0006
/// §4.2/§5): the same paired scopes as [`emit_theme_ramps_css`], serialised
/// through the SCSS adapter so the `primitiv.theme` CSS is followed by the
/// resolving `$primitiv-*` variables.
pub fn emit_theme_ramps_scss(ramps: &ThemeRamps) -> Result<String, GenerateError> {
    Ok(emit_theme_scss(&ramp_scopes(ramps)?))
}

/// Emit `primitiv theme` ramp overrides as Tailwind (RFC 0005 §2.4, RFC 0006
/// §4.2/§5): the same paired scopes as [`emit_theme_ramps_css`], serialised
/// through the Tailwind adapter so the `primitiv.theme` custom properties are
/// followed by the `@theme` preset.
pub fn emit_theme_ramps_tailwind(ramps: &ThemeRamps) -> Result<String, GenerateError> {
    Ok(emit_theme_tailwind(&ramp_scopes(ramps)?))
}

/// Emit the seeded ramps as a **DTCG document** (RFC 0009 §2.2's shape), mode
/// keyed, with every colour in hex.
///
/// This is the route from a CLI-seeded palette into a design tool. A consumer who
/// seeds their ramps in code and later wants them as Figma variables has no
/// Primitiv plugin to import a bespoke payload with — `primitiv-sync-figma-plugin`
/// is private to this repo — so the file is **standard DTCG**, which the token
/// ecosystem already reads.
///
/// Hex rather than `oklch()` for the same reason: it is the form those importers
/// understand, and the form Figma's variables panel shows. Nothing is lost by it,
/// because the engine's rendered OkLCH reproduces its own hex exactly
/// (`harmoni-core`'s `tests/ramp_regression.rs` gates that), so the two forms
/// describe the same colour.
pub fn emit_dtcg_ramps(
    seeds: &[(&str, &str)],
    steps: usize,
    neutral: Option<NeutralRamp>,
) -> Result<String, GenerateError> {
    let (light, dark) = palette_tokens(seeds, steps, neutral.as_ref(), ColorForm::Hex)?;

    Ok(dtcg_document(&[
        ("light".to_string(), light),
        ("dark".to_string(), dark),
    ]))
}

/// The family name a neutral ramp's tokens carry. Not in
/// [`RAMP_FAMILIES`](../../primitiv-cli/src/cli.rs) because it is not seedable,
/// but it is the same `--primitiv-color-<family>-<step>` override surface.
const NEUTRAL_FAMILY: &str = "neutral";

/// One family's contrast-checked light + dark pair at the requested length.
///
/// Shared by the stylesheet and DTCG paths so a ramp cannot come out one length in
/// one format and another length in the other.
fn generate_pair(seed: &str, steps: usize) -> Result<PaletteSet, GenerateError> {
    generate_brand_pair_with_options(
        ColorInput::Css(seed.to_string()),
        GenerateOptions {
            steps,
            ..GenerateOptions::default()
        },
    )
}

/// Every palette family's light + dark tokens: each seeded ramp, then the neutral if
/// the project has one.
///
/// Shared by the stylesheet and DTCG paths, and that sharing is the point — they
/// each had their own copy of this loop, and the copies disagreed: `dtcg` emitted no
/// neutral at all, so the one route out of a project and into a design tool handed
/// over a palette with no greys. One function means a family cannot reach one format
/// and miss the other. Only `form` differs between callers, because who reads the
/// output differs (a stylesheet wants `oklch()`, an importer wants hex).
fn palette_tokens(
    seeds: &[(&str, &str)],
    steps: usize,
    neutral: Option<&NeutralRamp>,
    form: ColorForm,
) -> Result<(Vec<Token>, Vec<Token>), GenerateError> {
    let mut light = Vec::new();
    let mut dark = Vec::new();
    for (family, seed) in seeds {
        let set = generate_pair(seed, steps)?;
        light.extend(ramp_tokens(family, &set.light, form));
        dark.extend(ramp_tokens(family, &set.dark, form));
    }
    // The neutral cannot ride in `seeds`: it is generated between two anchors rather
    // than from a step 500, so it takes the engine's other entry point.
    if let Some(neutral) = neutral {
        let set = generate_tinted_neutral_pair(
            neutral.white.clone(),
            neutral.black.clone(),
            neutral.tint.clone(),
            steps,
        )?;
        light.extend(ramp_tokens(NEUTRAL_FAMILY, &set.light, form));
        dark.extend(ramp_tokens(NEUTRAL_FAMILY, &set.dark, form));
    }
    Ok((light, dark))
}

/// Derive the paired light + dark theme scopes for every seeded ramp: link
/// `harmoni-core` for each family's contrast-checked pair at the requested
/// length, collect all the families' `--primitiv-color-<family>-*` tokens into one
/// scope per mode, and append whichever Intent roles that length has moved.
/// Shared by every serialiser so the formats stay byte-identical in structure.
fn ramp_scopes(ramps: &ThemeRamps) -> Result<Vec<Scope>, GenerateError> {
    let (mut light, mut dark) = palette_tokens(
        ramps.seeds,
        ramps.steps,
        ramps.neutral.as_ref(),
        ColorForm::Oklch,
    )?;

    let families: Vec<&str> = ramps.seeds.iter().map(|(family, _)| *family).collect();
    let labels = step_labels(ramps.steps);
    for (mode, tokens) in [("light", &mut light), ("dark", &mut dark)] {
        tokens.extend(link_aliases(realias(
            &ramps.intent[mode],
            &families,
            &labels,
        )));
    }

    Ok(vec![theme_scope("light", light), theme_scope("dark", dark)])
}

/// One theme-axis scope for a mode: the mode's `[data-theme]` selectors (the
/// default mode also sharing `:root`) carrying the already-collected tokens.
fn theme_scope(mode: &str, tokens: Vec<Token>) -> Scope {
    Scope {
        selectors: scope_selectors(&Axis::Theme, mode),
        tokens,
    }
}

/// Emit a component's per-component API tokens from its DTCG document (RFC 0008
/// §3.2): flatten the part tree, link alias values to `var()` references against
/// the shared theme tokens, and serialise the `primitiv.base` block. The
/// component name namespaces every knob (`--primitiv-<name>-<part>`).
pub fn emit_component_tokens_css(name: &str, document: &Value) -> String {
    emit_component_css(&Component {
        name: name.to_string(),
        tokens: link_aliases(tokens_from_dtcg(document)),
    })
}

/// Build the ordered mode scopes for a token emit: the mode-independent base in
/// `:root`, then one block per theme mode and per density mode, with aliases
/// linked as `var()` references. Shared by every serialiser.
fn token_scopes(sources: &TokenSources) -> Vec<Scope> {
    let mut scopes = vec![Scope {
        selectors: vec![":root".to_string()],
        tokens: base_tokens(sources.base),
    }];
    scopes.extend(axis_scopes(&Axis::Theme, sources.theme));
    scopes.extend(axis_scopes(&Axis::Density, sources.density));
    scopes
}

/// Flatten the single-mode documents into one mode-independent token list,
/// linking aliases to `var()` references.
fn base_tokens(documents: &[Value]) -> Vec<Token> {
    let mut tokens = Vec::new();
    for document in documents {
        tokens.extend(tokens_from_dtcg(document));
    }
    link_aliases(tokens)
}

/// One [`Scope`] per mode on an axis, default mode first, each carrying that
/// mode's tokens (merged across the axis's documents) with aliases linked.
fn axis_scopes(axis: &Axis, documents: &[Value]) -> Vec<Scope> {
    ordered_modes(axis, documents)
        .into_iter()
        .map(|(mode, tokens)| Scope {
            selectors: scope_selectors(axis, &mode),
            tokens: link_aliases(tokens),
        })
        .collect()
}

/// Merge each document's per-mode token groups by mode label, then order them
/// with the axis default first and the rest alphabetically.
fn ordered_modes(axis: &Axis, documents: &[Value]) -> Vec<(String, Vec<Token>)> {
    let mut by_mode: BTreeMap<String, Vec<Token>> = BTreeMap::new();
    for document in documents {
        for (mode, tokens) in flatten_modes(document) {
            by_mode.entry(mode).or_default().extend(tokens);
        }
    }
    let mut modes: Vec<(String, Vec<Token>)> = by_mode.into_iter().collect();
    modes.sort_by_key(|(mode, _)| (mode != axis.default_mode(), mode.clone()));
    modes
}
