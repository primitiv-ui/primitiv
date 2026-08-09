/*
 * Pagination — styled wrapper, HAND-AUTHORED (composes the registry Button and
 * Dropdown).
 *
 * Copied into the consumer repo by `primitiv add pagination`. It owns no
 * keyboard model or focus management of its own — every cell is a real
 * `Button`, and the overflow menu a real `Dropdown`, each already carrying its
 * own semantics — so there is nothing for a `packages/react` primitive to own
 * (RFC 0021: a composite ships pre-arranged, not as a new ARIA pattern).
 * Carries no drift-guard test; keep contract.json + the stylesheet + this file
 * in sync by hand.
 *
 * A COMPOUND, not one prop-heavy component. An earlier pass took
 * `page`/`pageCount`/`onPageChange` and rendered the whole row itself; that
 * broke the house convention every other compound follows (Breadcrumb, Select,
 * Card, Dropdown …) and, worse, made the component own a data model — the
 * thing `avatar-group` and `breadcrumb-overflow` explicitly refuse to do (RFC
 * 0019 §4c). The consumer now composes the row and keeps its own page state —
 * with `usePagination` from `@primitiv-ui/react` if they want the arithmetic,
 * clamping and prev/next handled for them.
 *
 * `size` is shared through a context rather than repeated on every part.
 * Breadcrumb can cascade its size purely through CSS custom properties because
 * its parts are plain elements; Pagination's cells are real `Button`s, which
 * need their own `size` prop to pick up the right framed-control geometry.
 * `split-button` hit exactly this and solved it the same way.
 *
 * THE CURRENT PAGE IS A `primary` BUTTON (`PaginationLink isActive`). Settled
 * on canvas against a `secondary` button held in its `active` state, which read
 * as hover/pressed rather than a persistent "you are here" (Figma page
 * "Pagination — exploration").
 *
 * PREV / NEXT ARE THE SAME SQUARE as a page cell — in Figma they are Icon
 * Buttons whose width and height both bind to framed-control/{size}/height.
 * The stylesheet gives them the same min-inline-size floor and zeroes Button's
 * text padding; leaving either off renders them narrower than the numbers
 * beside them.
 *
 * THE ELLIPSIS IS A REAL BUTTON that opens a Dropdown of the collapsed pages,
 * not a static "…" glyph — so a truncated range never puts a page out of reach.
 * Each `PaginationEllipsis` derives its OWN `anchor-name` from `useId()`: a
 * numbered range can open two gaps at once (before and after the current page)
 * and a page can hold more than one Pagination, so the name has to be per-gap.
 * `useId()`'s colon-bracketed output isn't a valid CSS `<custom-ident>`, so
 * every character outside [A-Za-z0-9_-] becomes a hyphen — mirroring
 * NavigationMenu's `toAnchorIdentFragment`.
 */
import {
  createContext,
  useContext,
  useId,
  useMemo,
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

function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

type PaginationStyleContextValue = { size: Size };

/**
 * Shares the row's `size` with the parts that compose a real `Button` — see the
 * file header for why this is a context rather than pure CSS cascade.
 */
const PaginationStyleContext = createContext<PaginationStyleContextValue | null>(null);

function usePaginationStyle(part: string): PaginationStyleContextValue {
  const context = useContext(PaginationStyleContext);
  if (context === null) {
    throw new Error(`${part} must be rendered inside a <Pagination>.`);
  }
  return context;
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

export type PaginationProps = ComponentPropsWithRef<"nav"> & {
  /**
   * `numbered` spaces the cells tightly; `compact` uses the ordinary control
   * gap, for a `PaginationStatus` readout between the chevrons.
   * @default "numbered"
   */
  variant?: "numbered" | "compact";
  /**
   * Sizes every part. Cells stay square at each size.
   * @default "md"
   */
  size?: Size;
  /**
   * Accessible name for the navigation landmark. **Give each Pagination on a
   * page a distinct one** — two identically named landmarks are
   * indistinguishable in a landmark list.
   * @default "Pagination"
   */
  label?: string;
};

/**
 * Page navigation for a paged collection — the landmark and layout root.
 *
 * Compose the row from `PaginationList` / `PaginationItem` and the cell parts.
 * `usePagination` supplies the page state and the collapsed range.
 *
 * @example
 * ```tsx
 * const { page, setPage, items, canPrevious, canNext, previous, next } =
 *   usePagination({ totalItems: 237, pageSize: 10 });
 *
 * <Pagination label="Search results">
 *   <PaginationList>
 *     <PaginationItem>
 *       <PaginationPrevious disabled={!canPrevious} onClick={previous} />
 *     </PaginationItem>
 *     {items.map((item, i) =>
 *       item.type === "page" ? (
 *         <PaginationItem key={item.page}>
 *           <PaginationLink isActive={item.page === page} onClick={() => setPage(item.page)}>
 *             {item.page}
 *           </PaginationLink>
 *         </PaginationItem>
 *       ) : (
 *         <PaginationItem key={`gap-${i}`}>
 *           <PaginationEllipsis>
 *             {item.pages.map((p) => (
 *               <PaginationMenuItem key={p} onSelect={() => setPage(p)}>{p}</PaginationMenuItem>
 *             ))}
 *           </PaginationEllipsis>
 *         </PaginationItem>
 *       ),
 *     )}
 *     <PaginationItem>
 *       <PaginationNext disabled={!canNext} onClick={next} />
 *     </PaginationItem>
 *   </PaginationList>
 * </Pagination>
 * ```
 *
 * @see https://primitiv-ui.dev/docs/components/pagination
 */
export function Pagination({
  variant = "numbered",
  size = "md",
  label = "Pagination",
  className,
  ...props
}: PaginationProps) {
  const value = useMemo(() => ({ size }), [size]);
  return (
    <PaginationStyleContext.Provider value={value}>
      <nav aria-label={label} className={cx(pagination({ variant, size }), className)} {...props} />
    </PaginationStyleContext.Provider>
  );
}

export type PaginationSummaryProps = ComponentPropsWithRef<"span">;

/** Range summary before the controls, e.g. "Showing 21-30 of 200". */
export function PaginationSummary({ className, ...props }: PaginationSummaryProps) {
  return <span className={cx("primitiv-pagination__summary", className)} {...props} />;
}

export type PaginationTrailingProps = ComponentPropsWithRef<"span">;

/** Slot after the controls — typically a jump-to-page `Select`. */
export function PaginationTrailing({ className, ...props }: PaginationTrailingProps) {
  return <span className={cx("primitiv-pagination__trailing", className)} {...props} />;
}

export type PaginationListProps = ComponentPropsWithRef<"ul">;

/**
 * The row of cells. A real `<ul>` so assistive tech announces the range's
 * length; the stylesheet strips the list affordances.
 */
export function PaginationList({ className, ...props }: PaginationListProps) {
  return <ul className={cx("primitiv-pagination__controls", className)} {...props} />;
}

export type PaginationItemProps = ComponentPropsWithRef<"li">;

/** One cell in the row. Layout-neutral — the control inside keeps its own box. */
export function PaginationItem({ className, ...props }: PaginationItemProps) {
  return <li className={cx("primitiv-pagination__cell", className)} {...props} />;
}

export type PaginationLinkProps = Omit<ComponentPropsWithRef<typeof Button>, "variant" | "size"> & {
  /**
   * Marks this cell as the current page: renders `primary` rather than
   * `secondary`, and sets `aria-current="page"`.
   * @default false
   */
  isActive?: boolean;
};

/**
 * A page-number cell.
 *
 * `aria-current` is the only marker for the current page — the stylesheet keys
 * off the same attribute, so the visual and the a11y tree cannot drift apart.
 */
export function PaginationLink({ isActive = false, className, ...props }: PaginationLinkProps) {
  const { size } = usePaginationStyle("PaginationLink");
  return (
    <Button
      variant={isActive ? "primary" : "secondary"}
      size={size}
      aria-current={isActive ? "page" : undefined}
      className={cx("primitiv-pagination__item", className)}
      {...props}
    />
  );
}

export type PaginationPreviousProps = Omit<
  ComponentPropsWithRef<typeof Button>,
  "variant" | "size" | "children"
> & {
  /** @default "Go to previous page" */
  label?: string;
};

/** Steps back one page. Disable it on the first page. */
export function PaginationPrevious({
  label = "Go to previous page",
  className,
  ...props
}: PaginationPreviousProps) {
  const { size } = usePaginationStyle("PaginationPrevious");
  return (
    <Button
      variant="ghost"
      size={size}
      aria-label={label}
      className={cx("primitiv-pagination__nav", className)}
      {...props}
    >
      <ChevronLeftGlyph />
    </Button>
  );
}

export type PaginationNextProps = PaginationPreviousProps;

/** Steps forward one page. Disable it on the last page. */
export function PaginationNext({
  label = "Go to next page",
  className,
  ...props
}: PaginationNextProps) {
  const { size } = usePaginationStyle("PaginationNext");
  return (
    <Button
      variant="ghost"
      size={size}
      aria-label={label}
      className={cx("primitiv-pagination__nav", className)}
      {...props}
    >
      <ChevronRightGlyph />
    </Button>
  );
}

export type PaginationStatusProps = ComponentPropsWithRef<"span">;

/**
 * The compact variant's readout — "Page 3 of 20" between the two chevrons.
 * Plain text, not a control.
 */
export function PaginationStatus({ className, ...props }: PaginationStatusProps) {
  return (
    <span aria-current="page" className={cx("primitiv-pagination__status", className)} {...props} />
  );
}

export type PaginationEllipsisProps = Omit<
  ComponentPropsWithRef<typeof Button>,
  "variant" | "size" | "children"
> & {
  /** The hidden pages, as `PaginationMenuItem` children. */
  children?: ReactNode;
  /** @default "Show more pages" */
  label?: string;
};

/**
 * A collapsed run of pages: a cell-shaped button that opens a menu of the
 * pages the range hid. Owns its own `anchor-name`, so two gaps in one row (and
 * two Paginations on one page) position independently.
 */
export function PaginationEllipsis({
  label = "Show more pages",
  className,
  children,
  ...props
}: PaginationEllipsisProps) {
  const { size } = usePaginationStyle("PaginationEllipsis");
  const anchorName = `--primitiv-pagination-${toAnchorIdentFragment(useId())}`;
  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <Button
          variant="ghost"
          size={size}
          aria-label={label}
          className={cx("primitiv-pagination__ellipsis", className)}
          style={{ anchorName }}
          {...props}
        >
          &hellip;
        </Button>
      </DropdownTrigger>
      <DropdownContent
        size={size}
        className="primitiv-pagination__menu"
        style={{ positionAnchor: anchorName }}
      >
        {children}
      </DropdownContent>
    </Dropdown>
  );
}

export type PaginationMenuItemProps = ComponentPropsWithRef<typeof DropdownItem>;

/** One hidden page inside a `PaginationEllipsis` menu. */
export function PaginationMenuItem(props: PaginationMenuItemProps) {
  return <DropdownItem {...props} />;
}

/**
 * Re-exported from `@primitiv-ui/react` so everything Pagination needs can be
 * imported from this one copied surface. The arithmetic itself lives in the
 * headless `usePagination` package — kept in ONE place because it has real edge
 * cases (page 1, the last page, an empty range, the gap-of-one collapse) and
 * the registry has no test harness to guard a second copy.
 */
export { paginationRange, type PaginationRangeItem } from "@primitiv-ui/react";
