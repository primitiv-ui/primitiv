use pretty_assertions::assert_eq;

use crate::alias::{resolve_against_base, resolve_aliases};
use crate::token::Token;

#[test]
fn resolves_a_mode_alias_against_the_base_and_returns_only_the_mode_tokens() {
    let base = vec![Token::new(&["color", "brand", "500"], "oklch(0.55 0.13 162)")];
    let mode_tokens = vec![Token::new(&["action", "primary"], "{color.brand.500}")];

    let resolved = resolve_against_base(&base, mode_tokens);

    assert_eq!(
        resolved,
        vec![Token::new(&["action", "primary"], "oklch(0.55 0.13 162)")]
    );
}

#[test]
fn resolves_an_alias_to_the_referenced_token_value() {
    let tokens = vec![
        Token::new(&["color", "brand", "500"], "oklch(0.55 0.13 162)"),
        Token::new(&["action", "primary"], "{color.brand.500}"),
    ];

    let resolved = resolve_aliases(tokens);

    assert_eq!(
        resolved,
        vec![
            Token::new(&["color", "brand", "500"], "oklch(0.55 0.13 162)"),
            Token::new(&["action", "primary"], "oklch(0.55 0.13 162)"),
        ]
    );
}

#[test]
fn leaves_a_dangling_reference_untouched() {
    let tokens = vec![Token::new(&["action", "primary"], "{color.missing}")];

    assert_eq!(
        resolve_aliases(tokens),
        vec![Token::new(&["action", "primary"], "{color.missing}")]
    );
}

#[test]
fn treats_an_unclosed_brace_as_a_literal_value() {
    let tokens = vec![Token::new(&["content", "marker"], "{literal")];

    assert_eq!(
        resolve_aliases(tokens),
        vec![Token::new(&["content", "marker"], "{literal")]
    );
}
