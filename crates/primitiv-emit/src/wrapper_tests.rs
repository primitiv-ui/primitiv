use pretty_assertions::assert_eq;

use crate::contract::Contract;
use crate::contract_fixtures::{BARE, DEMO_BOX};
use crate::wrapper::emit_wrapper;

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
