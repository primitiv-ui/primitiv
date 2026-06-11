use pretty_assertions::assert_eq;

use crate::token::Token;
use crate::ts::emit_ts;

/// Shared, pure-data fixture: a trimmed slice of the theme-token surface (one
/// colour, one radius) — enough to pin the nesting by path segment and the
/// `as const` typing.
fn theme_tokens() -> Vec<Token> {
    vec![
        Token::new(&["color", "primary"], "oklch(0.55 0.13 162)"),
        Token::new(&["radius", "md"], "0.5rem"),
    ]
}

#[test]
fn emits_a_nested_typed_token_object() {
    let ts = emit_ts(&theme_tokens());

    assert_eq!(
        ts,
        include_str!(concat!(env!("CARGO_MANIFEST_DIR"), "/tests/golden/tokens.ts"))
    );
}

#[test]
fn quotes_keys_that_are_not_valid_identifiers() {
    let ts = emit_ts(&[
        Token::new(&["color", "brand", "500"], "#0a7755"),
        Token::new(&["space", "space-4"], "0.25rem"),
    ]);

    assert_eq!(
        ts,
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/tests/golden/tokens-quoted-keys.ts"
        ))
    );
}
