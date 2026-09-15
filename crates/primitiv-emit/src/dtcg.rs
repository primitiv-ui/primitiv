use serde_json::{Map, Value};

use crate::token::Token;
use crate::value::{format_color, format_cubic_bezier, format_number, format_shadow, ShadowLayer};

/// Flatten a DTCG token tree into resolved [`Token`]s (RFC 0006 §3–4).
///
/// A node carrying a `$value` is a leaf — its nesting path becomes the token
/// path. A `color` leaf's string is rendered as `oklch()` (`format_color`);
/// every other string value is taken verbatim; numeric values
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
                    value: if is_color(child) {
                        format_color(text)
                    } else {
                        text.to_string()
                    },
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

/// Whether a leaf is a `color`, so its string `$value` is rendered as `oklch()`
/// rather than taken verbatim. Gated on the leaf's own `$type` rather than an
/// inherited one: every colour leaf in this design system declares its own, and
/// no group declares `$type` at all, so reading the leaf is exact here — and a
/// non-colour string is never mistaken for a colour, which matters because a
/// one-word font family (`Tomato`) parses perfectly well as a named colour.
fn is_color(leaf: &Value) -> bool {
    leaf.get("$type").and_then(Value::as_str) == Some("color")
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

/// One shadow layer's five box-shadow components, each a CSS string (a `{...}`
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

/// One node of a document being written: a group of named children **in
/// insertion order**, or a leaf colour.
///
/// Ordered by construction rather than by `serde_json`, which sorts its keys — and
/// sorting them as strings puts `"100"` before `"50"`, so a palette ramp would
/// read out of scale order. `serde_json`'s `preserve_order` feature is not an
/// option either: Cargo unifies features across the workspace, and turning it on
/// flips this crate's own token ordering and breaks five goldens.
enum Node {
    Group(Vec<(String, Node)>),
    Leaf(String),
}

/// Places `value` under `key`, then `rest`, within `children` — creating the
/// groups along the way and reusing any that an earlier token already opened.
///
/// The head of the path is taken as its own argument rather than split off a
/// slice, so there is no empty-path case to handle: every call names at least one
/// key by construction. It also takes the children rather than a [`Node`], so
/// there is no "is this a group?" check either — descending only ever reaches a
/// group.
fn insert(children: &mut Vec<(String, Node)>, key: &str, rest: &[String], value: &str) {
    if rest.is_empty() {
        children.push((key.to_string(), Node::Leaf(value.to_string())));
        return;
    }

    if !children.iter().any(|(name, _)| name == key) {
        children.push((key.to_string(), Node::Group(Vec::new())));
    }
    let group = children
        .iter_mut()
        .find_map(|(name, child)| match child {
            Node::Group(group) if name == key => Some(group),
            _ => None,
        })
        .expect("the group was just ensured to exist");

    insert(group, &rest[0], &rest[1..], value);
}

impl Node {
    /// Renders this node at `depth`, two spaces per level to match the committed
    /// DTCG documents so a generated file diffs against them directly.
    fn render(&self, depth: usize, out: &mut String) {
        let pad = "  ".repeat(depth);
        match self {
            Node::Leaf(value) => {
                out.push_str(&format!(
                    "{{\n{pad}  \"$type\": \"color\",\n{pad}  \"$value\": \"{value}\"\n{pad}}}"
                ));
            }
            Node::Group(children) => {
                out.push_str("{\n");
                for (index, (name, child)) in children.iter().enumerate() {
                    out.push_str(&format!("{pad}  \"{name}\": "));
                    child.render(depth + 1, out);
                    if index + 1 < children.len() {
                        out.push(',');
                    }
                    out.push('\n');
                }
                out.push_str(&format!("{pad}}}"));
            }
        }
    }
}

/// Serialise per-mode token lists as a DTCG document (RFC 0009 §2.2's shape,
/// read back by [`flatten_modes`]): the **mode** is the top-level key, and each
/// token's path nests beneath it.
///
/// This is the inverse of [`tokens_from_dtcg`], and it exists so a palette
/// generated from seeds can be handed to a tool that consumes DTCG rather than
/// CSS — Figma's importers among them. Standard DTCG on purpose: a bespoke
/// payload would only be readable by tooling we also ship, which is no use to a
/// consumer who has the CLI and no plugin.
pub fn dtcg_document(modes: &[(String, Vec<Token>)]) -> String {
    let mut root = Vec::new();
    for (mode, tokens) in modes {
        for token in tokens {
            // A token with no path names nothing, so there is nowhere to put it.
            // Writing it against the mode key would make the mode itself a colour.
            if token.path.is_empty() {
                continue;
            }
            insert(&mut root, mode, &token.path, &token.value);
        }
    }

    let mut out = String::new();
    Node::Group(root).render(0, &mut out);
    out.push('\n');
    out
}
