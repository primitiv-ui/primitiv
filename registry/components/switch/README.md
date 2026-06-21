# `switch` — registry entry

The artefacts `primitiv add switch` resolves and (soon) copies into a consumer
repo. Switch is the **state-driven proof** (RFC 0004 §3, RFC 0006 §6): the
deliberately-different second component that drives the generators past Button.
Where Button is modifier-driven and single-element, Switch is **state-driven**
(`data-state`), has a **part** (the thumb) and **no `variant`** — and flows
through the *same* `primitiv-emit` generators (D54).

The wrapper lays the root out as a **flex row**: the hidden input, a
`primitiv-switch__control` track holding the thumb, and — when you pass children —
a `primitiv-switch__label` span beside it, so `<Switch>Wi-Fi</Switch>` renders the
label inline. With no children the row is just the track, so an `aria-label`-only
switch still works.

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
  class (the `<label>` row, wrapping a real hidden native
  `<input type="checkbox" role="switch">`), the `primitiv-switch__thumb` **part**
  (a decorative slot, named BEM-style off the root, D14), and — emitted by the
  wrapper's `label: true` shape — the `primitiv-switch__control` track (which
  holds the thumb) and the `primitiv-switch__label` span (which holds the
  children). Plus the `size` modifier axis and the `--primitiv-switch-*`
  custom-property API (including the `--primitiv-switch-gap` control↔label gap and
  the `--primitiv-switch-label-*` type knobs). Switch's distinguishing trait is
  that it is **state-driven** (`data-state`, no `variant`/`intent` colour axis),
  which is what makes it the generators' state proof.

`parts` plus `label: true` is what tells the wrapper generator this is a **framed
control with an inline label**: instead of a single self-closing element, the
wrapper renders the Root, nests the thumb inside the `__control` track, and
appends a `__label` span from `children`, so the consumer writes one
`<Switch>Wi-Fi</Switch>` and gets the thumb, track and label for free.
(Structural, consumer-composed parts — `Tabs.Trigger` — are a separate concern,
not modelled here.)

## The default theme (`styles.css`)

Structured per RFC 0008 — the per-component API tokens + resting look in
`primitiv.base`, the `size` re-pointing in `primitiv.variants`, and the checked /
focus / `data-disabled` styling in `primitiv.states` (the sublayer order is
declared once in the shared token layer, so this file only re-opens the named
sublayers). It wires `--primitiv-switch-*` to the synced theme tokens —
`switch/*` for the track/thumb anatomy, `action/*` + `surface/*` + `border/*` for
colour. The input is **visually hidden** (the canonical sr-only clip) rather than
overlaid — the `<label>` row is itself the hit target — and the **on/off look
keys off its native `:checked`** via the sibling combinator
`> input:checked ~ .primitiv-switch__control` rather than the `data-state` mirror,
so it survives a form reset. The checked thumb travel is a `calc()` over the same
anatomy knobs (track width minus thumb minus a margin at each end), so a re-sized
track stays consistent. The `__label` text rides the shared `--primitiv-label-*`
scale, and the `size` axis re-points the track/thumb anatomy, the
`--primitiv-switch-gap` and the label type slot together.

On `:focus-visible` (keyboard focus only) the track draws the **shared two-layer
focus ring** — a `--primitiv-surface-default` gap band then the
`--primitiv-focus-ring` brand ring, stacked as `box-shadow`s so the ring follows
the track's pill radius, lifted onto the track via
`> input:focus-visible ~ .primitiv-switch__control`. It is the same ring every
framed control shows; restyle it system-wide by overriding the
`--primitiv-focus-ring`, `--primitiv-focus-ring-width` and
`--primitiv-focus-ring-offset` tokens.

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
  (cva) function over the root class and the `size` variants, defaulting to `md`.
  (The recipe const is `switchRecipe`, not `switch`: `export const switch` is a JS
  syntax error, so a reserved-word name gets a `Recipe` suffix.)
- **`switch.tsx`** — the wrapper. The `size` prop is `DistributiveOmit`-stripped
  from the headless props before the variant union is intersected in (so it can't
  collapse to `never`); the body renders `<SwitchPrimitive.Root>`, nests the thumb
  inside the `__control` track, and appends a `__label` span fed by `children`
  (omitted when there are none), so a consumer writes `<Switch>Wi-Fi</Switch>` and
  the thumb, track and label come for free.

The **styled surface is format-independent** and gated by the **styles opt-in**,
not the format (D52/D55): any styled React consumer (css / scss / tailwind) gets
the same `<Switch>`; the format only selects which stylesheet defines the rules
behind the classes. A headless-only install gets neither. So
`class-variance-authority` is a **styled-surface** dependency (`registry.json` →
`styles.packages`), ensured whenever styles are added.

Drift guards in `crates/primitiv-emit/src/{recipe,wrapper}_tests.rs` assert each
committed artifact equals the generator's output for the committed contract.
