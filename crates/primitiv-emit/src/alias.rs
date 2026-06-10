use std::collections::HashMap;

use crate::token::Token;

/// Resolve DTCG alias values to the value of the token they reference
/// (RFC 0006 §3). An alias is a value of the form `{group.token}`; it is
/// replaced by the referenced token's value, matched by dotted path.
///
/// This resolves a **single** level of indirection — enough for the common
/// intent → primitive aliases. A dangling reference (no such path) and a
/// malformed brace are both left untouched; chained aliases and dangling-
/// reference errors are later cycles.
pub fn resolve_aliases(tokens: Vec<Token>) -> Vec<Token> {
    let by_path: HashMap<String, String> = tokens
        .iter()
        .map(|token| (token.path.join("."), token.value.clone()))
        .collect();
    tokens
        .into_iter()
        .map(|mut token| {
            if let Some(target) = alias_target(&token.value) {
                if let Some(value) = by_path.get(target) {
                    token.value = value.clone();
                }
            }
            token
        })
        .collect()
}

/// Resolve one mode's tokens against the shared base namespace (RFC 0009 §2.2).
///
/// A mode's aliases reference the mode-independent **base** (primitive /
/// interaction) tokens and same-mode siblings (already included in
/// `mode_tokens`). Both are unioned into one namespace for resolution, but only
/// the resolved `mode_tokens` are returned: base tokens are emitted once in
/// `:root`, while these populate the mode's own `[data-*]` scope.
pub fn resolve_against_base(base: &[Token], mode_tokens: Vec<Token>) -> Vec<Token> {
    let split = base.len();
    let mut namespace = base.to_vec();
    namespace.extend(mode_tokens);
    resolve_aliases(namespace).split_off(split)
}

/// Rewrite DTCG alias values as CSS `var()` references for emission
/// (RFC 0006 §4.3, the var()-chain decision): `{color.brand.500}` becomes
/// `var(--primitiv-color-brand-500)`. Non-alias values are left untouched.
///
/// Unlike [`resolve_aliases`] (which inlines the target value for the TS object
/// and theme-value computation), this preserves the indirection so a later
/// override of the referenced custom property still propagates.
pub fn link_aliases(tokens: Vec<Token>) -> Vec<Token> {
    tokens
        .into_iter()
        .map(|mut token| {
            if let Some(target) = alias_target(&token.value) {
                token.value = format!("var(--primitiv-{})", target.replace('.', "-"));
            }
            token
        })
        .collect()
}

/// The dotted path inside a `{…}` alias, or `None` for a literal value.
pub(crate) fn alias_target(value: &str) -> Option<&str> {
    value
        .strip_prefix('{')
        .and_then(|inner| inner.strip_suffix('}'))
}
