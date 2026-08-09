import "../styles/primitiv/pagination/styles.css";
/*
 * Pagination — styled wrapper, HAND-AUTHORED (composes the registry Button and
 * Dropdown).
 *
 * Copied into the consumer repo by `primitiv add pagination`. It owns no
 * keyboard model or focus management of its own — every cell is a real
 * `Button`, and the overflow menu is a real `Dropdown`, each already carrying
 * its own semantics — so there is nothing for a `packages/react` primitive to
 * own (RFC 0021: a composite ships pre-arranged, not as a new ARIA pattern).
 * Carries no drift-guard test; keep contract.json + the stylesheet + this file
 * in sync by hand.
 *
 * `page` / `pageCount` / `onPageChange` IS the data model here, and that is not
 * a contradiction of the house rule that compounds refuse to own one (RFC 0019
 * §4c; see `avatar-group` and `breadcrumb-overflow`, which take children rather
 * than arrays). Those components would have had to model *content* — labels,
 * hrefs, member records. Pagination models two integers and a callback. There
 * is no richer structure to hand back to the consumer, and inventing a
 * children-based API for "which of 20 numbered pages is current" would be
 * ceremony, not composition.
 *
 * THE CURRENT PAGE IS A `primary` BUTTON. Settled on canvas against the
 * alternative of a `secondary` button held in its `active` state, which read as
 * hover/pressed rather than a persistent "you are here" (Figma page
 * "Pagination — exploration").
 *
 * THE ELLIPSIS IS A REAL BUTTON that opens a Dropdown of the collapsed pages,
 * not a static "…" glyph — so a truncated range never puts a page out of reach.
 * Like `breadcrumb-overflow`, each menu derives its own `anchor-name` from
 * `useId()` rather than asking the consumer to wire one: a page can hold more
 * than one Pagination, and a numbered range can open TWO gaps at once (before
 * and after the current page), so the name is per-gap, not per-component.
 * `useId()`'s colon-bracketed output isn't a valid CSS `<custom-ident>`, so
 * every character outside [A-Za-z0-9_-] becomes a hyphen — mirroring
 * NavigationMenu's `toAnchorIdentFragment`.
 */
import {
  useId,
  type ComponentPropsWithRef,
  type ReactNode,
} from "react";
import { Button } from "./button";
import { Dropdown, DropdownTrigger, DropdownContent, DropdownItem } from "./dropdown";
import { pagination } from "./pagination.recipe";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

function toAnchorIdentFragment(id: string): string {
  return id.replace(/[^A-Za-z0-9_-]/g, "-");
}

/**
 * The paths are copied verbatim from `@primitiv-ui/icons`' chevron-left /
 * chevron-right (packages/icons/icons/svg/) rather than imported: no registry
 * component depends on the icons package, so a copied surface never drags one
 * in — the same trade Tree and Chip make with their glyphs. Re-copy them if
 * those glyphs are ever redrawn.
 */
function ChevronLeftGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="m16.06 5-7 7 7 7L15 20.06 6.94 12 15 3.94 16.06 5Z" />
    </svg>
  );
}

function ChevronRightGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.06 12 9 20.06 7.94 19l7-7-7-7L9 3.94 17.06 12Z" />
    </svg>
  );
}

/** One entry in a rendered page range: either a page, or a collapsed gap. */
export type PaginationItem =
  | { type: "page"; page: number }
  | { type: "gap"; pages: number[] };

/**
 * Work out which pages to show, and which to collapse behind an overflow menu.
 *
 * Builds the visible set from three sources — the first `boundaryCount` pages,
 * the last `boundaryCount`, and `siblingCount` either side of `page` — then
 * walks the sorted result and collapses every remaining run into a `gap`.
 *
 * A gap of exactly ONE page is rendered as that page instead: hiding a single
 * number behind a menu costs the reader a click and saves no width (the
 * ellipsis cell is the same size as the number it replaces). The same reasoning
 * as `breadcrumb-overflow`, which only truncates once there is more than one
 * crumb to hide.
 *
 * Exported because it is a pure function of its inputs, so a consumer changing
 * the layout can reuse the arithmetic instead of re-deriving it.
 */
export function paginationRange(
  page: number,
  pageCount: number,
  siblingCount = 1,
  boundaryCount = 1,
): PaginationItem[] {
  const visible = new Set<number>();
  for (let i = 1; i <= Math.min(boundaryCount, pageCount); i++) visible.add(i);
  for (let i = Math.max(1, pageCount - boundaryCount + 1); i <= pageCount; i++) visible.add(i);
  for (let i = Math.max(1, page - siblingCount); i <= Math.min(pageCount, page + siblingCount); i++) {
    visible.add(i);
  }

  const sorted = [...visible].sort((a, b) => a - b);
  const items: PaginationItem[] = [];

  sorted.forEach((current, i) => {
    if (i > 0) {
      const previous = sorted[i - 1];
      const missing: number[] = [];
      for (let p = previous + 1; p < current; p++) missing.push(p);
      if (missing.length === 1) items.push({ type: "page", page: missing[0] });
      else if (missing.length > 1) items.push({ type: "gap", pages: missing });
    }
    items.push({ type: "page", page: current });
  });

  return items;
}

export type PaginationProps = Omit<ComponentPropsWithRef<"nav">, "children" | "onChange"> & {
  /** The current page, 1-based. */
  page: number;
  /** How many pages there are in total. */
  pageCount: number;
  /** Called with the requested page when the reader navigates. */
  onPageChange?: (page: number) => void;
  /**
   * `numbered` shows a cell per page; `compact` replaces them with a
   * "Page X of Y" readout, for narrow containers and table footers.
   * @default "numbered"
   */
  variant?: "numbered" | "compact";
  /**
   * Sizes the cells and their gap. Cells stay square at every size.
   * @default "md"
   */
  size?: Size;
  /**
   * How many pages to show either side of the current one.
   * Ignored when `variant` is `compact`.
   * @default 1
   */
  siblingCount?: number;
  /**
   * How many pages to always show at each end of the range.
   * Ignored when `variant` is `compact`.
   * @default 1
   */
  boundaryCount?: number;
  /**
   * Optional content before the controls — typically a range summary such as
   * "Showing 21-30 of 237". Maps to the Figma set's `Show summary` boolean.
   */
  summary?: ReactNode;
  /**
   * Optional content after the controls — typically a jump-to-page `Select`.
   * Maps to the Figma set's `Show jump` boolean.
   */
  children?: ReactNode;
  /**
   * Accessible name for the navigation landmark. Give each Pagination on a page
   * a distinct one.
   * @default "Pagination"
   */
  label?: string;
  /** @default "Go to previous page" */
  previousLabel?: string;
  /** @default "Go to next page" */
  nextLabel?: string;
  /** Builds each page cell's accessible name. @default `Go to page ${page}` */
  pageLabel?: (page: number) => string;
  /** @default "Show more pages" */
  moreLabel?: string;
};

/**
 * Page navigation for a paged collection.
 *
 * Renders a row of square page cells between prev/next chevrons, collapsing
 * long ranges behind an overflow menu; `variant="compact"` swaps the cells for
 * a "Page X of Y" readout.
 *
 * @example
 * ```tsx
 * const [page, setPage] = useState(1);
 *
 * <Pagination
 *   page={page}
 *   pageCount={20}
 *   onPageChange={setPage}
 *   summary={`Showing ${(page - 1) * 10 + 1}-${page * 10} of 200`}
 * />
 * ```
 *
 * @see https://primitiv-ui.dev/docs/components/pagination
 */
export function Pagination({
  page,
  pageCount,
  onPageChange,
  variant = "numbered",
  size = "md",
  siblingCount = 1,
  boundaryCount = 1,
  summary,
  children,
  label = "Pagination",
  previousLabel = "Go to previous page",
  nextLabel = "Go to next page",
  pageLabel = (n) => `Go to page ${n}`,
  moreLabel = "Show more pages",
  className,
  ...props
}: PaginationProps) {
  const anchorBase = toAnchorIdentFragment(useId());
  // Clamped rather than trusted: a consumer driving `page` from a URL query can
  // easily hand us 0 or 999, and every branch below reads it.
  const current = Math.min(Math.max(page, 1), Math.max(pageCount, 1));
  const items = variant === "numbered" ? paginationRange(current, pageCount, siblingCount, boundaryCount) : [];

  const go = (next: number) => () => onPageChange?.(next);

  return (
    <nav
      aria-label={label}
      className={[pagination({ variant, size }), className].filter(Boolean).join(" ")}
      {...props}
    >
      {summary !== undefined && <span className="primitiv-pagination__summary">{summary}</span>}

      <ul className="primitiv-pagination__controls">
        <li className="primitiv-pagination__cell">
          <Button
            variant="ghost"
            size={size}
            className="primitiv-pagination__nav"
            aria-label={previousLabel}
            disabled={current <= 1}
            onClick={go(current - 1)}
          >
            <ChevronLeftGlyph />
          </Button>
        </li>

        {variant === "compact" ? (
          <li className="primitiv-pagination__cell">
            <span className="primitiv-pagination__status" aria-current="page">
              Page {current} of {pageCount}
            </span>
          </li>
        ) : (
          items.map((item, i) =>
            item.type === "page" ? (
              <li key={`page-${item.page}`} className="primitiv-pagination__cell">
                <Button
                  variant={item.page === current ? "primary" : "secondary"}
                  size={size}
                  className="primitiv-pagination__item"
                  // aria-current is the *only* marker for the current page —
                  // the stylesheet keys off it too, so the visual and the a11y
                  // tree cannot drift apart.
                  aria-current={item.page === current ? "page" : undefined}
                  aria-label={pageLabel(item.page)}
                  onClick={go(item.page)}
                >
                  {item.page}
                </Button>
              </li>
            ) : (
              <li key={`gap-${i}`} className="primitiv-pagination__cell">
                <Dropdown>
                  <DropdownTrigger asChild>
                    <Button
                      variant="ghost"
                      size={size}
                      className="primitiv-pagination__ellipsis"
                      aria-label={moreLabel}
                      style={{ anchorName: `--primitiv-pagination-${anchorBase}-${i}` }}
                    >
                      &hellip;
                    </Button>
                  </DropdownTrigger>
                  <DropdownContent
                    size={size}
                    className="primitiv-pagination__menu"
                    style={{ positionAnchor: `--primitiv-pagination-${anchorBase}-${i}` }}
                  >
                    {item.pages.map((p) => (
                      <DropdownItem key={p} onSelect={go(p)}>
                        {p}
                      </DropdownItem>
                    ))}
                  </DropdownContent>
                </Dropdown>
              </li>
            ),
          )
        )}

        <li className="primitiv-pagination__cell">
          <Button
            variant="ghost"
            size={size}
            className="primitiv-pagination__nav"
            aria-label={nextLabel}
            disabled={current >= pageCount}
            onClick={go(current + 1)}
          >
            <ChevronRightGlyph />
          </Button>
        </li>
      </ul>

      {children !== undefined && <span className="primitiv-pagination__trailing">{children}</span>}
    </nav>
  );
}
