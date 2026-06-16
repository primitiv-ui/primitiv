import type { ReactElement } from "react";

import {
  TableBodyProps,
  TableCaptionProps,
  TableCellProps,
  TableFooterProps,
  TableHeaderProps,
  TableHeadProps,
  TableRootProps,
  TableRowProps,
  TableScrollAreaProps,
} from "./types";

/**
 * The root of a Table widget — renders a plain `<table>` element and passes
 * all `TableHTMLAttributes` through to the DOM.
 *
 * The `<table>` element carries an implicit `role="table"` in the accessibility
 * tree. Assistive technology will announce it as a table and report the number
 * of rows and columns to the user.
 *
 * Always pair column headers (`Table.Header`) with the correct
 * {@link TableHeaderProps.scope | `scope`} attribute so screen readers can
 * associate data cells with their headers.
 *
 * @example
 * ```tsx
 * <Table.Root>
 *   <Table.Head>
 *     <Table.Row>
 *       <Table.Header scope="col">Name</Table.Header>
 *       <Table.Header scope="col">Role</Table.Header>
 *     </Table.Row>
 *   </Table.Head>
 *   <Table.Body>
 *     <Table.Row>
 *       <Table.Cell>Alice</Table.Cell>
 *       <Table.Cell>Engineer</Table.Cell>
 *     </Table.Row>
 *   </Table.Body>
 * </Table.Root>
 * ```
 */
function Table({ children, ...rest }: TableRootProps): ReactElement {
  return <table {...rest}>{children}</table>;
}

Table.displayName = "Table";

/**
 * Groups header rows inside a `<thead>` element.
 *
 * Browsers and assistive technology treat rows inside `<thead>` as column
 * headers. When a table is printed across multiple pages, the browser may
 * repeat the `<thead>` content at the top of each page.
 *
 * @example
 * ```tsx
 * <Table.Head>
 *   <Table.Row>
 *     <Table.Header scope="col">Name</Table.Header>
 *     <Table.Header scope="col">Email</Table.Header>
 *   </Table.Row>
 * </Table.Head>
 * ```
 */
function TableHead({ children, ...rest }: TableHeadProps): ReactElement {
  return <thead {...rest}>{children}</thead>;
}

TableHead.displayName = "TableHead";

/**
 * Groups data rows inside a `<tbody>` element.
 *
 * Using `<tbody>` explicitly improves accessibility and allows browsers to
 * scroll the body independently of a fixed header. Multiple `<tbody>` elements
 * are valid and useful for visually separating logical row groups within a
 * single table.
 *
 * @example
 * ```tsx
 * <Table.Body>
 *   <Table.Row>
 *     <Table.Cell>Alice</Table.Cell>
 *     <Table.Cell>alice@example.com</Table.Cell>
 *   </Table.Row>
 * </Table.Body>
 * ```
 */
function TableBody({ children, ...rest }: TableBodyProps): ReactElement {
  return <tbody {...rest}>{children}</tbody>;
}

TableBody.displayName = "TableBody";

/**
 * Groups footer rows inside a `<tfoot>` element.
 *
 * Typically used for summary rows — totals, averages, counts. When a table is
 * printed across multiple pages some browsers repeat the `<tfoot>` content at
 * the bottom of each page.
 *
 * @example
 * ```tsx
 * <Table.Footer>
 *   <Table.Row>
 *     <Table.Cell>Total</Table.Cell>
 *     <Table.Cell>£1,200</Table.Cell>
 *   </Table.Row>
 * </Table.Footer>
 * ```
 */
function TableFooter({ children, ...rest }: TableFooterProps): ReactElement {
  return <tfoot {...rest}>{children}</tfoot>;
}

TableFooter.displayName = "TableFooter";

/**
 * An individual table row — renders a `<tr>` element.
 *
 * May contain `Table.Header` (`<th>`) or `Table.Cell` (`<td>`) children, or a
 * mix of both when the row contains both header and data cells (e.g. the first
 * column of each row is a row header).
 *
 * @example
 * ```tsx
 * <Table.Row>
 *   <Table.Header scope="row">Alice</Table.Header>
 *   <Table.Cell>Engineer</Table.Cell>
 *   <Table.Cell>London</Table.Cell>
 * </Table.Row>
 * ```
 */
function TableRow({ children, ...rest }: TableRowProps): ReactElement {
  return <tr {...rest}>{children}</tr>;
}

TableRow.displayName = "TableRow";

/**
 * A header cell — renders a `<th>` element with an implicit
 * `role="columnheader"` or `role="rowheader"` depending on context.
 *
 * **`scope` prop.** The `scope` attribute is the primary accessibility
 * contract for table headers. Set it so assistive technology knows which data
 * cells this header describes:
 *
 * | Value | Associates header with |
 * | ----- | ---------------------- |
 * | `"col"` | All cells in the same column |
 * | `"row"` | All cells in the same row |
 * | `"colgroup"` | All cells in the column group spanned by this header |
 * | `"rowgroup"` | All cells in the row group spanned by this header |
 *
 * All `ThHTMLAttributes` (including `colSpan`, `rowSpan`, `abbr`) pass
 * through to the DOM.
 *
 * @example Column header
 * ```tsx
 * <Table.Header scope="col">Name</Table.Header>
 * ```
 *
 * @example Row header
 * ```tsx
 * <Table.Header scope="row">Alice</Table.Header>
 * ```
 */
function TableHeader({ children, ...rest }: TableHeaderProps): ReactElement {
  return <th {...rest}>{children}</th>;
}

TableHeader.displayName = "TableHeader";

/**
 * A data cell — renders a `<td>` element.
 *
 * All `TdHTMLAttributes` pass through to the DOM, including `colSpan` and
 * `rowSpan` for spanning multiple columns or rows.
 *
 * @example Basic cell
 * ```tsx
 * <Table.Cell>alice@example.com</Table.Cell>
 * ```
 *
 * @example Spanning two columns
 * ```tsx
 * <Table.Cell colSpan={2}>Full-width note</Table.Cell>
 * ```
 */
function TableCell({ children, ...rest }: TableCellProps): ReactElement {
  return <td {...rest}>{children}</td>;
}

TableCell.displayName = "TableCell";

/**
 * A horizontal-scroll wrapper for tables wider than their container.
 *
 * Renders a `<div>` with `display: block`, `overflow-x: auto`, and
 * `max-width: 100%` applied as inline styles, then wraps a `Table.Root`
 * inside it. Use this when your table has many columns and you want it to
 * scroll horizontally on narrow viewports instead of overflowing or
 * compressing.
 *
 * **Custom styles.** Any `style` properties you pass are merged with (and take priority
 * over) the base scroll styles, so you can layer additional styles freely without
 * repeating the scroll declarations:
 *
 * ```tsx
 * <Table.ScrollArea style={{ borderRadius: "8px" }}>
 *   …
 * </Table.ScrollArea>
 * ```
 *
 * @example
 * ```tsx
 * <Table.ScrollArea>
 *   <Table.Root>
 *     …
 *   </Table.Root>
 * </Table.ScrollArea>
 * ```
 */
function TableScrollArea({
  children,
  style,
  ...rest
}: TableScrollAreaProps): ReactElement {
  return (
    <div
      style={{
        display: "block",
        overflowX: "auto",
        maxWidth: "100%",
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

TableScrollArea.displayName = "TableScrollArea";

/**
 * A visible caption for the table — renders a `<caption>` element.
 *
 * A visible `<caption>` is the preferred way to label a table for
 * accessibility. It is programmatically associated with the `<table>` element
 * by the browser, so assistive technology announces it when the user enters
 * the table — no `aria-label` or `aria-labelledby` on the table itself is
 * needed.
 *
 * **`captionSide` prop.** Controls whether the caption appears above or below
 * the table via the CSS `caption-side` property. Defaults to `"bottom"`.
 *
 * | Value | Position |
 * | ----- | -------- |
 * | `"bottom"` (default) | Below the table |
 * | `"top"` | Above the table |
 *
 * @example Default (caption below table)
 * ```tsx
 * <Table.Root>
 *   <Table.Caption>Q1 sales figures by region</Table.Caption>
 *   …
 * </Table.Root>
 * ```
 *
 * @example Caption above table
 * ```tsx
 * <Table.Root>
 *   <Table.Caption captionSide="top">Q1 sales figures by region</Table.Caption>
 *   …
 * </Table.Root>
 * ```
 */
function TableCaption({
  children,
  captionSide = "bottom",
  ...rest
}: TableCaptionProps): ReactElement {
  return (
    <caption style={{ captionSide }} {...rest}>
      {children}
    </caption>
  );
}

TableCaption.displayName = "TableCaption";

type TableCompound = typeof Table & {
  Root: typeof Table;
  Head: typeof TableHead;
  Body: typeof TableBody;
  Footer: typeof TableFooter;
  Row: typeof TableRow;
  Header: typeof TableHeader;
  Cell: typeof TableCell;
  ScrollArea: typeof TableScrollArea;
  Caption: typeof TableCaption;
};

const TableCompound: TableCompound = Object.assign(Table, {
  Root: Table,
  Head: TableHead,
  Body: TableBody,
  Footer: TableFooter,
  Row: TableRow,
  Header: TableHeader,
  Cell: TableCell,
  ScrollArea: TableScrollArea,
  Caption: TableCaption,
});

/**
 * Headless, accessible **Table** — a compound component wrapping standard
 * HTML table elements with zero styles.
 *
 * `Table` is both callable (it's an alias of {@link Table | `Table.Root`})
 * and carries its sub-components as static properties. Prefer the namespaced
 * form in application code for readability:
 *
 * - {@link Table | `Table.Root`} — `<table>`, implicit `role="table"`.
 * - {@link TableHead | `Table.Head`} — `<thead>`, groups header rows.
 * - {@link TableBody | `Table.Body`} — `<tbody>`, groups data rows.
 * - {@link TableFooter | `Table.Footer`} — `<tfoot>`, groups footer/summary rows.
 * - {@link TableRow | `Table.Row`} — `<tr>`, individual row.
 * - {@link TableHeader | `Table.Header`} — `<th>`, header cell; use `scope` for accessibility.
 * - {@link TableCell | `Table.Cell`} — `<td>`, data cell.
 * - {@link TableScrollArea | `Table.ScrollArea`} — horizontal-scroll wrapper for wide tables.
 * - {@link TableCaption | `Table.Caption`} — `<caption>`, visible accessible table label.
 *
 * @example Minimal usage
 * ```tsx
 * import { Table } from "@primitiv-ui/react";
 *
 * export function Demo() {
 *   return (
 *     <Table.Root>
 *       <Table.Caption>Team members</Table.Caption>
 *       <Table.Head>
 *         <Table.Row>
 *           <Table.Header scope="col">Name</Table.Header>
 *           <Table.Header scope="col">Role</Table.Header>
 *         </Table.Row>
 *       </Table.Head>
 *       <Table.Body>
 *         <Table.Row>
 *           <Table.Cell>Alice</Table.Cell>
 *           <Table.Cell>Engineer</Table.Cell>
 *         </Table.Row>
 *       </Table.Body>
 *     </Table.Root>
 *   );
 * }
 * ```
 *
 * @example Responsive — horizontal scroll on narrow viewports
 * ```tsx
 * <Table.ScrollArea>
 *   <Table.Root>…</Table.Root>
 * </Table.ScrollArea>
 * ```
 *
 * @example Styling with any system
 * Because no styles ship with the component, target the rendered elements
 * with whatever system you use (CSS, Tailwind, design tokens, etc.):
 *
 * ```css
 * table   { border-collapse: collapse; width: 100%; }
 * th, td  { padding: 0.5rem 1rem; border: 1px solid #e5e7eb; }
 * thead   { background: #f9fafb; }
 * ```
 *
 * @see {@link TableHeader} for the `scope` attribute and its accessibility contract.
 * @see {@link TableCaption} for caption placement and why it beats `aria-label`.
 * @see {@link TableScrollArea} for the horizontal-scroll style caveat.
 */
TableCompound.displayName = "Table";

export { TableCompound as Table };
