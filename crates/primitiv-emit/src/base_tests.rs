use crate::base::{BASE_CSS, BASE_SCSS};

/// The canonical sublayer order, declared up front so the sheet is safe to load
/// before the token layer.
const ORDER: &str = "@layer primitiv.reset, primitiv.tokens, primitiv.theme, \
                     primitiv.base, primitiv.variants, primitiv.states;";

/// The base stylesheet must declare the full sublayer order before it opens any
/// layer block. CSS fixes layer precedence by first appearance, so if a
/// component sheet (or this one) is bundled ahead of the token layer, the
/// up-front statement is what keeps primitiv.reset below primitiv.base —
/// otherwise the reset's zeroed element margins would win and kill the
/// .primitiv-flow rhythm (RFC 0008 §7).
#[test]
fn base_css_declares_the_layer_order_before_any_block() {
    let order_at = BASE_CSS.find(ORDER).expect("base.css declares the @layer order");
    let first_block = BASE_CSS
        .find("@layer primitiv.reset {")
        .expect("base.css opens a layer block");
    assert!(order_at < first_block, "the order statement must precede the first layer block");
}

#[test]
fn base_scss_declares_the_layer_order_before_any_block() {
    let order_at = BASE_SCSS.find(ORDER).expect("base.scss declares the @layer order");
    let first_block = BASE_SCSS
        .find("@layer primitiv.reset {")
        .expect("base.scss opens a layer block");
    assert!(order_at < first_block, "the order statement must precede the first layer block");
}

/// The two assets are hand-authored and hand-synced — nothing generates the SCSS
/// from the CSS the way `emit_component_scss` does for a component sheet — so
/// without this they drift the first time an edit lands in one and not the other.
/// (It happened: this session's typography fixes reached `base.css` and the
/// committed app copies at different times.)
#[test]
fn the_scss_mirror_is_byte_identical_to_the_css() {
    assert_eq!(BASE_CSS, BASE_SCSS, "assets/base.scss must mirror assets/base.css byte for byte");
}

/// The premise the identity above rests on: the mirror contract only adds
/// `$name: var(--name);` aliases for the custom properties a sheet *declares*,
/// and the base layer declares none — it consumes the token layer and styles bare
/// elements. If a future edit declares one here, the two assets legitimately
/// diverge and the test above is the one to revisit rather than to force green.
#[test]
fn the_base_layer_declares_no_custom_properties() {
    let declared: Vec<&str> = BASE_CSS
        .lines()
        .map(str::trim)
        .filter(|line| line.starts_with("--primitiv-"))
        .collect();
    assert!(declared.is_empty(), "base.css declares custom properties: {declared:?}");
}
