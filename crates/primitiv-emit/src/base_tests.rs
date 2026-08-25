use crate::base::{BASE_CSS, BASE_SCSS};
use crate::scss::strip_comments;

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
/// The standing check for the reset-leak bug class, at its last remaining site.
///
/// `li + li` was the one piece of content rhythm this sheet applied globally, so
/// every hand-rolled `<ul>` in a consumer app got 8px between items — and where
/// the list spaced itself with flex `gap` the two ADDED, since margins do not
/// collapse in a flex container. RFC 0016 D69/D76 make flow rhythm an opt-in
/// container context and explicitly reject a global owl, so the selector belongs
/// behind `.primitiv-flow`.
///
/// The scan runs over comment-stripped source because the rule's own comment
/// discusses `li + li` at length; a naive line filter matches the prose and
/// passes vacuously.
#[test]
fn list_item_rhythm_is_scoped_to_the_flow_context() {
    for (name, sheet) in [("base.css", BASE_CSS), ("base.scss", BASE_SCSS)] {
        let stripped = strip_comments(sheet);
        let matches: Vec<(usize, &str)> = stripped
            .lines()
            .enumerate()
            .map(|(i, line)| (i + 1, line.trim()))
            .filter(|(_, line)| line.contains("li + li"))
            .collect();
        assert!(!matches.is_empty(), "{name}: the `li + li` rule has vanished, not been scoped");
        for (line_no, line) in matches {
            assert!(
                line.starts_with(".primitiv-flow "),
                "{name}:{line_no} has an unscoped `li + li`, which spaces every bare \
                 list in a consumer app: {line}"
            );
        }
    }
}

#[test]
fn the_base_layer_declares_no_custom_properties() {
    let declared: Vec<&str> = BASE_CSS
        .lines()
        .map(str::trim)
        .filter(|line| line.starts_with("--primitiv-"))
        .collect();
    assert!(declared.is_empty(), "base.css declares custom properties: {declared:?}");
}
