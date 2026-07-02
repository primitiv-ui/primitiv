import "../styles/primitiv/table/styles.css";
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
export type TableProps = DistributiveOmit<ComponentPropsWithRef<typeof TablePrimitive.Root>, "size"> & {
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
};

export function Table({ size, className, ...props }: TableProps) {
  return <TablePrimitive.Root className={[table({ size }), className].filter(Boolean).join(" ")} {...props} />;
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

export type TableHeaderProps = ComponentPropsWithRef<typeof TablePrimitive.Header>;

export function TableHeader({ className, ...props }: TableHeaderProps) {
  return <TablePrimitive.Header className={[tableHeader(), className].filter(Boolean).join(" ")} {...props} />;
}

export type TableCellProps = ComponentPropsWithRef<typeof TablePrimitive.Cell>;

export function TableCell({ className, ...props }: TableCellProps) {
  return <TablePrimitive.Cell className={[tableCell(), className].filter(Boolean).join(" ")} {...props} />;
}

export type TableScrollAreaProps = ComponentPropsWithRef<typeof TablePrimitive.ScrollArea>;

export function TableScrollArea({ className, ...props }: TableScrollAreaProps) {
  return <TablePrimitive.ScrollArea className={[tableScrollArea(), className].filter(Boolean).join(" ")} {...props} />;
}

export type TableCaptionProps = ComponentPropsWithRef<typeof TablePrimitive.Caption>;

export function TableCaption({ className, ...props }: TableCaptionProps) {
  return <TablePrimitive.Caption className={[tableCaption(), className].filter(Boolean).join(" ")} {...props} />;
}
