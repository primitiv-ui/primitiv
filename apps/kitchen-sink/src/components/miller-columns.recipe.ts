/*
 * MillerColumns styled-surface recipe — hand-authored against contract.json.
 *
 * Keep in sync with registry/components/miller-columns/contract.json: maps the
 * variant props to the contract's modifier classes; the styling lives in the
 * copied stylesheet (RFC 0006 §6.1 / D53).
 */
import { cva, type VariantProps } from "class-variance-authority";

export const millerColumns = cva("primitiv-miller-columns", {
  variants: {
    size: {
      xs: "primitiv-miller-columns--xs",
      sm: "primitiv-miller-columns--sm",
      md: "primitiv-miller-columns--md",
      lg: "primitiv-miller-columns--lg",
      xl: "primitiv-miller-columns--xl",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export type MillerColumnsVariants = VariantProps<typeof millerColumns>;

export const millerColumnsColumn = cva("primitiv-miller-columns__column");

export const millerColumnsItem = cva("primitiv-miller-columns__item");

export const millerColumnsItemLabel = cva("primitiv-miller-columns__item-label");

export const millerColumnsItemIndicator = cva(
  "primitiv-miller-columns__item-indicator",
);

export const millerColumnsResizeHandle = cva(
  "primitiv-miller-columns__resize-handle",
);

export const millerColumnsPreview = cva("primitiv-miller-columns__preview");

export const millerColumnsEmpty = cva("primitiv-miller-columns__empty");
