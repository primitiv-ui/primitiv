use pretty_assertions::assert_eq;

use crate::css::Scope;
use crate::scss::emit_scss;
use crate::token::Token;

/// Shared, pure-data fixture: a trimmed slice of the theme-token surface (one
/// colour, one radius) — enough to pin the canonical-CSS passthrough and the
/// `$`-variable adapter.
fn theme_tokens() -> Vec<Token> {
    vec![
        Token::new(&["color", "primary"], "oklch(0.55 0.13 162)"),
        Token::new(&["radius", "md"], "0.5rem"),
    ]
}

#[test]
fn emits_the_canonical_css_then_a_scss_variable_per_token() {
    let scss = emit_scss(&[Scope::new(&[":root"], theme_tokens())]);

    assert_eq!(
        scss,
        include_str!(concat!(env!("CARGO_MANIFEST_DIR"), "/tests/golden/tokens.scss"))
    );
}

#[test]
fn emits_one_scss_variable_for_a_token_shared_across_mode_scopes() {
    let scss = emit_scss(&[
        Scope::new(
            &[":root", "[data-theme=\"light\"]"],
            vec![Token::new(&["color", "bg"], "#fff")],
        ),
        Scope::new(
            &["[data-theme=\"dark\"]"],
            vec![Token::new(&["color", "bg"], "#111")],
        ),
    ]);

    assert_eq!(
        scss,
        include_str!(concat!(env!("CARGO_MANIFEST_DIR"), "/tests/golden/theme-modes.scss"))
    );
}
