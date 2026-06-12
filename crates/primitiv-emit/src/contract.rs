//! The styling-contract type (RFC 0004 §3.4) — the single authored API source a
//! component's consumer artifacts (recipe, wrapper) are generated from (D53).
//!
//! Only the fields the generators consume are modelled; the `data-*` and
//! custom-property halves of `contract.json` are read elsewhere, so this type
//! ignores them (serde drops unknown fields) and the document carries them
//! without this struct changing.

use serde::Deserialize;

/// A component's styling contract.
#[derive(Debug, Deserialize)]
pub struct Contract {
    /// The component name (`button`), kebab-case for multi-word names.
    pub name: String,
    /// One-line component summary — the wrapper's component-level JSDoc.
    pub description: String,
    /// Optional docs URL — emitted as a `@see` tag where present.
    #[serde(default)]
    pub docs: Option<String>,
    pub root: Root,
    /// The visual modifier groups, in authored order.
    #[serde(default)]
    pub modifiers: Vec<ModifierGroup>,
}

/// The contract's root element + identity class.
#[derive(Debug, Deserialize)]
pub struct Root {
    pub element: String,
    pub class: String,
}

/// One modifier group (`intent`, `size`) — a `variant`-style prop axis.
#[derive(Debug, Deserialize)]
pub struct ModifierGroup {
    /// The canonical design-system key (`intent`).
    pub name: String,
    /// The consumer-facing prop name (`variant`); defaults to [`name`](Self::name) (D52).
    #[serde(default)]
    pub prop: Option<String>,
    /// The option selected by the base rule when the prop is omitted.
    pub default: String,
    /// One-line group summary — the prop's JSDoc.
    pub description: String,
    /// The options, in authored order.
    pub options: Vec<ModifierOption>,
}

/// One option within a modifier group (`primary`) and the class it applies.
#[derive(Debug, Deserialize)]
pub struct ModifierOption {
    pub name: String,
    pub class: String,
    pub description: String,
}

impl Contract {
    /// Parse the bytes of a `contract.json` into the typed contract. A pure
    /// function — fetching the bytes lives behind the CLI's ports.
    pub fn parse(bytes: &[u8]) -> serde_json::Result<Contract> {
        serde_json::from_slice(bytes)
    }
}

impl ModifierGroup {
    /// The consumer-facing prop name: the authored `prop`, else the group key.
    pub fn prop(&self) -> &str {
        self.prop.as_deref().unwrap_or(&self.name)
    }
}

/// A kebab-case component name as a PascalCase identifier (`toggle-group` →
/// `ToggleGroup`) — the React component / type name.
pub(crate) fn pascal_case(name: &str) -> String {
    name.split('-').map(capitalize).collect()
}

/// A kebab-case component name as a camelCase identifier (`toggle-group` →
/// `toggleGroup`) — the recipe `const` / import binding.
pub(crate) fn camel_case(name: &str) -> String {
    let mut out = String::new();
    for (index, segment) in name.split('-').enumerate() {
        if index == 0 {
            out.push_str(segment);
        } else {
            out.push_str(&capitalize(segment));
        }
    }
    out
}

/// The recipe `const` binding for a component — its camelCase name, unless that
/// is a JS reserved word (`switch` → `export const switch` is a syntax error),
/// in which case a `Recipe` suffix disambiguates it (`switchRecipe`). Shared by
/// the recipe (the `export`) and the wrapper (the `import`).
pub(crate) fn recipe_binding(name: &str) -> String {
    let camel = camel_case(name);
    if is_reserved_word(&camel) {
        format!("{camel}Recipe")
    } else {
        camel
    }
}

/// Whether an identifier collides with a JS reserved word, so it can't be a bare
/// `const` binding. Only the subset a kebab-case component name could realistically
/// produce is listed — `switch` is the live case.
fn is_reserved_word(ident: &str) -> bool {
    matches!(
        ident,
        "switch" | "default" | "class" | "case" | "do" | "for" | "if" | "else" | "new" | "void"
    )
}

/// Uppercase the first character of a non-empty name segment.
fn capitalize(segment: &str) -> String {
    let mut chars = segment.chars();
    let first = chars.next().expect("name segment is non-empty");
    first.to_uppercase().collect::<String>() + chars.as_str()
}
