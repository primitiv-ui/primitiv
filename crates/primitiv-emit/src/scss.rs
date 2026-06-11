//! SCSS serialiser — the thinnest adapter over the canonical CSS (RFC 0006 §4.2).

use std::collections::HashSet;

use crate::css::{emit_css, emit_theme_css, Scope};

/// Emit the shared theme-token surface as SCSS (RFC 0006 §4.2): the canonical
/// CSS custom-property contract verbatim — SCSS is a superset of CSS — followed
/// by one `$primitiv-*` variable per token, each resolving to its custom
/// property so `$`-pipeline consumers get `$`-vars that still swap per mode.
///
/// A token shared across mode scopes (the same name in `[data-theme="light"]`
/// and `[data-theme="dark"]`) emits a single `$`-var, in first-occurrence order.
pub fn emit_scss(scopes: &[Scope]) -> String {
    let mut out = emit_css(scopes);
    append_scss_vars(&mut out, scopes);
    out
}

/// Emit `primitiv theme` brand overrides as SCSS (RFC 0006 §4.2/§5): the
/// `primitiv.theme`-layer CSS verbatim (via [`emit_theme_css`]) followed by the
/// same `$primitiv-*` variable block, so an SCSS consumer re-skins through the
/// overrides layer exactly as the CSS path does.
pub fn emit_theme_scss(scopes: &[Scope]) -> String {
    let mut out = emit_theme_css(scopes);
    append_scss_vars(&mut out, scopes);
    out
}

/// Append the `$primitiv-*` variable block after the CSS body: a blank-line
/// separator, then one `$`-var per distinct token name (first-occurrence order),
/// each resolving to its custom property.
fn append_scss_vars(out: &mut String, scopes: &[Scope]) {
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
}
