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
  root class with the `--xs…--xl` **size** modifier (the type scale) and the
  **rows** modifier (`plain` / `striped`), the part classes, and the
  `--primitiv-table-*` custom-property API.

## The default theme (`styles.css`)

Structured per RFC 0008 — the per-component API tokens + the resting look in
`primitiv.base`, the size + rows modifiers in `primitiv.variants`, the hover/selected row
styling in `primitiv.states` (the sublayer order is declared once in the shared
token layer, so this file only re-opens the named sublayers). Collapsed rules,
body type, a header row set off by a strong underline (no fill band), subtle row
rules, and a hover/selected row fill.

**Size is the type axis only.** `--xs…--xl` re-point the `--primitiv-table-font-*`
knobs to the matching `body/{size}` slot; **cell padding is density-driven** via
the `table/cell/padding-*` Context tokens, so it tracks `data-density`
independently of size (matching the Figma model — RFC 0014).

**Row hover/selected are styling hooks.** Hover is automatic; `selected` rides
`aria-selected="true"` on a `.primitiv-table__row` (the headless layer sets
neither).

**Hover paints on the CELLS, selection on the ROW**, and swapping them breaks
things. `table/row/hover` is an alpha veil — it aliases the `neutral-alpha` ramp,
as `tree/row/hover` and `miller-columns/row/hover` do; an opaque neutral here was
as dark as `surface/sunken` and read as a selection rather than a hover. An alpha
value set as the *row's* `background-color` **replaces** the stripe instead of
sitting over it, so a striped row would lighten on hover — the wrong direction.
Cells paint above their row, so the same value on the cells composites over
whatever is behind: the stripe, the selected fill, or bare surface. Selection
stays on the row because it is opaque, needs no compositing, and shows through
every cell for free.

If you re-point `--primitiv-table-row-hover`, keep it **translucent**. An opaque
value will hide the stripe underneath it and look correct only on unstriped tables.

**The fill transitions**, via `--primitiv-table-transition-duration` /
`-easing` (150ms, the shared control duration), and is disabled under
`prefers-reduced-motion`. `background-color` is transitionable where a layered
`background-image` gradient would not have been — one of the reasons the state
layer is a cell background rather than a stacked gradient.

**`rows="striped"` is a table-level zebra.** Figma models striping as a per-row
`State=striped` alongside hover and selected, but on the web the idiomatic shape is
a `:nth-child(even)` banding driven from the table, so it's a `rows` prop rather
than something set on each row. `even` leaves the first body row unbanded, which
reads better immediately under the header rule.

It's a **variant, not a state**, and that placement is load-bearing: the rule sits
in `primitiv.variants` while hover and selected sit in the later
`primitiv.states`, so an even row that is hovered or selected shows the
interaction rather than the banding. Verified by measurement on a row that is
*both* even and `aria-selected` — the first attempt at that test used an odd row,
where the stripe rule never applies, and so proved nothing.

It's an enum rather than a boolean `striped` prop for a generator reason worth
knowing: `emit_part` writes `defaultVariants` values **quoted**, and a cva boolean
variant (keys `true`/`false`) needs an unquoted `false`, so the generator cannot
currently emit a valid boolean modifier. No generated component has one; the only
boolean modifier in the registry — `list`'s `indent` — lives in a hand-authored
recipe. Teaching `emit_part` to emit unquoted defaults for true/false options would
unblock a real `striped` boolean.

**Section rules differ per section, footer included.** Head gets `border/strong`
on its trailing edge, body gets `border/subtle`, and the **footer gets
`border/strong` on its *leading* edge with no trailing rule** — Figma draws nothing
below a footer. That last one was missing until it was measured: the Figma Row
frames carry no strokes at all, so the rule lives in a `Bottom Border` rectangle
whose constraint decides the edge, and only the footer's is pinned to
`vertical: MIN`. `Table.Footer` ships in the headless layer but isn't used in the
kitchen-sink, which is how an unstyled footer went unnoticed.

**Three Figma axes are still not implemented here.** Recorded so they aren't
mistaken for drift — and note the kitchen-sink demo already hand-rolls both with
local `ks-table__*` classes, so the need is proven and the styling exists in a form
that could be promoted into this component:

- **`Borders` (`none` / `horizontal` / `grid`)** — this build always draws
  horizontal rules and never vertical ones. `Cell.Right Border` is the grid half.
- **`Align` (`start` / `center` / `end`)** on cells and header cells — hardcoded
  `text-align: start` here. `end` is the numeric-column case.
- **`Sort` (`none` / `sortable` / `ascending` / `descending`)** on header cells,
  including an icon sized 0.8× the label (10/11/13/16/18 across xs–xl) and
  `content/muted` when merely sortable vs `content/primary` when active. This one
  needs headless work too (`aria-sort`, a focusable trigger), not just styling.

**Full width by default.** The root sets `inline-size: 100%`, so a table fills
its container rather than shrink-wrapping to content. Content wider than the
container still overflows into the optional `TableScrollArea` (capped at 100%,
scrolls) on narrow viewports instead of forcing the page wider; drop the width
override in your copy if you want a shrink-to-fit table.

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
  recipe per part: a `table` recipe carrying the `size` and `rows` variants, and a base-only
  `cva` for each subcomponent class.
- **`table.tsx`** — N thin per-part wrappers (`Table`, `TableHead`, `TableBody`,
  `TableFooter`, `TableRow`, `TableHeader`, `TableCell`, `TableScrollArea`,
  `TableCaption`), each applying its part class and forwarding the rest. The
  consumer composes them exactly like the headless API — there is no canonical
  subtree to auto-render (D56).

Drift guards in `crates/primitiv-emit/src/{recipe,wrapper}_tests.rs` assert each
committed artifact equals the generator's output for the committed contract.
