use pretty_assertions::assert_eq;

use crate::tailwind::emit_tailwind;
use crate::token::Token;

/// The five tiers Primitiv's breakpoint scale deliberately matches Tailwind
/// v4's own built-in defaults (RFC 0025 D2). Redeclaring `--breakpoint-sm`
/// through `--breakpoint-2xl` in our own `@theme` block would silently
/// override a consumer's customization of those exact names — unlike every
/// other Primitiv token, Tailwind v4 requires the bare (unprefixed) name to
/// drive its `sm:`/`md:`/etc. variants, so there is no namespaced-alias
/// escape hatch here. `xs` is additive (Tailwind has no default `xs`), so it
/// is always safe to emit.
fn breakpoint_tokens() -> Vec<Token> {
    vec![
        Token::new(&["breakpoint", "xs"], "22.5rem"),
        Token::new(&["breakpoint", "sm"], "40rem"),
        Token::new(&["breakpoint", "md"], "48rem"),
        Token::new(&["breakpoint", "lg"], "64rem"),
        Token::new(&["breakpoint", "xl"], "80rem"),
        Token::new(&["breakpoint", "2xl"], "96rem"),
    ]
}

/// Shared, pure-data fixture: a trimmed slice of the theme-token surface (one
/// colour, one radius) — enough to pin the `@theme` block and the mapping of a
/// token onto a Tailwind theme variable that references its custom property.
fn theme_tokens() -> Vec<Token> {
    vec![
        Token::new(&["color", "primary"], "oklch(0.55 0.13 162)"),
        Token::new(&["radius", "md"], "0.5rem"),
    ]
}

#[test]
fn maps_tokens_into_a_theme_block_of_var_references() {
    let tailwind = emit_tailwind(&theme_tokens());

    assert_eq!(
        tailwind,
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/tests/golden/tailwind.css"
        ))
    );
}

#[test]
fn renames_categories_to_their_tailwind_namespaces() {
    let tailwind = emit_tailwind(&[
        Token::new(&["space", "4"], "0.25rem"),
        Token::new(&["radii", "md"], "0.5rem"),
        Token::new(&["font-size", "lg"], "1.125rem"),
        Token::new(&["line-height", "tight"], "1.25"),
        Token::new(&["letter-spacing", "wide"], "0.025rem"),
    ]);

    assert_eq!(
        tailwind,
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/tests/golden/tailwind-namespaces.css"
        ))
    );
}

/// Tailwind numbers its spacing scale as a multiplier (`p-4` = 4 × 0.25rem),
/// Primitiv numbers its own in pixels (`space.4` = 4px). Emitting `--spacing-4`
/// would silently turn every consumer's `p-4` from 16px into 4px, so the space
/// scale keeps a `space-` prefix and is reached as `p-space-4` instead.
#[test]
fn keeps_a_space_prefix_so_tailwinds_own_spacing_numbers_are_never_overridden() {
    let tailwind = emit_tailwind(&[Token::new(&["space", "4"], "0.25rem")]);

    assert!(tailwind.contains("  --spacing-space-4: var(--primitiv-space-4);\n"));
    assert!(!tailwind.contains("--spacing-4:"));
}

#[test]
fn omits_tailwinds_own_default_breakpoints_keeping_only_the_additive_xs() {
    let tailwind = emit_tailwind(&breakpoint_tokens());

    assert_eq!(
        tailwind,
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/tests/golden/tailwind-breakpoints.css"
        ))
    );
}
