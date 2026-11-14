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

/// Unused until a later cycle reads token values; keeps the import honest.
#[allow(dead_code)]
fn tokens() -> Vec<Token> {
    Vec::new()
}
