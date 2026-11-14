use pretty_assertions::assert_eq;

use crate::token::Token;
use crate::utilities::{Rule, emit_rules};

#[test]
fn renders_a_rule_inside_the_utilities_layer_after_the_full_layer_order() {
    let rules = [Rule::raw("flex", &[("display", "flex")])];

    let css = emit_rules(&rules, &[]).unwrap();

    assert_eq!(
        css,
        "@layer primitiv.reset, primitiv.tokens, primitiv.theme, primitiv.base, primitiv.variants, primitiv.states, primitiv.utilities;\n\
         \n\
         @layer primitiv.utilities {\n\
         \x20 .flex { display: flex; }\n\
         }\n"
    );
}

/// A trimmed slice of the token surface: enough for each rule under test.
fn tokens() -> Vec<Token> {
    vec![
        Token::new(&["space", "16"], "1rem"),
        Token::new(&["content", "muted"], "var(--primitiv-color-neutral-600)"),
    ]
}

#[test]
fn reads_a_token_as_its_custom_property() {
    let rules = [Rule::tokens("p-16", &[("padding", "space.16")])];

    let css = emit_rules(&rules, &tokens()).unwrap();

    assert!(css.contains("  .p-16 { padding: var(--primitiv-space-16); }\n"), "{css}");
}
