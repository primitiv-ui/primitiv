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
