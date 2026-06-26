# `table` — registry entry

The artefacts `primitiv add table` resolves and copies into a consumer repo — the
styled surface over the headless `@primitiv-ui/react` `Table` plus its default
theme (RFC 0004 §3, RFC 0006 §6).

## Files

| File | Authored? | Role |
|---|---|---|
| `contract.json` | **authored** | The styling contract (RFC 0004 §3.4) — the single API source the recipe + wrapper are generated from. |
| `styles.css` | **authored** | The canonical default theme (the visual design). |
| `styles.scss` | generated | The canonical CSS re-expressed for SCSS consumers (from `styles.css`). |
| `table.recipe.ts` | generated | The `cva` recipes over the contract classes (from `contract.json`). |
| `table.tsx` | generated | The styled wrapper — one thin component per table part (from `contract.json`). |

Only `contract.json` (the API) and `styles.css` (the design) are **authored**;
the SCSS form, recipe and wrapper are **generated** by `primitiv-emit` and pinned
to their source by drift-guard tests, so they can't fall out of sync (D53).

## The contract (`contract.json`)

Table is a **structural** compound (like Tabs): the root plus eight
subcomponents — `head`, `body`, `footer`, `row`, `header`, `cell`, `caption`,
`scroll-area` — each generating its own thin wrapper the consumer composes
exactly like the headless API (D56).

- **`dataAttributes`** — empty on the root and every part, and asserted so against
  the rendered headless `Table` by a drift-guard test
  (`packages/react/src/Table/__tests__/Table.contract.test.tsx`). Table is a
  static layout component: it carries no state, so it emits no `data-*` (sort /
  row-state are design-guidance only — RFC 0014 §11).
- **`root` / `modifiers` / `customProperties`** — authored. The `.primitiv-table`
  root class with the `--xs…--xl` **size** modifier (the type scale), the part
  classes, and the `--primitiv-table-*` custom-property API.

## The default theme (`styles.css`)

Structured per RFC 0008 — the per-component API tokens + the resting look in
`primitiv.base`, the size modifiers in `primitiv.variants`, the hover/selected row
styling in `primitiv.states` (the sublayer order is declared once in the shared
token layer, so this file only re-opens the named sublayers). Collapsed rules,
body type, a raised header band with a strong underline, subtle row rules, and a
hover/selected row fill.

**Size is the type axis only.** `--xs…--xl` re-point the `--primitiv-table-font-*`
knobs to the matching `body/{size}` slot; **cell padding is density-driven** via
the `table/cell/padding-*` Context tokens, so it tracks `data-density`
independently of size (matching the Figma model — RFC 0014).

**Row hover/selected are styling hooks.** Hover is automatic; `selected` rides
`aria-selected="true"` on a `.primitiv-table__row` (the headless layer sets
neither). Row striping is left to the consumer (a fast-follow).

**It is yours to edit.** The stable surface is the *contract* (classes,
custom-property names), not these values (RFC 0006 Principle 2 — names are stable,
values are not). Requires the token layer (`primitiv tokens`) for the
`--primitiv-*` custom properties it resolves.

## The SCSS form (`styles.scss`)

CSS is canonical; SCSS is `styles.css` **verbatim** followed by one
`$primitiv-table-*` variable per `--primitiv-table-*` knob, each resolving to its
custom property. It is **derived, not hand-maintained**: `primitiv-emit`'s
`emit_component_scss` produces it from `styles.css`, and a drift-guard test
(`crates/primitiv-emit/src/scss_tests.rs`) asserts the committed file is exactly
that output.

## The styled surface (`table.recipe.ts` + `table.tsx`)

Both are **generated** from `contract.json` (RFC 0004 §3.5 / D53):

- **`table.recipe.ts`** — one [`class-variance-authority`](https://cva.style)
  recipe per part: a `table` recipe carrying the `size` variant, and a base-only
  `cva` for each subcomponent class.
- **`table.tsx`** — N thin per-part wrappers (`Table`, `TableHead`, `TableBody`,
  `TableFooter`, `TableRow`, `TableHeader`, `TableCell`, `TableScrollArea`,
  `TableCaption`), each applying its part class and forwarding the rest. The
  consumer composes them exactly like the headless API — there is no canonical
  subtree to auto-render (D56).

Drift guards in `crates/primitiv-emit/src/{recipe,wrapper}_tests.rs` assert each
committed artifact equals the generator's output for the committed contract.
