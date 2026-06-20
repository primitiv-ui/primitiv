# `radio` — registry entry

The artefacts `primitiv add radio` resolves and copies into a consumer repo.
Radio is the **binary sibling of the checkbox**: it shares the same shape — a
`data-state`-driven `<button>` root with one decorative **part** (the
indicator) and a `size` modifier axis — but drops the indeterminate state, so it
exercises the *same* `primitiv-emit` generators on a two-value control.

It styles the standalone headless `Radio` (`Radio.Root` + `Radio.Indicator`).
For a managed set with roving-tabindex keyboard navigation, the headless
`RadioGroup` is the primitive; this styled surface is the lone control you group
yourself.

## Files

| File | Authored? | Role |
|---|---|---|
| `contract.json` | **authored** | The styling contract (RFC 0004 §3.4) — the single API source the recipe + wrapper are generated from. |
| `styles.css` | **authored** | The canonical default theme (the visual design). |
| `styles.scss` | generated | The canonical CSS re-expressed for SCSS consumers (from `styles.css`). |
| `radio.recipe.ts` | generated | The `cva` recipe over the contract's root + `size` classes (from `contract.json`). |
| `radio.tsx` | generated | The styled wrapper — the primary `<Radio>` DX (from `contract.json`). |

Only `contract.json` (the API) and `styles.css` (the design) are **authored**;
the SCSS form, recipe and wrapper are **generated** by `primitiv-emit` and pinned
to their source by drift-guard tests, so they can't fall out of sync (D53).

## The contract (`contract.json`)

A **hybrid** document with two halves and two sources of truth (D15):

- **`dataAttributes`** — `source: "auto"`. Derived from and **asserted against
  the rendered headless `Radio`** by a drift-guard test
  (`packages/react/src/Radio/__tests__/Radio.contract.test.tsx`). Radio emits
  `data-state` — `"checked"` or `"unchecked"`, always present — plus
  `data-disabled` (empty value, when `disabled`). No indeterminate.
- **`root` / `parts` / `modifiers` / `customProperties`** — authored. The
  `.primitiv-radio` root class, the `primitiv-radio__indicator` **part** (a
  decorative slot, named BEM-style off the root, D14), the `size` modifier axis,
  and the `--primitiv-radio-*` custom-property API.

## The default theme (`styles.css`)

Structured per RFC 0008 — the per-component API tokens + resting look in
`primitiv.base`, the `size` re-pointing in `primitiv.variants`, and the
`data-state` / focus / `data-disabled` styling in `primitiv.states`. It wires
`--primitiv-radio-*` to the synced theme tokens — `radio/*` for the box and dot
anatomy (per size, density-aware), `action/*` + `surface/*` + `border/*` for
colour.

The **indicator is the dot**: the headless layer mounts it only while selected,
so a `dot-size` circle filled with the current colour is the whole indicator.
**Unlike the checkbox, the box stays light when selected** — the brand colour
shows only as the centred dot and a highlighted ring, the convention that keeps a
radio visually distinct from a checkbox. On `:focus-visible` the box draws the
**shared two-layer focus ring** every framed control shows; the `size` axis (with
ambient `[data-density]`) scales the box, dot and radius together by re-pointing
the anatomy knobs to each size's token slot.

**It is yours to edit.** The stable surface is the *contract* (classes, `data-*`,
custom-property names), not these values (RFC 0006 Principle 2 — names are stable,
values are not). Requires the token layer (`primitiv tokens`) for the
`--primitiv-*` custom properties it resolves.

## The SCSS form (`styles.scss`)

CSS is canonical; `styles.scss` is `styles.css` **verbatim** followed by one
`$primitiv-radio-*` variable per `--primitiv-radio-*` knob, each resolving to its
custom property. It is **derived, not hand-maintained**: `primitiv-emit`'s
`emit_component_scss` produces it from `styles.css`, and a drift-guard test
(`crates/primitiv-emit/src/scss_tests.rs`) asserts the committed file is exactly
that output.

## The styled surface (`radio.recipe.ts` + `radio.tsx`)

The primary DX is the wrapper — a single `<Radio size>` over the headless
`@primitiv-ui/react` Radio + the recipe (D51, shadcn parity). Both are
**generated** from `contract.json` (RFC 0004 §3.5 / D53):

- **`radio.recipe.ts`** — a [`class-variance-authority`](https://cva.style)
  function over the root class and the `size` variants, defaulting to `md`.
- **`radio.tsx`** — the wrapper. The `size` prop is `DistributiveOmit`-stripped
  from the headless props before the variant union is intersected in (so it can't
  collapse to `never`); the body renders `<RadioPrimitive.Root>` and auto-fills
  the indicator slot, so a consumer writes `<Radio checked onCheckedChange={…} />`
  and the dot comes for free.

Drift guards in `crates/primitiv-emit/src/{recipe,wrapper}_tests.rs` assert each
committed artifact equals the generator's output for the committed contract.
