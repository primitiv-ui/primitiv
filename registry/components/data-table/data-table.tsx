/*
 * DataTable — styled wrapper, HAND-AUTHORED (composes the registry Table and
 * the headless Table's expandable-row seam).
 *
 * Copied into the consumer repo by `primitiv add data-table`. Carries no
 * drift-guard test; keep contract.json + the stylesheet + this file in sync by
 * hand.
 *
 * It owns ANATOMY, never state. Sorting, selection, expansion, filtering and
 * pagination all arrive as props and leave as callbacks, so an external table
 * engine — TanStack Table in the kitchen-sink demo — drives it without this
 * component duplicating a single concept. There is deliberately no `columns` /
 * `data` API: that would re-invent the column definition every real table
 * engine already has, need a cell-renderer escape hatch within a week, and
 * break the house rule on data models (RFC 0019 §4c; see avatar-group and
 * breadcrumb-overflow, which take children for the same reason).
 *
 * What it does own: the framed shell, the three-region bars, the square
 * control-cell geometry, the sort button's full-cell hit area, the detail row's
 * indent and grid-collapse clip, and the aria plumbing of the expand seam
 * (which lives in `packages/react`, not here, precisely because a copied file
 * is one refactor away from breaking an aria relationship untested).
 *
 * It ships NO toolbar controls — not even column visibility, which looks
 * defensible until you notice it would mean owning the column list. Compose the
 * filter from `input`, the field menu from `dropdown`, rows-per-page from
 * `select` and the pager from `pagination`, and drop them into the regions.
 *
 * Glyphs are inlined rather than imported from `@primitiv-ui/icons`, so
 * installing this pulls in no extra package (the `chip` precedent).
 */
import {
  createContext,
  useContext,
  useMemo,
  type ComponentPropsWithRef,
  type ReactElement,
  type ReactNode,
} from "react";
import { Table } from "@primitiv-ui/react";
import { Button } from "./button";
import { TableCell, TableHeader } from "./table";
import {
  dataTable,
  dataTableToolbar,
  dataTableFooter,
  dataTableRegion,
  dataTableControlCell,
  dataTableSort,
  dataTableSortIcon,
  dataTableExpand,
  dataTableExpandIcon,
  dataTableDetailRow,
  dataTableDetailCell,
  dataTableDetailClip,
  dataTableDetailBody,
  dataTableDetailContent,
} from "./data-table.recipe";

type Size = "xs" | "sm" | "md" | "lg" | "xl";
type SortDirection = "none" | "asc" | "desc";

const cx = (...parts: (string | undefined | false)[]) => parts.filter(Boolean).join(" ");

/*
 * The shell shares its `size` with the parts that compose a real Button, the
 * same way `pagination` does — a Button takes its scale as a prop, so CSS
 * inheritance alone cannot reach it.
 */
type DataTableStyleContextValue = { size: Size };

const DataTableStyleContext = createContext<DataTableStyleContextValue | null>(null);

function useDataTableStyle(part: string): DataTableStyleContextValue {
  const context = useContext(DataTableStyleContext);
  if (context === null) {
    throw new Error(`${part} must be rendered inside a <DataTable>.`);
  }
  return context;
}

/*
 * A control inside a data row is sized ONE TIER DOWN from the row, floored at
 * xs. Read off the live Figma sets, which instance a `Size=sm` ghost Icon Button
 * into an `md` row (and xs into both xs and sm): a same-tier control reads as an
 * icon button dropped into a cell rather than as part of the row, and at the
 * small end there is no tier below xs to drop to. The same ladder Tree uses for
 * its Breadcrumb sizes.
 */
const CONTROL_SIZE: Record<Size, Size> = {
  xs: "xs",
  sm: "xs",
  md: "sm",
  lg: "md",
  xl: "lg",
};

export type DataTableProps = ComponentPropsWithRef<"div"> & {
  /**
   * Type scale for the table and its bars; `data-density` scales padding
   * further, independently.
   * @default "md"
   */
  size?: Size;
  /**
   * Whether the shell draws its own surface, hairline and radius.
   * - `framed` — a bordered, radiused panel (the default).
   * - `bare` — nothing of its own, for a table already inside a Card or panel.
   * @default "framed"
   */
  frame?: "framed" | "bare";
  /**
   * Pins the header row while the body scrolls. Adds the opaque header
   * background the base Table deliberately does not have — without it, rows
   * scroll straight through the header. Needs a `max-block-size` on the
   * surrounding `TableScrollArea` so there is something to scroll within.
   * @default false
   */
  sticky?: boolean;
};

/** The framed shell: a toolbar, a table and a footer that read as one object. */
export function DataTable({ size, frame, sticky, className, ...props }: DataTableProps): ReactElement {
  const value = useMemo(() => ({ size: size ?? "md" }), [size]);
  return (
    <DataTableStyleContext.Provider value={value}>
      <div className={cx(dataTable({ size, frame, sticky }), className)} {...props} />
    </DataTableStyleContext.Provider>
  );
}

export type DataTableToolbarProps = ComponentPropsWithRef<"div">;

/** The padded bar above the table. Holds `DataTableRegion` children. */
export function DataTableToolbar({ className, ...props }: DataTableToolbarProps): ReactElement {
  return <div className={cx(dataTableToolbar(), className)} {...props} />;
}

export type DataTableFooterProps = ComponentPropsWithRef<"div">;

/** The padded bar below the table — identical mechanism to the toolbar. */
export function DataTableFooter({ className, ...props }: DataTableFooterProps): ReactElement {
  return <div className={cx(dataTableFooter(), className)} {...props} />;
}

export type DataTableRegionProps = ComponentPropsWithRef<"div"> & {
  /**
   * Which of the bar's three regions this is. Every control is independently
   * placeable, so the filter can sit at the start, the centre or the end, and
   * so can the field menu.
   *
   * The bar is a `minmax(0, 1fr) auto minmax(0, 1fr)` grid: equal fractional
   * flanks are the only thing that holds a centre still when the two sides hold
   * different amounts.
   * @default "start"
   */
  align?: "start" | "center" | "end";
};

/** One region of a toolbar or footer. */
export function DataTableRegion({ align, className, ...props }: DataTableRegionProps): ReactElement {
  return <div className={cx(dataTableRegion({ align }), className)} {...props} />;
}

/* `align` is Omitted and re-declared for the same reason it is on
   `DataTableSortHeaderProps` below: `<td>` carries a native `align` attribute
   (React types it as the deprecated `"left" | "center" | "right" | "justify" |
   "char"`), and this spreads its props straight into `TableCell`, whose own
   `align` is the logical `"start" | "center" | "end"`. Without the Omit the two
   unions have no overlap and the spread fails to compile. */
export type DataTableControlCellProps = Omit<ComponentPropsWithRef<"td">, "align"> & {
  /** Render a `<th>` instead of a `<td>` — for the select-all cell in the head. */
  header?: boolean;
  /**
   * Cell text alignment. A control cell centres its content by default via its
   * own class, so this is only for overriding that.
   */
  align?: "start" | "center" | "end";
};

/**
 * A square cell for a control (select, expand, row actions).
 *
 * Takes `table/cell/padding-block` on the inline axis and **no** block padding:
 * a control cell that padded its own height would set the row height for the
 * whole table, so it takes none and its control centres in whatever height the
 * text cells produce.
 */
export function DataTableControlCell({ header = false, className, ...props }: DataTableControlCellProps): ReactElement {
  /* Composes the registry Table's own cells rather than emitting a bare th/td.
     That matters for more than tidiness: the table's rules and the sticky-header
     rule both target .primitiv-table__header / __cell, so a hand-rolled cell
     silently opted out of both — the row rule broke into segments under the
     control columns, and a sticky header left its checkbox cell behind. */
  if (header) {
    return <TableHeader scope="col" className={cx(dataTableControlCell(), className)} {...props} />;
  }
  return <TableCell className={cx(dataTableControlCell(), className)} {...props} />;
}

function SortGlyph({ direction }: { direction: SortDirection }): ReactElement {
  if (direction === "none") {
    return (
      <svg className={dataTableSortIcon()} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 6.5 5 13M5 13 3 11M5 13l2-2M11 9.5 11 3M11 3 9 5M11 3l2 2" />
      </svg>
    );
  }
  return (
    <svg className={dataTableSortIcon()} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={direction === "asc" ? "m4 10 4-4 4 4" : "m4 6 4 4 4-4"} />
    </svg>
  );
}

export type DataTableSortButtonProps = Omit<ComponentPropsWithRef<"button">, "type"> & {
  /**
   * The column's current sort state. `none` still reserves space for the glyph,
   * so the label does not shift when sorting starts.
   * @default "none"
   */
  direction?: SortDirection;
  /** Match the column's text alignment — `end` for numeric columns. @default "start" */
  align?: "start" | "center" | "end";
};

/**
 * The sort control — a real `<button>`, so it is reachable and operable, and it
 * fills its whole header cell so the entire header is the target.
 *
 * Put `aria-sort` on the `<th>`, not here (or use `DataTableSortHeader`, which
 * does it for you). Cycle ascending → descending → unsorted, matching
 * TanStack's default: two-state cycling traps a user who sorted by accident.
 */
export function DataTableSortButton({ direction = "none", align, className, children, ...props }: DataTableSortButtonProps): ReactElement {
  return (
    <button type="button" className={cx(dataTableSort({ direction, align }), className)} {...props}>
      {children}
      <SortGlyph direction={direction} />
    </button>
  );
}

/* `align` is Omitted, not just overridden: `<th>` carries a native `align`
   attribute (React types it as the deprecated `"left" | "center" | "right" |
   "justify" | "char"`), so intersecting it with this component's own
   `"start" | "end"` leaves a type nothing satisfies — `align="end"` failed to
   compile at the call site with a bewildering "string is not assignable to
   undefined". The house prop-collision check exists for exactly this. */
export type DataTableSortHeaderProps = Omit<ComponentPropsWithRef<typeof TableHeader>, "children" | "align"> & {
  /** The column's current sort state, mirrored onto the `<th>`'s `aria-sort`. */
  direction?: SortDirection;
  /** Match the column's text alignment — `end` for numeric columns. Forwarded to
   *  the `<th>` as well as the sort button, so the header and its cells agree. */
  align?: "start" | "center" | "end";
  /** The visible column label. */
  children?: ReactNode;
  /** Fires when the header is activated — hand it the engine's sort toggler. */
  onSort?: () => void;
};

/**
 * A sortable column header: the `<th>` with its `aria-sort`, wrapping a
 * `DataTableSortButton`. Use this rather than assembling the two by hand — a
 * clickable `<th>` with an `onClick` and no button is the single most common
 * defect in hand-rolled tables (unreachable by keyboard, unannounced as
 * interactive), and a missing `aria-sort` is the second.
 */
export function DataTableSortHeader({ direction = "none", align, children, onSort, ...props }: DataTableSortHeaderProps): ReactElement {
  return (
    // `align` goes to BOTH the <th> and the button, and it has to. The button is
    // a flex row, so its label and glyph are placed by `justify-content`; the
    // <th>'s own `text-align` is what the column's <td>s match. Forwarding it to
    // the button alone — which is all this did originally — right-aligned the
    // header label while every cell below stayed at the leading edge, so the
    // documented way to mark a numeric column produced a visibly broken one.
    <TableHeader scope="col" align={align} aria-sort={direction === "none" ? "none" : direction === "asc" ? "ascending" : "descending"} {...props}>
      <DataTableSortButton direction={direction} align={align} onClick={onSort}>
        {children}
      </DataTableSortButton>
    </TableHeader>
  );
}

export type DataTableExpandTriggerProps = ComponentPropsWithRef<typeof Table.ExpandTrigger>;

/**
 * The row's disclosure control. Composes the headless
 * `Table.ExpandTrigger`, so `aria-expanded` and `aria-controls` are wired for
 * you — it must sit inside a `Table.Expandable`.
 *
 * Give it a name that identifies its row ("Show details for Ada Lovelace"); a
 * column of buttons all called "Expand" is useless in a screen reader's element
 * list. The chevron rotates rather than swapping glyphs, so it can animate.
 */
export function DataTableExpandTrigger({ className, children, ...props }: DataTableExpandTriggerProps): ReactElement {
  const { size } = useDataTableStyle("DataTableExpandTrigger");
  /* A real ghost Button through `asChild`, not a hand-rolled <button>. The Figma
     set instances an Icon Button here, and composing the component is what makes
     the control's box track size AND density: its square comes from Button's own
     `framed-control/{size}/height`, and its hover / active / focus-visible / ink
     come from the ghost variant. Hand-rolling it meant a box derived from a
     padding token plus a glyph, which drifted from every other control. */
  return (
    <Table.ExpandTrigger asChild {...props}>
      <Button
        variant="ghost"
        size={CONTROL_SIZE[size]}
        className={cx(dataTableExpand(), className)}
      >
        {children}
        <svg className={dataTableExpandIcon()} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m6 4 4 4-4 4" />
        </svg>
      </Button>
    </Table.ExpandTrigger>
  );
}

export type DataTableDetailRowProps = ComponentPropsWithRef<typeof Table.DetailRow>;

/**
 * The panel an expanded row opens onto. Composes the headless
 * `Table.DetailRow` and adds the clip/body wrappers the open-close transition
 * needs — the `display: grid` 0fr↔1fr technique cannot go on a `<tr>` or a
 * `<td>` (it takes the element out of the table layout algorithm and column
 * alignment collapses with it), so it lives one level in.
 *
 * Draws no fill and no leading rule: containment comes from the indent, which is
 * the headless `gutter` prop — pass the number of control columns and the panel
 * starts at the first data column, aligned by an empty spanning cell rather than
 * by CSS. The parent row sheds its own bottom rule automatically while expanded
 * (a `:has()` rule in styles.css), so the two read as one block without you
 * having to say so.
 *
 * Pass `forceMount` to animate. The collapsed row is then `aria-hidden`, so it
 * still does not inflate the table's announced row count.
 */
export function DataTableDetailRow({ className, children, cellProps, ...props }: DataTableDetailRowProps): ReactElement {
  return (
    <Table.DetailRow
      className={cx(dataTableDetailRow(), className)}
      cellProps={{ ...cellProps, className: cx(dataTableDetailCell(), cellProps?.className) }}
      {...props}
    >
      {/* THREE levels, not two, and each one is load-bearing: the grid clip, the
          zero-min-height overflow box, and — one further in — the padded body.
          Padding on the collapsing box sits outside its content box and FLOORS
          the collapse at twice the padding, so a closed row keeps a visible band
          (measured: 24px at md). Accordion's content/content-inner/content-body
          is the same three-part shape for the same reason. */}
      <div className={dataTableDetailClip()}>
        <div className={dataTableDetailBody()}>
          <div className={dataTableDetailContent()}>{children}</div>
        </div>
      </div>
    </Table.DetailRow>
  );
}
