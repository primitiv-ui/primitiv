# `switch` — registry entry

The artefacts `primitiv add switch` resolves and (soon) copies into a consumer
repo. Switch is the **state-driven proof** (RFC 0004 §3, RFC 0006 §6): the
deliberately-different second component that drives the generators past Button.
Where Button is modifier-driven and single-element, Switch is **state-driven**
(`data-state`), has a **part** (the thumb) and **no `variant`** — and flows
through the *same* `primitiv-emit` generators (D54).

## Files

| File | Authored? | Role |
|---|---|---|
| `contract.json` | **authored** | The styling contract (RFC 0004 §3.4) — the single API source the recipe + wrapper are generated from. |
| `styles.css` | **authored** | The canonical default theme (the visual design). |
| `styles.scss` | generated | The canonical CSS re-expressed for SCSS consumers (from `styles.css`). |
| `switch.recipe.ts` | generated | The `cva` recipe over the contract's root class (from `contract.json`). |
| `switch.tsx` | generated | The styled wrapper — the primary `<Switch>` DX (from `contract.json`). |

Only `contract.json` (the API) and `styles.css` (the design) are **authored**;
the SCSS form, recipe and wrapper are **generated** by `primitiv-emit` and pinned
to their source by drift-guard tests, so they can't fall out of sync (D53).

## The contract (`contract.json`)

A **hybrid** document with two halves and two sources of truth (D15):

- **`dataAttributes`** — `source: "auto"`. Derived from and **asserted against
  the rendered headless `Switch`** by a drift-guard test
  (`packages/react/src/Switch/__tests__/Switch.contract.test.tsx`), so it can
  never drift from what the component emits. The track emits `data-state` —
  `"checked"` or `"unchecked"`, always present — plus `data-disabled` (empty
  value, when `disabled`). (`data-state` is a best-effort mirror; the stylesheet
  keys the on/off look off the hidden input's native `:checked` instead.)
- **`root` / `parts` / `customProperties`** — authored. These are styling
  conventions the headless layer does not emit: the `.primitiv-switch` root
  class (the `<label>` track, wrapping a real hidden native
  `<input type="checkbox" role="switch">`), the `primitiv-switch__thumb` **part**
  (a decorative slot, named
  BEM-style off the root, D14), the `size` modifier axis, and the
  `--primitiv-switch-*` custom-property API. Switch's distinguishing trait is
  that it is **state-driven** (`data-state`, no `variant`/`intent` colour axis),
  which is what makes it the generators' state proof.

`parts` is what tells the wrapper generator this is a **compound with a
decorative slot**: instead of a single self-closing element, the wrapper renders
the Root and fills each slot, so the consumer writes one `<Switch>` and gets the
thumb for free. (Structural, consumer-composed parts — `Tabs.Trigger` — are a
separate concern, not modelled here.)

## The default theme (`styles.css`)

Structured per RFC 0008 — the per-component API tokens + resting look in
`primitiv.base`, the `size` re-pointing in `primitiv.variants`, and the checked /
focus / `data-disabled` styling in `primitiv.states` (the sublayer order is
declared once in the shared token layer, so this file only re-opens the named
sublayers). It wires `--primitiv-switch-*` to the synced theme tokens —
`switch/*` for the track/thumb anatomy, `action/*` + `surface/*` + `border/*` for
colour. The hidden
input is laid over the whole track (`appearance: none`, transparent) so it stays
the hit/focus target, and the **on/off look keys off its native `:checked`** (and
`:focus-visible` via `:has`) rather than the `data-state` mirror, so it survives a
form reset. The checked thumb travel is a `calc()` over the same anatomy knobs
(track width minus thumb minus a margin at each end), so a re-sized track stays
consistent.

On `:focus-visible` (keyboard focus only) the track draws the **shared two-layer
focus ring** — a `--primitiv-surface-default` gap band then the
`--primitiv-focus-ring` brand ring, stacked as `box-shadow`s so the ring follows
the track's pill radius. It is the same ring every framed control shows; restyle
it system-wide by overriding the `--primitiv-focus-ring`,
`--primitiv-focus-ring-width` and `--primitiv-focus-ring-offset` tokens.

**It is yours to edit.** The stable surface is the *contract* (classes,
`data-*`, custom-property names), not these values (RFC 0006 Principle 2 — names
are stable, values are not). Requires the token layer (`primitiv tokens`) for
the `--primitiv-*` custom properties it resolves.

## The SCSS form (`styles.scss`)

CSS is canonical; SCSS is the same stylesheet re-expressed for `$`-pipeline
consumers (D: "Registry CSS, derive rest"). Because SCSS is a strict superset of
CSS, `styles.scss` is `styles.css` **verbatim** — layers and all — followed by
one `$primitiv-switch-*` variable per `--primitiv-switch-*` knob the stylesheet
declares, each resolving to its custom property
(`$primitiv-switch-track-bg: var(--primitiv-switch-track-bg);` …). Override the
custom properties to re-skin; the `$`-vars are just the SCSS-side mirror.

It is **derived, not hand-maintained**: `primitiv-emit`'s `emit_component_scss`
produces it from `styles.css` — the *same* serialiser Button uses, proving it is
component-shape-agnostic — and a drift-guard test
(`crates/primitiv-emit/src/scss_tests.rs`) asserts the committed file is exactly
that output.

## The styled surface (`switch.recipe.ts` + `switch.tsx`)

The primary DX is the wrapper — a single `<Switch>` over the headless
`@primitiv-ui/react` Switch + the recipe (D51, shadcn parity). Both are
**generated** from `contract.json` (RFC 0004 §3.5 / D53):

- **`switch.recipe.ts`** — a [`class-variance-authority`](https://cva.style)
  (cva) function. With no modifiers, it is **base-only** — `cva("primitiv-switch")`
  — emitting just the root identity class the wrapper applies. (The recipe const
  is `switchRecipe`, not `switch`: `export const switch` is a JS syntax error, so
  a reserved-word name gets a `Recipe` suffix.)
- **`switch.tsx`** — the wrapper. Because there are no modifier props, the props
  type is a plain alias of the headless props (also sidestepping the union
  controlled/uncontrolled type that `interface extends` can't widen); the body
  renders `<SwitchPrimitive.Root>` and **auto-fills the thumb slot**
  (`<SwitchPrimitive.Thumb className="primitiv-switch__thumb" />`), so a consumer
  writes `<Switch checked onCheckedChange={…} />` and the thumb comes for free.

The **styled surface is format-independent** and gated by the **styles opt-in**,
not the format (D52/D55): any styled React consumer (css / scss / tailwind) gets
the same `<Switch>`; the format only selects which stylesheet defines the rules
behind the classes. A headless-only install gets neither. So
`class-variance-authority` is a **styled-surface** dependency (`registry.json` →
`styles.packages`), ensured whenever styles are added.

Drift guards in `crates/primitiv-emit/src/{recipe,wrapper}_tests.rs` assert each
committed artifact equals the generator's output for the committed contract.
