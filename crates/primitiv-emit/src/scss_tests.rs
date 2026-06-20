use pretty_assertions::assert_eq;

use crate::css::Scope;
use crate::scss::{emit_component_scss, emit_scss};
use crate::token::Token;

/// Shared, pure-data fixture: a trimmed slice of the theme-token surface (one
/// colour, one radius) — enough to pin the canonical-CSS passthrough and the
/// `$`-variable adapter.
fn theme_tokens() -> Vec<Token> {
    vec![
        Token::new(&["color", "primary"], "oklch(0.55 0.13 162)"),
        Token::new(&["radius", "md"], "0.5rem"),
    ]
}

#[test]
fn emits_the_canonical_css_then_a_scss_variable_per_token() {
    let scss = emit_scss(&[Scope::new(&[":root"], theme_tokens())]);

    assert_eq!(
        scss,
        include_str!(concat!(env!("CARGO_MANIFEST_DIR"), "/tests/golden/tokens.scss"))
    );
}

#[test]
fn emits_one_scss_variable_for_a_token_shared_across_mode_scopes() {
    let scss = emit_scss(&[
        Scope::new(
            &[":root", "[data-theme=\"light\"]"],
            vec![Token::new(&["color", "bg"], "#fff")],
        ),
        Scope::new(
            &["[data-theme=\"dark\"]"],
            vec![Token::new(&["color", "bg"], "#111")],
        ),
    ]);

    assert_eq!(
        scss,
        include_str!(concat!(env!("CARGO_MANIFEST_DIR"), "/tests/golden/theme-modes.scss"))
    );
}

/// A trimmed two-layer component stylesheet — enough to pin the verbatim CSS
/// passthrough and the declared-property `$`-var scan: a knob re-declared by a
/// modifier (deduped to one `$`-var), a `var()` *reference* to one of the
/// component's own knobs (`gap:` — must not be aliased), and a backing token
/// referenced but not declared here (`--primitiv-action-*` — must not appear).
const COMPONENT_CSS: &str = "\
@layer primitiv.base {
  .primitiv-demo {
    --primitiv-demo-bg: var(--primitiv-action-primary);
    --primitiv-demo-gap: 0.5rem;
    gap: var(--primitiv-demo-gap);
  }
}
@layer primitiv.variants {
  .primitiv-demo--alt {
    --primitiv-demo-bg: var(--primitiv-action-secondary);
  }
}
";

#[test]
fn emits_the_stylesheet_verbatim_then_a_scss_var_per_declared_custom_property() {
    let scss = emit_component_scss(COMPONENT_CSS);

    assert_eq!(
        scss,
        format!(
            "{COMPONENT_CSS}\n\
$primitiv-demo-bg: var(--primitiv-demo-bg);\n\
$primitiv-demo-gap: var(--primitiv-demo-gap);\n"
        )
    );
}

/// Drift guard: the committed `registry/components/button/styles.scss` is exactly the
/// derived form of the canonical `styles.css`. SCSS is the canonical CSS
/// re-expressed for SCSS consumers (D: "Registry CSS, derive rest"), so it must
/// stay byte-for-byte what [`emit_component_scss`] produces — no hand-drift.
#[test]
fn the_committed_button_scss_is_the_derived_form_of_its_css() {
    let css = include_str!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../registry/components/button/styles.css"
    ));
    let scss = include_str!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../registry/components/button/styles.scss"
    ));

    assert_eq!(emit_component_scss(css), scss);
}

/// Drift guard: the committed `registry/components/input/styles.scss` is exactly the
/// derived form of its canonical `styles.css` — the text-field proof.
#[test]
fn the_committed_input_scss_is_the_derived_form_of_its_css() {
    let css = include_str!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../registry/components/input/styles.css"
    ));
    let scss = include_str!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../registry/components/input/styles.scss"
    ));

    assert_eq!(emit_component_scss(css), scss);
}

/// Drift guard: the committed `registry/components/field/styles.scss` is exactly the
/// derived form of its canonical `styles.css` — the form-field-wrapper proof.
#[test]
fn the_committed_field_scss_is_the_derived_form_of_its_css() {
    let css = include_str!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../registry/components/field/styles.css"
    ));
    let scss = include_str!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../registry/components/field/styles.scss"
    ));

    assert_eq!(emit_component_scss(css), scss);
}

/// Drift guard: the committed `registry/components/input-group/styles.scss` is
/// exactly the derived form of its canonical `styles.css` — the adornment-frame
/// proof, whose `$`-var scan must collect every `--primitiv-input-group-*` knob.
#[test]
fn the_committed_input_group_scss_is_the_derived_form_of_its_css() {
    let css = include_str!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../registry/components/input-group/styles.css"
    ));
    let scss = include_str!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../registry/components/input-group/styles.scss"
    ));

    assert_eq!(emit_component_scss(css), scss);
}

/// Drift guard: the committed `registry/components/switch/styles.scss` is exactly the
/// derived form of its canonical `styles.css` — the state-driven, parts-based
/// proof that the SCSS adapter is component-shape-agnostic.
#[test]
fn the_committed_switch_scss_is_the_derived_form_of_its_css() {
    let css = include_str!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../registry/components/switch/styles.css"
    ));
    let scss = include_str!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../registry/components/switch/styles.scss"
    ));

    assert_eq!(emit_component_scss(css), scss);
}

/// Drift guard: the committed `registry/components/tabs/styles.scss` is exactly the
/// derived form of its canonical `styles.css` — the structural-compound proof that
/// the deriver collects every `--primitiv-tabs-*` knob across all three sublayers.
#[test]
fn the_committed_tabs_scss_is_the_derived_form_of_its_css() {
    let css = include_str!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../registry/components/tabs/styles.css"
    ));
    let scss = include_str!(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../registry/components/tabs/styles.scss"
    ));

    assert_eq!(emit_component_scss(css), scss);
}
