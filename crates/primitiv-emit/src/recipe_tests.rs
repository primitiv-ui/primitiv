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

/// Drift guard: the committed `registry/components/tabs/tabs.recipe.ts` is exactly
/// the generated form of its contract — the structural, per-part proof (D56).
#[test]
fn the_committed_tabs_recipe_is_the_generated_form_of_its_contract() {
    let contract = Contract::parse(include_bytes!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../registry/components/tabs/contract.json"
    )))
    .unwrap();

    assert_eq!(
        emit_recipe(&contract),
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../../registry/components/tabs/tabs.recipe.ts"
        ))
    );
}

/// Drift guard: the committed `registry/components/input/input.recipe.ts` is exactly
/// the generated form of its contract — the size-only text-field proof.
#[test]
fn the_committed_input_recipe_is_the_generated_form_of_its_contract() {
    let contract = Contract::parse(include_bytes!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../registry/components/input/contract.json"
    )))
    .unwrap();

    assert_eq!(
        emit_recipe(&contract),
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../../registry/components/input/input.recipe.ts"
        ))
    );
}

/// Drift guard: the committed `registry/components/field/field.recipe.ts` is exactly
/// the generated form of its contract — a structural compound of base-only parts.
#[test]
fn the_committed_field_recipe_is_the_generated_form_of_its_contract() {
    let contract = Contract::parse(include_bytes!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../registry/components/field/contract.json"
    )))
    .unwrap();

    assert_eq!(
        emit_recipe(&contract),
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../../registry/components/field/field.recipe.ts"
        ))
    );
}

/// Drift guard: the committed `registry/components/input-group/input-group.recipe.ts`
/// is exactly the generated form of its contract — a sized root plus base-only
/// adornment parts.
#[test]
fn the_committed_input_group_recipe_is_the_generated_form_of_its_contract() {
    let contract = Contract::parse(include_bytes!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../registry/components/input-group/contract.json"
    )))
    .unwrap();

    assert_eq!(
        emit_recipe(&contract),
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../../registry/components/input-group/input-group.recipe.ts"
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

/// Drift guard: the committed `registry/components/checkbox/checkbox.recipe.ts` is
/// exactly the generated form of its contract — the state-driven, size-modified
/// framed control (the Switch shape plus a `size` axis).
#[test]
fn the_committed_checkbox_recipe_is_the_generated_form_of_its_contract() {
    let contract = Contract::parse(include_bytes!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../registry/components/checkbox/contract.json"
    )))
    .unwrap();

    assert_eq!(
        emit_recipe(&contract),
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../../registry/components/checkbox/checkbox.recipe.ts"
        ))
    );
}

/// Drift guard: the committed `registry/components/radio/radio.recipe.ts` is exactly
/// the generated form of its contract — a binary (no-indeterminate) sibling of the
/// checkbox, same `size` axis.
#[test]
fn the_committed_radio_recipe_is_the_generated_form_of_its_contract() {
    let contract = Contract::parse(include_bytes!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../registry/components/radio/contract.json"
    )))
    .unwrap();

    assert_eq!(
        emit_recipe(&contract),
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../../registry/components/radio/radio.recipe.ts"
        ))
    );
}

/// Drift guard: the committed `registry/components/divider/divider.recipe.ts` is
/// exactly the generated form of its contract.
#[test]
fn the_committed_divider_recipe_is_the_generated_form_of_its_contract() {
    let contract = Contract::parse(include_bytes!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../registry/components/divider/contract.json"
    )))
    .unwrap();

    assert_eq!(
        emit_recipe(&contract),
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../../registry/components/divider/divider.recipe.ts"
        ))
    );
}

/// Drift guard: the committed `registry/components/table/table.recipe.ts` is
/// exactly the generated form of its contract.
#[test]
fn the_committed_table_recipe_is_the_generated_form_of_its_contract() {
    let contract = Contract::parse(include_bytes!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../registry/components/table/contract.json"
    )))
    .unwrap();

    assert_eq!(
        emit_recipe(&contract),
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../../registry/components/table/table.recipe.ts"
        ))
    );
}
