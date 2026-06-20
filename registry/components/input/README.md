# `input` — registry entry

The artefacts `primitiv add input` resolves and copies into a consumer repo.
Input is the **text-field proof**: the first registry control whose styled
wrapper has to defend a modifier prop (`size`) against a *native* attribute of
the same name (`<input size>`, typed `number`).

## Files

| File | Authored? | Role |
|---|---|---|
| `contract.json` | **authored** | The styling contract (RFC 0004 §3.4) — the single API source the recipe + wrapper are generated from. |
| `styles.css` | **authored** | The canonical default theme (the visual design). |
| `styles.scss` | generated | The canonical CSS re-expressed for SCSS consumers (from `styles.css`). |
| `input.recipe.ts` | generated | The `cva` recipe over the contract's root class (from `contract.json`). |
| `input.tsx` | generated | The styled wrapper — the primary `<Input>` DX (from `contract.json`). |

Only `contract.json` (the API) and `styles.css` (the design) are **authored**;
the SCSS form, recipe and wrapper are **generated** by `primitiv-emit` and pinned
to their source by drift-guard tests, so they can't fall out of sync (D53).

## The contract (`contract.json`)

A **hybrid** document with two halves and two sources of truth (D15):

- **`dataAttributes`** — `source: "auto"`. Derived from and **asserted against
  the rendered headless `Input`** by a drift-guard test
  (`packages/react/src/Input/__tests__/Input.contract.test.tsx`), so it can never
  drift from what the component emits. Input emits a single data attribute:
  `data-disabled` (empty value, when `disabled`). Validity is an `aria-invalid`
  concern — set directly or cascaded from a `Field.Root` — not a `data-*`, so it
  is not part of the auto surface.
- **`root` / `modifiers` / `customProperties`** — authored. The `.primitiv-input`
  root class, the `size` modifier (`xs`–`xl`), and the `--primitiv-input-*`
  custom-property API are styling conventions the headless layer does not emit.

## The default theme (`styles.css`)

Structured per RFC 0008 — the per-component API tokens + resting look in
`primitiv.base`, the `size` modifiers in `primitiv.variants`, and the
focus / invalid / disabled styling in `primitiv.states`. It wires
`--primitiv-input-*` to the synced theme tokens — `framed-control/*` for the
frame anatomy (height, padding, radius — shared with Button), `surface/*` +
`border/*` + `content/*` for colour, and `body/*` for the typed text (a text
field reads as body copy, not a label).

On `:focus-visible` the border adopts `--primitiv-border-focus` and the **shared
two-layer focus ring** draws outside it — a `--primitiv-surface-default` gap band
then the `--primitiv-focus-ring` brand ring, the same ring every framed control
shows. An `[aria-invalid="true"]` field swaps the border to
`--primitiv-border-invalid`; `[data-disabled]` dims it.

**It is yours to edit.** The stable surface is the *contract* (classes,
`data-*`, custom-property names), not these values (RFC 0006 Principle 2 — names
are stable, values are not). Requires the token layer (`primitiv tokens`) for the
`--primitiv-*` custom properties it resolves.

## The SCSS form (`styles.scss`)

CSS is canonical; SCSS is the same stylesheet re-expressed for `$`-pipeline
consumers. Because SCSS is a strict superset of CSS, `styles.scss` is
`styles.css` **verbatim**, followed by one `$primitiv-input-*` variable per
`--primitiv-input-*` knob the stylesheet declares, each resolving to its custom
property. It is derived by `primitiv-emit`'s `emit_component_scss` and pinned by
a drift-guard test (`crates/primitiv-emit/src/scss_tests.rs`).

## The styled surface (`input.recipe.ts` + `input.tsx`)

The primary DX is the wrapper — a single `<Input>` over the headless
`@primitiv-ui/react` Input + the recipe. Both are **generated** from
`contract.json`:

- **`input.recipe.ts`** — a [`class-variance-authority`](https://cva.style)
  (cva) function mapping the `size` prop to the `primitiv-input--<size>`
  modifier class.
- **`input.tsx`** — the wrapper. Because the styled `size` prop shares its name
  with the native `<input size>` attribute (typed `number`), the props type
  **`DistributiveOmit`s** `size` from the primitive props before intersecting the
  `"xs" | … | "xl"` union in — a plain intersection would collapse `size` to
  `never`, and a non-distributive `Omit` would break the controlled /
  uncontrolled prop union on spread (D59). The omit is emitted automatically for
  every wrapper whose modifier prop names could shadow a native attribute.

Drift guards in `crates/primitiv-emit/src/{recipe,wrapper}_tests.rs` assert each
committed artifact equals the generator's output for the committed contract.
