import "../styles/primitiv/carousel/styles.css";
/*
 * Carousel — styled wrapper, generated from contract.json.
 *
 * Do not edit by hand: change registry/components/carousel/contract.json and regenerate.
 * A typed props surface over the headless @primitiv-ui/react component + the
 * generated recipe — the primary DX (RFC 0004 §3.5 / D51).
 */
import { Carousel as CarouselPrimitive } from "@primitiv-ui/react";
import { type ComponentPropsWithRef } from "react";
import { carousel, carouselViewport, carouselControls, carouselSlide, carouselPreviousTrigger, carouselNextTrigger, carouselIndicatorGroup, carouselIndicator } from "./carousel.recipe";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/**
 * A responsive, accessible carousel — a scroll-snap viewport of slides with prev/next controls and indicator dots (WAI-ARIA Carousel pattern). Adapts to its container by default.
 *
 * @see https://primitiv-ui.dev/docs/components/carousel
 */
export type CarouselProps = DistributiveOmit<ComponentPropsWithRef<typeof CarouselPrimitive.Root>, "peek" | "padding" | "placement" | "slidesPerPage"> & {
  /**
   * Reveal a sliver of the adjacent slides on either side of the active one. Works in both orientations (inline edges when horizontal, block edges when vertical).
   * - `none` — No peek — the active slide fills the viewport (the default).
   * - `sm` — A small peek.
   * - `md` — A medium peek.
   * - `lg` — A large peek.
   * @default "none"
   * @see https://primitiv-ui.dev/docs/components/carousel
   */
  peek?: "none" | "sm" | "md" | "lg";
  /**
   * Inset the whole carousel from its container with an outer gutter (breathing room framing the viewport). Distinct from `peek`: padding is the outer gutter and never reveals neighbouring slides, whereas peek is the inner reveal — they stack, so with both set the edge inset is padding + peek while the neighbour reveal stays exactly peek. Follows the scroll axis (inline edges when horizontal, block edges when vertical).
   * - `none` — No viewport padding — the carousel fills its container edge to edge (the default).
   * - `sm` — A small gutter.
   * - `md` — A medium gutter.
   * - `lg` — A large gutter.
   * @default "none"
   * @see https://primitiv-ui.dev/docs/components/carousel
   */
  padding?: "none" | "sm" | "md" | "lg";
  /**
   * Where the prev/next controls and indicator dots sit relative to the viewport. The default keeps them in a flow row below (compose them in a `<CarouselControls>` wrapper); `overlay` insets the controls on the slide for edge-to-edge imagery.
   * - `row` — Controls flow in a row below the viewport (the default).
   * - `overlay` — Controls sit on the imagery — prev/next flanking the slide edges on a translucent scrim, dots in a pill overlaid at the bottom.
   * @default "row"
   * @see https://primitiv-ui.dev/docs/components/carousel
   */
  placement?: "row" | "overlay";
  /**
   * How many slides are visible per page. The default shows one slide filling the viewport; higher counts divide it into equal shares separated by the gap (a 2-/3-/4-up gallery). Composes with peek and both orientations. For an arbitrary count, set the `--primitiv-carousel-slides-per-page` knob directly.
   * - `1` — One slide fills the viewport (the default).
   * - `2` — Two slides per page.
   * - `3` — Three slides per page.
   * - `4` — Four slides per page.
   * @default "1"
   * @see https://primitiv-ui.dev/docs/components/carousel
   */
  slidesPerPage?: "1" | "2" | "3" | "4";
};

export function Carousel({ peek, padding, placement, slidesPerPage, className, ...props }: CarouselProps) {
  return <CarouselPrimitive.Root className={[carousel({ peek, padding, placement, slidesPerPage }), className].filter(Boolean).join(" ")} {...props} />;
}

export type CarouselViewportProps = ComponentPropsWithRef<typeof CarouselPrimitive.Viewport>;

export function CarouselViewport({ className, ...props }: CarouselViewportProps) {
  return <CarouselPrimitive.Viewport className={[carouselViewport(), className].filter(Boolean).join(" ")} {...props} />;
}

export type CarouselControlsProps = ComponentPropsWithRef<"div">;

export function CarouselControls({ className, ...props }: CarouselControlsProps) {
  return <div className={[carouselControls(), className].filter(Boolean).join(" ")} {...props} />;
}

export type CarouselSlideProps = DistributiveOmit<ComponentPropsWithRef<typeof CarouselPrimitive.Slide>, "radius"> & {
  /**
   * Corner rounding of the slide.
   * - `md` — Medium rounded corners (the default).
   * - `none` — Sharp, un-rounded corners.
   * @default "md"
   * @see https://primitiv-ui.dev/docs/components/carousel
   */
  radius?: "md" | "none";
};

export function CarouselSlide({ radius, className, ...props }: CarouselSlideProps) {
  return <CarouselPrimitive.Slide className={[carouselSlide({ radius }), className].filter(Boolean).join(" ")} {...props} />;
}

export type CarouselPreviousTriggerProps = ComponentPropsWithRef<typeof CarouselPrimitive.PreviousTrigger>;

export function CarouselPreviousTrigger({ className, ...props }: CarouselPreviousTriggerProps) {
  return <CarouselPrimitive.PreviousTrigger className={[carouselPreviousTrigger(), className].filter(Boolean).join(" ")} {...props} />;
}

export type CarouselNextTriggerProps = ComponentPropsWithRef<typeof CarouselPrimitive.NextTrigger>;

export function CarouselNextTrigger({ className, ...props }: CarouselNextTriggerProps) {
  return <CarouselPrimitive.NextTrigger className={[carouselNextTrigger(), className].filter(Boolean).join(" ")} {...props} />;
}

export type CarouselIndicatorGroupProps = ComponentPropsWithRef<typeof CarouselPrimitive.IndicatorGroup>;

export function CarouselIndicatorGroup({ className, ...props }: CarouselIndicatorGroupProps) {
  return <CarouselPrimitive.IndicatorGroup className={[carouselIndicatorGroup(), className].filter(Boolean).join(" ")} {...props} />;
}

export type CarouselIndicatorProps = ComponentPropsWithRef<typeof CarouselPrimitive.Indicator>;

export function CarouselIndicator({ className, ...props }: CarouselIndicatorProps) {
  return <CarouselPrimitive.Indicator className={[carouselIndicator(), className].filter(Boolean).join(" ")} {...props} />;
}
