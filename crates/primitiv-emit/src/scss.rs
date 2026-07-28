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

/// Emit a component stylesheet as SCSS (RFC 0006 §4.2): the canonical CSS
/// verbatim — SCSS is a strict superset of CSS, so it round-trips, keyframes and
/// all — followed by one `$primitiv-*` variable per custom property the
/// stylesheet *declares*, each resolving to that property. Consumers re-skin by
/// overriding the custom properties; the `$`-vars are the `$`-pipeline mirror of
/// the same knobs.
///
/// Only *declared* properties are aliased: a `var(--primitiv-button-gap)`
/// reference, or a backing `--primitiv-action-*` token referenced but not
/// declared in this file, is skipped — a declaration is a line whose trimmed
/// form starts `--name:`. A property re-declared by a modifier emits a single
/// `$`-var, in first-occurrence order. The scan runs over a comment-stripped
/// copy of the CSS — a `/* ... */` block is inert, so prose that happens to
/// contain a `--name:`-shaped fragment (e.g. explaining a *different* token
/// by name) is never mistaken for a real declaration — while the emitted
/// output still carries the original CSS, comments included, verbatim.
pub fn emit_component_scss(css: &str) -> String {
    let mut out = css.to_string();
    out.push('\n');
    let scannable = strip_comments(css);
    let mut seen = HashSet::new();
    for line in scannable.lines() {
        if let Some(name) = line
            .trim_start()
            .strip_prefix("--")
            .and_then(|rest| rest.split_once(':'))
            .map(|(name, _)| name.trim_end())
        {
            if seen.insert(name.to_string()) {
                out.push_str(&format!("${name}: var(--{name});\n"));
            }
        }
    }
    out
}

/// Remove every `/* ... */` span from `css`, preserving every newline
/// (including ones inside a removed span) so line structure survives for a
/// line-oriented scan downstream. An unterminated `/*` drops the remainder of
/// the input, keeping only its newlines.
fn strip_comments(css: &str) -> String {
    let mut out = String::with_capacity(css.len());
    let mut rest = css;
    while let Some(start) = rest.find("/*") {
        out.push_str(&rest[..start]);
        let after_open = &rest[start + 2..];
        match after_open.find("*/") {
            Some(end) => {
                out.push_str(&"\n".repeat(after_open[..end].matches('\n').count()));
                rest = &after_open[end + 2..];
            }
            None => {
                out.push_str(&"\n".repeat(rest[start..].matches('\n').count()));
                rest = "";
            }
        }
    }
    out.push_str(rest);
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
