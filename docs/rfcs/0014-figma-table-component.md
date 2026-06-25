# RFC 0014 — Figma Table component build

> **Status:** Draft
> **Author:** simonrevill
> **Date:** 2026-06-25
> **Seeds from:** the 2026-06-25 Table planning session.
> **Relates to:** RFC 0012 (Figma web typography build) — this is checklist
> item #15, the last large prose component, and follows every convention set
> there; RFC 0002 (Harmoni → Intent → Plugin) — supplies the Intent colour
> aliases the new `table/*` tokens point at; RFC 0009 (mode scoping) — density
> is owned by the consuming frame, never baked into a variant. Skills:
> `figma-prose-component` (slot strategy, grid labels, example frame),
> `figma-variable-architecture` (Context/Intent token mechanics, the
> clone-and-rebind recipe), `figma-arrange-component-set` (grid layout +
> labels), `figma-component-descriptions` (the mandatory final step), `figma`
> (session setup / Desktop Bridge).

---

## 0. Summary

Primitiv's Figma typography library needs a **Table** — the one prose
component that is genuinely **two-dimensional**. Every other prose component
(List, DescriptionList, Blockquote, Pull quote, Code block) is a 1-D stack of
slots; a Table is a grid of rows × cells with header, body, and footer
sections, sortable column headers, and a handful of visual treatments
(striping, borders, alignment, row state).

This RFC records, for a future build session: the **component family** and how
it maps onto the headless React `Table`; every **variant axis** per set; how
the **sort affordance** is modelled; the **new `table/*` tokens** to create
(Context + Intent) with proposed values; the **top-level composed Table**; the
required **grid-labels** and **light/dark example** frames; and the
**decisions** taken in planning so they don't get re-litigated.

It does **not** change the React component — `@primitiv-ui/react`'s `Table` is
already built, headless, and shipped. The Figma build must stay faithful to its
sub-component surface (§1) but adds purely visual affordances (sort indicators,
row states) that the headless component leaves to the consumer.

---

## 1. Component family

**Decision (D1): a composed family + a top-level assembly**, not a monolith.
The React component is a compound of nine sub-components; Figma mirrors the
ones that carry visual design as **separate component sets**, then provides one
pre-composed **Table** that nests them. A monolithic single set was rejected
because cells would not be independently reusable and the column count would be
frozen per variant; a leaf-only build was rejected because designers need a
real drop-in table.

### React → Figma mapping

| React sub-component | Renders | Figma representation |
| --- | --- | --- |
| `Table.Root` | `<table>` | **Table** (top-level set) — the composed grid |
| `Table.Head` | `<thead>` | a **Row** instance, `Section=head` |
| `Table.Body` | `<tbody>` | the stack of body **Row** instances |
| `Table.Footer` | `<tfoot>` | a **Row** instance, `Section=footer` |
| `Table.Row` | `<tr>` | **Table / Row** (set) |
| `Table.Header` | `<th>` | **Table / Header Cell** (set) |
| `Table.Cell` | `<td>` | **Table / Cell** (set) |
| `Table.ScrollArea` | `<div>` | not a component — a documented wrapping frame with horizontal overflow (note in the Table description; nothing to bind) |
| `Table.Caption` | `<caption>` | a text node inside the top-level Table, gated by `Show Caption` + a `Caption Side` axis (§6) |

Four component sets get built: **Table / Cell**, **Table / Header Cell**,
**Table / Row**, and **Table** (top-level). All live on a new **Table** page in
the Figma file.

`<thead>`/`<tbody>`/`<tfoot>` are **not** their own sets — they are row
*sections*, expressed as the `Section` axis on **Table / Row**. This keeps the
family to the four sets that actually carry distinct design.

---

## 2. Conventions (inherited)

This build follows the established prose-component conventions verbatim — they
are not re-derived here, only pointers:

- **Inline font binding**, never a text style inside a component
  (`fontFamily`/`fontSize`/`lineHeight`/`fontStyle` via `setBoundVariable`).
- **Fill/stroke binding** to Intent variables via
  `figma.variables.createVariableAlias` — never a hardcoded RGB.
- **Density is frame-owned** — do **not** set explicit Context mode overrides
  on any variant (RFC 0009). The example frame (§7) sets density on its cells.
- **Ordering gotchas** (D7/D8 in RFC 0012): `resize()` before HUG/FILL sizing;
  `layoutSizingHorizontal/Vertical`, not `primaryAxisSizingMode`; FILL and
  `componentPropertyReferences` only **after** `appendChild`.
- **`createVariable` / collection lookup** uses the async API and the
  collection *node* (not the id string).
- **Naming**: `Axis=value, Axis=value` form sets `variantProperties`.
- **Build via clone-and-rebind** for the size cross-product
  (`figma-variable-architecture`), and lay out + label via
  `figma-arrange-component-set`.

---

## 3. Variant axes per set

The headless `Table.Header` carries `scope` (col/row/colgroup/rowgroup),
`colSpan`, `rowSpan`; `Table.Cell` carries `colSpan`/`rowSpan`. These are
**data-structure** props with no visual signature, so they are **not** Figma
axes — they are documented in the set descriptions and realised by a designer
resizing/spanning instances. Figma axes capture only what changes the rendering.

### 3.1 Table / Cell (`<td>`)

| Axis | Values | Drives |
| --- | --- | --- |
| `Size` | `xs · sm · md · lg · xl` | `body/{size}` type tokens on the text node |
| `Align` | `start · end` | `primaryAxisAlignItems` + text alignment |

**= 5 × 2 = 10 variants.** Plus one boolean property **`Right Border`**
(default `false`) — the vertical rule for grid mode (§3.5, D5). `center`
alignment is omitted as an axis (D6) and left to an instance override.

Structure: HORIZONTAL auto-layout, HUG height, FILL width when placed in a row;
padding bound to `table/cell/padding-*` (Context, §5.1). Text node: `body/{size}`,
`content/primary`, Asta Sans Regular.

### 3.2 Table / Header Cell (`<th>`)

| Axis | Values | Drives |
| --- | --- | --- |
| `Size` | `xs · sm · md · lg · xl` | `body/{size}` type tokens |
| `Align` | `start · end` | label + sort-icon group alignment |
| `Sort` | `none · sortable · ascending · descending` | the sort affordance (§4) |

**= 5 × 2 × 4 = 40 variants.** Plus the **`Right Border`** boolean (grid mode).

Structure: HORIZONTAL auto-layout (label + sort icon), HUG height, FILL width.
Header text is **SemiBold** — bind `fontFamily`/`fontSize`/`lineHeight` to
`body/{size}` but bind `fontStyle` to the **`font-style/semibold`** primitive
(the same trick `<dt>` uses, RFC 0012 D10) so it stays SemiBold across every
density. Fill `content/primary`. Header bottom rule uses `border/strong` (D5).

### 3.3 Table / Row (`<tr>`)

| Axis | Values | Drives |
| --- | --- | --- |
| `Section` | `head · body · footer` | bottom/top rule weight & colour, default fill |
| `State` | `default · striped · hover · selected` | row background fill |

Built as a **sparse set** — `head` and `footer` only exist at `State=default`;
`striped`/`hover`/`selected` exist for `body` only:

```
Section=head,   State=default
Section=footer, State=default
Section=body,   State=default
Section=body,   State=striped
Section=body,   State=hover
Section=body,   State=selected
```

**= 6 variants.** Plus a **`Bottom Border`** boolean (default `true`) — the
horizontal rule, turned off for `Borders=none` (§3.5).

Structure: HORIZONTAL auto-layout, FILL width, HUG height, `itemSpacing = 0`
(cells abut). Fills per State (§5.2). `head`/`footer` carry stronger rules:
`head` → bottom stroke `border/strong`; `footer` → top stroke `border/strong`;
`body` → bottom stroke `border/subtle` via the `Bottom Border` boolean.

### 3.4 Table (top-level, `<table>`)

| Axis | Values | Drives |
| --- | --- | --- |
| `Borders` | `none · horizontal · grid` | the nested rows'/cells' border booleans |

**= 3 variants** (fixed at **Size = md**; D2). Each variant is a full composed
demo table; the `Borders` axis flips the nested instances' `Bottom Border`
(rows) and `Right Border` (cells) booleans:

| Borders | Row `Bottom Border` | Cell `Right Border` |
| --- | --- | --- |
| `none` | false | false |
| `horizontal` | true | false |
| `grid` | true | true |

Plus boolean properties: **`Show Caption`**, **`Show Footer`**, and
**`Show Row 5`–`Show Row 8`** (rows 1–4 always visible; 5–8 collapse to zero
height when off — the standard prose 8-slot rule). And a **`Caption Side`**
axis-or-boolean for caption placement (§6).

### 3.5 Where borders live (D5)

Border *style* is a table-wide decision, so it is an axis on the **top-level
Table only**. The sub-components expose their strokes as cheap **boolean
properties** (`Bottom Border` on Row, `Right Border` on Cell) rather than
tripling their own variant counts. The top-level `Borders` variant sets those
booleans on every nested instance per the table above. Horizontal rules are the
row's bottom stroke; vertical rules are each cell's right stroke. The header's
emphasised underline (`border/strong`) is intrinsic to `Section=head` and is
present in `horizontal` and `grid`.

---

## 4. Sort affordance (D4)

**Decision: `Sort` is a first-class variant axis on Header Cell** (not a
boolean+swap, not a separate Sort Button). Sort direction is then directly
selectable from the variant panel, which is what a designer wants.

The affordance is an **instance of the Icon component**, size-matched to the
header's `Size`, trailing the label in the horizontal auto-layout (it leads /
the group right-aligns when `Align=end`). The required glyphs already exist in
the Icon set:

| `Sort` value | Icon | Icon fill | Meaning |
| --- | --- | --- | --- |
| `none` | — (no icon) | — | column is not sortable |
| `sortable` | `sort` | `content/muted` | sortable, currently unsorted |
| `ascending` | `chevron-up` | `content/primary` | sorted ascending |
| `descending` | `chevron-down` | `content/primary` | sorted descending |

The `sort` glyph (the dual up/down indicator) signals *sortability*; the single
chevrons signal the *active* direction. Icon size tracks the header `Size` —
use the matching Icon `size=` variant (the 5-size set). No new icon is needed.

**Contract note:** the headless React `Table` ships **no** sort logic — it is a
static layout component with no `data-state` (see its README "Styling hooks").
The sort affordance is therefore **Figma design guidance + a consumer
responsibility**, not a behaviour the code mirrors. The Table description must
say so, and point consumers at wiring `aria-sort` + a button in `<th>`
themselves.

---

## 5. Token additions

Two small namespaces. Reuse existing Intent borders (`border/subtle`,
`border/strong`) for rules — **no new border token** — and add only the cell
padding (Context) and the three row-state fills (Intent).

### 5.1 Context collection — `table/*` (density-scaling)

**Decision (D3): cell padding scales by density only, not by Size.** Following
the `code/padding` precedent: the `Size` axis changes type (and so row height
via line-height); padding is a density concern. One inline + one block value
per mode:

| Token | Dense | Compact | Comfortable | Spacious |
| --- | --- | --- | --- | --- |
| `table/cell/padding-inline` | `space-8` | `space-12` | `space-16` | `space-20` |
| `table/cell/padding-block` | `space-4` | `space-8` | `space-12` | `space-16` |

Bound to `paddingLeft`/`paddingRight` and `paddingTop`/`paddingBottom` on both
**Cell** and **Header Cell** (header reuses the same padding for now — if the
build wants taller headers later, add `table/header/padding-block`; deferred,
see §9). Back both up to `packages/tokens/src/context.json` under `table/cell`
in all four density mode sections. Record the resulting `VariableID`s here after
creation.

### 5.2 Intent collection — `table/*` (light/dark)

Three row-background fills. Each aliases a Primitives / Palette ramp step; the
palette's own Light/Dark modes do the inversion, so both Intent modes use the
same alias (the established pattern):

| Token | Light alias | Dark alias | Use |
| --- | --- | --- | --- |
| `table/row/stripe` | `color/neutral/50` | `color/neutral/900` | zebra fill (`State=striped`) |
| `table/row/hover` | `color/neutral/100` | `color/neutral/800` | hover fill (`State=hover`) |
| `table/row/selected` | `color/brand/100` | `color/brand/900` | selected fill (`State=selected`) |

These deliberately mirror `surface/raised` (stripe) and `surface/subtle`
(hover) today, but get **dedicated semantic names** so a theme can tune table
striping independently of raised surfaces. `table/row/selected` is a subtle
brand tint; text on a selected row stays `content/primary` (the tints are light
enough to keep contrast — verify in the example pass). Back all three up to
`packages/tokens/src/intent.json` in both `light` and `dark`, in deterministic
order (after the `list` block, before `border`, to match the transform).
Record `VariableID`s here after creation.

### 5.3 Reused (no new token)

| Need | Existing token |
| --- | --- |
| Horizontal/vertical rules (body, grid) | `border/subtle` |
| Header underline / footer top rule | `border/strong` |
| All text fills | `content/primary` (header/body), `content/secondary` (footer, optional) |
| Header bold | `font-style/semibold` primitive |
| Type scale | `body/{size}` Context tokens |

---

## 6. Top-level Table composition (D2)

**Decision: the top-level Table is a full demo table, fixed at Size = md**, with
`Borders` (§3.4) as its only variant axis. Other sizes come from swapping the
nested Cell/Header-Cell/Row instances to a different `Size` — building a full
`Size × Borders` grid of composed tables (15 large tables) is not worth the
weight when the sub-components already carry the size axis. (If a future session
disagrees, the alternative is a `Size × Borders` = 15-variant top-level set.)

Structure (VERTICAL auto-layout, HUG, `itemSpacing = 0`):

```
Table (Borders axis; Size=md fixed)
  ├─ Caption        text node — Show Caption bool; Caption Side = top|bottom
  ├─ Head           Row instance (Section=head)        — 4 Header Cells
  ├─ Row 1 … Row 4  Row instances (Section=body)       — 4 Cells each (always visible)
  ├─ Row 5 … Row 8  Row instances (Section=body)       — Show Row 5–8 booleans
  └─ Footer         Row instance (Section=footer)      — Show Footer bool
```

- **Column count: 4** in the demo (a balanced, legible default). Designers add
  columns by pasting cells into each row.
- **Caption** is a single text node (`body/sm`, `content/muted`) at the top or
  bottom of the stack. `Caption Side` reorders it (top = first child, bottom =
  last child). Model as a 2-value axis `Caption Side=top·bottom` **or** a
  `Caption Side` boolean — pick whichever reads better in the panel during the
  build; the React default is `captionSide="bottom"`, so default the Figma side
  to **bottom** to match.
- **Striping** in the demo: alternate the body rows' `State` between `default`
  and `striped` so the drop-in shows the zebra pattern immediately; a designer
  flips them back to `default` if unwanted.
- **`Show Row 5–8`** collapse to zero height when off (the prose 8-slot rule).
- The top-level Table is the **default instance** target — `insertChild(0, …)`
  the `Borders=horizontal` variant so it's the one Figma offers first.

**ScrollArea** is documented only: wrap the Table in a frame with horizontal
overflow for narrow viewports (it is an inline-style `<div>` in React, nothing
to bind). State this in the Table description.

---

## 7. Required page furniture

Per the prose-component definition of done, the Table page is not finished until
both of these exist (use `figma-arrange-component-set` for layout + labels):

### 7.1 Grid-labels groups

One `"<Set> Grid Labels"` group per set (Khand SemiBold 11px,
`content/primary` headers / `content/secondary` sub-labels):

- **Table / Cell** — column headers `xs…xl`; rotated `START` / `END` align row
  bands.
- **Table / Header Cell** — column headers `xs…xl`; rotated align bands; per-row
  `NONE / SORTABLE / ASC / DESC` sort labels.
- **Table / Row** — labels for the 6 sparse variants (`HEAD`, `FOOTER`,
  `BODY · DEFAULT/STRIPED/HOVER/SELECTED`).
- **Table** — `NONE / HORIZONTAL / GRID` border labels.

### 7.2 Light + Dark example frame

A `"Table Example"` frame below the sets: two rows (**LIGHT** / **DARK**) × four
density columns (**Dense / Compact / Comfortable / Spacious**). Intent mode set
on each row, Context mode on each cell, both via
`setExplicitVariableModeForCollection` (the collection *object*, not the id).
Representative instance: the top-level **Table**, `Borders=horizontal`, with a
couple of striped body rows and the footer shown — so the frame demonstrates
header underline, zebra, rules, and density scaling at a glance.

---

## 8. Decisions

### D1 — Composed family + top-level assembly
Four sets: **Table / Cell**, **Table / Header Cell**, **Table / Row**, **Table**.
`<thead>/<tbody>/<tfoot>` are the `Section` axis on Row, not their own sets.
Monolithic (cells not reusable, fixed columns) and leaf-only (no drop-in table)
both rejected. See §1.

### D2 — Top-level Table is Size=md, `Borders` is its only axis
A full `Size × Borders` grid of composed tables (15) is not worth the weight;
the sub-components carry the size axis and a designer swaps nested instances for
other sizes. See §6.

### D3 — Cell padding scales by density only (not Size)
Mirrors `code/padding`. The `Size` axis changes type; padding is a density
concern. Two Context tokens (`table/cell/padding-inline`, `padding-block`). See
§5.1. (Header reuses cell padding; a dedicated `table/header/padding-block` is
deferred.)

### D4 — Sort is a variant axis on Header Cell
`Sort=none·sortable·ascending·descending`, realised with the existing `sort` /
`chevron-up` / `chevron-down` Icon glyphs (muted when sortable, primary when
active). Boolean+swap and a separate Sort Button were rejected as making
direction a second-class state / decoupling it from the header layout.
**The headless React Table ships no sort logic** — this is Figma + consumer
responsibility, documented in the description. See §4.

### D5 — Border style lives on the top-level Table; sub-components use booleans
`Borders=none·horizontal·grid` on the Table flips `Bottom Border` (Row) and
`Right Border` (Cell) booleans on its nested instances, instead of tripling the
Row/Cell variant counts. Rules reuse `border/subtle`; the header underline /
footer top rule reuse `border/strong` — no new border token. See §3.5, §5.3.

### D6 — `Align` is `start·end` only; `center` via instance override
The dominant real need is right-aligning numeric columns; `center` is rare in
data tables and not worth doubling-again the Cell/Header-Cell variant counts.
Designers override `primaryAxisAlignItems` on an instance for the odd centred
column. See §3.1.

### D7 — Row `State` includes Figma-only `hover`/`selected`
The visual-treatment axes the design wants (striping, hover, selected) exceed
the headless component's contract — `Table` emits no `data-state`. `hover` and
`selected` are **Figma design guidance** for consumers who add interaction
themselves; they are not a behaviour the React component mirrors. Recorded so a
future session doesn't try to "sync" them back into the headless package. See
§3.3.

### D8 — Three new Intent row-fill tokens, reusing palette steps
`table/row/stripe` (neutral/50·900), `table/row/hover` (neutral/100·800),
`table/row/selected` (brand/100·900). Dedicated names (not reusing
`surface/raised`/`subtle`) so striping is independently themeable. See §5.2.

---

## 9. Build order & checklist

Build bottom-up so each set exists before the thing that nests it:

1. **Tokens first.** Create the two Context `table/cell/padding-*` and three
   Intent `table/row/*` variables (async API, all four / both modes). Back up to
   `context.json` + `intent.json`. Record VariableIDs in §5.
2. **Table / Cell** — 10 variants (Size × Align) + `Right Border` boolean. Grid
   labels.
3. **Table / Header Cell** — 40 variants (Size × Align × Sort) + `Right Border`
   boolean; sort Icon instances. Grid labels. (Clone-and-rebind across Size.)
4. **Table / Row** — 6 sparse variants (Section × State) + `Bottom Border`
   boolean; nests Cell / Header-Cell instances. Grid labels.
5. **Table** (top-level) — 3 `Borders` variants at Size=md; caption + head + 8
   body rows (Show Row 5–8) + footer (Show Footer) + Show Caption / Caption
   Side; nests Row instances and wires their border booleans. Grid labels.
6. **Table Example** frame — Light/Dark × four densities (§7.2).
7. **Descriptions** — write the `.description` on all four sets
   (`figma-component-descriptions`): what it is, axes & values, booleans,
   token bindings, the ScrollArea note, and the **sort/hover/selected =
   design-guidance-only** caveat (D4, D7).
8. **Close out** — back up any remaining variables; update RFC 0012's checklist
   row #15 to **Done**; tick the Table box in `ROADMAP.md` if listed; fill the
   VariableID tables in §5.

---

## 10. Deferred / open

- **`table/header/padding-block`** — a taller-header token, if reusing cell
  padding reads too tight in the example pass (D3).
- **`center` alignment as a variant** — only if numeric-vs-centred demand
  appears (D6); today it's an instance override.
- **Sticky header / frozen first column** — pure CSS/behaviour concerns with no
  Figma signature beyond the existing rows; out of scope here.
- **Selected-row contrast** — verify `content/primary` on `table/row/selected`
  passes contrast in both themes during the example pass; if not, add a
  `table/row/selected-foreground` alias.
- **INSTANCE_SWAP slots** — once the file is published to a team library, the
  Row/Cell nested instances can gain explicit INSTANCE_SWAP properties (blocked
  on local components today — RFC 0012 D11).
```
