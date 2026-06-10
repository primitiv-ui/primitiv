//! SCSS serialiser — the thinnest adapter over the canonical CSS (RFC 0006 §4.2).

use crate::css::{emit_css, Scope};

/// Emit the shared theme-token surface as SCSS (RFC 0006 §4.2): the canonical
/// CSS custom-property contract verbatim — SCSS is a superset of CSS — followed
/// by one `$primitiv-*` variable per token, each resolving to its custom
/// property so `$`-pipeline consumers get `$`-vars that still swap per mode.
pub fn emit_scss(scopes: &[Scope]) -> String {
    let mut out = emit_css(scopes);
    out.push('\n');
    for scope in scopes {
        for token in &scope.tokens {
            let name = token.path.join("-");
            out.push_str(&format!("$primitiv-{name}: var(--primitiv-{name});\n"));
        }
    }
    out
}
