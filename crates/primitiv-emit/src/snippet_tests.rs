use pretty_assertions::assert_eq;

use crate::contract::Contract;
use crate::contract_fixtures::{DEMO_BOX, DEMO_MARK, DEMO_PILL};
use crate::snippet::emit_snippet;

#[test]
fn renders_a_single_element_with_every_default_modifier_class() {
    let contract = Contract::parse(DEMO_BOX.as_bytes()).unwrap();

    assert_eq!(
        emit_snippet(&contract),
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/tests/golden/demo-box.snippet.html"
        ))
    );
}

#[test]
fn gives_only_a_button_root_a_type() {
    let contract = Contract::parse(DEMO_MARK.as_bytes()).unwrap();

    assert!(
        emit_snippet(&contract)
            .ends_with("-->\n<mark class=\"primitiv-demo-mark\">Demo mark</mark>\n"),
        "{}",
        emit_snippet(&contract)
    );
}

#[test]
fn wraps_the_text_in_a_label_span_when_the_contract_asks() {
    let contract = Contract::parse(DEMO_PILL.as_bytes()).unwrap();

    assert!(
        emit_snippet(&contract).ends_with(
            "-->\n<span class=\"primitiv-demo-pill\"><span class=\"primitiv-demo-pill__label\">Demo pill</span></span>\n"
        ),
        "{}",
        emit_snippet(&contract)
    );
}
