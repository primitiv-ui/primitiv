# `button` — registry entry

The artefacts `primitiv add button` resolves and (soon) copies into a consumer
repo. This is the first component to land the **styling contract + default
theme** (RFC 0004 §3, RFC 0006 §6).

## Files

| File | Authored? | Role |
|---|---|---|
| `contract.json` | **authored** | The styling contract (RFC 0004 §3.4) — the single API source the recipe + wrapper are generated from. |
| `styles.css` | **authored** | The canonical default theme (the visual design). |
| `styles.scss` | generated | The canonical CSS re-expressed for SCSS consumers (from `styles.css`). |
| `button.recipe.ts` | generated | The `cva` recipe over the contract classes (from `contract.json`). |
| `button.tsx` | generated | The styled wrapper — the primary `<Button variant size>` DX (from `contract.json`). |

Only `contract.json` (the API) and `styles.css` (the design) are **authored**;
the SCSS form, recipe and wrapper are **generated** by `primitiv-emit` and pinned
to their source by drift-guard tests, so they can't fall out of sync (D53).

## The contract (`contract.json`)

A **hybrid** document with two halves and two sources of truth (D15):

- **`dataAttributes`** — `source: "auto"`. Derived from and **asserted against
  the rendered headless `Button`** by a drift-guard test
  (`packages/react/src/Button/__tests__/Button.contract.test.tsx`), so it can
  never drift from what the component actually emits. Button emits exactly
  `data-disabled` (empty value, when `disabled`).
- **`root` / `modifiers` / `customProperties`** — authored. These are styling
  conventions the headless layer does not emit: the `.primitiv-button` root
  class, the `--primary…--link` / `--xs…--xl` visual modifiers, and the
  `--primitiv-button-*` custom-property API. Each modifier group carries a
  `description`, a `default`, an optional `prop` (the consumer-facing prop name —
  `intent` surfaces as `variant`, D52) and `options` mapping each value to its
  `{ class, description }`. This richness is what lets the recipe + wrapper be
  **generated** from the contract (RFC 0004 §3.5).

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

## The styled surface (`button.recipe.ts` + `button.tsx`)

The primary DX is the wrapper — a typed `<Button variant size>` over the headless
`@primitiv-ui/react` Button + the recipe (D51, shadcn parity). Both are
**generated** from `contract.json` (RFC 0004 §3.5 / D53):

- **`button.recipe.ts`** — a [`class-variance-authority`](https://cva.style)
  (cva) function mapping the `variant` / `size` props to the contract's
  **modifier classes** (`primitiv-button--primary`, …) — *not* Tailwind
  utilities. The styling stays in `styles.css`, so the design round-trips
  perfectly (the `action/*` / `framed-control/*` / `label/*` semantic tokens fall
  outside Tailwind's utility namespaces, and the knob seam / `text-box` trim /
  future `@keyframes` have no utility form — a utility recipe would be lossy
  arbitrary-value soup). It is also the escape hatch for classes on a non-Button
  element (`<a className={button({ variant: "link" })}>`).
- **`button.tsx`** — the wrapper, carrying generated JSDoc (component summary +
  one documented prop per modifier group with its `@default` and `@see`; the
  headless props' JSDoc flows through via `extends`).

The **styled surface is format-independent** and gated by the **styles opt-in**,
not the format (D52/D55): any styled React consumer (css / scss / tailwind) gets
the same `<Button variant size>`; the format only selects which stylesheet
(`styles.css` / `styles.scss`) defines the rules behind the classes. A
headless-only install gets neither. So `class-variance-authority` is a
**styled-surface** dependency (`registry.json` → `styles.packages`), ensured
whenever styles are added — never for a headless-only install.

Drift guards in `crates/primitiv-emit/src/{recipe,wrapper}_tests.rs` assert each
committed artifact equals the generator's output for the committed contract.
