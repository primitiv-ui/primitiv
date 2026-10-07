/*
 * Field styled-surface recipe — generated from contract.json.
 *
 * Yours to edit once `primitiv add` copies it into your project — re-running
 * `add` keeps your changes unless you pass --force. (In the Primitiv repo,
 * edit registry/components/field/contract.json and regenerate instead.)
 * Maps the variant props to the contract's modifier classes; the styling lives
 * in the copied stylesheet (RFC 0006 §6.1 / D53).
 */
import { cva, type VariantProps } from "class-variance-authority";

export const field = cva("primitiv-field", {
  variants: {
    size: {
      xs: "primitiv-field--xs",
      sm: "primitiv-field--sm",
      md: "primitiv-field--md",
      lg: "primitiv-field--lg",
      xl: "primitiv-field--xl",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export type FieldVariants = VariantProps<typeof field>;

export const fieldLabel = cva("primitiv-field__label");

export type FieldLabelVariants = VariantProps<typeof fieldLabel>;

export const fieldDescription = cva("primitiv-field__description");

export type FieldDescriptionVariants = VariantProps<typeof fieldDescription>;

export const fieldErrorText = cva("primitiv-field__error");

export type FieldErrorTextVariants = VariantProps<typeof fieldErrorText>;
