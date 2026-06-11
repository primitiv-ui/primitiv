use std::collections::BTreeMap;

use serde_json::Value;

use crate::alias::{link_aliases, resolve_aliases};
use crate::component::{emit_component_css, Component};
use crate::css::{emit_css, emit_theme_css, Scope};
use crate::dtcg::{flatten_modes, tokens_from_dtcg};
use crate::mode::{scope_selectors, Axis};
use crate::scss::emit_scss;
use crate::token::Token;
use crate::ts::emit_ts;

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

/// Emit the mode-independent base tokens as a nested, typed TS object (RFC 0006
/// §4.2, D47). Unlike the CSS path, the TS object **inlines** alias values
/// (`resolve_aliases`) rather than emitting `var()` references — it is for
/// tokens-in-code, where a concrete value is wanted. Mode-aware TS (theme /
/// density) is a single-tree policy question that lands with the CLI `tokens`
/// command; this is the base-token surface it builds on.
pub fn emit_ts_tokens(documents: &[Value]) -> String {
    let mut tokens = Vec::new();
    for document in documents {
        tokens.extend(tokens_from_dtcg(document));
    }
    emit_ts(&resolve_aliases(tokens))
}

/// Emit `primitiv theme` brand overrides from their paired light + dark DTCG
/// documents (RFC 0006 §5.1–5.2, RFC 0008 §5): build the theme-axis scopes
/// (default mode sharing `:root`, the rest as `[data-theme="…"]` blocks) with
/// aliases linked, and serialise them into the `primitiv.theme` layer — the
/// separate overrides file that beats the base palette by layer order.
pub fn emit_theme_overrides_css(documents: &[Value]) -> String {
    emit_theme_css(&axis_scopes(&Axis::Theme, documents))
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
