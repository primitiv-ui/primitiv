use pretty_assertions::assert_eq;

use crate::contract::{recipe_binding, Contract};
use crate::contract_fixtures::DEMO_VIEW;

#[test]
fn a_structural_contract_parses_its_subcomponents_and_their_modifiers() {
    let contract = Contract::parse(DEMO_VIEW.as_bytes()).expect("structural contract parses");

    // The root names the headless component it wraps for a structural compound.
    assert_eq!(contract.root.component.as_deref(), Some("Root"));

    let names: Vec<&str> = contract
        .subcomponents
        .iter()
        .map(|sub| sub.name.as_str())
        .collect();
    assert_eq!(names, ["bar", "item"]);

    // `bar` carries a per-part modifier group; `item` has none.
    let bar = &contract.subcomponents[0];
    assert_eq!(bar.component, "Bar");
    assert_eq!(bar.class, "primitiv-demo-view__bar");
    assert_eq!(bar.modifiers.len(), 1);
    assert_eq!(bar.modifiers[0].prop(), "align");
    assert!(contract.subcomponents[1].modifiers.is_empty());
}

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
