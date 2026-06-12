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
