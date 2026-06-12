# `button` — registry entry

The artefacts `primitiv add button` resolves and (soon) copies into a consumer
repo. This is the first component to land the **styling contract + default
theme** (RFC 0004 §3, RFC 0006 §6).

## Files

| File | Format | Role |
|---|---|---|
| `contract.json` | — | The styling contract (RFC 0004 §3.4) — the component's public styling API. |
| `styles.css` | css | The canonical default theme. |
| `styles.scss` | scss | The canonical CSS re-expressed for SCSS consumers (derived). |
| `tailwind/button.recipe.ts` | tailwind | A `cva` recipe over the contract classes (authored); rides on `styles.css`. |

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

## The SCSS form (`styles.scss`)

CSS is canonical; SCSS is the same stylesheet re-expressed for `$`-pipeline
consumers (D: "Registry CSS, derive rest"). Because SCSS is a strict superset of
CSS, `styles.scss` is `styles.css` **verbatim** — layers, `text-box` longhands
and all — followed by one `$primitiv-button-*` variable per `--primitiv-button-*`
knob the stylesheet declares, each resolving to its custom property
(`$primitiv-button-bg: var(--primitiv-button-bg);` …). Override the custom
properties to re-skin; the `$`-vars are just the SCSS-side mirror of the same
knobs.

It is **derived, not hand-maintained**: `primitiv-emit`'s `emit_component_scss`
produces it from `styles.css`, and a drift-guard test
(`crates/primitiv-emit/src/scss_tests.rs`) asserts the committed file is exactly
that output, so the two can't fall out of sync.

## The Tailwind recipe (`tailwind/button.recipe.ts`)

Tailwind is **authored, not derived** (RFC 0006 §6.1 — arbitrary CSS → utilities
is lossy). The recipe is a [`class-variance-authority`](https://cva.style) (cva)
function mapping the `intent` / `size` props to the contract's **modifier
classes** (`primitiv-button--primary`, `primitiv-button--md`, …) over the
`.primitiv-button` root — *not* Tailwind utilities. Button's design consumes
semantic tokens (`action/*`, `framed-control/*`, `label/*`) that fall outside
Tailwind v4's utility namespaces, and the knob seam / `text-box` trim / future
`@keyframes` have no utility form — so a utility recipe would be lossy
arbitrary-value soup. Keeping the styling in the contract CSS lets the visual
design round-trip perfectly.

Consequences (handled by `primitiv add button --format tailwind`):

- It ships **with `styles.css`** — the recipe applies classes whose rules live
  there; the `@theme` token preset (`primitiv tokens --format tailwind`) backs
  the custom properties those rules resolve.
- It installs **`class-variance-authority`** — declared as a Tailwind-format
  package in `registry.json` (`dependsOn.packagesByFormat.tailwind`), so the CSS
  consumer never gets it.

A drift-guard test
(`packages/react/src/Button/__tests__/Button.recipe.test.ts`) asserts the recipe
applies exactly the contract's root + modifier classes, so it can't drift from
`contract.json`.
