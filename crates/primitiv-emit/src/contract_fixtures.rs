//! Shared, pure-data synthetic contracts for the generator tests. The generators
//! are proven against *synthetic* shapes, never Button/Switch (D54), so the
//! emitter can't couple to a specific component. `DEMO_BOX` is the full case
//! (hyphenated name → casing, docs → `@see`, a `prop`-renamed group + a
//! default-prop group); `BARE` is the sparse case (single-word name, no docs).

/// Full synthetic contract — exercises the `prop` rename, multi-word name
/// casing, the docs `@see`, and a multi-group surface.
pub(crate) const DEMO_BOX: &str = r#"{
  "name": "demo-box",
  "description": "A demo box control.",
  "docs": "https://example.test/demo-box",
  "root": { "element": "button", "class": "primitiv-demo-box" },
  "modifiers": [
    {
      "name": "intent",
      "prop": "variant",
      "default": "primary",
      "description": "Visual intent.",
      "options": [
        { "name": "primary", "class": "primitiv-demo-box--primary", "description": "Primary action." },
        { "name": "ghost", "class": "primitiv-demo-box--ghost", "description": "Low-emphasis ghost." }
      ]
    },
    {
      "name": "size",
      "default": "md",
      "description": "Control size.",
      "options": [
        { "name": "sm", "class": "primitiv-demo-box--sm", "description": "Small." },
        { "name": "md", "class": "primitiv-demo-box--md", "description": "Medium." }
      ]
    }
  ]
}"#;

/// State-driven synthetic contract — the generality proof for a *parts-based,
/// no-modifier* component (Switch's shape without being Switch, D54). A root
/// plus one decorative slot part, no `variant` axis, docs present. Exercises the
/// recipe's base-only `cva` and the wrapper's compound auto-render + type-alias
/// props.
pub(crate) const DEMO_TOGGLE: &str = r#"{
  "name": "demo-toggle",
  "description": "A demo on/off toggle.",
  "docs": "https://example.test/demo-toggle",
  "root": { "element": "button", "class": "primitiv-demo-toggle" },
  "parts": [
    { "name": "thumb", "class": "primitiv-demo-toggle__thumb" }
  ]
}"#;

/// Structural synthetic contract — the generality proof for a *consumer-composed
/// compound* (Tabs' shape without being Tabs, D56/D54). A root with its own
/// modifier (`size`) plus two structural subcomponents: `bar` carries a per-part
/// modifier (`align`), `item` has none. Exercises the recipe's per-part `cva`
/// emission and the wrapper's N-thin-per-part composition.
pub(crate) const DEMO_VIEW: &str = r#"{
  "name": "demo-view",
  "description": "A demo composed view.",
  "docs": "https://example.test/demo-view",
  "root": { "element": "div", "class": "primitiv-demo-view", "component": "Root" },
  "modifiers": [
    {
      "name": "size",
      "default": "md",
      "description": "Control size.",
      "options": [
        { "name": "sm", "class": "primitiv-demo-view--sm", "description": "Small." },
        { "name": "md", "class": "primitiv-demo-view--md", "description": "Medium." }
      ]
    }
  ],
  "subcomponents": [
    {
      "name": "bar",
      "component": "Bar",
      "element": "div",
      "class": "primitiv-demo-view__bar",
      "modifiers": [
        {
          "name": "align",
          "default": "start",
          "description": "Alignment of the items.",
          "options": [
            { "name": "start", "class": "primitiv-demo-view__bar--start", "description": "Start." },
            { "name": "center", "class": "primitiv-demo-view__bar--center", "description": "Centre." },
            { "name": "end", "class": "primitiv-demo-view__bar--end", "description": "End." }
          ]
        }
      ]
    },
    {
      "name": "item",
      "component": "Item",
      "element": "button",
      "class": "primitiv-demo-view__item"
    }
  ]
}"#;

/// Labelled framed-control synthetic contract — the generality proof for the
/// inline-label decorative-slot shape (Radio/Checkbox/Switch without being any
/// of them, D54). `label: true` nests the parts inside a `…__control` box and
/// appends a `…__label` span fed by `children`; the `size` modifier proves the
/// children destructure rides alongside the variant props.
pub(crate) const DEMO_LABELLED: &str = r#"{
  "name": "demo-labelled",
  "description": "A demo labelled control.",
  "docs": "https://example.test/demo-labelled",
  "label": true,
  "root": { "element": "label", "class": "primitiv-demo-labelled" },
  "parts": [
    { "name": "indicator", "class": "primitiv-demo-labelled__indicator" }
  ],
  "modifiers": [
    {
      "name": "size",
      "default": "md",
      "description": "Control size.",
      "options": [
        { "name": "sm", "class": "primitiv-demo-labelled--sm", "description": "Small." },
        { "name": "md", "class": "primitiv-demo-labelled--md", "description": "Medium." }
      ]
    }
  ]
}"#;

/// Structural synthetic contract with a text-wrapping subcomponent — the
/// generality proof for a structural part that wraps its string/number
/// children in a `{class}-label` span (ToggleGroup.Item's shape without being
/// ToggleGroup, D54). Exercises the wrapper's per-part `wrapTextChildren` opt-in.
pub(crate) const DEMO_STRIP: &str = r#"{
  "name": "demo-strip",
  "description": "A demo segmented strip.",
  "root": { "element": "div", "class": "primitiv-demo-strip", "component": "Root" },
  "subcomponents": [
    {
      "name": "item",
      "component": "Item",
      "element": "button",
      "class": "primitiv-demo-strip__item",
      "wrapTextChildren": true
    }
  ]
}"#;

/// Structural synthetic contract with a *presentational* subcomponent — the
/// generality proof for a styling-only grouping part that renders a plain host
/// element (`div`) with the part class and no headless backing (the carousel's
/// `__controls` row). The subcomponent carries no `component`, so the wrapper
/// derives its props from the intrinsic element and renders a bare `<div>`.
pub(crate) const DEMO_GROUPED: &str = r#"{
  "name": "demo-grouped",
  "description": "A demo compound with a presentational group.",
  "root": { "element": "div", "class": "primitiv-demo-grouped", "component": "Root" },
  "subcomponents": [
    {
      "name": "controls",
      "element": "div",
      "class": "primitiv-demo-grouped__controls"
    }
  ]
}"#;

/// Sparse synthetic contract — single-word name, no docs, one group with no
/// `prop` (so the group key is the prop).
pub(crate) const BARE: &str = r#"{
  "name": "bare",
  "description": "A bare control.",
  "root": { "element": "button", "class": "primitiv-bare" },
  "modifiers": [
    {
      "name": "tone",
      "default": "neutral",
      "description": "Tone.",
      "options": [
        { "name": "neutral", "class": "primitiv-bare--neutral", "description": "Neutral." },
        { "name": "accent", "class": "primitiv-bare--accent", "description": "Accent." }
      ]
    }
  ]
}"#;
