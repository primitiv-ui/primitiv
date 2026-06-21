# `radio` — registry entry

The artefacts `primitiv add radio` resolves and copies into a consumer repo.
Radio is the **binary sibling of the checkbox**: it shares the same shape — a
`<label>` box root with one decorative **part** (the indicator) and a `size`
modifier axis — but drops the indeterminate state, so it exercises the *same*
`primitiv-emit` generators on a two-value control.

It styles the standalone headless `Radio` (`Radio.Root` + `Radio.Indicator`),
whose root is a `<label>` wrapping a **real, visually-hidden native
`<input type="radio">`**. The wrapper lays the root out as a **flex row**: the
hidden input, a `primitiv-radio__control` box holding the dot, and — when you
pass children — a `primitiv-radio__label` span beside it, so
`<Radio>Subscribe</Radio>` renders the label inline with the control. With no
children the row is just the box, so an `aria-label`-only radio still works.

That makes it a genuine form control: siblings sharing a `name` form a native
radio group (the browser enforces single-selection), and it submits with an
enclosing form. For a managed set with roving-tabindex keyboard navigation, the
headless `RadioGroup` is the primitive; this styled surface is the lone native
control you group yourself with `name`.

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
  (`packages/react/src/Radio/__tests__/Radio.contract.test.tsx`). The box emits
  `data-state` — `"checked"` or `"unchecked"`, always present — plus
  `data-disabled` (empty value, when `disabled`). No indeterminate. (`data-state`
  is a best-effort mirror; the stylesheet keys the *checked* look off the input's
  native `:checked` instead — see below.)
- **`root` / `parts` / `modifiers` / `customProperties`** — authored. The
  `.primitiv-radio` root class (the `<label>` row), the
  `primitiv-radio__indicator` **part** (a decorative slot, named BEM-style off
  the root, D14), and — emitted by the wrapper's `label: true` shape — the
  `primitiv-radio__control` box (which holds the indicator) and the
  `primitiv-radio__label` span (which holds the children). Plus the `size`
  modifier axis and the `--primitiv-radio-*` custom-property API (including the
  `--primitiv-radio-gap` control↔label gap and the `--primitiv-radio-label-*`
  type knobs).

## The default theme (`styles.css`)

Structured per RFC 0008 — the per-component API tokens + resting look in
`primitiv.base`, the `size` re-pointing in `primitiv.variants`, and the
`data-state` / focus / `data-disabled` styling in `primitiv.states`. It wires
`--primitiv-radio-*` to the synced theme tokens — `radio/*` for the box size (per
size, density-aware), with the radius and dot derived from it, plus `action/*` +
`surface/*` + `border/*` for colour.

The **indicator is the dot**: a `dot-size` circle filled with the current
colour, always in the DOM but `scale: 0` until the input is checked, when
`.primitiv-radio > input:checked ~ .primitiv-radio__control .primitiv-radio__indicator`
scales it to `1`. Keying the reveal — and the highlighted ring via
`.primitiv-radio > input:checked ~ .primitiv-radio__control` — off the input's
**native `:checked`** rather than the `data-state` mirror is deliberate: when the
browser silently deselects a grouped sibling (an event React never sees), the CSS
stays correct. **Unlike the checkbox, the box stays light when selected** — the
brand colour shows only as the centred dot and a highlighted ring, the convention
that keeps a radio visually distinct from a checkbox. The input is **visually
hidden** (the canonical sr-only clip) rather than overlaid — the `<label>` row is
itself the hit target — and on `:focus-visible` the **shared two-layer focus
ring** is drawn on the box via the sibling combinator
`> input:focus-visible ~ .primitiv-radio__control`. The `size` axis (with ambient
`[data-density]`) re-points the box size, the `--primitiv-radio-gap` and the
label type slot for each size — the radius (always a full circle,
`--primitiv-radii-full`) and the dot (half the box,
`calc(var(--primitiv-radio-size) / 2)`) derive from `--primitiv-radio-size`, so
they scale with size and density automatically. The `__label` text rides the
shared `--primitiv-label-*` scale, so it tracks size and density with the box.

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
  collapse to `never`); the body renders `<RadioPrimitive.Root>`, nests the
  indicator inside the `__control` box, and appends a `__label` span fed by
  `children` (omitted when there are none). A consumer writes
  `<Radio name="plan" value="pro">Pro</Radio>` and the dot, box and label all
  come for free.

Drift guards in `crates/primitiv-emit/src/{recipe,wrapper}_tests.rs` assert each
committed artifact equals the generator's output for the committed contract.
