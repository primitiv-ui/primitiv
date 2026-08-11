/*
 * Stepper styled-surface recipe — HAND-AUTHORED (see stepper.tsx).
 *
 * Maps the variant props to the contract's modifier classes; the styling lives
 * in the copied stylesheet (RFC 0006 §6.1 / D53). Only the root carries a
 * modifier group — every other part is a single stable class, because a step's
 * appearance is driven by data attributes (`data-state` from Tabs,
 * `data-step-state` from StepperStep), not by variant classes.
 */
import { cva, type VariantProps } from "class-variance-authority";

export const stepper = cva("primitiv-stepper", {
  variants: {
    size: {
      xs: "primitiv-stepper--xs",
      sm: "primitiv-stepper--sm",
      md: "primitiv-stepper--md",
      lg: "primitiv-stepper--lg",
      xl: "primitiv-stepper--xl",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export type StepperVariants = VariantProps<typeof stepper>;

export const stepperList = cva("primitiv-stepper__list", {
  variants: {
    compact: {
      true: "primitiv-stepper__list--compact",
      false: "",
    },
  },
  defaultVariants: {
    compact: false,
  },
});

export type StepperListVariants = VariantProps<typeof stepperList>;

export const stepperStep = cva("primitiv-stepper__step");

export type StepperStepVariants = VariantProps<typeof stepperStep>;

export const stepperMarker = cva("primitiv-stepper__marker");

export type StepperMarkerVariants = VariantProps<typeof stepperMarker>;

export const stepperLabel = cva("primitiv-stepper__label");

export type StepperLabelVariants = VariantProps<typeof stepperLabel>;

export const stepperDescription = cva("primitiv-stepper__description");

export type StepperDescriptionVariants = VariantProps<typeof stepperDescription>;

export const stepperPanel = cva("primitiv-stepper__panel");

export type StepperPanelVariants = VariantProps<typeof stepperPanel>;
