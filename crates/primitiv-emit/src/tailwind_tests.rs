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

#[test]
fn renames_categories_to_their_tailwind_namespaces() {
    let tailwind = emit_tailwind(&[
        Token::new(&["space", "4"], "0.25rem"),
        Token::new(&["radii", "md"], "0.5rem"),
        Token::new(&["font-size", "lg"], "1.125rem"),
        Token::new(&["line-height", "tight"], "1.25"),
        Token::new(&["letter-spacing", "wide"], "0.025rem"),
    ]);

    assert_eq!(
        tailwind,
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/tests/golden/tailwind-namespaces.css"
        ))
    );
}
