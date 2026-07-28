# `textarea` — registry entry

The artefacts `primitiv add textarea` resolves and copies into a consumer
repo. Textarea is the multi-line sibling of `input` — same framed-field
treatment, minus the fixed single-line height.

## Files

| File | Authored? | Role |
|---|---|---|
| `contract.json` | **authored** | The styling contract (RFC 0004 §3.4) — the single API source the recipe + wrapper are generated from. |
| `styles.css` | **authored** | The canonical default theme (the visual design). |
| `styles.scss` | generated | The canonical CSS re-expressed for SCSS consumers (from `styles.css`). |
| `textarea.recipe.ts` | generated | The `cva` recipe over the contract's root class (from `contract.json`). |
| `textarea.tsx` | generated | The styled wrapper — the primary `<Textarea>` DX (from `contract.json`). |

Only `contract.json` (the API) and `styles.css` (the design) are **authored**;
the SCSS form, recipe and wrapper are **generated** by `primitiv-emit` and
pinned to their source by drift-guard tests, so they can't fall out of sync
(D53).

## What's different from `input`

- **`min-block-size`, not a fixed `block-size`** — content can grow a
  textarea taller, so its geometry comes from a dedicated
  `textarea/{size}/min-height` Context family rather than
  `framed-control/{size}/height`.
- **Real block padding** — a single-line input centres its text vertically
  via its fixed height; a textarea needs actual `padding-block`. Rather than
  inventing a second padding token family, it reuses
  `framed-control-{size}-padding-inline` for both axes (a uniform box
  padding).
- **`resize: vertical`** — the width already tracks the Field / form column,
  so free-axis resize would fight the layout; only the block axis is
  user-resizable.

Everything else — the `size` modifier, the focus/invalid/disabled states, the
`framed-control`/`surface`/`border`/`content`/`body` token wiring — mirrors
`input` exactly.

## Tokens

`--primitiv-textarea-*` wires to `framed-control/*` (padding + radius,
shared with Button/Input), the new-to-this-build `textarea/{size}/min-height`
Context family, `surface/*` + `border/*` + `content/*` for colour, and
`body/*` for the typed text. Requires the token layer (`primitiv tokens`).
