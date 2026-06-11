//! Tailwind v4 serialiser — a `@theme` preset over the custom properties
//! (RFC 0006 §4.2, D46).

use crate::token::Token;

/// Emit the theme-token surface as a Tailwind v4 `@theme` preset (RFC 0006 §4.2,
/// D46): one theme variable per token, each pointing at the token's
/// `--primitiv-*` custom property. Tailwind v4 is CSS-variable-native, so the
/// preset *is* the custom properties plus this mapping — utilities resolve the
/// vars, and a `[data-theme]`/`[data-density]` ancestor re-skins them with no
/// extra config (RFC 0009 §4.2).
pub fn emit_tailwind(tokens: &[Token]) -> String {
    let mut out = String::from("@theme {\n");
    for token in tokens {
        let name = token.path.join("-");
        out.push_str(&format!("  --{name}: var(--primitiv-{name});\n"));
    }
    out.push_str("}\n");
    out
}
