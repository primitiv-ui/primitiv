/*
 * DataTable — class recipes, HAND-AUTHORED (this component composes other
 * registry components and the headless Table's expandable-row seam, so no
 * generator emits it). Keep in sync with contract.json and styles.css by hand.
 */
import { cva } from "class-variance-authority";

export const dataTable = cva("primitiv-data-table", {
  variants: {
    size: {
      xs: "primitiv-data-table--xs",
      sm: "primitiv-data-table--sm",
      md: "primitiv-data-table--md",
      lg: "primitiv-data-table--lg",
      xl: "primitiv-data-table--xl",
    },
    frame: {
      framed: "",
      bare: "primitiv-data-table--bare",
    },
    sticky: {
      true: "primitiv-data-table--sticky",
      false: "",
    },
  },
  defaultVariants: {
    size: "md",
    frame: "framed",
    sticky: false,
  },
});

export const dataTableToolbar = cva("primitiv-data-table__toolbar");

export const dataTableFooter = cva("primitiv-data-table__footer");

export const dataTableRegion = cva("primitiv-data-table__region", {
  variants: {
    align: {
      start: "primitiv-data-table__region--start",
      center: "primitiv-data-table__region--center",
      end: "primitiv-data-table__region--end",
    },
  },
  defaultVariants: {
    align: "start",
  },
});

export const dataTableControlCell = cva("primitiv-data-table__control-cell");

export const dataTableSort = cva("primitiv-data-table__sort", {
  variants: {
    align: {
      start: "",
      end: "primitiv-data-table__sort--end",
    },
    direction: {
      none: "primitiv-data-table__sort--unsorted",
      asc: "",
      desc: "",
    },
  },
  defaultVariants: {
    align: "start",
    direction: "none",
  },
});

export const dataTableSortIcon = cva("primitiv-data-table__sort-icon");

export const dataTableExpand = cva("primitiv-data-table__expand");

export const dataTableExpandIcon = cva("primitiv-data-table__expand-icon");

export const dataTableDetailRow = cva("primitiv-data-table__detail-row");

export const dataTableDetailCell = cva("primitiv-data-table__detail-cell");

export const dataTableDetailClip = cva("primitiv-data-table__detail-clip");

export const dataTableDetailBody = cva("primitiv-data-table__detail-body");
