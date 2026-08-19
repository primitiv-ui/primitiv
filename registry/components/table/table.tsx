/*
 * Table — styled wrapper, generated from contract.json.
 *
 * Do not edit by hand: change registry/components/table/contract.json and regenerate.
 * A typed props surface over the headless @primitiv-ui/react component + the
 * generated recipe — the primary DX (RFC 0004 §3.5 / D51).
 */
import { Table as TablePrimitive } from "@primitiv-ui/react";
import { type ComponentPropsWithRef } from "react";
import { table, tableHead, tableBody, tableFooter, tableRow, tableHeader, tableCell, tableScrollArea, tableCaption } from "./table.recipe";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/**
 * An accessible data table — a compound of standard HTML table elements (`<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`, `<caption>`) with a tokenised default theme.
 *
 * @see https://primitiv-ui.dev/docs/components/table
 */
export type TableProps = DistributiveOmit<ComponentPropsWithRef<typeof TablePrimitive.Root>, "size" | "rows"> & {
  /**
   * Type scale for the whole table; `data-density` scales cell padding further.
   * - `xs` — Extra small.
   * - `sm` — Small.
   * - `md` — Medium (the default).
   * - `lg` — Large.
   * - `xl` — Extra large.
   * @default "md"
   * @see https://primitiv-ui.dev/docs/components/table
   */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /**
   * Whether body rows alternate a subtle stripe for readability.
   * - `plain` — No banding (the default).
   * - `striped` — Even body rows take the table/row/stripe fill.
   * @default "plain"
   * @see https://primitiv-ui.dev/docs/components/table
   */
  rows?: "plain" | "striped";
};

export function Table({ size, rows, className, ...props }: TableProps) {
  return <TablePrimitive.Root className={[table({ size, rows }), className].filter(Boolean).join(" ")} {...props} />;
}

export type TableHeadProps = ComponentPropsWithRef<typeof TablePrimitive.Head>;

export function TableHead({ className, ...props }: TableHeadProps) {
  return <TablePrimitive.Head className={[tableHead(), className].filter(Boolean).join(" ")} {...props} />;
}

export type TableBodyProps = ComponentPropsWithRef<typeof TablePrimitive.Body>;

export function TableBody({ className, ...props }: TableBodyProps) {
  return <TablePrimitive.Body className={[tableBody(), className].filter(Boolean).join(" ")} {...props} />;
}

export type TableFooterProps = ComponentPropsWithRef<typeof TablePrimitive.Footer>;

export function TableFooter({ className, ...props }: TableFooterProps) {
  return <TablePrimitive.Footer className={[tableFooter(), className].filter(Boolean).join(" ")} {...props} />;
}

export type TableRowProps = ComponentPropsWithRef<typeof TablePrimitive.Row>;

export function TableRow({ className, ...props }: TableRowProps) {
  return <TablePrimitive.Row className={[tableRow(), className].filter(Boolean).join(" ")} {...props} />;
}

export type TableHeaderProps = DistributiveOmit<ComponentPropsWithRef<typeof TablePrimitive.Header>, "align"> & {
  /**
   * Column text alignment, matching Figma's Table / Header Cell `Align` axis. Set it to match the column's cells — `end` for numeric columns. Direction-aware — `start`/`end` follow the reading direction, flipping under RTL.
   * - `start` — Header text at the start edge (the default).
   * - `center` — Header text centred.
   * - `end` — Header text at the end edge, for a numeric column.
   * @default "start"
   * @see https://primitiv-ui.dev/docs/components/table
   */
  align?: "start" | "center" | "end";
};

export function TableHeader({ align, className, ...props }: TableHeaderProps) {
  return <TablePrimitive.Header className={[tableHeader({ align }), className].filter(Boolean).join(" ")} {...props} />;
}

export type TableCellProps = DistributiveOmit<ComponentPropsWithRef<typeof TablePrimitive.Cell>, "align"> & {
  /**
   * Cell text alignment, matching Figma's Table / Cell `Align` axis. CSS cannot align a whole column (`text-align` does not apply to `<col>`), so set this on every cell in the column. Direction-aware — `start`/`end` follow the reading direction, flipping under RTL.
   * - `start` — Cell text at the start edge (the default).
   * - `center` — Cell text centred.
   * - `end` — Cell text at the end edge, for a numeric column.
   * @default "start"
   * @see https://primitiv-ui.dev/docs/components/table
   */
  align?: "start" | "center" | "end";
};

export function TableCell({ align, className, ...props }: TableCellProps) {
  return <TablePrimitive.Cell className={[tableCell({ align }), className].filter(Boolean).join(" ")} {...props} />;
}

export type TableScrollAreaProps = ComponentPropsWithRef<typeof TablePrimitive.ScrollArea>;

export function TableScrollArea({ className, ...props }: TableScrollAreaProps) {
  return <TablePrimitive.ScrollArea className={[tableScrollArea(), className].filter(Boolean).join(" ")} {...props} />;
}

export type TableCaptionProps = ComponentPropsWithRef<typeof TablePrimitive.Caption>;

export function TableCaption({ className, ...props }: TableCaptionProps) {
  return <TablePrimitive.Caption className={[tableCaption(), className].filter(Boolean).join(" ")} {...props} />;
}
