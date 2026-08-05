/*
 * SplitButton — class recipes, HAND-AUTHORED.
 *
 * Keep in sync with contract.json and styles.css by hand: the generators only
 * emit primitive-backed single-element and structural-compound wrappers, and
 * this component is a composition over three of them (button, dropdown and the
 * headless SplitButton), so there is no drift-guard test.
 */
import { cva } from "class-variance-authority";

export const splitButton = cva("primitiv-split-button", {
  variants: {
    variant: {
      primary: "primitiv-split-button--primary",
      secondary: "primitiv-split-button--secondary",
      danger: "primitiv-split-button--danger",
    },
    size: {
      xs: "primitiv-split-button--xs",
      sm: "primitiv-split-button--sm",
      md: "primitiv-split-button--md",
      lg: "primitiv-split-button--lg",
      xl: "primitiv-split-button--xl",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
  },
});

export const splitButtonAction = cva("primitiv-split-button__action");

export const splitButtonTrigger = cva("primitiv-split-button__trigger");

export const splitButtonMenu = cva("primitiv-split-button__menu");
