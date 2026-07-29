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
spans its container, or a full-height hairline that spans its flex row. It wires
`--primitiv-divider-*` to the synced theme tokens — `border/subtle` for colour,
`border-width/1` for thickness, `space/0` for spacing.

### It reserves no separation — the container owns the rhythm

`--primitiv-divider-spacing` defaults to **0**. Verified against the live Figma
file: the `Divider` component is a bare 1px rule with no margin or padding, and
every one of its ~30 instances across the layout mockups draws its separation
from the **parent auto-layout frame's `itemSpacing`** instead. That value is both
contextual and density-dependent — `0` in the Account Settings mockup (where the
neighbouring rows carry their own padding), `32` on Mobile (Compact), `48` on the
default article column, `56` on Spacious.

An earlier build baked `margin-block`/`margin-inline: space/16` into the
component. A margin on the component can express none of the above, and it
misbehaves three ways:

- **It double-spaces in gap-based containers.** Margins don't collapse in flex or
  grid, so the gap and the margin add. Measured in the kitchen-sink's own demo:
  a 16px section gap plus a 16px margin gave **32px** of separation.
- **It can't reach 0**, so the flush-divider layout Figma actually uses needs a
  per-instance override.
- **It can't track `[data-density]`**, because a raw `space/*` primitive is not
  density-scaled — so the one axis Figma varies was the one axis it pinned.

So the spacing knob is deliberately **neither `size`- nor density-scaled**, which
is the documented exception to the house rule that every spacing property scales
on both. There is no `size` axis on the Figma component to scale against, and the
axis that *is* density-dependent is the container's gap — which this component
does not own. Set the knob when you need reserved margin in a plain block-flow
context that has no gap of its own:

```css
.prose > .primitiv-divider { --primitiv-divider-spacing: var(--primitiv-space-space-48); }
```

### `display: inline-block` on the vertical rule is for inline flow only

The vertical variant declares `display: inline-block`, but a flex item is
blockified — so in the documented usage (inside a flex row) it computes to
`block`. Measured, not assumed. The declaration is kept for the inline-flow case,
where the rule sits between spans of text rather than between flex children.

### Thickness resolves through `border-width/1`, not Figma's `size/size-1`

Figma binds the rule's dimension to `size/size-1`; the stylesheet uses
`border-width/1`. Both are `0.0625rem` (1px), so there is **no visual drift** —
this is a token-family choice, kept because `border-width/*` is the family every
other hairline in the registry resolves through.

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
