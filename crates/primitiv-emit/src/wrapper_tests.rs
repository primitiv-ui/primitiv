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

/// Drift guard: the committed `registry/components/input/input.tsx` is exactly the
/// generated form of its contract — the proof a styled `size` survives the native
/// `size` attribute via the distributive omit (D59).
#[test]
fn the_committed_input_wrapper_is_the_generated_form_of_its_contract() {
    let contract = Contract::parse(include_bytes!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../registry/components/input/contract.json"
    )))
    .unwrap();

    assert_eq!(
        emit_wrapper(&contract),
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../../registry/components/input/input.tsx"
        ))
    );
}

/// Drift guard: the committed `registry/components/field/field.tsx` is exactly the
/// generated form of its contract — the structural, no-modifier compound proof.
#[test]
fn the_committed_field_wrapper_is_the_generated_form_of_its_contract() {
    let contract = Contract::parse(include_bytes!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../registry/components/field/contract.json"
    )))
    .unwrap();

    assert_eq!(
        emit_wrapper(&contract),
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../../registry/components/field/field.tsx"
        ))
    );
}

/// Drift guard: the committed `registry/components/input-group/input-group.tsx` is
/// exactly the generated form of its contract — a structural compound that *also*
/// carries a root `size` modifier, so the distributive omit and the per-part
/// wrappers appear together.
#[test]
fn the_committed_input_group_wrapper_is_the_generated_form_of_its_contract() {
    let contract = Contract::parse(include_bytes!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../registry/components/input-group/contract.json"
    )))
    .unwrap();

    assert_eq!(
        emit_wrapper(&contract),
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../../registry/components/input-group/input-group.tsx"
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

/// A styled wrapper owns its modifier prop names, so they must be omitted from
/// the primitive props before the variant union is intersected in. Without it a
/// modifier whose name shadows a native attribute (e.g. `size` on `<input>`,
/// typed `number`) intersects to `never` and the styled prop becomes unusable.
/// The omit is *distributive* so it preserves the primitive's controlled /
/// uncontrolled prop union (a plain `Omit` collapses it and breaks the spread).
#[test]
fn distributively_omits_modifier_prop_names_from_the_primitive_props() {
    let wrapper = emit_wrapper(&Contract::parse(DEMO_BOX.as_bytes()).unwrap());

    assert!(wrapper.contains(
        "type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;",
    ));
    assert!(wrapper.contains(
        "export type DemoBoxProps = DistributiveOmit<ComponentPropsWithRef<typeof DemoBoxPrimitive>, \"variant\" | \"size\"> & {",
    ));
}

/// A no-modifier wrapper needs no omit, so the helper is not emitted.
#[test]
fn omits_the_distributive_helper_when_there_are_no_modifiers() {
    let wrapper = emit_wrapper(&Contract::parse(DEMO_TOGGLE.as_bytes()).unwrap());

    assert!(!wrapper.contains("DistributiveOmit"));
}
