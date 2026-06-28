use crate::token::Token;

/// Rewrite DTCG alias references inside token values as CSS `var()` references
/// for emission (RFC 0006 §4.3, the var()-chain decision): every `{group.name}`
/// segment becomes `var(--primitiv-group-name)`. A value may carry a single
/// alias (a plain token alias — `{color.brand.500}`) or several embedded among
/// literals (a `shadow` composite's offsets/colours, RFC 0017 §4); both are
/// resolved, with the text between braces copied verbatim, so a later override
/// of any referenced custom property still propagates — the indirection every
/// emitted format relies on.
pub fn link_aliases(tokens: Vec<Token>) -> Vec<Token> {
    tokens
        .into_iter()
        .map(|mut token| {
            token.value = link_value(&token.value);
            token
        })
        .collect()
}

/// Replace every `{…}` alias in one value with its `var()` reference, copying
/// non-alias text (literals, the spaces and commas of a composite) through
/// unchanged. An unbalanced `{` with no closing brace is left verbatim.
fn link_value(value: &str) -> String {
    let mut out = String::new();
    let mut rest = value;
    while let Some(open) = rest.find('{') {
        out.push_str(&rest[..open]);
        let after = &rest[open + 1..];
        match after.find('}') {
            Some(close) => {
                out.push_str(&format!("var(--primitiv-{})", after[..close].replace('.', "-")));
                rest = &after[close + 1..];
            }
            None => {
                out.push('{');
                rest = after;
            }
        }
    }
    out.push_str(rest);
    out
}
