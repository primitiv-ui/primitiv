use pretty_assertions::assert_eq;

use crate::wiring::{contains_wiring, patch, SNIPPET};

// --- SNIPPET ---

#[test]
fn snippet_contains_the_dark_variant_remap() {
    assert!(SNIPPET.contains("@custom-variant dark"));
    assert!(SNIPPET.contains(r#"[data-theme="dark"]"#));
}

#[test]
fn snippet_contains_the_layer_order_statement() {
    assert!(SNIPPET.contains("@layer"));
    assert!(SNIPPET.contains("primitiv"));
    assert!(SNIPPET.contains("utilities"));
}

// --- contains_wiring ---

#[test]
fn detects_both_lines_as_already_wired() {
    let css = format!("{SNIPPET}\n@import \"tailwindcss\";\n");
    assert!(contains_wiring(&css));
}

#[test]
fn missing_dark_variant_is_not_wired() {
    let css = "@import \"tailwindcss\";\n@layer theme, base, components, primitiv, utilities;\n";
    assert!(!contains_wiring(css));
}

#[test]
fn missing_layer_order_is_not_wired() {
    let css = "@import \"tailwindcss\";\n@custom-variant dark (&:where([data-theme=\"dark\"], [data-theme=\"dark\"] *));\n";
    assert!(!contains_wiring(css));
}

#[test]
fn empty_css_is_not_wired() {
    assert!(!contains_wiring(""));
}

// --- patch ---

#[test]
fn patch_prepends_snippet_to_existing_css() {
    let original = "@import \"tailwindcss\";\n";
    let patched = patch(original);
    assert!(patched.starts_with(SNIPPET));
    assert!(patched.ends_with(original));
}

#[test]
fn patch_adds_a_blank_line_between_snippet_and_original() {
    let original = "@import \"tailwindcss\";\n";
    let patched = patch(original);
    // snippet (no trailing newline) + newline + blank line + original
    let expected = format!("{SNIPPET}\n\n{original}");
    assert_eq!(patched, expected);
}

#[test]
fn patch_on_empty_content_is_just_the_snippet() {
    let patched = patch("");
    assert_eq!(patched, format!("{SNIPPET}\n"));
}
