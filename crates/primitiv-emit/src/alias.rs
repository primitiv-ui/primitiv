use crate::token::Token;

/// Rewrite DTCG alias values as CSS `var()` references for emission
/// (RFC 0006 §4.3, the var()-chain decision): `{color.brand.500}` becomes
/// `var(--primitiv-color-brand-500)`. Non-alias values are left untouched, so a
/// later override of the referenced custom property still propagates — the
/// indirection every emitted format relies on.
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
