use std::collections::BTreeSet;

/// The `--primitiv-*` custom properties a stylesheet **reads**, as bare names
/// (`color-brand-600`, `action-primary-hover`).
///
/// Every occurrence is collected, including the component's own declarations
/// (`--primitiv-button-fg: ...`). Telling a read from a declaration by syntax
/// would need a CSS parser; the caller instead intersects this with the
/// vocabulary Primitiv's own layers supply, and a component-owned property is
/// not in it — so it drops out without either side having to reason about
/// `var()` nesting or the `:has()` and `@supports` blocks these sheets use.
pub fn referenced(css: &str) -> BTreeSet<String> {
    let mut names = BTreeSet::new();
    let mut rest = css;
    while let Some(at) = rest.find(PREFIX) {
        let tail = &rest[at + PREFIX.len()..];
        let end = tail
            .find(|c: char| !c.is_ascii_alphanumeric() && c != '-')
            .unwrap_or(tail.len());
        let name = tail[..end].trim_end_matches('-');
        if !name.is_empty() {
            names.insert(name.to_string());
        }
        rest = &tail[end..];
    }
    names
}

/// The prefix every token the design system emits carries.
const PREFIX: &str = "--primitiv-";
