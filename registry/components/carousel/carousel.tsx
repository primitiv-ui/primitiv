/*
 * Carousel — styled wrapper, generated from contract.json.
 *
 * Do not edit by hand: change registry/components/carousel/contract.json and regenerate.
 * A typed props surface over the headless @primitiv-ui/react component + the
 * generated recipe — the primary DX (RFC 0004 §3.5 / D51).
 */
import { Carousel as CarouselPrimitive } from "@primitiv-ui/react";
import { type ComponentPropsWithRef, type CSSProperties } from "react";
import { carousel, carouselViewport, carouselControls, carouselSlide, carouselPreviousTrigger, carouselNextTrigger, carouselIndicatorGroup, carouselIndicator, carouselIndicators } from "./carousel.recipe";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/**
 * A responsive, accessible carousel — a scroll-snap viewport of slides with prev/next controls and indicator dots (WAI-ARIA Carousel pattern). Adapts to its container by default.
 *
 * @see https://primitiv-ui.dev/docs/components/carousel
 */
export type CarouselProps = DistributiveOmit<ComponentPropsWithRef<typeof CarouselPrimitive.Root>, "peek" | "padding" | "surface" | "placement" | "indicators"> & {
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
   * Make the viewport a padded, framed track: pad the slides inward from the viewport edges and draw the track outline (border + rounded corners). The gap is coupled to the padding so the resting track doesn't itself reveal a neighbour; add `peek` for a deliberate reveal within the track. The background fill is opt-in via the `surface` modifier — padding alone renders an outlined track.
   * - `none` — No viewport padding — a bare, frameless scroll box (the default).
   * - `sm` — A small inset.
   * - `md` — A medium inset.
   * - `lg` — A large inset.
   * @default "none"
   * @see https://primitiv-ui.dev/docs/components/carousel
   */
  padding?: "none" | "sm" | "md" | "lg";
  /**
   * Opt into the viewport track's background fill. Off by default (a framed track is just an outline); pairs with `padding` to render a filled, framed track.
   * - `none` — No fill — the track is transparent (the default).
   * - `subtle` — Fill the track with the subtle surface token.
   * @default "none"
   * @see https://primitiv-ui.dev/docs/components/carousel
   */
  surface?: "none" | "subtle";
  /**
   * Where the prev/next controls and indicator dots sit relative to the viewport. The default keeps them in a flow row below (compose them in a `<CarouselControls>` wrapper); `overlay` insets the controls on the slide for edge-to-edge imagery.
   * - `row` — Controls flow in a row below the viewport (the default).
   * - `overlay` — Controls sit on the imagery — prev/next flanking the slide edges on a translucent scrim, dots in a pill overlaid at the bottom.
   * @default "row"
   * @see https://primitiv-ui.dev/docs/components/carousel
   */
  placement?: "row" | "overlay";
  /**
   * What the indicators look like. `dots` (the default) is the compact dot row; `thumbnails` swaps each indicator for a rounded-rect image thumbnail — the active one ringed in the primary colour, the classic gallery pattern. Supply the thumbnail content as children of each `<CarouselIndicator>` (an `<img>` or a background element).
   * - `dots` — Compact dots — one per page (the default).
   * - `thumbnails` — Image thumbnails — each indicator shows its slide's thumbnail, the active one ringed in the primary colour.
   * @default "dots"
   * @see https://primitiv-ui.dev/docs/components/carousel
   */
  indicators?: "dots" | "thumbnails";
};

export function Carousel({ peek, padding, surface, placement, indicators, slidesPerPage, className, style, ...props }: CarouselProps) {
  return (
    <CarouselPrimitive.Root
      className={[carousel({ peek, padding, surface, placement, indicators }), className].filter(Boolean).join(" ")}
      style={{ ...style, ...(slidesPerPage === undefined ? {} : { "--primitiv-carousel-slides-per-page": slidesPerPage }) } as CSSProperties}
      slidesPerPage={slidesPerPage}
      {...props}
    />
  );
}

export type CarouselViewportProps = ComponentPropsWithRef<typeof CarouselPrimitive.Viewport>;

export function CarouselViewport({ className, ...props }: CarouselViewportProps) {
  return <CarouselPrimitive.Viewport className={[carouselViewport(), className].filter(Boolean).join(" ")} {...props} />;
}

export type CarouselControlsProps = ComponentPropsWithRef<"div">;

export function CarouselControls({ className, ...props }: CarouselControlsProps) {
  return <div className={[carouselControls(), className].filter(Boolean).join(" ")} {...props} />;
}

export type CarouselSlideProps = DistributiveOmit<ComponentPropsWithRef<typeof CarouselPrimitive.Slide>, "radius" | "ratio"> & {
  /**
   * Corner rounding of the slide.
   * - `md` — Medium rounded corners (the default).
   * - `none` — Sharp, un-rounded corners.
   * @default "md"
   * @see https://primitiv-ui.dev/docs/components/carousel
   */
  radius?: "md" | "none";
  /**
   * The slide's aspect ratio (read in the horizontal orientation — the vertical viewport owns its own ratio via --primitiv-carousel-vertical-aspect-ratio). Re-points --primitiv-carousel-slide-aspect-ratio to a common media ratio; override the knob directly for a bespoke value.
   * - `square` — 1:1 — a square slide.
   * - `standard` — 4:3 — the classic photo ratio.
   * - `wide` — 16:9 — widescreen (the default).
   * - `ultrawide` — 21:9 — cinematic ultra-wide.
   * @default "wide"
   * @see https://primitiv-ui.dev/docs/components/carousel
   */
  ratio?: "square" | "standard" | "wide" | "ultrawide";
};

export function CarouselSlide({ radius, ratio, className, ...props }: CarouselSlideProps) {
  return <CarouselPrimitive.Slide className={[carouselSlide({ radius, ratio }), className].filter(Boolean).join(" ")} {...props} />;
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

export type CarouselIndicatorsProps = ComponentPropsWithRef<typeof CarouselPrimitive.Indicators>;

export function CarouselIndicators({ className, ...props }: CarouselIndicatorsProps) {
  return <CarouselPrimitive.Indicators className={[carouselIndicators(), className].filter(Boolean).join(" ")} {...props} />;
}
