use pretty_assertions::assert_eq;

use crate::contract::recipe_binding;

#[test]
fn the_recipe_binding_is_the_camelcased_component_name() {
    assert_eq!(recipe_binding("button"), "button");
    assert_eq!(recipe_binding("demo-toggle"), "demoToggle");
}

#[test]
fn a_reserved_word_name_gets_a_recipe_suffix() {
    // `export const switch = …` is a syntax error, so the binding disambiguates.
    assert_eq!(recipe_binding("switch"), "switchRecipe");
}
