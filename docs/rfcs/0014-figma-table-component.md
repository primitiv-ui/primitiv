# RFC 0014 — Figma Table component build

> **Status:** Implemented (build landed 2026-06-25 — see §11)
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

**= 5 × 2 = 10 variants.** Plus two component properties: a **`Text`** TEXT
property bound to the cell's text node `characters` (§3.6, D9) and a
**`Right Border`** boolean (default `false`) — the vertical rule for grid mode
(§3.5, D5). `center` alignment is omitted as an axis (D6) and left to an
instance override.

Structure: HORIZONTAL auto-layout, HUG height, FILL width when placed in a row;
padding bound to `table/cell/padding-*` (Context, §5.1). Text node: `body/{size}`,
`content/primary`, Asta Sans Regular.

### 3.2 Table / Header Cell (`<th>`)

| Axis | Values | Drives |
| --- | --- | --- |
| `Size` | `xs · sm · md · lg · xl` | `body/{size}` type tokens |
| `Align` | `start · end` | label + sort-icon group alignment |
| `Sort` | `none · sortable · ascending · descending` | the sort affordance (§4) |

**= 5 × 2 × 4 = 40 variants.** Plus a **`Text`** TEXT property bound to the
label node `characters` (§3.6, D9) and the **`Right Border`** boolean (grid
mode).

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

Row has **no `Size` axis** — it is a container, not a sized control. Its height
follows the cells it holds; size comes from the nested Cell / Header Cell
instances (§6.1). Structure: HORIZONTAL auto-layout, FILL width, HUG height,
`itemSpacing = 0` (cells abut). Fills per State (§5.2). `head`/`footer` carry
stronger rules:
`head` → bottom stroke `border/strong`; `footer` → top stroke `border/strong`;
`body` → bottom stroke `border/subtle` via the `Bottom Border` boolean.

### 3.4 Table (top-level, `<table>`)

| Axis | Values | Drives |
| --- | --- | --- |
| `Size` | `xs · sm · md · lg · xl` | the `Size` of every nested Header Cell / Cell instance |
| `Borders` | `none · horizontal · grid` | the nested rows'/cells' border booleans |

**= 5 × 3 = 15 variants** (D2). Each variant is a full composed demo table. The
`Size` axis composes the matching-size sub-component variants (§6.1); the
`Borders` axis flips the nested instances' `Bottom Border` (rows) and
`Right Border` (cells) booleans:

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

### 3.6 Editable text (TEXT property) (D9)

Both **Cell** and **Header Cell** expose their text node as a **`Text` TEXT
component property** so a designer edits the instance label from the properties
panel without entering the instance. Without it, populating a table means
double-clicking into every nested cell — unworkable at table scale.

Mechanics (a per-variant binding, like the `Show Item N` booleans):

```js
// On each component (variant) in the set, after it is in the set:
const key = variant.addComponentProperty('Text', 'TEXT', 'Cell');  // default value
textNode.componentPropertyReferences = { characters: key };         // bind characters
```

The reference must be set **after** the node is a child of the component, and
the property is added **per variant** with the **same name** so Figma unifies it
across the set into a single `Text` field. Give a sensible default (`"Cell"` /
`"Header"`).

**Surfacing through the top-level Table:** a nested instance's TEXT property
appears on the parent Table instance's panel automatically (grouped under each
nested cell), so a designer fills the whole table from the top-level instance —
no need to select individual cells. This is the main reason `Text` is a real
component property and not just a free text node.

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
in all four density mode sections.

**Created `VariableID`s** (Context collection `VariableCollectionId:369:31958`):

| Token | `VariableID` |
| --- | --- |
| `table/cell/padding-inline` | `VariableID:604:9767` |
| `table/cell/padding-block` | `VariableID:604:9768` |

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

**Created `VariableID`s** (Intent collection `VariableCollectionId:346:4407`).
Following the established `surface/raised` pattern, each mode aliases a distinct
palette step (Light → low step, Dark → high step) resolved against the Light
palette; the example frames switch only the Intent mode:

| Token | `VariableID` | Light alias | Dark alias |
| --- | --- | --- | --- |
| `table/row/stripe` | `VariableID:604:9769` | `color/neutral/50` | `color/neutral/900` |
| `table/row/hover` | `VariableID:604:9770` | `color/neutral/100` | `color/neutral/800` |
| `table/row/selected` | `VariableID:604:9771` | `color/brand/100` | `color/brand/900` |

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

**Decision: the top-level Table carries the full `Size` (xs–xl) × `Borders`
(none/horizontal/grid) = 15-variant grid.** A true drop-in at every size,
consistent with the rest of the library — and a designer rescales a dropped-in
table with a single `Size` property change.

Structure (VERTICAL auto-layout, HUG, `itemSpacing = 0`):

```
Table (Size × Borders axes)
  ├─ Caption        text node — Show Caption bool; Caption Side = top|bottom
  ├─ Head           Row instance (Section=head)        — 4 Header Cells
  ├─ Row 1 … Row 4  Row instances (Section=body)       — 4 Cells each (always visible)
  ├─ Row 5 … Row 8  Row instances (Section=body)       — Show Row 5–8 booleans
  └─ Footer         Row instance (Section=footer)      — Show Footer bool
```

### 6.1 How the `Size` axis composes

Row is size-agnostic (§3.3), so size lives on the leaf cells. Each top-level
`Size` variant is the **same composition** with every nested Header Cell / Cell
instance's `Size` property set to that size — `Size=lg` Table → all cells
`Size=lg`. Because `Size` is a *variant* axis on the Table, switching a placed
instance's `Size` property swaps the whole subtree to the matching-size variant
in one move (Figma variant switching cascades to the baked-in nested overrides);
the consumer does not touch individual cells. No per-size token rebinding is
needed — each Cell `Size` variant already binds its own `body/{size}` type
tokens, so setting the nested instance's `Size` is enough.

Build economics: build the `Size=md` × 3 `Borders` tables first, then **clone
per size** and retarget the nested cells' `Size` property (and re-verify the
border booleans). 15 composed tables is the heaviest part of this build —
script it.

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
  the `Size=md, Borders=horizontal` variant so it's the one Figma offers first.

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
- **Table** — column headers `xs…xl`; rotated `NONE / HORIZONTAL / GRID` border
  bands.

### 7.2 Light + Dark example frame

A `"Table Example"` frame below the sets: two rows (**LIGHT** / **DARK**) × four
density columns (**Dense / Compact / Comfortable / Spacious**). Intent mode set
on each row, Context mode on each cell, both via
`setExplicitVariableModeForCollection` (the collection *object*, not the id).
Representative instance: the top-level **Table**, `Size=md, Borders=horizontal`, with a
couple of striped body rows and the footer shown — so the frame demonstrates
header underline, zebra, rules, and density scaling at a glance.

---

## 8. Decisions

### D1 — Composed family + top-level assembly
Four sets: **Table / Cell**, **Table / Header Cell**, **Table / Row**, **Table**.
`<thead>/<tbody>/<tfoot>` are the `Section` axis on Row, not their own sets.
Monolithic (cells not reusable, fixed columns) and leaf-only (no drop-in table)
both rejected. See §1.

### D2 — Top-level Table carries full Size × Borders (15 variants)
The top-level Table is built at every size so a dropped-in table rescales with a
single `Size` property change (the variant switch cascades to the nested cells).
Each `Size` variant composes the matching-size Cell / Header Cell variants; **Row
is size-agnostic** — a container whose height follows its cells. More build
effort than an md-only set (15 composed tables — script the clone-per-size), but
a true drop-in at every size, consistent with the rest of the library. See §6.

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

### D6 — `Align` is `start·center·end` (REVISED at build — center is a variant)
Originally `start·end` only, with `center` left to an instance override. **At
build time (2026-06-25) the human asked for a first-class `center` variant on
both Cell and Header Cell**, so `Align=center` is now a real axis value. This
makes Cell **5 × 3 = 15** variants and Header Cell **5 × 3 × 4 = 60** (see §11).
`center` drives `primaryAxisAlignItems=CENTER` + `textAlign=CENTER` (Header: the
label still FILLs and centres while the sort icon stays end-pinned, §11).

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

### D9 — Cell + Header Cell expose an editable `Text` property
Both leaf cells carry a `Text` TEXT component property bound to their text
node's `characters`, so designers populate cells from the instance panel (and
from the top-level Table) instead of double-clicking into each instance. Added
per variant with the same name so it unifies across the set. See §3.6.

**Correction (2026-06-26):** the original build claimed the cell `Text`
"surfaces automatically" on the top-level Table — it does **not**. Nested
instance properties only bubble up when the nested instance has
`isExposedInstance = true`, which the build never set. Fixed in a follow-up (see
§11) by exposing the Cell/Header-Cell instances inside the Row set **and** the
Row instances inside the Table set (exposure is per-level), and giving every
nested cell a positional name (`Header 1–4`, `Cell 1–4`) so the exposed panel is
navigable.

---

## 9. Build order & checklist

Build bottom-up so each set exists before the thing that nests it:

1. **Tokens first.** Create the two Context `table/cell/padding-*` and three
   Intent `table/row/*` variables (async API, all four / both modes). Back up to
   `context.json` + `intent.json`. Record VariableIDs in §5.
2. **Table / Cell** — 10 variants (Size × Align) + `Text` TEXT property + `Right
   Border` boolean. Grid labels.
3. **Table / Header Cell** — 40 variants (Size × Align × Sort) + `Text` TEXT
   property + `Right Border` boolean; sort Icon instances. Grid labels.
   (Clone-and-rebind across Size.)
4. **Table / Row** — 6 sparse variants (Section × State) + `Bottom Border`
   boolean; nests Cell / Header-Cell instances. Grid labels.
5. **Table** (top-level) — 15 variants (Size × Borders); caption + head + 8
   body rows (Show Row 5–8) + footer (Show Footer) + Show Caption / Caption
   Side; nests Row instances, sets each nested cell's `Size`, and wires the
   border booleans. Build the md × 3 first, then clone per size and retarget the
   nested cells' `Size` property (§6.1). Grid labels.
6. **Table Example** frame — Light/Dark × four densities (§7.2).
7. **Descriptions** — write the `.description` on all four sets
   (`figma-component-descriptions`): what it is, axes & values, the `Text` TEXT
   property (Cell / Header Cell), booleans, token bindings, the ScrollArea note,
   and the **sort/hover/selected = design-guidance-only** caveat (D4, D7).
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

---

## 11. Build outcome (landed 2026-06-25)

All four sets, both grid-label groups per set, and the Light/Dark example frame
live on the **Table** page. Node IDs:

| Set | Node ID | Variants |
| --- | --- | --- |
| Table / Cell | `604:9802` | 15 (Size × Align) |
| Table / Header Cell | `604:9991` | 60 (Size × Align × Sort) |
| Table / Row | `604:10228` | 6 (sparse Section × State) |
| Table (top-level) | `605:13524` | 15 (Size × Borders) |

Tokens created — Context `table/cell/padding-inline` `VariableID:604:9767`,
`padding-block` `604:9768`; Intent `table/row/stripe` `604:9769`, `hover`
`604:9770`, `selected` `604:9771` (backed up to `context.json` / `intent.json`).

**Deviations from the draft, all confirmed during the build:**

- **`Align=center` is a variant axis** on Cell and Header Cell (D6 revised —
  human request). Cell 15, Header Cell 60.
- **Sort icon = end-pinned + subordinate size.** The header label takes FILL
  width and aligns per `Align`; the sort Icon is **always pinned to the cell end
  (right edge)** — the common data-table header pattern — not interleaved with
  the label. It is sized to **~0.8× the label type** (`xs10 sm11 md13 lg16 xl18`),
  *not* the Icon set's native `size=` variant (which ran larger than the type).
  The icon is fixed-size (does not track density); it is tuned for the default
  Comfortable density shown in the grids.
- **Caption: `Show Caption` boolean only, bottom-placed.** D2 fixes the set at
  the 15 Size × Borders variants, so `Caption Side` is **not** a third axis (that
  would make 30) and a boolean can't reorder a child. The caption is a single
  bottom node (matching React `captionSide="bottom"`); a top caption is a manual
  layer reorder, documented in the Table description.
- **Right/Bottom borders are visibility-bound divider rectangles** (absolute,
  edge-pinned, STRETCH constraints), since a Figma BOOLEAN property toggles a
  node's `visible`, not a stroke weight. The top-level `Borders` axis sets these
  nested booleans per D5.

**Extra artifact (human request):** beyond the §7.2 Light/Dark example, a
**`Table Size × Density`** frame was added — Dense/Compact/Comfortable/Spacious
**columns** × xs–xl **rows**, each cell a full Table instance (Borders=horizontal,
**un-striped** per request) — so size scaling and density scaling read together in
one matrix. The §7.2 Light/Dark example keeps its alternating stripe per the RFC.

**Verification (per §5.2 / §10):** dark-mode row striping is **subtle** —
`table/row/stripe`'s dark alias `color/neutral/900` resolves very close to the
black `surface/default` (exactly mirroring `surface/raised`, by design). It is
visible on inspection but low-contrast in dark; if stronger dark striping is
wanted later, retune the dark alias (e.g. `neutral/800`) — deferred, not a build
defect. The throwaway-instance test (all booleans toggled on at `Size=lg,
Borders=grid`) confirmed caption, footer, and rows 5–8 all surface correctly.

**Post-build update (2026-06-26) — nested cell `Text` now actually surfaces (D9).**
The original build did not expose the nested instances, so D9's "populate from
the top-level Table" never worked — the cells' `Text` stayed buried. Fixed by
setting `isExposedInstance = true` on the Cell/Header-Cell instances in the
**Table / Row** set (24) and on the Row instances in the **Table** set (150),
and naming every nested cell positionally (`Header 1–4` in the head row, `Cell
1–4` elsewhere; 600 renames across the 15 variants) so the exposed panel reads
as `Head → Header 1–4`, `Row N → Cell 1–4`, `Footer → Cell 1–4`. Verified by
editing a cell's `Text` on a throwaway top-level instance. (Figma exposure is
per-level and all-or-nothing — caption `Align`/`Size`/`Sort` surface alongside
`Text`; see the `figma-prose-component` skill "Nested instance properties don't
bubble up unless exposed".)
```
