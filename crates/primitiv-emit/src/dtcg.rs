use serde_json::{Map, Value};

use crate::token::Token;
use crate::value::{format_cubic_bezier, format_number, format_shadow, ShadowLayer};

/// Flatten a DTCG token tree into resolved [`Token`]s (RFC 0006 §3–4).
///
/// A node carrying a `$value` is a leaf — its nesting path becomes the token
/// path. String values (colours, aliases) are taken verbatim; numeric values
/// are formatted by category (`format_number`); a `cubicBezier` leaf's
/// four-point array becomes a CSS `cubic-bezier()` function. Group nodes
/// recurse; `$`-prefixed metadata keys (`$type`, `$description`) are skipped.
/// A `shadow` leaf's layer(s) become a CSS `box-shadow` (`shadow_layers`); any
/// other composite (e.g. gradient/typography tokens) is not yet supported and
/// is skipped.
pub fn tokens_from_dtcg(root: &Value) -> Vec<Token> {
    let mut tokens = Vec::new();
    let mut path = Vec::new();
    if let Some(map) = root.as_object() {
        collect(map, &mut path, &mut tokens);
    }
    tokens
}

/// Split a multi-mode DTCG document into per-mode token groups (RFC 0009 §2.2).
///
/// Multi-mode collections (`palette`, `intent`, `context`) put the **mode** as
/// the top-level key (`light`/`dark`, or a density). Each top-level entry is one
/// mode; its subtree is flattened with [`tokens_from_dtcg`], so the mode segment
/// is stripped from the token names and survives only as the returned mode
/// label. The labels map to `[data-theme]` / `[data-density]` scopes in a later
/// cycle.
pub fn flatten_modes(document: &Value) -> Vec<(String, Vec<Token>)> {
    let mut modes = Vec::new();
    if let Some(map) = document.as_object() {
        for (mode, subtree) in map {
            modes.push((mode.clone(), tokens_from_dtcg(subtree)));
        }
    }
    modes
}

fn collect(map: &Map<String, Value>, path: &mut Vec<String>, out: &mut Vec<Token>) {
    for (key, child) in map {
        if key.starts_with('$') {
            continue;
        }
        path.push(key.clone());
        if let Some(value) = child.get("$value") {
            if let Some(text) = value.as_str() {
                out.push(Token {
                    path: path.clone(),
                    value: text.to_string(),
                });
            } else if let Some(number) = value.as_f64() {
                out.push(Token {
                    path: path.clone(),
                    value: format_number(&path[0], number),
                });
            } else if let Some(points) = cubic_bezier_points(child, value) {
                out.push(Token {
                    path: path.clone(),
                    value: format_cubic_bezier(&points),
                });
            } else if let Some(layers) = shadow_layers(child, value) {
                out.push(Token {
                    path: path.clone(),
                    value: format_shadow(&layers),
                });
            }
        } else if let Some(child_map) = child.as_object() {
            collect(child_map, path, out);
        }
        path.pop();
    }
}

/// The four numeric control points of a `cubicBezier` leaf, or `None` for any
/// other leaf. Gated on the sibling `$type` so a future array-valued composite
/// is not mistaken for an easing curve, and on the value being four numbers so a
/// malformed curve is skipped rather than half-emitted.
fn cubic_bezier_points(leaf: &Value, value: &Value) -> Option<Vec<f64>> {
    if leaf.get("$type").and_then(Value::as_str) != Some("cubicBezier") {
        return None;
    }
    let points: Vec<f64> = value.as_array()?.iter().filter_map(Value::as_f64).collect();
    (points.len() == 4).then_some(points)
}

/// The [`ShadowLayer`]s of a `shadow` leaf, or `None` for any other leaf or a
/// malformed shadow (RFC 0006 §4, RFC 0017 §4). Gated on the sibling `$type` so
/// no other array/object composite is mistaken for a shadow. A `$value` array is
/// the layered form (one box-shadow per element, the smoothshadows stack); an
/// **empty** array yields zero layers — the `none` keyword. A bare object is a
/// single layer. A layer missing any component fails the whole token (`?`), so a
/// malformed shadow is skipped rather than half-emitted.
fn shadow_layers(leaf: &Value, value: &Value) -> Option<Vec<ShadowLayer>> {
    if leaf.get("$type").and_then(Value::as_str) != Some("shadow") {
        return None;
    }
    match value {
        Value::Array(items) => items.iter().map(shadow_layer).collect(),
        layer => shadow_layer(layer).map(|layer| vec![layer]),
    }
}

/// One shadow layer's five box-shadow components, each a CSS string (a `{…}`
/// alias resolved later by [`crate::alias::link_aliases`], or a literal). `None`
/// if any component is missing or non-string.
fn shadow_layer(layer: &Value) -> Option<ShadowLayer> {
    let parts: Option<Vec<String>> = ["offsetX", "offsetY", "blur", "spread", "color"]
        .iter()
        .map(|key| layer.get(*key).and_then(Value::as_str).map(str::to_string))
        .collect();
    let parts = parts?;
    Some(ShadowLayer {
        offset_x: parts[0].clone(),
        offset_y: parts[1].clone(),
        blur: parts[2].clone(),
        spread: parts[3].clone(),
        color: parts[4].clone(),
    })
}
