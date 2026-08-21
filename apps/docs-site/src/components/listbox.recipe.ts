/*
 * Listbox styled-surface recipe — authored alongside the bespoke wrapper.
 *
 * Like Select and Dropdown, Listbox's wrapper is hand-authored (listbox.tsx):
 * five of its parts (OptionIndicator / OptionCheckbox / OptionLeading /
 * OptionLabel / OptionTrailing) are presentational spans with no headless
 * counterpart, mirroring the `Listbox / Option` row slots in Figma, and Empty is
 * a registry-only presentational row with no primitive at all. This recipe still
 * follows the generated shape: it maps the variant props to the contract's
 * modifier classes; the styling lives in the copied stylesheet
 * (RFC 0006 §6.1 / D53). Change contract.json + this file together.
 */
import { cva, type VariantProps } from "class-variance-authority";

export const listbox = cva("primitiv-listbox", {
  variants: {
    size: {
      xs: "primitiv-listbox--xs",
      sm: "primitiv-listbox--sm",
      md: "primitiv-listbox--md",
      lg: "primitiv-listbox--lg",
      xl: "primitiv-listbox--xl",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export type ListboxVariants = VariantProps<typeof listbox>;

export const listboxOption = cva("primitiv-listbox__option");

export type ListboxOptionVariants = VariantProps<typeof listboxOption>;

export const listboxOptionIndicator = cva("primitiv-listbox__option-indicator");

export type ListboxOptionIndicatorVariants = VariantProps<typeof listboxOptionIndicator>;

export const listboxOptionCheckbox = cva("primitiv-listbox__option-checkbox");

export type ListboxOptionCheckboxVariants = VariantProps<typeof listboxOptionCheckbox>;

export const listboxOptionLeading = cva("primitiv-listbox__option-leading");

export type ListboxOptionLeadingVariants = VariantProps<typeof listboxOptionLeading>;

export const listboxOptionLabel = cva("primitiv-listbox__option-label");

export type ListboxOptionLabelVariants = VariantProps<typeof listboxOptionLabel>;

export const listboxOptionTrailing = cva("primitiv-listbox__option-trailing");

export type ListboxOptionTrailingVariants = VariantProps<typeof listboxOptionTrailing>;

export const listboxGroup = cva("primitiv-listbox__group");

export type ListboxGroupVariants = VariantProps<typeof listboxGroup>;

export const listboxGroupLabel = cva("primitiv-listbox__group-label");

export type ListboxGroupLabelVariants = VariantProps<typeof listboxGroupLabel>;

export const listboxEmpty = cva("primitiv-listbox__empty");

export type ListboxEmptyVariants = VariantProps<typeof listboxEmpty>;
