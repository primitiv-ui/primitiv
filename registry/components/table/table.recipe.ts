/*
 * Table styled-surface recipe — generated from contract.json.
 *
 * Yours to edit once `primitiv add` copies it into your project — re-running
 * `add` keeps your changes unless you pass --force. (In the Primitiv repo,
 * edit registry/components/table/contract.json and regenerate instead.)
 * Maps the variant props to the contract's modifier classes; the styling lives
 * in the copied stylesheet (RFC 0006 §6.1 / D53).
 */
import { cva, type VariantProps } from "class-variance-authority";

export const table = cva("primitiv-table", {
  variants: {
    size: {
      xs: "primitiv-table--xs",
      sm: "primitiv-table--sm",
      md: "primitiv-table--md",
      lg: "primitiv-table--lg",
      xl: "primitiv-table--xl",
    },
    rows: {
      plain: "",
      striped: "primitiv-table--striped",
    },
  },
  defaultVariants: {
    size: "md",
    rows: "plain",
  },
});

export type TableVariants = VariantProps<typeof table>;

export const tableHead = cva("primitiv-table__head");

export type TableHeadVariants = VariantProps<typeof tableHead>;

export const tableBody = cva("primitiv-table__body");

export type TableBodyVariants = VariantProps<typeof tableBody>;

export const tableFooter = cva("primitiv-table__footer");

export type TableFooterVariants = VariantProps<typeof tableFooter>;

export const tableRow = cva("primitiv-table__row");

export type TableRowVariants = VariantProps<typeof tableRow>;

export const tableHeader = cva("primitiv-table__header", {
  variants: {
    align: {
      start: "primitiv-table__header--start",
      center: "primitiv-table__header--center",
      end: "primitiv-table__header--end",
    },
  },
  defaultVariants: {
    align: "start",
  },
});

export type TableHeaderVariants = VariantProps<typeof tableHeader>;

export const tableCell = cva("primitiv-table__cell", {
  variants: {
    align: {
      start: "primitiv-table__cell--start",
      center: "primitiv-table__cell--center",
      end: "primitiv-table__cell--end",
    },
  },
  defaultVariants: {
    align: "start",
  },
});

export type TableCellVariants = VariantProps<typeof tableCell>;

export const tableScrollArea = cva("primitiv-table__scroll-area");

export type TableScrollAreaVariants = VariantProps<typeof tableScrollArea>;

export const tableCaption = cva("primitiv-table__caption");

export type TableCaptionVariants = VariantProps<typeof tableCaption>;
