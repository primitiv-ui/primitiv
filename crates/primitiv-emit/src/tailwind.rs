//! Tailwind v4 serialiser — a `@theme` preset over the custom properties
//! (RFC 0006 §4.2, D46).

use std::collections::HashSet;

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
