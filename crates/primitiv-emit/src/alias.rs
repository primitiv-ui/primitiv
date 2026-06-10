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

/// The dotted path inside a `{…}` alias, or `None` for a literal value.
fn alias_target(value: &str) -> Option<&str> {
    value
        .strip_prefix('{')
        .and_then(|inner| inner.strip_suffix('}'))
}
