use pretty_assertions::assert_eq;

use crate::component::{emit_component_css, Component};
use crate::token::Token;

/// Shared, pure-data fixture: Button's per-component API tokens, already linked
/// to their backing theme tokens — enough to pin the `.primitiv-<name>` block
/// and the `--primitiv-<name>-<part>` namespacing.
fn button() -> Component {
    Component {
        name: "button".to_string(),
        tokens: vec![
            Token::new(&["bg"], "var(--primitiv-color-primary)"),
            Token::new(&["fg"], "var(--primitiv-color-on-primary)"),
        ],
    }
}

#[test]
fn emits_the_per_component_api_tokens_inside_the_base_layer() {
    let css = emit_component_css(&button());

    assert_eq!(
        css,
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/tests/golden/component-button.css"
        ))
    );
}
