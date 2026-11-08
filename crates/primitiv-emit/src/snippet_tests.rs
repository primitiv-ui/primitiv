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

/// Drift guard: every snippet `registry.json` lists under a component's
/// `elements.files` is exactly what its contract generates. Regenerate with
/// `cargo run -p primitiv-emit --example regen-snippets`.
#[test]
fn committed_registry_snippets_match_their_contracts() {
    let registry = concat!(env!("CARGO_MANIFEST_DIR"), "/../../registry");
    let index: serde_json::Value = serde_json::from_str(
        &std::fs::read_to_string(format!("{registry}/registry.json")).unwrap(),
    )
    .unwrap();
    let mut checked = 0;
    for (name, entry) in index["components"].as_object().unwrap() {
        let files = entry["elements"]["files"].as_array().into_iter().flatten();
        for file in files
            .filter_map(|file| file.as_str())
            .filter(|file| file.ends_with(".html"))
        {
            let dir = format!("{registry}/components/{name}");
            let contract =
                Contract::parse(&std::fs::read(format!("{dir}/contract.json")).unwrap()).unwrap();
            let committed = std::fs::read_to_string(format!("{dir}/{file}"))
                .unwrap_or_else(|error| panic!("{name}/{file}: {error}"));
            assert_eq!(
                committed,
                emit_snippet(&contract),
                "{name}/{file} has drifted"
            );
            checked += 1;
        }
    }
    assert!(checked > 0, "no registry component lists a snippet");
}
