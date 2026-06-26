# `divider` — registry entry

The artefacts `primitiv add divider` resolves and copies into a consumer repo —
the styled surface over the headless `@primitiv-ui/react` `Divider` plus its
default theme (RFC 0004 §3, RFC 0006 §6).

## Files

| File | Authored? | Role |
|---|---|---|
| `contract.json` | **authored** | The styling contract (RFC 0004 §3.4) — the single API source the recipe + wrapper are generated from. |
| `styles.css` | **authored** | The canonical default theme (the visual design). |
| `styles.scss` | generated | The canonical CSS re-expressed for SCSS consumers (from `styles.css`). |
| `divider.recipe.ts` | generated | The `cva` recipe over the contract class (from `contract.json`). |
| `divider.tsx` | generated | The styled `<Divider>` wrapper (from `contract.json`). |

Only `contract.json` (the API) and `styles.css` (the design) are **authored**;
the SCSS form, recipe and wrapper are **generated** by `primitiv-emit` and pinned
to their source by drift-guard tests, so they can't fall out of sync (D53).

## The contract (`contract.json`)

Divider is the simplest styled surface: a single element, **no modifiers**, and
**no `data-*`** surface.

- **`dataAttributes`** — empty, and asserted so against the rendered headless
  `Divider` by a drift-guard test
  (`packages/react/src/Divider/__tests__/Divider.contract.test.tsx`). The
  component carries its orientation on **`aria-orientation`** (an ARIA hook, not a
  `data-*`), and that same test pins it — the stylesheet's
  `[aria-orientation="…"]` selectors depend on it.
- **`root` / `customProperties`** — authored. The `.primitiv-divider` root class
  and the `--primitiv-divider-*` custom-property API (`color`, `thickness`,
  `spacing`). There are no modifier classes: the horizontal/vertical split rides
  the `aria-orientation` attribute the headless component already sets, so the
  recipe is a base-only `cva("primitiv-divider")` and the wrapper forwards
  `orientation` straight through.

## The default theme (`styles.css`)

Structured per RFC 0008 — the per-component API tokens + resting look in
`primitiv.base`, the orientation axis in `primitiv.variants` (the sublayer order
is declared once in the shared token layer, so this file only re-opens the named
sublayers). The line is painted as a `background-color` fill (so a `<span>` needs
no border reset); `aria-orientation` chooses the axis — a full-width hairline that
reserves block margin, or a full-height hairline that reserves inline margin and
flows inline. It wires `--primitiv-divider-*` to the synced theme tokens —
`border/subtle` for colour, `border-width/1` for thickness, `space/16` for
spacing.

**It is yours to edit.** The stable surface is the *contract* (the class,
`aria-orientation` hooks, custom-property names), not these values (RFC 0006
Principle 2 — names are stable, values are not). Requires the token layer
(`primitiv tokens`) for the `--primitiv-*` custom properties it resolves.

## The SCSS form (`styles.scss`)

CSS is canonical; SCSS is `styles.css` **verbatim** followed by one
`$primitiv-divider-*` variable per `--primitiv-divider-*` knob, each resolving to
its custom property. It is **derived, not hand-maintained**: `primitiv-emit`'s
`emit_component_scss` produces it from `styles.css`, and a drift-guard test
(`crates/primitiv-emit/src/scss_tests.rs`) asserts the committed file is exactly
that output.

## The styled surface (`divider.recipe.ts` + `divider.tsx`)

Both are **generated** from `contract.json` (RFC 0004 §3.5 / D53):

- **`divider.recipe.ts`** — a base-only [`class-variance-authority`](https://cva.style)
  recipe, `cva("primitiv-divider")`, since there are no modifier classes. It is
  the escape hatch for putting the class on a non-`Divider` element.
- **`divider.tsx`** — the `<Divider>` wrapper, carrying the component JSDoc and
  forwarding every headless prop (including `orientation`, which becomes
  `aria-orientation`) via `{...props}`.

Drift guards in `crates/primitiv-emit/src/{recipe,wrapper}_tests.rs` assert each
committed artifact equals the generator's output for the committed contract.
