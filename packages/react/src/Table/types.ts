import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactNode,
  TableHTMLAttributes,
  ThHTMLAttributes,
  TdHTMLAttributes,
} from "react";

/**
 * Props for {@link TableRoot | `Table.Root`} — all `TableHTMLAttributes` on
 * the native `<table>`. No custom props are added.
 *
 * @extends HTMLTableElement
 */
export type TableRootProps = TableHTMLAttributes<HTMLTableElement>;

/**
 * Props for {@link TableHead | `Table.Head`} — all `HTMLAttributes` on the
 * native `<thead>`. No custom props are added.
 *
 * @extends HTMLTableSectionElement
 */
export type TableHeadProps = HTMLAttributes<HTMLTableSectionElement>;

/**
 * Props for {@link TableBody | `Table.Body`} — all `HTMLAttributes` on the
 * native `<tbody>`. No custom props are added.
 *
 * @extends HTMLTableSectionElement
 */
export type TableBodyProps = HTMLAttributes<HTMLTableSectionElement>;

/**
 * Props for {@link TableFooter | `Table.Footer`} — all `HTMLAttributes` on
 * the native `<tfoot>`. No custom props are added.
 *
 * @extends HTMLTableSectionElement
 */
export type TableFooterProps = HTMLAttributes<HTMLTableSectionElement>;

/**
 * Props for {@link TableRow | `Table.Row`} — all `HTMLAttributes` on the
 * native `<tr>`. No custom props are added.
 *
 * @extends HTMLTableRowElement
 */
export type TableRowProps = HTMLAttributes<HTMLTableRowElement>;

/**
 * Props for {@link TableHeader | `Table.Header`} — all `ThHTMLAttributes` on
 * the native `<th>`, including `colSpan`, `rowSpan`, and `abbr`.
 *
 * The most important prop for accessibility is `scope`: set it to `"col"` for
 * column headers and `"row"` for row headers so assistive technology can
 * associate data cells with the correct header. See the scope table on
 * {@link TableHeader}.
 *
 * @extends HTMLTableCellElement
 */
export type TableHeaderProps = ThHTMLAttributes<HTMLTableCellElement>;

/**
 * Props for {@link TableCell | `Table.Cell`} — all `TdHTMLAttributes` on the
 * native `<td>`.
 *
 * Includes `colSpan` and `rowSpan` for spanning multiple columns or rows.
 *
 * @extends HTMLTableCellElement
 */
export type TableCellProps = TdHTMLAttributes<HTMLTableCellElement>;

/**
 * Props for {@link TableScrollArea | `Table.ScrollArea`} — a required
 * `children` plus all `HTMLAttributes` on the wrapping `<div>`.
 *
 * @extends HTMLDivElement
 */
export type TableScrollAreaProps = {
  /** The table (typically a single {@link TableRoot | `Table.Root`}) to
   * wrap in the horizontally-scrolling container. */
  children: ReactNode;
  /**
   * Merged with (and taking priority over) the base scroll styles
   * (`display: block`, `overflow-x: auto`, `max-width: 100%`), so
   * additional styles can be layered on without repeating the scroll
   * declarations. See {@link TableScrollArea}'s custom-styles example.
   */
  style?: HTMLAttributes<HTMLDivElement>["style"];
} & Omit<HTMLAttributes<HTMLDivElement>, "style">;

/**
 * The value shared by {@link TableExpandable | `Table.Expandable`} with its
 * {@link TableExpandTrigger | `Table.ExpandTrigger`} and
 * {@link TableDetailRow | `Table.DetailRow`} children.
 *
 * @internal
 */
export type TableExpandableContextValue = {
  /** Whether the detail row is currently revealed. */
  expanded: boolean;
  /** The id wired to the detail row's `<tr>` and the trigger's `aria-controls`. */
  detailId: string;
  /** Flips `expanded` and notifies `onExpandedChange`. */
  toggle: () => void;
};

/**
 * Props for {@link TableExpandable | `Table.Expandable`} — the pairing
 * provider for one expandable row and its detail row.
 */
export type TableExpandableProps = {
  /** The parent {@link TableRow | `Table.Row`} and its
   * {@link TableDetailRow | `Table.DetailRow`}, as siblings. */
  children: ReactNode;
  /**
   * Whether the detail row is revealed. Pass this (with
   * `onExpandedChange`) to drive expansion from outside — which is what an
   * external table engine such as TanStack Table does.
   */
  expanded?: boolean;
  /**
   * Initial expanded state when running uncontrolled. Ignored when
   * `expanded` is supplied.
   * @default false
   */
  defaultExpanded?: boolean;
  /** Called with the next expanded state whenever the trigger is activated. */
  onExpandedChange?: (expanded: boolean) => void;
};

/**
 * Props for {@link TableExpandTrigger | `Table.ExpandTrigger`} — all
 * `ButtonHTMLAttributes` on the native `<button>`.
 *
 * `aria-expanded`, `aria-controls` and `type` are owned by the component and
 * therefore `Omit`-ted: they are derived from the surrounding
 * {@link TableExpandable | `Table.Expandable`} and must not be overridden, or
 * the relationship the pair exists to express would break.
 *
 * @extends HTMLButtonElement
 */
export type TableExpandTriggerProps = {
  /**
   * Render a consumer-supplied control instead of the native `<button>`, with
   * this part's `aria-expanded`, `aria-controls`, `data-state` and click
   * handling merged onto it via the {@link Slot} pattern.
   *
   * This is how a styled layer composes a real Button rather than re-creating
   * one: the registry `data-table` renders a ghost Button through it, matching
   * the Figma set, whose Expand Trigger is an Icon Button instance rather than a
   * drawn glyph. The child must be a single element that accepts a `ref`, and it
   * should be a `<button>` — the wiring assumes a control.
   * @default false
   */
  asChild?: boolean;
} & Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-expanded" | "aria-controls" | "type"
>;

/**
 * Props for {@link TableDetailRow | `Table.DetailRow`} — a required `colSpan`
 * plus all `HTMLAttributes` on the native `<tr>`.
 *
 * `id` is component-owned (it is the target of the trigger's `aria-controls`)
 * and so is `Omit`-ted.
 *
 * @extends HTMLTableRowElement
 */
export type TableDetailRowProps = {
  /** The detail panel's content. */
  children?: ReactNode;
  /**
   * How many columns the panel spans — **every** column the table renders,
   * control columns included.
   *
   * Deliberately a required prop rather than a value counted from context:
   * counting would mean the table registering its own columns, and an
   * external table engine already knows the number (TanStack Table:
   * `table.getVisibleLeafColumns().length`).
   */
  colSpan: number;
  /**
   * How many leading columns to leave empty before the panel starts — the
   * control columns (select, expand) a row renders in front of its data.
   *
   * The panel then spans the columns that remain, so `colSpan` keeps its
   * meaning: the table's full column count, gutter included.
   *
   * This is how a panel aligns with the first **data** column instead of the
   * table's edge (a panel starting under the checkbox reads as a new section of
   * the table rather than an opened row). Alignment by empty cell rather than by
   * a CSS indent is deliberate: the browser's own table layout resolves the
   * width, so it stays exact across every size, density and control-column set
   * with nothing measured and no arithmetic to drift.
   * @default 0
   */
  gutter?: number;
  /**
   * Keep the row mounted while collapsed so a CSS transition can run.
   *
   * Off by default, and that default matters more here than it does on a
   * `<div>`-based disclosure: a mounted row is still a **row**, so assistive
   * technology counts it, and a table of 24 rows with 24 force-mounted
   * detail rows announces 48. Opt in only when you are animating, and note
   * that the collapsed row remains in the accessibility tree while you do.
   * @default false
   */
  forceMount?: boolean;
  /** Passed through to the `<td>` that spans the row, for styling the cell
   * itself rather than the row. */
  cellProps?: TdHTMLAttributes<HTMLTableCellElement>;
} & Omit<HTMLAttributes<HTMLTableRowElement>, "id" | "children">;

/**
 * Props for {@link TableCaption | `Table.Caption`} — a required `children`,
 * an optional `captionSide`, plus all `HTMLAttributes` on the native
 * `<caption>`.
 *
 * @extends HTMLTableCaptionElement
 */
export type TableCaptionProps = {
  /** The visible, accessible label for the table. Preferred over
   * `aria-label`/`aria-labelledby` on the table itself — the browser
   * programmatically associates a `<caption>` with its `<table>`. */
  children: ReactNode;
  /**
   * Controls the CSS `caption-side` property, positioning the caption
   * above or below the table. See {@link TableCaption}'s placement
   * examples.
   * - `"bottom"` — caption appears below the table.
   * - `"top"` — caption appears above the table.
   * @default "bottom"
   */
  captionSide?: "bottom" | "top";
} & HTMLAttributes<HTMLTableCaptionElement>;
