//! Tailwind CSS project wiring (RFC 0005 §4.3 / RFC 0009 §4.2 / RFC 0008 §2.5).
//!
//! When a consumer adds a Tailwind-format component, two lines must appear
//! somewhere in their entry CSS before `@import "tailwindcss"` takes effect:
//!
//! 1. The `dark:` variant remap — keeps Tailwind's `dark:` utilities in lockstep
//!    with the `[data-theme="dark"]` scope (RFC 0009 §4.2).
//! 2. The layer-order statement — slots `primitiv` below utilities so a consumer's
//!    utility class still wins over a Primitiv variant class (RFC 0008 §2.5).
//!
//! This module provides the exact snippet bytes and the pure functions the `add`
//! command uses to detect and apply the patch.

/// The exact two-line wiring block `add` offers to prepend to the consumer's
/// Tailwind entry CSS (RFC 0005 §4.3). Both lines together form a single atomic
/// unit: the dark-variant remap (RFC 0009 §4.2) and the layer-order statement
/// (RFC 0008 §2.5).
pub const SNIPPET: &str = "\
@custom-variant dark (&:where([data-theme=\"dark\"], [data-theme=\"dark\"] *));\n\
@layer theme, base, components, primitiv, utilities;\
";

/// Returns `true` when both wiring lines are already present in `css`, making
/// the patch a no-op. Checks for substring presence — order and surrounding
/// context do not matter (the consumer may have arranged the lines differently).
pub fn contains_wiring(css: &str) -> bool {
    css.contains("@custom-variant dark") && css.contains("primitiv")
}

/// Prepend the [`SNIPPET`] block to `css`, separated by a blank line. When
/// `css` is empty the result is just the snippet followed by a newline. The
/// caller is responsible for writing the result back to disk.
pub fn patch(css: &str) -> String {
    if css.is_empty() {
        format!("{SNIPPET}\n")
    } else {
        format!("{SNIPPET}\n\n{css}")
    }
}
