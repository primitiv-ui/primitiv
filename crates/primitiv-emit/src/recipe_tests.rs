use pretty_assertions::assert_eq;

use crate::contract::Contract;
use crate::contract_fixtures::{DEMO_BOX, DEMO_TOGGLE, DEMO_VIEW};
use crate::recipe::emit_recipe;

#[test]
fn generates_one_cva_per_part_for_a_structural_compound() {
    let contract = Contract::parse(DEMO_VIEW.as_bytes()).unwrap();

    // Root recipe (its own `size`), then one per subcomponent — `bar` keyed by
    // its `align`, `item` base-only — each with its own VariantProps type (D56).
    assert_eq!(
        emit_recipe(&contract),
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/tests/golden/demo-view.recipe.ts"
        ))
    );
}

#[test]
fn generates_a_cva_recipe_over_the_contract_modifier_classes() {
    let contract = Contract::parse(DEMO_BOX.as_bytes()).unwrap();

    assert_eq!(
        emit_recipe(&contract),
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/tests/golden/demo-box.recipe.ts"
        ))
    );
}

#[test]
fn generates_a_base_only_recipe_for_a_no_modifier_contract() {
    let contract = Contract::parse(DEMO_TOGGLE.as_bytes()).unwrap();

    assert_eq!(
        emit_recipe(&contract),
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/tests/golden/demo-toggle.recipe.ts"
        ))
    );
}

/// Drift guard: the committed `registry/components/button/button.recipe.ts` is exactly
/// the generated form of its contract (D53), so the artifact can't hand-drift.
#[test]
fn the_committed_button_recipe_is_the_generated_form_of_its_contract() {
    let contract = Contract::parse(include_bytes!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../registry/components/button/contract.json"
    )))
    .unwrap();

    assert_eq!(
        emit_recipe(&contract),
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../../registry/components/button/button.recipe.ts"
        ))
    );
}

/// Drift guard: the committed `registry/components/switch/switch.recipe.ts` is exactly the
/// generated form of its contract — the state-driven, no-modifier proof (D54).
#[test]
fn the_committed_switch_recipe_is_the_generated_form_of_its_contract() {
    let contract = Contract::parse(include_bytes!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../registry/components/switch/contract.json"
    )))
    .unwrap();

    assert_eq!(
        emit_recipe(&contract),
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../../registry/components/switch/switch.recipe.ts"
        ))
    );
}
