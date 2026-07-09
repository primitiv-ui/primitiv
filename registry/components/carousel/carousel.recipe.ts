/*
 * Carousel styled-surface recipe — generated from contract.json.
 *
 * Do not edit by hand: change registry/components/carousel/contract.json and regenerate.
 * Maps the variant props to the contract's modifier classes; the styling lives
 * in the copied stylesheet (RFC 0006 §6.1 / D53).
 */
import { cva, type VariantProps } from "class-variance-authority";

export const carousel = cva("primitiv-carousel", {
  variants: {
    peek: {
      none: "primitiv-carousel--peek-none",
      sm: "primitiv-carousel--peek-sm",
      md: "primitiv-carousel--peek-md",
      lg: "primitiv-carousel--peek-lg",
    },
    padding: {
      none: "primitiv-carousel--padding-none",
      sm: "primitiv-carousel--padding-sm",
      md: "primitiv-carousel--padding-md",
      lg: "primitiv-carousel--padding-lg",
    },
    surface: {
      none: "primitiv-carousel--surface-none",
      subtle: "primitiv-carousel--surface-subtle",
    },
    placement: {
      row: "primitiv-carousel--placement-row",
      overlay: "primitiv-carousel--placement-overlay",
    },
    indicators: {
      dots: "primitiv-carousel--indicators-dots",
      thumbnails: "primitiv-carousel--indicators-thumbnails",
    },
  },
  defaultVariants: {
    peek: "none",
    padding: "none",
    surface: "none",
    placement: "row",
    indicators: "dots",
  },
});

export type CarouselVariants = VariantProps<typeof carousel>;

export const carouselViewport = cva("primitiv-carousel__viewport");

export type CarouselViewportVariants = VariantProps<typeof carouselViewport>;

export const carouselControls = cva("primitiv-carousel__controls");

export type CarouselControlsVariants = VariantProps<typeof carouselControls>;

export const carouselSlide = cva("primitiv-carousel__slide", {
  variants: {
    radius: {
      md: "primitiv-carousel__slide--radius-md",
      none: "primitiv-carousel__slide--radius-none",
    },
  },
  defaultVariants: {
    radius: "md",
  },
});

export type CarouselSlideVariants = VariantProps<typeof carouselSlide>;

export const carouselPreviousTrigger = cva("primitiv-carousel__prev");

export type CarouselPreviousTriggerVariants = VariantProps<typeof carouselPreviousTrigger>;

export const carouselNextTrigger = cva("primitiv-carousel__next");

export type CarouselNextTriggerVariants = VariantProps<typeof carouselNextTrigger>;

export const carouselIndicatorGroup = cva("primitiv-carousel__indicator-group");

export type CarouselIndicatorGroupVariants = VariantProps<typeof carouselIndicatorGroup>;

export const carouselIndicator = cva("primitiv-carousel__indicator");

export type CarouselIndicatorVariants = VariantProps<typeof carouselIndicator>;

export const carouselIndicators = cva("primitiv-carousel__indicator-group");

export type CarouselIndicatorsVariants = VariantProps<typeof carouselIndicators>;
