# usePagination

Headless pagination state: the page arithmetic every paged surface needs, with
no opinion about where the data comes from or how the row is rendered.

```tsx
import { usePagination } from "@primitiv-ui/react";

const { page, pageCount, items, next, previous, canNext, canPrevious } =
  usePagination({ totalItems: 237, pageSize: 10 });
```

## Works with any data source

The hook never fetches, holds or slices data — it hands back **indices**, which
is what makes it source-agnostic.

**Client-side** — slice an array you already have:

```tsx
const { startIndex, endIndex } = usePagination({
  totalItems: rows.length,
  pageSize: 10,
});
const visible = rows.slice(startIndex, endIndex);
```

**Server-side** — feed the same indices to a query. Here the server owns the
total, so pass `totalItems` through as it arrives:

```tsx
const { page, startIndex, pageSize } = usePagination({
  totalItems: data?.total,
  pageSize: 10,
});
const { data } = useQuery(["rows", page], () =>
  fetch(`/api/rows?offset=${startIndex}&limit=10`),
);
```

If the server reports a page **count** rather than an item total, give
`pageCount` directly and skip `totalItems` entirely.

`startIndex`/`endIndex` are a **half-open** range — `[start, end)` — so they
drop into `Array.slice` and into `LIMIT`/`OFFSET` with no off-by-one at the call
site.

## Controlled and uncontrolled

Uncontrolled by default, holding its own page:

```tsx
const pagination = usePagination({ pageCount: 20, defaultPage: 3 });
```

Pass `page` to drive it yourself — from a URL query, say:

```tsx
const pagination = usePagination({
  pageCount: 20,
  page: Number(searchParams.get("page") ?? 1),
  onPageChange: (next) => setSearchParams({ page: String(next) }),
});
```

`onPageChange` always reports the **clamped** page, never a raw out-of-range
request, and is not called when the page hasn't actually moved.

## Out-of-range pages are clamped, not rejected

A page index restored from a URL or `localStorage` can easily outlive the data
it pointed at. Every route into the page — `defaultPage`, a controlled `page`,
and `setPage` — is clamped to `1…pageCount`, so `page` is always safe to read
and to index with.

`pageCount` is never less than `1`: a 1-based page needs somewhere to stand, and
reporting `0` pages would put `page` out of range the moment it was read.

## Options

| Option | Type | Default | Notes |
|---|---|---|---|
| `totalItems` | `number` | — | Total items across all pages. Pairs with `pageSize`. |
| `pageSize` | `number` | — | Items per page. Pairs with `totalItems`. |
| `pageCount` | `number` | — | Supply directly instead of deriving from the pair. |
| `page` | `number` | — | Controlled current page, 1-based. |
| `defaultPage` | `number` | `1` | Starting page when uncontrolled. |
| `onPageChange` | `(page: number) => void` | — | Fired with the clamped page. |
| `window` | `"paged" \| "sliding"` | `"paged"` | See Windowing below. |
| `blockSize` | `number` | `5` | `paged` only — pages per block. |
| `siblingCount` | `number` | `1` | `sliding` only — pages either side of the current one. |
| `boundaryCount` | `number` | `1` | Pages pinned at each end, both strategies. |

Given neither `pageCount` nor a complete `totalItems` + `pageSize` pair, the
hook reports a single page.

## Returns

| Key | Type | Notes |
|---|---|---|
| `page` | `number` | Current page, always within `1…pageCount`. |
| `pageCount` | `number` | Never less than 1. |
| `setPage` | `(page: number) => void` | Out-of-range requests clamp. |
| `next` / `previous` | `() => void` | No-ops at the respective end. |
| `first` / `last` | `() => void` | Jump to either end. |
| `canPrevious` / `canNext` | `boolean` | Wire to a control's `disabled`. |
| `startIndex` / `endIndex` | `number` | Half-open slice bounds; `0` when no `pageSize`. |
| `items` | `PaginationRangeItem[]` | The range to render — see below. |

## Windowing — why the default is `paged`

As the current page moves, something has to decide which numbers stay on screen.

**`paged`** (the default) holds a fixed block and only advances when the current
page steps outside it:

```
page 6:  1 … 6 7 8 9 10 … 20
page 7:  1 … 6 7 8 9 10 … 20     ← identical; only the active cell moved
page 10: 1 … 6 7 8 9 10 … 20
page 11: 1 … 11 12 13 14 15 … 20 ← one deliberate jump
```

**`sliding`** follows the current page continuously:

```
page 6:  1 … 5 6 7 … 20
page 7:  1 … 6 7 8 … 20          ← every cell re-labelled
page 8:  1 … 7 8 9 … 20          ← again
```

Sliding is the more common default elsewhere, but it re-labels the numbers
directly under the reader's cursor on every single step — the cell you are
about to click has become a different page by the time you get there, and the
whole row appears to flash. Paged trades that for one visible jump per block,
which is both calmer and safer to click.

Set `blockSize` to control how many pages a block holds (default 5). Choose
`sliding` explicitly if you want the conventional behaviour:

```tsx
usePagination({ totalItems: 500, pageSize: 10, window: "sliding", siblingCount: 2 });
```

`siblingCount` applies only to `sliding`; `blockSize` only to `paged`.
`boundaryCount` applies to both.

## `items` and `paginationRange`

`items` is the range to render: each entry is either a page or a `gap` carrying
the pages it hides, so an overflow menu can offer them.

```tsx
items.map((item) =>
  item.type === "page" ? renderPage(item.page) : renderGap(item.pages),
);
```

A run of exactly **one** hidden page is returned as that page instead — hiding a
single number behind a menu costs a click and saves no width.

`paginationRange(page, pageCount, options?)` is exported separately and is
pure, so a consumer holding its own page state can reuse the arithmetic without
the hook. It takes the same `window` / `blockSize` / `siblingCount` /
`boundaryCount` options.

## Styled surface

The `pagination` registry component composes this hook's output into a styled
row. See `registry/components/pagination/README.md`.
