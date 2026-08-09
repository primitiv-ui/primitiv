import { useCallback, useMemo } from "react";
import { useControllableState } from "../hooks/useControllableState.ts";

/** One entry in a rendered page range: either a page, or a collapsed run. */
export type PaginationRangeItem =
  | { type: "page"; page: number }
  | { type: "gap"; pages: number[] };

/**
 * How the visible page window behaves as the current page moves.
 *
 * - **paged** — the window holds a fixed block of pages and only advances when
 *   the current page steps outside it. Within a block nothing re-labels; only
 *   which cell is active changes. Stepping past the block's last page loads the
 *   next block in one deliberate jump.
 * - **sliding** — the window follows the current page continuously, keeping
 *   `siblingCount` pages either side of it. The conventional behaviour, but the
 *   numbers under the reader's cursor re-label on EVERY step, which reads as a
 *   flash.
 */
export type PaginationWindow = "paged" | "sliding";

/** Shape of the range — see {@link paginationRange}. */
export type PaginationRangeOptions = {
  /**
   * Which windowing strategy to use.
   * @default "paged"
   */
  window?: PaginationWindow;
  /**
   * `paged` only — how many pages a block holds.
   * @default 5
   */
  blockSize?: number;
  /**
   * `sliding` only — pages shown either side of the current one.
   * @default 1
   */
  siblingCount?: number;
  /**
   * Pages pinned at each end of the range, in both strategies.
   * @default 1
   */
  boundaryCount?: number;
};

/**
 * Work out which pages to show, and which to collapse behind an overflow menu.
 *
 * Pins `boundaryCount` pages at each end, adds the window around the current
 * page (see {@link PaginationWindow}), then walks the sorted result and
 * collapses each remaining run into a `gap` carrying the pages it hides, so a
 * menu can offer them.
 *
 * A run of exactly ONE page is returned as that page instead: hiding a single
 * number behind a menu costs the reader a click and saves no width, since the
 * ellipsis cell is the same square as the number it would replace. Same
 * reasoning as `breadcrumb-overflow`, which only truncates once there is more
 * than one crumb to hide.
 *
 * Pure — exported separately from the hook so a consumer holding its own page
 * state can still reuse the arithmetic.
 *
 * @example
 * ```ts
 * paginationRange(7, 20);
 * // 1 [2,3,4,5] 6 7 8 9 10 [11…19] 20   — the 6-10 block, steady while you
 * //                                       move within it
 * ```
 */
export function paginationRange(
  page: number,
  pageCount: number,
  options: PaginationRangeOptions = {},
): PaginationRangeItem[] {
  const { window = "paged", blockSize = 5, siblingCount = 1, boundaryCount = 1 } = options;

  const visible = new Set<number>();
  for (let i = 1; i <= Math.min(boundaryCount, pageCount); i++) visible.add(i);
  for (let i = Math.max(1, pageCount - boundaryCount + 1); i <= pageCount; i++) visible.add(i);

  if (window === "paged") {
    // Which block the current page falls in. Because this is derived from the
    // page rather than centred on it, every page in the block yields the same
    // window — that is what stops the cells re-labelling as you step.
    const blockStart = Math.floor((page - 1) / blockSize) * blockSize + 1;
    const blockEnd = Math.min(blockStart + blockSize - 1, pageCount);
    for (let i = blockStart; i <= blockEnd; i++) visible.add(i);
  } else {
    for (let i = Math.max(1, page - siblingCount); i <= Math.min(pageCount, page + siblingCount); i++) {
      visible.add(i);
    }
  }

  const sorted = [...visible].sort((a, b) => a - b);
  const items: PaginationRangeItem[] = [];

  sorted.forEach((current, i) => {
    if (i > 0) {
      const missing: number[] = [];
      for (let p = sorted[i - 1] + 1; p < current; p++) missing.push(p);
      if (missing.length === 1) items.push({ type: "page", page: missing[0] });
      else if (missing.length > 1) items.push({ type: "gap", pages: missing });
    }
    items.push({ type: "page", page: current });
  });

  return items;
}

export type UsePaginationOptions = {
  /**
   * How many pages there are. Supply this directly when the page count comes
   * from elsewhere (a server response, say); otherwise give `totalItems` and
   * `pageSize` and let the hook derive it.
   */
  pageCount?: number;
  /** Total number of items across every page. Pairs with `pageSize`. */
  totalItems?: number;
  /** How many items each page holds. Pairs with `totalItems`. */
  pageSize?: number;
  /**
   * The current page, 1-based — supply this to drive the hook yourself
   * (controlled). Leave it out to let the hook hold its own state.
   */
  page?: number;
  /**
   * Starting page when uncontrolled. Read once on mount.
   * @default 1
   */
  defaultPage?: number;
  /**
   * Notified whenever the page changes, with the **clamped** page — never a
   * raw out-of-range request. Not called when the page hasn't actually moved.
   */
  onPageChange?: (page: number) => void;
  /**
   * How the visible window behaves as the page moves. See
   * {@link PaginationWindow} — `paged` holds a block steady, `sliding` follows
   * the current page.
   * @default "paged"
   */
  window?: PaginationWindow;
  /**
   * `paged` only — how many pages a block holds.
   * @default 5
   */
  blockSize?: number;
  /**
   * `sliding` only — pages shown either side of the current one.
   * @default 1
   */
  siblingCount?: number;
  /**
   * How many pages `items` pins at each end of the range.
   * @default 1
   */
  boundaryCount?: number;
};

/**
 * What {@link usePagination} hands back.
 */
export type UsePaginationResult = {
  /** The current page, 1-based. Always within `1…pageCount`. */
  page: number;
  /** How many pages there are. Never less than 1. */
  pageCount: number;
  /** Go to a page. Out-of-range requests are clamped, not rejected. */
  setPage: (page: number) => void;
  /** Step forward one page. A no-op on the last page. */
  next: () => void;
  /** Step back one page. A no-op on the first page. */
  previous: () => void;
  /** Jump to page 1. */
  first: () => void;
  /** Jump to the last page. */
  last: () => void;
  /** Whether there is a page before this one — wire to a prev control's `disabled`. */
  canPrevious: boolean;
  /** Whether there is a page after this one — wire to a next control's `disabled`. */
  canNext: boolean;
  /**
   * Zero-based index of this page's first item. Together with `endIndex` this
   * is a **half-open** range, so it drops straight into `Array.slice(start,
   * end)` or a LIMIT/OFFSET query with no off-by-one at the call site.
   *
   * Both are `0` when the hook has no `pageSize` to reason from.
   */
  startIndex: number;
  /** Zero-based index one past this page's last item. Never exceeds `totalItems`. */
  endIndex: number;
  /**
   * The range to render: each entry is either a page or a collapsed `gap`
   * carrying the pages it hides. See {@link paginationRange}.
   */
  items: PaginationRangeItem[];
};

function clamp(page: number, pageCount: number): number {
  return Math.min(Math.max(page, 1), pageCount);
}

/**
 * Headless pagination state: the page arithmetic every paged surface needs,
 * with no opinion about where the data comes from or how the row is rendered.
 *
 * @see https://primitiv-ui.dev/docs/hooks/use-pagination
 */
export function usePagination(options: UsePaginationOptions): UsePaginationResult {
  const {
    pageCount: explicitPageCount,
    totalItems,
    pageSize,
    page: controlledPage,
    defaultPage = 1,
    onPageChange,
    window = "paged",
    blockSize = 5,
    siblingCount = 1,
    boundaryCount = 1,
  } = options;

  const derived =
    explicitPageCount !== undefined
      ? explicitPageCount
      : totalItems !== undefined && pageSize !== undefined
        ? Math.ceil(totalItems / pageSize)
        : 1;

  // A range needs somewhere to stand: with 0 pages, a 1-based `page` would be
  // out of range the moment it is read.
  const pageCount = Math.max(derived, 1);

  const [rawPage, setRawPage] = useControllableState(controlledPage, defaultPage, onPageChange);

  // Clamped on the way OUT as well as on the way in: `defaultPage` is read once
  // on mount, and a controlled `page` comes straight from the consumer, so
  // neither has passed through `setPage`. Both can outlive the data they
  // pointed at (a page index restored from a URL, a list that shrank).
  const page = clamp(rawPage, pageCount);

  const setPage = useCallback(
    (next: number) => {
      const target = clamp(next, pageCount);
      // useControllableState deliberately does not dedupe, so the guard lives
      // here — a consumer re-selecting the page they are already on should not
      // see a change notification.
      if (target === page) return;
      setRawPage(target);
    },
    [page, pageCount, setRawPage],
  );

  // Every mover goes through setPage, so clamping and the change guard are
  // stated once — stepping past either end is a no-op rather than an error.
  const next = useCallback(() => setPage(page + 1), [page, setPage]);
  const previous = useCallback(() => setPage(page - 1), [page, setPage]);
  const first = useCallback(() => setPage(1), [setPage]);
  const last = useCallback(() => setPage(pageCount), [pageCount, setPage]);

  // Only meaningful when the hook knows a page size. Given `pageCount` alone it
  // cannot invent slice bounds, so it reports an empty range rather than a
  // plausible-looking guess a consumer might slice with.
  const canSlice = pageSize !== undefined;
  const startIndex = canSlice ? (page - 1) * pageSize : 0;
  const endIndex = canSlice
    ? // Clamped to the real item count so the final, partial page's range stops
      // at the data instead of a page-size multiple past it.
      Math.min(startIndex + pageSize, totalItems ?? startIndex + pageSize)
    : 0;

  const items = useMemo(
    () => paginationRange(page, pageCount, { window, blockSize, siblingCount, boundaryCount }),
    [page, pageCount, window, blockSize, siblingCount, boundaryCount],
  );

  return {
    page,
    pageCount,
    setPage,
    items,
    startIndex,
    endIndex,
    next,
    previous,
    first,
    last,
    canPrevious: page > 1,
    canNext: page < pageCount,
  };
}
