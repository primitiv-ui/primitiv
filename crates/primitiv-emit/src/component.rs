//! Per-component API-token serialiser — the two-tier split (RFC 0008 §3.2).

use crate::token::Token;

/// One component's per-component API surface: its name and the
/// `--primitiv-<name>-<part>` knobs that default to theme tokens (RFC 0004
/// §3.3). Each token's path is the *part* path (`["bg"]`, `["icon", "size"]`);
/// its value is the already-linked CSS the knob resolves to.
pub struct Component {
    pub name: String,
    pub tokens: Vec<Token>,
}

/// Emit a component's per-component API tokens inside the `primitiv.base` layer
/// (RFC 0008 §3.2): a `.primitiv-<name>` block of `--primitiv-<name>-<part>`
/// custom properties. These ship *inside* the component's own stylesheet — not
/// the shared token file — so a partial install carries only what was added.
/// The component stylesheet re-opens the named layer; it never re-declares the
/// sublayer order (that lives once in the shared token file, RFC 0008 §2.1).
pub fn emit_component_css(component: &Component) -> String {
    let mut out = String::new();
    out.push_str("@layer primitiv.base {\n");
    out.push_str(&format!("  .primitiv-{} {{\n", component.name));
    for token in &component.tokens {
        out.push_str(&format!(
            "    --primitiv-{}-{}: {};\n",
            component.name,
            token.path.join("-"),
            token.value
        ));
    }
    out.push_str("  }\n");
    out.push_str("}\n");
    out
}
