use pretty_assertions::assert_eq;

use crate::contract::Contract;
use crate::contract_fixtures::{DEMO_BOX, DEMO_MARK, DEMO_PILL, DEMO_TOGGLE, DEMO_VIEW};
use crate::snippet::emit_snippet;

#[test]
fn renders_a_single_element_with_every_default_modifier_class() {
    let contract = Contract::parse(DEMO_BOX.as_bytes()).unwrap();

    assert_eq!(
        emit_snippet(&contract).unwrap(),
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/tests/golden/demo-box.snippet.html"
        ))
    );
}

#[test]
fn gives_only_a_button_root_a_type() {
    let contract = Contract::parse(DEMO_MARK.as_bytes()).unwrap();

    assert_eq!(
        emit_snippet(&contract).unwrap(),
        "<mark class=\"primitiv-demo-mark\">Demo mark</mark>\n"
    );
}

#[test]
fn leaves_out_a_default_option_that_adds_no_class() {
    // Prose's `measure` defaults to off, an option with an empty class: it adds
    // nothing, so it must not leave a stray space in the attribute either.
    let contract = Contract::parse(
        br#"{
  "name": "demo-flow",
  "version": "0.1.0",
  "description": "A container with an opt-in modifier.",
  "root": { "element": "div", "class": "primitiv-demo-flow" },
  "modifiers": [
    {
      "name": "measure",
      "default": "false",
      "description": "Caps the width.",
      "options": [
        { "name": "false", "class": "", "description": "Full width." },
        { "name": "true", "class": "primitiv-demo-flow--measure", "description": "Capped." }
      ]
    }
  ]
}"#,
    )
    .unwrap();

    assert_eq!(
        emit_snippet(&contract).unwrap(),
        "<div class=\"primitiv-demo-flow\">Demo flow</div>\n"
    );
}

#[test]
fn wraps_the_text_in_a_label_span_when_the_contract_asks() {
    let contract = Contract::parse(DEMO_PILL.as_bytes()).unwrap();

    assert_eq!(
        emit_snippet(&contract).unwrap(),
        // A child element goes on its own line, indented, so the nesting reads.
        "<span class=\"primitiv-demo-pill\">\n  <span class=\"primitiv-demo-pill__label\">Demo pill</span>\n</span>\n"
    );
}

#[test]
fn generates_nothing_for_a_compound_whose_nesting_the_contract_does_not_record() {
    // Which part nests in which, and which repeats per value, is not in the
    // contract, so a compound's example is hand-written (RFC 0033 §8.1).
    for fixture in [DEMO_VIEW, DEMO_TOGGLE] {
        let contract = Contract::parse(fixture.as_bytes()).unwrap();
        assert_eq!(emit_snippet(&contract), None, "{}", contract.name);
    }
}

/// Drift guard: every example `registry.json` names as a component's
/// `elements.example` is held to its contract. A generated one (a single
/// element) is exactly what the contract generates — regenerate with
/// `cargo run -p primitiv-emit --example regen-snippets`. A hand-written one (a
/// compound) uses only classes the contract defines, and every part's class.
#[test]
fn committed_registry_examples_match_their_contracts() {
    let registry = concat!(env!("CARGO_MANIFEST_DIR"), "/../../registry");
    let index: serde_json::Value = serde_json::from_str(
        &std::fs::read_to_string(format!("{registry}/registry.json")).unwrap(),
    )
    .unwrap();
    let (mut generated, mut written) = (0, 0);
    for (name, entry) in index["components"].as_object().unwrap() {
        if let Some(file) = entry["elements"]["example"].as_str() {
            let dir = format!("{registry}/components/{name}");
            let contract =
                Contract::parse(&std::fs::read(format!("{dir}/contract.json")).unwrap()).unwrap();
            let committed = std::fs::read_to_string(format!("{dir}/{file}"))
                .unwrap_or_else(|error| panic!("{name}/{file}: {error}"));
            // `handWritten` marks an example whose markup carries structure the
            // contract does not record (Blockquote's quote paragraph): it is
            // held to the contract's classes, never regenerated over.
            let generated_markup = if entry["elements"]["handWritten"] == true {
                None
            } else {
                emit_snippet(&contract)
            };
            match generated_markup {
                Some(markup) => {
                    assert_eq!(committed, markup, "{name}/{file} has drifted");
                    generated += 1;
                }
                None => {
                    let stylesheet = std::fs::read_to_string(format!("{dir}/styles.css")).unwrap();
                    // A component's declared dependencies are always installed
                    // with it, so their classes are fair game too: Avatar Group
                    // holds Avatars, Pagination's cells are Buttons.
                    let dependencies: Vec<(Contract, String)> = entry["dependsOn"]["components"]
                        .as_array()
                        .into_iter()
                        .flatten()
                        .map(|dep| {
                            let dir = format!("{registry}/components/{}", dep.as_str().unwrap());
                            (
                                Contract::parse(
                                    &std::fs::read(format!("{dir}/contract.json")).unwrap(),
                                )
                                .unwrap(),
                                std::fs::read_to_string(format!("{dir}/styles.css")).unwrap(),
                            )
                        })
                        .collect();
                    assert_uses_the_contracts_classes(
                        &contract,
                        &stylesheet,
                        &dependencies,
                        &committed,
                        &format!("{name}/{file}"),
                    );
                    written += 1;
                }
            }
        }
    }
    assert!(
        generated > 0,
        "no registry component names a generated example"
    );
    assert!(
        written > 0,
        "no registry component names a hand-written example"
    );
}

/// Hold hand-written markup to its contract: no class that neither the contract
/// nor the component's own stylesheet defines (a typo or a renamed part), and
/// every part's own class present (a part the example forgot). The stylesheet
/// counts because a hand-authored wrapper can style structure the contract does
/// not model — Accordion's content clip and body. A declared dependency's
/// classes are allowed as well (never required): it is installed alongside.
fn assert_uses_the_contracts_classes(
    contract: &Contract,
    stylesheet: &str,
    dependencies: &[(Contract, String)],
    markup: &str,
    file: &str,
) {
    let required = required_classes(contract);
    let mut allowed = defined_classes(contract, stylesheet);
    for (dependency, dependency_stylesheet) in dependencies {
        allowed.extend(defined_classes(dependency, dependency_stylesheet));
    }
    let used: std::collections::BTreeSet<String> = markup
        .split("class=\"")
        .skip(1)
        .flat_map(|rest| rest.split('"').next().unwrap().split_whitespace())
        .map(String::from)
        .collect();
    let unknown: Vec<_> = used.difference(&allowed).collect();
    assert!(
        unknown.is_empty(),
        "{file} uses classes its contract does not define: {unknown:?}"
    );
    let missing: Vec<_> = required
        .iter()
        .filter(|class| !used.contains(*class))
        .collect();
    assert!(
        missing.is_empty(),
        "{file} leaves out parts of its contract: {missing:?}"
    );
}

/// The root's and every part's class: each must appear in an example.
fn required_classes(contract: &Contract) -> Vec<String> {
    let label = |class: &str, wraps: bool| wraps.then(|| format!("{class}-label"));
    let mut required = vec![contract.root.class.clone()];
    required.extend(contract.parts.iter().map(|part| part.class.clone()));
    for sub in &contract.subcomponents {
        required.push(sub.class.clone());
        required.extend(label(&sub.class, sub.wrap_text_children));
    }
    required
}

/// Every class a component defines: its parts, its modifiers, and anything its
/// own stylesheet selects.
fn defined_classes(contract: &Contract, stylesheet: &str) -> std::collections::BTreeSet<String> {
    let mut defined: std::collections::BTreeSet<String> =
        required_classes(contract).into_iter().collect();
    let groups = contract
        .modifiers
        .iter()
        .chain(contract.subcomponents.iter().flat_map(|sub| &sub.modifiers));
    defined
        .extend(groups.flat_map(|group| group.options.iter().map(|option| option.class.clone())));
    defined.extend(stylesheet.split('.').skip(1).map(|rest| {
        rest.split(|c: char| !(c.is_ascii_alphanumeric() || c == '-' || c == '_'))
            .next()
            .unwrap()
            .to_string()
    }));
    defined
}
