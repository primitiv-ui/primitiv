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
export type CarouselProps = DistributiveOmit<ComponentPropsWithRef<typeof CarouselPrimitive.Root>, "peek" | "gap" | "padding" | "surface" | "placement" | "side" | "distribution" | "align" | "indicators"> & {
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
   * The spacing between slides. A t-shirt scale re-pointing --primitiv-carousel-gap to a spacing token; `md` is the default. Works in both orientations (the gap runs on the scroll axis) and composes with every other variant. Note: the `padding` modifier couples the gap to its inset for a clean framed track, so it overrides this within a padded track.
   * - `none` — No gap — the slides sit flush.
   * - `sm` — A small gap.
   * - `md` — A medium gap (the default).
   * - `lg` — A large gap.
   * @default "md"
   * @see https://primitiv-ui.dev/docs/components/carousel
   */
  gap?: "none" | "sm" | "md" | "lg";
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
   * The structural family the controls belong to — the one axis that changes how you compose the parts. `external` (the default) groups the prev/next + indicators into a single bar beside the viewport (compose them in a `<CarouselControls>` wrapper); its layout is refined by the composable `side` / `distribution` / `align` axes. `overlay` insets the controls on the slide for edge-to-edge imagery. `flank` splits the prev/next onto the viewport's two scroll-axis edges with the indicators on a perpendicular side (compose the parts as direct children of the root). The `side` / `distribution` / `align` axes compose on top of whichever family is chosen and degrade to a no-op where a family doesn't use them.
   * - `external` — Prev/next + indicators sit together in a bar beside the viewport (the default). Compose them in a `<CarouselControls>` wrapper; refine the bar with `side` (which edge), `distribution` (bunch vs spread) and `align`.
   * - `overlay` — Controls sit on the imagery — prev/next flanking the slide edges on a translucent scrim, dots in a pill overlaid at the bottom.
   * - `flank` — Prev/next split onto the viewport's two scroll-axis edges (left/right when horizontal, top/bottom when vertical) with the indicators on a perpendicular side (`side` picks which). Compose the parts as direct children of the root — the grid places each by area.
   * @default "external"
   * @see https://primitiv-ui.dev/docs/components/carousel
   */
  placement?: "external" | "overlay" | "flank";
  /**
   * Which cross-axis edge the controls sit on, relative to the scroll direction — the external bar, the flank indicators, or the overlay dots pill (+ its vertical control lane). `after` is the trailing edge (below the viewport when horizontal, the inline-end/right side when vertical); `before` is the leading edge (above / inline-start). Orientation-relative and RTL-safe — it composes with `orientation` to reach all four physical edges. Read by all three families.
   * - `after` — Trailing edge — below the viewport (horizontal) or the end/right side (vertical). The default.
   * - `before` — Leading edge — above the viewport (horizontal) or the start/left side (vertical). Under overlay it moves the dots pill (and, when vertical, the whole control lane) to the leading edge.
   * @default "after"
   * @see https://primitiv-ui.dev/docs/components/carousel
   */
  side?: "after" | "before";
  /**
   * How the controls spread along their edge. In `external` it drives the whole prev/indicators/next bar — `group` (the default) bunches them, `stretch` pushes prev/next to the extremes with the indicators centred (space-between). In `overlay` / `flank` it governs the indicator cluster instead (prev/next stay pinned to the family's edges) — `group` bunches the dots, `stretch` spreads them across the full edge. No-op for vertical overlay, where the controls share one lane.
   * - `group` — Bunch the controls together with a fixed gap, positioned by `align` (the default).
   * - `stretch` — Spread the controls across the full edge (space-between) — prev/next to the extremes in `external`, the indicator dots edge-to-edge in `overlay` / `flank`.
   * @default "group"
   * @see https://primitiv-ui.dev/docs/components/carousel
   */
  distribution?: "group" | "stretch";
  /**
   * Where the grouped controls sit along their edge (only read under `distribution=group`; `stretch` fills the edge, so alignment is moot). `center` is the default; `start` / `end` pin the cluster to the leading / trailing end. Applies to the `external` bar and the `overlay` / `flank` indicator cluster (no-op for vertical overlay). Logical, so it mirrors under RTL and follows the scroll axis when vertical.
   * - `start` — Pin the control cluster to the start of the edge (left / top, mirrored under RTL).
   * - `center` — Centre the control cluster on the edge (the default).
   * - `end` — Pin the control cluster to the end of the edge (right / bottom, mirrored under RTL).
   * @default "center"
   * @see https://primitiv-ui.dev/docs/components/carousel
   */
  align?: "start" | "center" | "end";
  /**
   * What the indicators look like. `dots` (the default) is the compact dot row; `thumbnails` swaps each indicator for a rounded-rect image thumbnail — the active one ringed in the primary colour, the classic gallery pattern. Supply the thumbnail content as children of each `<CarouselIndicator>` (an `<img>` or a background element).
   * - `dots` — Compact dots — one per page (the default).
   * - `thumbnails` — Image thumbnails — each indicator shows its slide's thumbnail, the active one ringed in the primary colour.
   * @default "dots"
   * @see https://primitiv-ui.dev/docs/components/carousel
   */
  indicators?: "dots" | "thumbnails";
};

export function Carousel({ peek, gap, padding, surface, placement, side, distribution, align, indicators, slidesPerPage, className, style, ...props }: CarouselProps) {
  return (
    <CarouselPrimitive.Root
      className={[carousel({ peek, gap, padding, surface, placement, side, distribution, align, indicators }), className].filter(Boolean).join(" ")}
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
