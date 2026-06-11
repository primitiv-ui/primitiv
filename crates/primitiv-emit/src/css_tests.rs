use pretty_assertions::assert_eq;

use crate::css::{emit_css, emit_theme_css, Scope};
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
    let css = emit_css(&[Scope::new(&[":root"], theme_tokens())]);

    assert_eq!(
        css,
        include_str!(concat!(env!("CARGO_MANIFEST_DIR"), "/tests/golden/tokens.css"))
    );
}

#[test]
fn emits_one_block_per_mode_scope_with_the_default_sharing_root() {
    let css = emit_css(&[
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
        css,
        include_str!(concat!(env!("CARGO_MANIFEST_DIR"), "/tests/golden/theme-modes.css"))
    );
}

#[test]
fn emits_brand_overrides_into_the_theme_layer_without_the_sublayer_declaration() {
    let css = emit_theme_css(&[
        Scope::new(
            &[":root", "[data-theme=\"light\"]"],
            vec![Token::new(&["color", "primary"], "oklch(0.55 0.13 162)")],
        ),
        Scope::new(
            &["[data-theme=\"dark\"]"],
            vec![Token::new(&["color", "primary"], "oklch(0.72 0.13 162)")],
        ),
    ]);

    assert_eq!(
        css,
        include_str!(concat!(env!("CARGO_MANIFEST_DIR"), "/tests/golden/theme-overrides.css"))
    );
}
