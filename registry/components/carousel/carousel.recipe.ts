/*
 * Carousel styled-surface recipe — generated from contract.json.
 *
 * Do not edit by hand: change registry/components/carousel/contract.json and regenerate.
 * Maps the variant props to the contract's modifier classes; the styling lives
 * in the copied stylesheet (RFC 0006 §6.1 / D53).
 */
import { cva, type VariantProps } from "class-variance-authority";

export const carousel = cva("primitiv-carousel");

export type CarouselVariants = VariantProps<typeof carousel>;

export const carouselViewport = cva("primitiv-carousel__viewport");

export type CarouselViewportVariants = VariantProps<typeof carouselViewport>;

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
