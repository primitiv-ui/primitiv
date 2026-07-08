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
    /// The decorative slot parts (`Switch.Thumb`), in authored order. Empty for a
    /// single-element component (Button); when present, the styled wrapper renders
    /// the compound and fills each slot. Distinct from [`subcomponents`](Self::subcomponents):
    /// a slot is auto-rendered into a fixed subtree, a subcomponent is composed by
    /// the consumer (D56).
    #[serde(default)]
    pub parts: Vec<Part>,
    /// The structural, consumer-composed subcomponents (`Tabs.List` / `.Trigger` /
    /// `.Content`), in authored order. Empty for a single-element or decorative-slot
    /// component; when present, the styled surface is N thin per-part wrappers the
    /// consumer composes (shadcn parity, D56).
    #[serde(default)]
    pub subcomponents: Vec<Subcomponent>,
    /// The visual modifier groups, in authored order.
    #[serde(default)]
    pub modifiers: Vec<ModifierGroup>,
    /// Whether the decorative-slot wrapper is a *framed control with an inline
    /// label*: a flex row that nests its parts inside a `…__control` box and
    /// appends a `…__label` span carrying the wrapper's `children` (Radio,
    /// Checkbox, Switch). `false` (the default) keeps the flat decorative-slot
    /// render (Switch's thumb-only shape). Only consulted when [`parts`](Self::parts)
    /// is non-empty.
    #[serde(default)]
    pub label: bool,
    /// Whether a *single-element* wrapper wraps its string/number children in a
    /// `…__label` span (element children — icons — pass through unwrapped). This
    /// lets `text-box-trim` sit on the label text rather than the flex container
    /// (Button). `false` (the default) keeps the plain self-closing render. Only
    /// consulted when [`parts`](Self::parts) is empty.
    #[serde(default, rename = "wrapTextChildren")]
    pub wrap_text_children: bool,
}

/// One structural, consumer-composed subcomponent of a compound (`Tabs.List`).
/// Unlike a decorative [`Part`], it is not auto-rendered: the styled surface emits
/// a thin wrapper the consumer places themselves, carrying its own BEM class and
/// optional per-part modifier groups (e.g. the list's `justify` axis, D56).
#[derive(Debug, Deserialize)]
pub struct Subcomponent {
    /// The part key (`list`), kebab-case for multi-word names.
    pub name: String,
    /// The headless sub-component this wraps (`List` → `Tabs.List`), or `None` for
    /// a **presentational** subcomponent — a styling-only grouping element that
    /// renders a plain host [`element`](Self::element) with the part class and no
    /// headless backing (the carousel's `__controls` row, which just groups the
    /// prev / dots / next in a flow line). The consumer still composes it.
    #[serde(default)]
    pub component: Option<String>,
    /// The host element a presentational subcomponent renders (`div`). Only
    /// consulted when [`component`](Self::component) is `None`; a headless-backed
    /// part renders `{Primitive}.{component}` and ignores this.
    #[serde(default)]
    pub element: Option<String>,
    /// The BEM part class the wrapper applies (`primitiv-tabs__list`).
    pub class: String,
    /// The part's own modifier groups, in authored order. Empty for a part with no
    /// visual variants (a trigger).
    #[serde(default)]
    pub modifiers: Vec<ModifierGroup>,
    /// Whether this subcomponent wraps its string/number children in a
    /// `{class}-label` span (element children — icons — pass through unwrapped),
    /// so `text-box-trim` can sit on the label rather than the flex part
    /// (ToggleGroup.Item). Mirrors [`Contract::wrap_text_children`] but scoped to
    /// one structural part. `false` (the default) keeps the plain self-closing
    /// render.
    #[serde(default, rename = "wrapTextChildren")]
    pub wrap_text_children: bool,
}

/// One decorative slot part — its sub-component name (`thumb` → `Switch.Thumb`)
/// and the BEM part class the wrapper applies (`primitiv-switch__thumb`).
#[derive(Debug, Deserialize)]
pub struct Part {
    pub name: String,
    pub class: String,
}

/// The contract's root element + identity class.
#[derive(Debug, Deserialize)]
pub struct Root {
    pub element: String,
    pub class: String,
    /// The headless sub-component the root wraps (`Root` → `Tabs.Root`) for a
    /// structural compound; `None` for a single-element or decorative-slot
    /// component, whose wrapper targets the primitive directly.
    #[serde(default)]
    pub component: Option<String>,
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

/// The recipe `const` binding for a structural subcomponent — the component's
/// camelCase name followed by the PascalCase part name (`tabs` + `list` →
/// `tabsList`). Shared by the recipe (the `export`) and the wrapper (the
/// `import`). The compound suffix can't collide with a JS reserved word, so no
/// disambiguation is needed (unlike the bare root [`recipe_binding`]).
pub(crate) fn subcomponent_binding(name: &str, part: &str) -> String {
    format!("{}{}", camel_case(name), pascal_case(part))
}

/// The PascalCase identifier for a structural subcomponent (`tabs` + `list` →
/// `TabsList`) — the styled wrapper's component / props / variants-type prefix.
pub(crate) fn subcomponent_pascal(name: &str, part: &str) -> String {
    format!("{}{}", pascal_case(name), pascal_case(part))
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
