//! Tailwind v4 serialiser — a `@theme` preset over the custom properties
//! (RFC 0006 §4.2, D46).

use std::collections::HashSet;

use crate::css::{emit_theme_css, Scope};
use crate::token::Token;

/// Emit the theme-token surface as a Tailwind v4 `@theme` preset (RFC 0006 §4.2,
/// D46): one theme variable per token, each pointing at the token's
/// `--primitiv-*` custom property. Tailwind v4 is CSS-variable-native, so the
/// preset *is* the custom properties plus this mapping — utilities resolve the
/// vars, and a `[data-theme]`/`[data-density]` ancestor re-skins them with no
/// extra config (RFC 0009 §4.2).
///
/// A name repeated across mode scopes (the same token in a light / dark or
/// density pair) maps to one theme variable, in first-occurrence order — the
/// `var()` reference is mode-independent, so one entry serves every mode.
pub fn emit_tailwind(tokens: &[Token]) -> String {
    let mut out = String::from("@theme {\n");
    let mut seen = HashSet::new();
    for token in tokens {
        let name = token.path.join("-");
        if seen.insert(name.clone()) {
            out.push_str(&format!(
                "  --{}: var(--primitiv-{name});\n",
                theme_name(&token.path)
            ));
        }
    }
    out.push_str("}\n");
    out
}

/// Emit `primitiv theme` brand overrides as Tailwind (RFC 0006 §4.2/§5): the
/// `primitiv.theme` custom-property block verbatim (via [`emit_theme_css`]) then
/// the `@theme` preset mapping those tokens onto Tailwind namespaces. Unlike the
/// token-layer preset — which assumes the always-emitted canonical CSS defines
/// the custom properties — a `theme` override is a single self-contained file,
/// so it carries its own custom-property definitions, mirroring the SCSS path.
pub fn emit_theme_tailwind(scopes: &[Scope]) -> String {
    let mut out = emit_theme_css(scopes);
    out.push('\n');
    out.push_str(&emit_tailwind(&scope_tokens(scopes)));
    out
}

/// Flatten every scope's tokens into one list (light then dark); [`emit_tailwind`]
/// dedupes the names a mode pair shares down to one `@theme` entry each.
fn scope_tokens(scopes: &[Scope]) -> Vec<Token> {
    scopes
        .iter()
        .flat_map(|scope| scope.tokens.iter().cloned())
        .collect()
}

/// A token's Tailwind theme-variable name: its category (first path segment)
/// renamed to Tailwind v4's canonical namespace, then the rest of the path.
/// Renaming the category is what lets a `space-4` token drive `p-4`/`m-4`,
/// a `font-size-lg` token drive `text-lg`, and so on.
fn theme_name(path: &[String]) -> String {
    let (category, rest) = path.split_first().expect("token path is never empty");
    let mut segments = vec![tailwind_namespace(category).to_string()];
    segments.extend(rest.iter().cloned());
    segments.join("-")
}

/// Map a token category onto Tailwind v4's theme namespace where the names
/// differ; categories Tailwind already spells the same (`color`, `radius`,
/// `font-weight`) and ones it has no namespace for pass through unchanged.
fn tailwind_namespace(category: &str) -> &str {
    match category {
        "space" => "spacing",
        "radii" => "radius",
        "font-size" => "text",
        "line-height" => "leading",
        "letter-spacing" => "tracking",
        other => other,
    }
}
