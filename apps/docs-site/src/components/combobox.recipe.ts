/*
 * Combobox styled-surface recipe — authored alongside the bespoke wrapper.
 *
 * Like Select, Dropdown and Listbox, Combobox's wrapper is hand-authored
 * (combobox.tsx): the control has to be a wrapper element around the headless
 * <input> so a chevron can sit beside the field, and six of its parts (Control /
 * Leading / Icon / ItemIndicator / ItemLeading / ItemLabel / ItemTrailing) are
 * presentational with no headless counterpart. This recipe still follows the
 * generated shape: it maps the variant props to the contract's modifier classes;
 * the styling lives in the copied stylesheet (RFC 0006 §6.1 / D53).
 *
 * Note the size variants live on the ROOT recipe only. Every knob is declared on
 * the root and inherits down the DOM tree, panel included, so no other part
 * carries a size axis — contrast Select, whose root renders no element in rich
 * mode and so has to repeat the axis on its trigger and content.
 *
 * Change contract.json + this file together.
 */
import { cva, type VariantProps } from "class-variance-authority";

export const combobox = cva("primitiv-combobox", {
  variants: {
    size: {
      xs: "primitiv-combobox--xs",
      sm: "primitiv-combobox--sm",
      md: "primitiv-combobox--md",
      lg: "primitiv-combobox--lg",
      xl: "primitiv-combobox--xl",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export type ComboboxVariants = VariantProps<typeof combobox>;

export const comboboxControl = cva("primitiv-combobox__control");

export type ComboboxControlVariants = VariantProps<typeof comboboxControl>;

export const comboboxLeading = cva("primitiv-combobox__leading");

export type ComboboxLeadingVariants = VariantProps<typeof comboboxLeading>;

export const comboboxInput = cva("primitiv-combobox__input");

export type ComboboxInputVariants = VariantProps<typeof comboboxInput>;

export const comboboxIcon = cva("primitiv-combobox__icon");

export type ComboboxIconVariants = VariantProps<typeof comboboxIcon>;

export const comboboxContent = cva("primitiv-combobox__content");

export type ComboboxContentVariants = VariantProps<typeof comboboxContent>;

export const comboboxItem = cva("primitiv-combobox__item");

export type ComboboxItemVariants = VariantProps<typeof comboboxItem>;

export const comboboxItemIndicator = cva("primitiv-combobox__item-indicator");

export type ComboboxItemIndicatorVariants = VariantProps<typeof comboboxItemIndicator>;

export const comboboxItemLeading = cva("primitiv-combobox__item-leading");

export type ComboboxItemLeadingVariants = VariantProps<typeof comboboxItemLeading>;

export const comboboxItemLabel = cva("primitiv-combobox__item-label");

export type ComboboxItemLabelVariants = VariantProps<typeof comboboxItemLabel>;

export const comboboxItemTrailing = cva("primitiv-combobox__item-trailing");

export type ComboboxItemTrailingVariants = VariantProps<typeof comboboxItemTrailing>;

export const comboboxEmpty = cva("primitiv-combobox__empty");

export type ComboboxEmptyVariants = VariantProps<typeof comboboxEmpty>;
