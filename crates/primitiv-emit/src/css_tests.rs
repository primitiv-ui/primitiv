use pretty_assertions::assert_eq;

use crate::css::emit_css;
use crate::token::Token;

/// Shared, pure-data fixture: a trimmed slice of the theme-token surface (one
/// colour, one radius) — enough to pin the document shape and the
/// path-to-custom-property flattening.
fn theme_tokens() -> Vec<Token> {
    vec![
        Token::new(&["color", "primary"], "oklch(0.55 0.13 162)"),
        Token::new(&["radius", "md"], "0.5rem"),
    ]
}

#[test]
fn emits_the_shared_theme_token_surface_as_canonical_css() {
    let css = emit_css(&theme_tokens());

    assert_eq!(
        css,
        include_str!(concat!(env!("CARGO_MANIFEST_DIR"), "/tests/golden/tokens.css"))
    );
}
