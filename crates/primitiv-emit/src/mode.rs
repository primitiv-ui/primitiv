/// A mode axis (RFC 0009 §2.1). The two axes are orthogonal and each has its
/// own inheritable DOM attribute and resting default mode:
///
/// - `Theme` → `data-theme`, default `light`;
/// - `Density` → `data-density`, default `comfortable`.
pub enum Axis {
    Theme,
    Density,
}

impl Axis {
    /// The inheritable DOM attribute for this axis.
    fn attribute(&self) -> &'static str {
        match self {
            Axis::Theme => "data-theme",
            Axis::Density => "data-density",
        }
    }

    /// The resting default mode — the one that shares `:root`.
    pub fn default_mode(&self) -> &'static str {
        match self {
            Axis::Theme => "light",
            Axis::Density => "comfortable",
        }
    }
}

/// The CSS selectors for one mode's scope block (RFC 0009 §2.2). The axis's
/// default mode shares `:root` (`:root, [data-theme="light"]`); every other mode
/// emits as its own attribute selector (`[data-theme="dark"]`).
pub fn scope_selectors(axis: &Axis, mode: &str) -> Vec<String> {
    let scoped = format!("[{}=\"{}\"]", axis.attribute(), mode);
    if mode == axis.default_mode() {
        vec![":root".to_string(), scoped]
    } else {
        vec![scoped]
    }
}
