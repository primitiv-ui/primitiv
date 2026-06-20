# `input-group` — registry entry

The artefacts `primitiv add input-group` resolves and copies into a consumer
repo. InputGroup is the **adornment-frame proof**: a structural compound that
*owns the frame* and wraps an `Input` (or other framed control) with leading /
trailing slots for icons, prefixes, currency symbols, clear buttons, and
password-reveal toggles. It is also the first registry component with a real
**component dependency** — its default theme styles the nested `.primitiv-input`,
so `add input-group` pulls in `input` transitively.

## Files

| File | Authored? | Role |
|---|---|---|
| `contract.json` | **authored** | The styling contract (RFC 0004 §3.4) — the single API source the recipe + wrapper are generated from. |
| `styles.css` | **authored** | The canonical default theme (the visual design). |
| `styles.scss` | generated | The canonical CSS re-expressed for SCSS consumers (from `styles.css`). |
| `input-group.recipe.ts` | generated | The `cva` recipes — the sized root plus a base-only engine per adornment slot. |
| `input-group.tsx` | generated | The styled wrappers — `InputGroup`, `InputGroupLeadingAdornment`, `InputGroupTrailingAdornment`. |

Only `contract.json` (the API) and `styles.css` (the design) are **authored**;
the SCSS form, recipe and wrappers are **generated** by `primitiv-emit` and pinned
to their source by drift-guard tests, so they can't fall out of sync (D53).

## The contract (`contract.json`)

A **hybrid** document with two halves and two sources of truth (D15):

- **`dataAttributes`** — `source: "auto"`. Derived from and **asserted against
  the rendered headless `InputGroup.Root`** by a drift-guard test
  (`packages/react/src/InputGroup/__tests__/InputGroup.contract.test.tsx`). The
  root always carries `data-input-group`. The adornments' `data-*` hooks are not
  contracted — the stylesheet targets their part classes instead.
- **`root` / `modifiers` / `subcomponents` / `customProperties`** — authored. The
  `.primitiv-input-group` root + `__leading` / `__trailing` part classes, the
  `size` modifier (`xs`–`xl`), the adornment subcomponents, and the
  `--primitiv-input-group-*` custom-property API. The `size` modifier is a
  styling addition — the headless `InputGroup.Root` is a plain `<div>` with no
  size — so the wrapper `DistributiveOmit`s `size` before adding the union, even
  though a `<div>` has no native `size` to clash with.

## The default theme (`styles.css`)

Structured per RFC 0008 — the per-component API tokens + resting frame in
`primitiv.base`, the `size` modifiers in `primitiv.variants`, and the
focus / invalid / disabled styling in `primitiv.states`. The frame maps to the
same `framed-control/*` anatomy Button and Input use (height, padding-inline,
gap, icon-size, radius), so a group and a bare input at the same `size` line up.

**The group owns the frame; the nested Input surrenders its own.** The group
draws the border, background, radius, and the shared two-layer focus ring; the
Input inside is made frameless by **overriding its `--primitiv-input-*` knobs**
(transparent border / background, `auto` height, zero inline padding, inherited
typography) on the more-specific `.primitiv-input-group .primitiv-input`
selector. The two stylesheets cooperate through the Input's stable token
contract — no `!important`, no specificity battle (RFC 0006 Principle 2).

State is read straight off the wrapped control with **`:focus-within`** (the
ring) and **`:has()`** — `:has(input[aria-invalid="true"])` swaps the border to
the danger colour, `:has(input:disabled)` dims the frame — so the group needs no
prop and no JS to track the field's state.

**It is yours to edit.** The stable surface is the *contract* (classes,
`data-*`, custom-property names), not these values. Requires the token layer
(`primitiv tokens`) for the `--primitiv-*` custom properties it resolves.

## The SCSS form (`styles.scss`)

CSS is canonical; SCSS is `styles.css` **verbatim**, followed by one
`$primitiv-input-group-*` variable per `--primitiv-input-group-*` knob the
stylesheet declares. It is derived by `primitiv-emit`'s `emit_component_scss` and
pinned by a drift-guard test (`crates/primitiv-emit/src/scss_tests.rs`).

## The styled surface (`input-group.recipe.ts` + `input-group.tsx`)

A **structural compound** (D56): `InputGroup` (the sized `InputGroup.Root` frame)
plus `InputGroupLeadingAdornment` / `InputGroupTrailingAdornment`, each applying
its part class via `cva`. The consumer composes the adornments and the control in
the order they want — there is no auto-rendered subtree.

```tsx
<InputGroup size="md">
  <InputGroupLeadingAdornment>
    <SearchIcon aria-hidden="true" />
  </InputGroupLeadingAdornment>
  <Input aria-label="Search" type="search" />
  <InputGroupTrailingAdornment asChild>
    <button type="button" aria-label="Clear" onClick={clear}>
      <XIcon aria-hidden="true" />
    </button>
  </InputGroupTrailingAdornment>
</InputGroup>
```

Drift guards in `crates/primitiv-emit/src/{recipe,wrapper}_tests.rs` assert each
committed artifact equals the generator's output for the committed contract.
