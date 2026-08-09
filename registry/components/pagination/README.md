# Pagination

Page navigation for a paged collection — a row of square page cells between
prev/next chevrons, or a compact "Page X of Y" readout. Long ranges collapse
behind an ellipsis that opens a menu of the hidden pages.

```sh
primitiv add pagination
```

Installs the `button` and `dropdown` components too — Pagination composes both
directly rather than restating their anatomy.

## Usage

```tsx
import { useState } from "react";
import { Pagination } from "@/components/pagination";

const [page, setPage] = useState(1);

<Pagination page={page} pageCount={20} onPageChange={setPage} />;
```

### With a summary and a jump-to-page control

`summary` fills the slot before the controls; `children` fills the one after.
Both are omitted entirely when not supplied — they map to the Figma set's
`Show summary` / `Show jump` booleans.

```tsx
<Pagination
  page={page}
  pageCount={20}
  onPageChange={setPage}
  summary={`Showing ${(page - 1) * 10 + 1}-${page * 10} of 200`}
>
  <label htmlFor="jump">Go to</label>
  <Select id="jump" value={String(page)} onValueChange={(v) => setPage(Number(v))}>
    {/* … */}
  </Select>
</Pagination>
```

### Compact

Drops the numbered cells for a readout — for narrow containers, and the
intended default for a data-table footer.

```tsx
<Pagination variant="compact" page={page} pageCount={20} onPageChange={setPage} />
```

### Controlling how much of the range shows

`siblingCount` sets how many pages flank the current one; `boundaryCount` how
many pin to each end.

```tsx
<Pagination page={50} pageCount={100} siblingCount={2} boundaryCount={1} />
// « 1 … 48 49 [50] 51 52 … 100 »
```

A gap of exactly one page renders as that page instead of an ellipsis: hiding a
single number behind a menu costs a click and saves no width, since the
ellipsis cell is the same size as the number it replaces.

## Props

| Prop | Type | Default | Notes |
|---|---|---|---|
| `page` | `number` | — | Current page, 1-based. Clamped to `1…pageCount`. |
| `pageCount` | `number` | — | Total pages. |
| `onPageChange` | `(page: number) => void` | — | Called with the requested page. |
| `variant` | `"numbered" \| "compact"` | `"numbered"` | |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl"` | `"md"` | |
| `siblingCount` | `number` | `1` | Pages either side of the current one. |
| `boundaryCount` | `number` | `1` | Pages pinned to each end. |
| `summary` | `ReactNode` | — | Slot before the controls. |
| `children` | `ReactNode` | — | Slot after the controls. |
| `label` | `string` | `"Pagination"` | The `<nav>`'s accessible name. |
| `previousLabel` / `nextLabel` | `string` | `"Go to previous page"` / `"Go to next page"` | |
| `pageLabel` | `(page: number) => string` | ``(n) => `Go to page ${n}` `` | |
| `moreLabel` | `string` | `"Show more pages"` | The ellipsis trigger's name. |

`paginationRange(page, pageCount, siblingCount, boundaryCount)` is exported too
— it is a pure function, so a different layout can reuse the arithmetic instead
of re-deriving it.

## Accessibility

- The root is a `<nav>` with an accessible name. **Give each Pagination on a
  page a distinct `label`** — two identically-named navigation landmarks are
  indistinguishable in a landmark list.
- Controls are a real `nav > ul > li` list, so assistive tech announces the
  range's length.
- The current page carries `aria-current="page"`. The stylesheet keys its
  styling off that same attribute rather than a parallel class, so the visual
  and the a11y tree cannot drift apart.
- Prev/next are `disabled` at the ends of the range; the current page cell is
  never disabled — it stays focusable so a keyboard user isn't stranded.
- The ellipsis is a real button (not a `…` glyph), so the collapsed pages stay
  reachable by keyboard and screen reader.

## Why there's no headless primitive

Pagination introduces no new ARIA pattern: every cell is a `Button`, the
overflow menu is a `Dropdown`, and each already owns its focus and keyboard
behaviour. What is left is arrangement plus `paginationRange`, a pure function
— so it ships as a registry leaf (RFC 0021).

`page` / `pageCount` / `onPageChange` being a real data model is deliberate and
not a break from `avatar-group` / `breadcrumb-overflow` taking children: those
would have had to model *content*. This models two integers.

## Custom properties

| Property | Default |
|---|---|
| `--primitiv-pagination-gap` | `var(--primitiv-pagination-md-gap)` |
| `--primitiv-pagination-item-min-inline-size` | `var(--primitiv-pagination-md-item-min-width)` |
| `--primitiv-pagination-group-gap` | `var(--primitiv-space-space-24)` |
| `--primitiv-pagination-menu-min-inline-size` | `var(--primitiv-pagination-md-item-min-width)` |

Page cells are square via **`min-inline-size`, not a fixed width** — so `1` and
`20` match, while a 4-digit page grows rather than clipping. Without the floor,
a cell's width tracks its digit count and the whole row visibly resizes and
re-centres each time the page number gains a digit (9 → 10 → 100).

The overflow menu re-points Dropdown's own `--primitiv-dropdown-min-inline-size`
down to the page-cell width. Dropdown's 12rem floor is sized for menu *labels*;
this menu holds page numbers, and 12rem leaves a large empty panel beside
"6 7 8 9". That override lives in the `primitiv.variants` layer — it must sit
after `primitiv.base`, where Dropdown declares the property, or which rule wins
would depend on stylesheet order.

## Files

| File | Purpose |
|---|---|
| `pagination.tsx` | The wrapper (hand-authored). |
| `pagination.recipe.ts` | `cva` recipe mapping props to modifier classes. |
| `styles.css` | Default theme. |
| `styles.scss` | The same, plus `$primitiv-*` aliases. |
| `contract.json` | Class/modifier/custom-property contract. |

## Dependencies

- [`button`](../button/README.md) — every cell, including prev/next and the
  ellipsis trigger.
- [`dropdown`](../dropdown/README.md) — the overflow menu.
- The token layer, for `pagination/*`, `space/*`, and the families those two
  components resolve.
