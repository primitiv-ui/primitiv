use pretty_assertions::assert_eq;

use crate::contract::Contract;
use crate::contract_fixtures::{BARE, DEMO_BOX, DEMO_TOGGLE, DEMO_VIEW};
use crate::wrapper::emit_wrapper;

#[test]
fn generates_n_thin_per_part_wrappers_for_a_structural_compound() {
    let contract = Contract::parse(DEMO_VIEW.as_bytes()).unwrap();

    // One wrapper per part the consumer composes: the root (its `size`), `bar`
    // (its `align`) and the base-only `item` — no auto-rendered subtree (D56).
    assert_eq!(
        emit_wrapper(&contract),
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/tests/golden/demo-view.wrapper.tsx"
        ))
    );
}

#[test]
fn generates_a_jsdoc_styled_wrapper_from_a_full_contract() {
    let contract = Contract::parse(DEMO_BOX.as_bytes()).unwrap();

    assert_eq!(
        emit_wrapper(&contract),
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/tests/golden/demo-box.wrapper.tsx"
        ))
    );
}

#[test]
fn omits_the_see_tag_when_the_contract_has_no_docs() {
    let contract = Contract::parse(BARE.as_bytes()).unwrap();

    assert_eq!(
        emit_wrapper(&contract),
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/tests/golden/bare.wrapper.tsx"
        ))
    );
}

#[test]
fn generates_a_compound_auto_rendering_wrapper_for_a_no_modifier_parts_contract() {
    let contract = Contract::parse(DEMO_TOGGLE.as_bytes()).unwrap();

    assert_eq!(
        emit_wrapper(&contract),
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/tests/golden/demo-toggle.wrapper.tsx"
        ))
    );
}

/// Drift guard: the committed `registry/components/button/button.tsx` is exactly the
/// generated form of its contract (D53), so the artifact can't hand-drift.
#[test]
fn the_committed_button_wrapper_is_the_generated_form_of_its_contract() {
    let contract = Contract::parse(include_bytes!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../registry/components/button/contract.json"
    )))
    .unwrap();

    assert_eq!(
        emit_wrapper(&contract),
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../../registry/components/button/button.tsx"
        ))
    );
}

/// Drift guard: the committed `registry/components/switch/switch.tsx` is exactly the
/// generated form of its contract — the compound, parts-based proof (D54).
#[test]
fn the_committed_switch_wrapper_is_the_generated_form_of_its_contract() {
    let contract = Contract::parse(include_bytes!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../registry/components/switch/contract.json"
    )))
    .unwrap();

    assert_eq!(
        emit_wrapper(&contract),
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../../registry/components/switch/switch.tsx"
        ))
    );
}

/// Drift guard: the committed `registry/components/tabs/tabs.tsx` is exactly the
/// generated form of its contract — the structural, consumer-composed proof (D56).
#[test]
fn the_committed_tabs_wrapper_is_the_generated_form_of_its_contract() {
    let contract = Contract::parse(include_bytes!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../registry/components/tabs/contract.json"
    )))
    .unwrap();

    assert_eq!(
        emit_wrapper(&contract),
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../../registry/components/tabs/tabs.tsx"
        ))
    );
}
