use pretty_assertions::assert_eq;

use crate::contract::Contract;
use crate::contract_fixtures::DEMO_BOX;
use crate::recipe::emit_recipe;

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

/// Drift guard: the committed `registry/r/button/button.recipe.ts` is exactly
/// the generated form of its contract (D53), so the artifact can't hand-drift.
#[test]
fn the_committed_button_recipe_is_the_generated_form_of_its_contract() {
    let contract = Contract::parse(include_bytes!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../registry/r/button/contract.json"
    )))
    .unwrap();

    assert_eq!(
        emit_recipe(&contract),
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../../registry/r/button/button.recipe.ts"
        ))
    );
}
