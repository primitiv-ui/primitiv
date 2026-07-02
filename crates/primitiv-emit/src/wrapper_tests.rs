use pretty_assertions::assert_eq;

use crate::contract::Contract;
use crate::contract_fixtures::{BARE, DEMO_BOX, DEMO_LABELLED, DEMO_STRIP, DEMO_TOGGLE, DEMO_VIEW};
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

/// The inline-label decorative-slot shape (`label: true`): the parts nest inside
/// a `…__control` box, a `…__label` span carrying `children` is appended, and
/// `children` joins the destructure alongside the `size` variant prop (D54).
#[test]
fn generates_a_framed_control_with_inline_label_for_a_labelled_parts_contract() {
    let contract = Contract::parse(DEMO_LABELLED.as_bytes()).unwrap();

    assert_eq!(
        emit_wrapper(&contract),
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/tests/golden/demo-labelled.wrapper.tsx"
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

/// Drift guard: the committed `registry/components/checkbox/checkbox.tsx` is exactly
/// the generated form of its contract — a decorative-slot compound (the indicator)
/// that *also* carries a `size` modifier, so the auto-rendered part and the
/// distributive omit appear together.
#[test]
fn the_committed_checkbox_wrapper_is_the_generated_form_of_its_contract() {
    let contract = Contract::parse(include_bytes!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../registry/components/checkbox/contract.json"
    )))
    .unwrap();

    assert_eq!(
        emit_wrapper(&contract),
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../../registry/components/checkbox/checkbox.tsx"
        ))
    );
}

/// Drift guard: the committed `registry/components/radio/radio.tsx` is exactly the
/// generated form of its contract — the checkbox's decorative-slot + `size` shape,
/// proving the wrapper generator is contract-shape-agnostic across siblings.
#[test]
fn the_committed_radio_wrapper_is_the_generated_form_of_its_contract() {
    let contract = Contract::parse(include_bytes!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../registry/components/radio/contract.json"
    )))
    .unwrap();

    assert_eq!(
        emit_wrapper(&contract),
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../../registry/components/radio/radio.tsx"
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

/// A single-element contract can opt into wrapping its text children in a
/// `…__label` span (so `text-box-trim` can sit on the label, not the flex box).
/// The wrapper then imports `Children` / `ReactNode`, emits the `wrapTextNodes`
/// helper, destructures `children`, and renders `{wrapTextNodes(children)}`.
#[test]
fn wraps_text_children_in_a_label_span_when_the_contract_opts_in() {
    let json = br#"{
        "name": "button",
        "description": "A clickable action.",
        "root": { "element": "button", "class": "primitiv-button" },
        "wrapTextChildren": true
    }"#;
    let wrapper = emit_wrapper(&Contract::parse(json).unwrap());

    assert!(wrapper.contains(
        "import { Children, type ComponentPropsWithRef, type ReactNode } from \"react\";",
    ));
    assert!(wrapper.contains("function wrapTextNodes(children: ReactNode): ReactNode {"));
    assert!(wrapper.contains("<span className=\"primitiv-button__label\">{child}</span>"));
    assert!(wrapper.contains("{wrapTextNodes(children)}"));
    assert!(wrapper.contains("className, children, ...props"));
}

/// Without the opt-in, a single-element wrapper stays self-closing with no helper.
#[test]
fn omits_the_text_wrapping_helper_by_default() {
    let json = br#"{
        "name": "button",
        "description": "A clickable action.",
        "root": { "element": "button", "class": "primitiv-button" }
    }"#;
    let wrapper = emit_wrapper(&Contract::parse(json).unwrap());

    assert!(!wrapper.contains("wrapTextNodes"));
    assert!(wrapper.contains("{...props} />;"));
}

/// A structural subcomponent can independently opt into wrapping its text
/// children in a `{class}-label` span (ToggleGroup.Item), distinct from the
/// single-element `wrapTextChildren` — the import switches to `Children` /
/// `ReactNode`, a `wrap{Sub}TextNodes` helper is emitted for that part only, and
/// only that part's function destructures `children` and renders open/close.
#[test]
fn wraps_text_children_in_a_label_span_for_a_structural_subcomponent_when_it_opts_in() {
    let contract = Contract::parse(DEMO_STRIP.as_bytes()).unwrap();
    let wrapper = emit_wrapper(&contract);

    assert!(wrapper.contains(
        "import { Children, type ComponentPropsWithRef, type ReactNode } from \"react\";",
    ));
    assert!(wrapper.contains("function wrapDemoStripItemTextNodes(children: ReactNode): ReactNode {"));
    assert!(wrapper.contains("<span className=\"primitiv-demo-strip__item-label\">{child}</span>"));
    assert!(wrapper.contains(
        "export function DemoStripItem({ className, children, ...props }: DemoStripItemProps) {",
    ));
    assert!(wrapper.contains("{wrapDemoStripItemTextNodes(children)}"));
    // The root part has no opt-in, so it stays self-closing with no `children`.
    assert!(wrapper.contains(
        "export function DemoStrip({ className, ...props }: DemoStripProps) {",
    ));
    assert!(wrapper.contains("{...props} />;"));
}

/// Drift guard: the committed `registry/components/divider/divider.tsx` is exactly
/// the generated form of its contract.
#[test]
fn the_committed_divider_wrapper_is_the_generated_form_of_its_contract() {
    let contract = Contract::parse(include_bytes!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../registry/components/divider/contract.json"
    )))
    .unwrap();

    assert_eq!(
        emit_wrapper(&contract),
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../../registry/components/divider/divider.tsx"
        ))
    );
}

/// Drift guard: the committed `registry/components/table/table.tsx` is exactly the
/// generated form of its contract.
#[test]
fn the_committed_table_wrapper_is_the_generated_form_of_its_contract() {
    let contract = Contract::parse(include_bytes!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../registry/components/table/contract.json"
    )))
    .unwrap();

    assert_eq!(
        emit_wrapper(&contract),
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../../registry/components/table/table.tsx"
        ))
    );
}

/// Drift guard: the committed `registry/components/toggle-group/toggle-group.tsx`
/// is exactly the generated form of its contract — a structural compound whose
/// `item` subcomponent opts into `wrapTextChildren`, proving the per-part
/// text-wrapping helper alongside a modifier-bearing root (`size` / `justify`).
#[test]
fn the_committed_toggle_group_wrapper_is_the_generated_form_of_its_contract() {
    let contract = Contract::parse(include_bytes!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../registry/components/toggle-group/contract.json"
    )))
    .unwrap();

    assert_eq!(
        emit_wrapper(&contract),
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../../registry/components/toggle-group/toggle-group.tsx"
        ))
    );
}

/// Drift guard: the committed `registry/components/accordion/accordion.tsx` is
/// exactly the generated form of its contract — a five-subcomponent structural
/// compound (item / header / trigger / content / trigger-icon) whose `trigger`
/// opts into `wrapTextChildren`, proving a kebab-case multi-word subcomponent
/// name (`trigger-icon`) round-trips through the PascalCase/camelCase naming.
#[test]
fn the_committed_accordion_wrapper_is_the_generated_form_of_its_contract() {
    let contract = Contract::parse(include_bytes!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../registry/components/accordion/contract.json"
    )))
    .unwrap();

    assert_eq!(
        emit_wrapper(&contract),
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../../registry/components/accordion/accordion.tsx"
        ))
    );
}
