/*
 * Slider styled-surface recipe — generated from contract.json.
 *
 * Yours to edit once `primitiv add` copies it into your project — re-running
 * `add` keeps your changes unless you pass --force. (In the Primitiv repo,
 * edit registry/components/slider/contract.json and regenerate instead.)
 * Maps the variant props to the contract's modifier classes; the styling lives
 * in the copied stylesheet (RFC 0006 §6.1 / D53).
 */
import { cva, type VariantProps } from "class-variance-authority";

export const slider = cva("primitiv-slider", {
  variants: {
    size: {
      xs: "primitiv-slider--xs",
      sm: "primitiv-slider--sm",
      md: "primitiv-slider--md",
      lg: "primitiv-slider--lg",
      xl: "primitiv-slider--xl",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export type SliderVariants = VariantProps<typeof slider>;

export const sliderTrack = cva("primitiv-slider__track");

export type SliderTrackVariants = VariantProps<typeof sliderTrack>;

export const sliderRange = cva("primitiv-slider__range");

export type SliderRangeVariants = VariantProps<typeof sliderRange>;

export const sliderThumb = cva("primitiv-slider__thumb");

export type SliderThumbVariants = VariantProps<typeof sliderThumb>;
