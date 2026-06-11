use pretty_assertions::assert_eq;

use crate::tailwind::emit_tailwind;
use crate::token::Token;

/// Shared, pure-data fixture: a trimmed slice of the theme-token surface (one
/// colour, one radius) — enough to pin the `@theme` block and the mapping of a
/// token onto a Tailwind theme variable that references its custom property.
fn theme_tokens() -> Vec<Token> {
    vec![
        Token::new(&["color", "primary"], "oklch(0.55 0.13 162)"),
        Token::new(&["radius", "md"], "0.5rem"),
    ]
}

#[test]
fn maps_tokens_into_a_theme_block_of_var_references() {
    let tailwind = emit_tailwind(&theme_tokens());

    assert_eq!(
        tailwind,
        include_str!(concat!(env!("CARGO_MANIFEST_DIR"), "/tests/golden/tailwind.css"))
    );
}
