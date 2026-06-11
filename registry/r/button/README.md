# `button` — registry entry

The artefacts `primitiv add button` resolves and (soon) copies into a consumer
repo. This is the first component to land the **styling contract + default
theme** (RFC 0004 §3, RFC 0006 §6).

## Files

| File | Format | Role |
|---|---|---|
| `contract.json` | — | The styling contract (RFC 0004 §3.4) — the component's public styling API. |
| `styles.css` | css | The canonical default theme. |
| `styles.scss` | scss | _(next increment)_ |
| `tailwind/button.recipe.ts` | tailwind | _(next increment)_ |

## The contract (`contract.json`)

A **hybrid** document with two halves and two sources of truth (D15):

- **`dataAttributes`** — `source: "auto"`. Derived from and **asserted against
  the rendered headless `Button`** by a drift-guard test
  (`packages/react/src/Button/__tests__/Button.contract.test.tsx`), so it can
  never drift from what the component actually emits. Button emits exactly
  `data-disabled` (empty value, when `disabled`).
- **`root` / `modifiers` / `customProperties`** — authored alongside the
  stylesheet. These are styling conventions the headless layer does not emit:
  the `.primitiv-button` root class, the `--primary…--link` / `--xs…--xl`
  visual modifiers, and the `--primitiv-button-*` custom-property API.

## The default theme (`styles.css`)

Structured per RFC 0008 — the per-component API tokens + base rule in
`primitiv.base`, visual modifiers in `primitiv.variants`, `data-*` state styling
in `primitiv.states` (the sublayer order is declared once in the shared token
layer, so this file only re-opens the named sublayers). It wires
`--primitiv-button-*` to the synced theme tokens — `action/*` for colour,
`framed-control/*` for sizing, `label/*` for typography — and uses `text-box`
to trim the label's line-box leading for optical centring.

**It is yours to edit.** The stable surface is the *contract* (classes,
`data-*`, custom-property names), not these values (RFC 0006 Principle 2 — names
are stable, values are not). Requires the token layer (`primitiv tokens`) for
the `--primitiv-*` custom properties it resolves.
