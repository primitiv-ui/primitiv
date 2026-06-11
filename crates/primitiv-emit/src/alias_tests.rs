use pretty_assertions::assert_eq;

use crate::alias::link_aliases;
use crate::token::Token;

#[test]
fn rewrites_alias_values_as_var_references_and_leaves_literals_untouched() {
    let tokens = vec![
        Token::new(&["action", "primary"], "{color.brand.500}"),
        Token::new(&["color", "brand", "500"], "oklch(0.55 0.13 162)"),
    ];

    let linked = link_aliases(tokens);

    assert_eq!(
        linked,
        vec![
            Token::new(&["action", "primary"], "var(--primitiv-color-brand-500)"),
            Token::new(&["color", "brand", "500"], "oklch(0.55 0.13 162)"),
        ]
    );
}

#[test]
fn leaves_a_non_alias_literal_untouched() {
    let tokens = vec![Token::new(&["content", "marker"], "{literal")];

    assert_eq!(
        link_aliases(tokens),
        vec![Token::new(&["content", "marker"], "{literal")]
    );
}
