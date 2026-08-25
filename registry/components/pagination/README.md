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

Pagination is a **compound**, like Breadcrumb and Select: you compose the row,
and [`usePagination`](https://primitiv-ui.dev/docs/hooks/use-pagination) supplies
the page state and arithmetic. That split is the point — the hook works against
any data source, and this styled row knows nothing about where the pages came
from.

```tsx
import { usePagination } from "@primitiv-ui/react";
import {
  Pagination,
  PaginationList,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
  PaginationMenuItem,
} from "@/components/pagination";

function Results({ rows }) {
  const { page, items, setPage, next, previous, canNext, canPrevious, startIndex, endIndex } =
    usePagination({ totalItems: rows.length, pageSize: 10 });

  return (
    <>
      <ul>{rows.slice(startIndex, endIndex).map(renderRow)}</ul>

      <Pagination label="Results">
        <PaginationList>
          <PaginationItem>
            <PaginationPrevious disabled={!canPrevious} onClick={previous} />
          </PaginationItem>

          {items.map((item, i) =>
            item.type === "page" ? (
              <PaginationItem key={`page-${item.page}`}>
                <PaginationLink isActive={item.page === page} onClick={() => setPage(item.page)}>
                  {item.page}
                </PaginationLink>
              </PaginationItem>
            ) : (
              <PaginationItem key={`gap-${i}`}>
                <PaginationEllipsis>
                  {item.pages.map((hidden) => (
                    <PaginationMenuItem key={hidden} onSelect={() => setPage(hidden)}>
                      {hidden}
                    </PaginationMenuItem>
                  ))}
                </PaginationEllipsis>
              </PaginationItem>
            ),
          )}

          <PaginationItem>
            <PaginationNext disabled={!canNext} onClick={next} />
          </PaginationItem>
        </PaginationList>
      </Pagination>
    </>
  );
}
```

### Summary and jump-to-page slots

`PaginationSummary` sits before the controls, `PaginationTrailing` after. Both
are ordinary children — omit them and nothing renders. They map to the Figma
set's `Show summary` / `Show jump` booleans.

```tsx
<Pagination label="Results">
  <PaginationSummary>
    Showing {startIndex + 1}-{endIndex} of {totalItems}
  </PaginationSummary>
  <PaginationList>{/* ... */}</PaginationList>
  <PaginationTrailing>
    <span>Go to</span>
    <Select native value={String(page)} onValueChange={(v) => setPage(Number(v))}>
      {/* ... */}
    </Select>
  </PaginationTrailing>
</Pagination>
```

### Compact

Drops the numbered cells for a `PaginationStatus` readout — for narrow
containers, and the intended default for a data-table footer.

```tsx
<Pagination variant="compact" label="Results">
  <PaginationList>
    <PaginationItem>
      <PaginationPrevious disabled={!canPrevious} onClick={previous} />
    </PaginationItem>
    <PaginationItem>
      <PaginationStatus>
        Page {page} of {pageCount}
      </PaginationStatus>
    </PaginationItem>
    <PaginationItem>
      <PaginationNext disabled={!canNext} onClick={next} />
    </PaginationItem>
  </PaginationList>
</Pagination>
```

### Controlling how much of the range shows

The window is **paged** by default: it holds a block of pages steady and only
advances when the current page steps outside it, so the numbers never re-label
under the reader's cursor mid-click. `blockSize` sets how many a block holds;
`boundaryCount` how many pin to each end. Pass `window: "sliding"` for the
conventional follow-the-current-page behaviour. All of this lives in
`usePagination` — see its README.

A gap of exactly one page renders as that page instead of an ellipsis: hiding a
single number behind a menu costs a click and saves no width, since the
ellipsis cell is the same size as the number it replaces.

## Parts

| Part | Element | Notes |
|---|---|---|
| `Pagination` | `<nav>` | The landmark and layout root. Owns `size` and `variant`. |
| `PaginationSummary` | `<span>` | Slot before the controls. |
| `PaginationList` | `<ul>` | The row of cells. |
| `PaginationItem` | `<li>` | One cell. Layout-neutral. |
| `PaginationLink` | `Button` | A page number. `isActive` marks the current page. |
| `PaginationPrevious` / `PaginationNext` | `Button` | Ghost chevrons. Set `disabled` at the ends. |
| `PaginationEllipsis` | `Button` + `Dropdown` | A collapsed run; children are its menu. |
| `PaginationMenuItem` | `DropdownItem` | One hidden page inside that menu. |
| `PaginationStatus` | `<span>` | The compact readout. |
| `PaginationTrailing` | `<span>` | Slot after the controls. |

`Pagination` takes `size` (`xs`–`xl`, default `md`), `variant`
(`numbered` | `compact`), and `label` for the landmark's accessible name. Size
is shared with the parts through a context, so it is set once on the root.

`paginationRange` and its `PaginationRangeItem` type are re-exported from this
file for convenience; they live in `@primitiv-ui/react`.

## Accessibility

- The root is a `<nav>` with an accessible name. **Give each Pagination on a
  page a distinct `label`** — two identically-named navigation landmarks are
  indistinguishable in a landmark list.
- Controls are a real `nav > ul > li` list, so assistive tech announces the
  range's length.
- The current page carries `aria-current="page"`. The stylesheet keys its
  styling off that same attribute rather than a parallel class, so the visual
  and the a11y tree cannot drift apart.
- Prev/next take `disabled` at the ends of the range; the current page cell is
  never disabled — it stays focusable so a keyboard user isn't stranded.
- The ellipsis is a real button (not a `...` glyph), so the collapsed pages stay
  reachable by keyboard and screen reader.

## Why the state lives in a hook

Pagination introduces no new ARIA pattern — every cell is a `Button`, the
overflow menu a `Dropdown`, and each already owns its focus and keyboard
behaviour. What is left is arrangement plus arithmetic, and the arithmetic went
to `usePagination` in `@primitiv-ui/react` rather than into this copied file for
one reason: **there is no test harness under `registry/`**, and the maths has
real edge cases (page 1, the last page, an empty range, the gap-of-one
collapse). It is tested there to 100% and is reusable against any data source.

## Custom properties

| Property | Default |
|---|---|
| `--primitiv-pagination-gap` | `var(--primitiv-pagination-md-gap)` |
| `--primitiv-pagination-group-gap` | `var(--primitiv-pagination-md-group-gap)` |
| `--primitiv-pagination-control-gap` | `var(--primitiv-framed-control-md-gap)` |
| `--primitiv-pagination-icon-size` | `var(--primitiv-framed-control-md-icon-size)` |
| `--primitiv-pagination-item-min-inline-size` | `var(--primitiv-pagination-md-item-min-width)` |
| `--primitiv-pagination-menu-min-inline-size` | `var(--primitiv-pagination-md-item-min-width)` |

Every one is re-pointed by the `--xs`...`--xl` modifiers. The base rule's `md`
values are defaults for an unsized root — a knob declared there and *not*
restated per size silently pins itself to `md` at every size.

Page cells are square via **`min-inline-size`, not a fixed width** — so `1` and
`20` match, while a 4-digit page grows rather than clipping. Without the floor,
a cell's width tracks its digit count and the whole row visibly resizes and
re-centres each time the page number gains a digit (9 → 10 → 100). Prev/next
take the same floor and zero Button's text padding, so they are the same square
rather than lozenges.

The overflow menu re-points Dropdown's own `--primitiv-dropdown-min-inline-size`
down to the page-cell width. Dropdown's 12rem floor is sized for menu *labels*;
this menu holds page numbers, and 12rem leaves a large empty panel beside
"6 7 8 9". That override lives in the `primitiv.variants` layer — it must sit
after `primitiv.base`, where Dropdown declares the property, or which rule wins
would depend on stylesheet order.

## Files

| File | Purpose |
|---|---|
| `pagination.tsx` | The compound wrapper (hand-authored). |
| `pagination.recipe.ts` | `cva` recipe mapping props to modifier classes. |
| `styles.css` | Default theme. |
| `styles.scss` | The same, plus `$primitiv-*` aliases. |
| `contract.json` | Class/modifier/custom-property contract. |

## Dependencies

- [`button`](../button/README.md) — every cell, including prev/next and the
  ellipsis trigger.
- [`dropdown`](../dropdown/README.md) — the overflow menu.
- `@primitiv-ui/react` — `usePagination` and `paginationRange`.
- The token layer, for `pagination/*`, `framed-control/*`, `space/*`, and the
  families those two components resolve.
