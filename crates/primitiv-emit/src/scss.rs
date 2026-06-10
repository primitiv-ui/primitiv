//! SCSS serialiser — the thinnest adapter over the canonical CSS (RFC 0006 §4.2).

use std::collections::HashSet;

use crate::css::{emit_css, Scope};

/// Emit the shared theme-token surface as SCSS (RFC 0006 §4.2): the canonical
/// CSS custom-property contract verbatim — SCSS is a superset of CSS — followed
/// by one `$primitiv-*` variable per token, each resolving to its custom
/// property so `$`-pipeline consumers get `$`-vars that still swap per mode.
///
/// A token shared across mode scopes (the same name in `[data-theme="light"]`
/// and `[data-theme="dark"]`) emits a single `$`-var, in first-occurrence order.
pub fn emit_scss(scopes: &[Scope]) -> String {
    let mut out = emit_css(scopes);
    out.push('\n');
    let mut seen = HashSet::new();
    for scope in scopes {
        for token in &scope.tokens {
            let name = token.path.join("-");
            if seen.insert(name.clone()) {
                out.push_str(&format!("$primitiv-{name}: var(--primitiv-{name});\n"));
            }
        }
    }
    out
}
