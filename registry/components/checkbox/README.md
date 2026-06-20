# `checkbox` — registry entry

The artefacts `primitiv add checkbox` resolves and copies into a consumer repo.
Checkbox is a **tri-state framed control**: it shares the Switch shape — a
`data-state`-driven `<button>` root with one decorative **part** (the indicator)
— and adds back the `size` modifier axis, so the auto-rendered part and the
size-variant recipe appear together in the *same* `primitiv-emit` generators.

## Files

| File | Authored? | Role |
|---|---|---|
| `contract.json` | **authored** | The styling contract (RFC 0004 §3.4) — the single API source the recipe + wrapper are generated from. |
| `styles.css` | **authored** | The canonical default theme (the visual design). |
| `styles.scss` | generated | The canonical CSS re-expressed for SCSS consumers (from `styles.css`). |
| `checkbox.recipe.ts` | generated | The `cva` recipe over the contract's root + `size` classes (from `contract.json`). |
| `checkbox.tsx` | generated | The styled wrapper — the primary `<Checkbox>` DX (from `contract.json`). |

Only `contract.json` (the API) and `styles.css` (the design) are **authored**;
the SCSS form, recipe and wrapper are **generated** by `primitiv-emit` and pinned
to their source by drift-guard tests, so they can't fall out of sync (D53).

## The contract (`contract.json`)

A **hybrid** document with two halves and two sources of truth (D15):

- **`dataAttributes`** — `source: "auto"`. Derived from and **asserted against
  the rendered headless `Checkbox`** by a drift-guard test
  (`packages/react/src/Checkbox/__tests__/Checkbox.contract.test.tsx`). Checkbox
  emits `data-state` — `"checked"`, `"unchecked"` or `"indeterminate"`, always
  present — plus `data-disabled` (empty value, when `disabled`).
- **`root` / `parts` / `modifiers` / `customProperties`** — authored. The
  `.primitiv-checkbox` root class, the `primitiv-checkbox__indicator` **part** (a
  decorative slot, named BEM-style off the root, D14), the `size` modifier axis,
  and the `--primitiv-checkbox-*` custom-property API.

`parts` is what tells the wrapper generator this is a **compound with a
decorative slot**: the wrapper renders the Root and auto-fills the indicator, so
the consumer writes one `<Checkbox>` and gets the mark for free.

## The default theme (`styles.css`)

Structured per RFC 0008 — the per-component API tokens + resting look in
`primitiv.base`, the `size` re-pointing in `primitiv.variants`, and the
`data-state` / focus / `data-disabled` styling in `primitiv.states`. It wires
`--primitiv-checkbox-*` to the synced theme tokens — `checkbox/*` for the box and
mark anatomy, `action/*` + `surface/*` + `border/*` for colour.

The **indicator is the mark itself**: the headless layer mounts it only while
checked or indeterminate, so a `mark-size` square filled with the current colour
and `clip-path`-clipped to a tick is the whole indicator. The indeterminate state
re-clips the same square to a bar. On `:focus-visible` the box draws the **shared
two-layer focus ring** every framed control shows; restyle it system-wide by
overriding the `--primitiv-focus-ring*` and `--primitiv-surface-default` tokens.

**It is yours to edit.** The stable surface is the *contract* (classes, `data-*`,
custom-property names), not these values (RFC 0006 Principle 2 — names are stable,
values are not). Requires the token layer (`primitiv tokens`) for the
`--primitiv-*` custom properties it resolves.

## The SCSS form (`styles.scss`)

CSS is canonical; `styles.scss` is `styles.css` **verbatim** followed by one
`$primitiv-checkbox-*` variable per `--primitiv-checkbox-*` knob, each resolving
to its custom property. It is **derived, not hand-maintained**: `primitiv-emit`'s
`emit_component_scss` produces it from `styles.css`, and a drift-guard test
(`crates/primitiv-emit/src/scss_tests.rs`) asserts the committed file is exactly
that output.

## The styled surface (`checkbox.recipe.ts` + `checkbox.tsx`)

The primary DX is the wrapper — a single `<Checkbox size>` over the headless
`@primitiv-ui/react` Checkbox + the recipe (D51, shadcn parity). Both are
**generated** from `contract.json` (RFC 0004 §3.5 / D53):

- **`checkbox.recipe.ts`** — a [`class-variance-authority`](https://cva.style)
  function over the root class and the `size` variants, defaulting to `md`.
- **`checkbox.tsx`** — the wrapper. The `size` prop is `DistributiveOmit`-stripped
  from the headless props before the variant union is intersected in (so it can't
  collapse to `never`); the body renders `<CheckboxPrimitive.Root>` and auto-fills
  the indicator slot, so a consumer writes `<Checkbox checked onCheckedChange={…} />`
  and the mark comes for free.

Drift guards in `crates/primitiv-emit/src/{recipe,wrapper}_tests.rs` assert each
committed artifact equals the generator's output for the committed contract.
