/*
 * Dropdown styled-surface recipe — authored alongside the bespoke wrapper.
 *
 * Like Popover and Modal, Dropdown's wrapper is hand-authored (dropdown.tsx)
 * because Dropdown.Root / Trigger / Sub take no className (Root and Sub are
 * context providers with no DOM; Trigger is a pass-through button). This recipe
 * still follows the generated shape: it maps the variant props to the contract's
 * modifier classes; the styling lives in the copied stylesheet (RFC 0006 §6.1 /
 * D53). Change contract.json + this file together.
 */
import { cva, type VariantProps } from "class-variance-authority";

export const dropdown = cva("primitiv-dropdown", {
  variants: {
    size: {
      xs: "primitiv-dropdown--xs",
      sm: "primitiv-dropdown--sm",
      md: "primitiv-dropdown--md",
      lg: "primitiv-dropdown--lg",
      xl: "primitiv-dropdown--xl",
    },
    placement: {
      "bottom-start": "primitiv-dropdown--bottom-start",
      "bottom-end": "primitiv-dropdown--bottom-end",
      "top-start": "primitiv-dropdown--top-start",
      "top-end": "primitiv-dropdown--top-end",
      submenu: "primitiv-dropdown--submenu",
    },
  },
  defaultVariants: {
    size: "md",
    placement: "bottom-start",
  },
});

export type DropdownVariants = VariantProps<typeof dropdown>;

export const dropdownItem = cva("primitiv-dropdown__item");

export type DropdownItemVariants = VariantProps<typeof dropdownItem>;

export const dropdownCheckboxItem = cva("primitiv-dropdown__checkbox-item");

export type DropdownCheckboxItemVariants = VariantProps<typeof dropdownCheckboxItem>;

export const dropdownRadioItem = cva("primitiv-dropdown__radio-item");

export type DropdownRadioItemVariants = VariantProps<typeof dropdownRadioItem>;

export const dropdownItemIndicator = cva("primitiv-dropdown__item-indicator");

export type DropdownItemIndicatorVariants = VariantProps<typeof dropdownItemIndicator>;

export const dropdownLabel = cva("primitiv-dropdown__label");

export type DropdownLabelVariants = VariantProps<typeof dropdownLabel>;

export const dropdownSeparator = cva("primitiv-dropdown__separator");

export type DropdownSeparatorVariants = VariantProps<typeof dropdownSeparator>;

export const dropdownGroup = cva("primitiv-dropdown__group");

export type DropdownGroupVariants = VariantProps<typeof dropdownGroup>;

export const dropdownRadioGroup = cva("primitiv-dropdown__radio-group");

export type DropdownRadioGroupVariants = VariantProps<typeof dropdownRadioGroup>;

export const dropdownSubTrigger = cva("primitiv-dropdown__sub-trigger");

export type DropdownSubTriggerVariants = VariantProps<typeof dropdownSubTrigger>;
