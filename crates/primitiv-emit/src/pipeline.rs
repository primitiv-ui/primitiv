use std::collections::BTreeMap;

use serde_json::Value;

use crate::alias::link_aliases;
use crate::css::{emit_css, Scope};
use crate::dtcg::{flatten_modes, tokens_from_dtcg};
use crate::mode::{scope_selectors, Axis};
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
    let mut scopes = vec![Scope {
        selectors: vec![":root".to_string()],
        tokens: base_tokens(sources.base),
    }];
    scopes.extend(axis_scopes(&Axis::Theme, sources.theme));
    scopes.extend(axis_scopes(&Axis::Density, sources.density));
    emit_css(&scopes)
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
