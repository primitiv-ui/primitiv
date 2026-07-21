import type {
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
