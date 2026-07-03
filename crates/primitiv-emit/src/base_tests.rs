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
