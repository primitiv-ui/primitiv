/*
 * Select styled-surface recipe — authored alongside the bespoke wrapper.
 *
 * Like Dropdown, Select's wrapper is hand-authored (select.tsx): the rich Root
 * renders no DOM of its own (it is a context boundary plus a visually-hidden
 * form <select>), the same `size` axis has to reach two separately-anchored
 * elements — the control and the popover panel — and three of the parts
 * (ItemLeading / ItemLabel / ItemTrailing, plus GroupLabel and Icon) are
 * presentational spans with no headless counterpart. This recipe still follows
 * the generated shape: it maps the variant props to the contract's modifier
 * classes; the styling lives in the copied stylesheet (RFC 0006 §6.1 / D53).
 * Change contract.json + this file together.
 */
import { cva, type VariantProps } from "class-variance-authority";

export const select = cva("primitiv-select", {
  variants: {
    size: {
      xs: "primitiv-select--xs",
      sm: "primitiv-select--sm",
      md: "primitiv-select--md",
      lg: "primitiv-select--lg",
      xl: "primitiv-select--xl",
    },
    mode: {
      rich: "primitiv-select--rich",
      native: "primitiv-select--native",
    },
  },
  defaultVariants: {
    size: "md",
    mode: "rich",
  },
});

export type SelectVariants = VariantProps<typeof select>;

export const selectValue = cva("primitiv-select__value");

export type SelectValueVariants = VariantProps<typeof selectValue>;

export const selectLeading = cva("primitiv-select__leading");

export type SelectLeadingVariants = VariantProps<typeof selectLeading>;

export const selectIcon = cva("primitiv-select__icon");

export type SelectIconVariants = VariantProps<typeof selectIcon>;

export const selectContent = cva("primitiv-select__content", {
  variants: {
    size: {
      xs: "primitiv-select__content--xs",
      sm: "primitiv-select__content--sm",
      md: "primitiv-select__content--md",
      lg: "primitiv-select__content--lg",
      xl: "primitiv-select__content--xl",
    },
    placement: {
      "bottom-start": "primitiv-select__content--bottom-start",
      "bottom-end": "primitiv-select__content--bottom-end",
      "top-start": "primitiv-select__content--top-start",
      "top-end": "primitiv-select__content--top-end",
    },
  },
  defaultVariants: {
    size: "md",
    placement: "bottom-start",
  },
});

export type SelectContentVariants = VariantProps<typeof selectContent>;

export const selectItem = cva("primitiv-select__item");

export type SelectItemVariants = VariantProps<typeof selectItem>;

export const selectItemIndicator = cva("primitiv-select__item-indicator");

export type SelectItemIndicatorVariants = VariantProps<typeof selectItemIndicator>;

export const selectItemLeading = cva("primitiv-select__item-leading");

export type SelectItemLeadingVariants = VariantProps<typeof selectItemLeading>;

export const selectItemLabel = cva("primitiv-select__item-label");

export type SelectItemLabelVariants = VariantProps<typeof selectItemLabel>;

export const selectItemTrailing = cva("primitiv-select__item-trailing");

export type SelectItemTrailingVariants = VariantProps<typeof selectItemTrailing>;

export const selectGroup = cva("primitiv-select__group");

export type SelectGroupVariants = VariantProps<typeof selectGroup>;

export const selectGroupLabel = cva("primitiv-select__group-label");

export type SelectGroupLabelVariants = VariantProps<typeof selectGroupLabel>;

export const selectSeparator = cva("primitiv-select__separator");

export type SelectSeparatorVariants = VariantProps<typeof selectSeparator>;
