# `field` — registry entry

The artefacts `primitiv add field` resolves and copies into a consumer repo.
Field is a **form-field wrapper**: a structural compound that owns the label,
helper text, and error message around a control (`Input`, a future `Textarea`, …).
It carries a **`size`** axis that scales its own label / helper typography and
stack gap (density scales each size further, ambiently). Field does **not**
cascade size to the control it wraps — the control carries its own `size`, so set
`size` on both and keep them matched (a single-prop cascade would need the
headless `Field` to distribute size through context; tracked as a future option).

## Files

| File | Authored? | Role |
|---|---|---|
| `contract.json` | **authored** | The styling contract (RFC 0004 §3.4) — the single API source the recipe + wrapper are generated from. |
| `styles.css` | **authored** | The canonical default theme (the visual design). |
| `styles.scss` | generated | The canonical CSS re-expressed for SCSS consumers (from `styles.css`). |
| `field.recipe.ts` | generated | The `cva` recipes — one base-only class engine per part (from `contract.json`). |
| `field.tsx` | generated | The styled wrappers — `Field`, `FieldLabel`, `FieldDescription`, `FieldErrorText` (from `contract.json`). |

Only `contract.json` (the API) and `styles.css` (the design) are **authored**;
the SCSS form, recipe and wrappers are **generated** by `primitiv-emit` and pinned
to their source by drift-guard tests, so they can't fall out of sync (D53).

## The contract (`contract.json`)

A **hybrid** document with two halves and two sources of truth (D15):

- **`dataAttributes`** — `source: "auto"`. Derived from and **asserted against
  the rendered headless `Field.Root`** by a drift-guard test
  (`packages/react/src/Field/__tests__/Field.contract.test.tsx`), so it can never
  drift. The root always carries `data-field`, plus `data-field-invalid` /
  `data-field-disabled` / `data-field-required` when the matching flag is set —
  the single selector hooks that let the stylesheet style the whole group.
- **`root` / `subcomponents` / `customProperties`** — authored. The
  `.primitiv-field` root + `__label` / `__description` / `__error` part classes,
  the structural subcomponents the consumer composes, and the `--primitiv-field-*`
  custom-property API are styling conventions the headless layer does not emit.
- **`modifiers`** — a single **`size`** modifier (`xs`–`xl`, default `md`) that
  re-points the label / helper typography + stack gap to the matching step.
  Density scales each size further via `[data-density]` (RFC 0009). Field does not
  cascade this to the wrapped control — that carries its own `size`.

## The default theme (`styles.css`)

Structured per RFC 0008 — the per-component API tokens + resting layout in
`primitiv.base`, the `size` classes in `primitiv.variants`, the required /
disabled styling in `primitiv.states`. The field is a vertical flex stack
(label, control, description, error) separated by one `--primitiv-field-gap`; the
label uses `label/*` typography, helper + error text use `body/*`, and colour
comes from `content/*` (`content-error` for the error and the required marker).

**Field does not style the control it wraps.** The control reads the
`aria-invalid` / `disabled` that `Field.Root` cascades through context and styles
its own invalid / disabled look — so the boundary stays clean and Field works
around any compatible control. A `[data-field-required]` label grows a trailing
marker; a `[data-field-disabled]` group dims.

**It is yours to edit.** The stable surface is the *contract* (classes,
`data-*`, custom-property names), not these values (RFC 0006 Principle 2). Requires
the token layer (`primitiv tokens`) for the `--primitiv-*` custom properties it
resolves.

## The SCSS form (`styles.scss`)

CSS is canonical; SCSS is `styles.css` **verbatim**, followed by one
`$primitiv-field-*` variable per `--primitiv-field-*` knob the stylesheet
declares. It is derived by `primitiv-emit`'s `emit_component_scss` and pinned by a
drift-guard test (`crates/primitiv-emit/src/scss_tests.rs`).

## The styled surface (`field.recipe.ts` + `field.tsx`)

A **structural compound** (D56): like Tabs, the wrapper is N thin per-part
wrappers the consumer composes — `Field` (the `Field.Root` provider + layout),
`FieldLabel`, `FieldDescription`, `FieldErrorText` — each applying its part class
via a base-only `cva`. There is no auto-rendered subtree: the consumer writes the
label / control / description / error in the order they want.

```tsx
<Field size="md">
  <FieldLabel>Email</FieldLabel>
  <Input type="email" size="md" required />
  <FieldDescription>We won't share it.</FieldDescription>
  <FieldErrorText>Enter a valid email.</FieldErrorText>
</Field>
```

Drift guards in `crates/primitiv-emit/src/{recipe,wrapper}_tests.rs` assert each
committed artifact equals the generator's output for the committed contract.
