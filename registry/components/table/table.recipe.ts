/*
 * Table styled-surface recipe — generated from contract.json.
 *
 * Do not edit by hand: change registry/components/table/contract.json and regenerate.
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
  },
  defaultVariants: {
    size: "md",
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

export const tableHeader = cva("primitiv-table__header");

export type TableHeaderVariants = VariantProps<typeof tableHeader>;

export const tableCell = cva("primitiv-table__cell");

export type TableCellVariants = VariantProps<typeof tableCell>;

export const tableScrollArea = cva("primitiv-table__scroll-area");

export type TableScrollAreaVariants = VariantProps<typeof tableScrollArea>;

export const tableCaption = cva("primitiv-table__caption");

export type TableCaptionVariants = VariantProps<typeof tableCaption>;
