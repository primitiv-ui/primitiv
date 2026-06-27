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

#[test]
fn rewrites_every_embedded_alias_in_a_composite_value() {
    // A shadow composite carries many `{…}` aliases in one value string; each is
    // resolved to its var() reference, the literals between them left in place.
    let tokens = vec![Token::new(
        &["shadow", "1"],
        "{space.0} {space.1} {space.2} {space.0} {shadow.color.strong}",
    )];

    assert_eq!(
        link_aliases(tokens),
        vec![Token::new(
            &["shadow", "1"],
            "var(--primitiv-space-0) var(--primitiv-space-1) var(--primitiv-space-2) \
             var(--primitiv-space-0) var(--primitiv-shadow-color-strong)"
        )]
    );
}
