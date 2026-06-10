/// A mode axis (RFC 0009 §2.1). The two axes are orthogonal and each has its
/// own inheritable DOM attribute and resting default mode:
///
/// - `Theme` → `data-theme`, default `light`;
/// - `Density` → `data-density`, default `comfortable`.
pub enum Axis {
    Theme,
    Density,
}

/// The CSS selectors for one mode's scope block (RFC 0009 §2.2). The axis's
/// default mode shares `:root` (`:root, [data-theme="light"]`); every other mode
/// emits as its own attribute selector (`[data-theme="dark"]`).
pub fn scope_selectors(axis: &Axis, mode: &str) -> Vec<String> {
    let (attribute, default_mode) = match axis {
        Axis::Theme => ("data-theme", "light"),
        Axis::Density => ("data-density", "comfortable"),
    };
    let scoped = format!("[{attribute}=\"{mode}\"]");
    if mode == default_mode {
        vec![":root".to_string(), scoped]
    } else {
        vec![scoped]
    }
}
