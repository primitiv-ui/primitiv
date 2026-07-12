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
export type CarouselProps = DistributiveOmit<ComponentPropsWithRef<typeof CarouselPrimitive.Root>, "peek" | "gap" | "padding" | "surface" | "placement" | "side" | "distribution" | "align" | "cluster" | "indicators" | "size" | "ratio"> & {
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
   * Where the controls sit relative to the imagery — the one axis that is off-vs-on the slide. `external` (the default) keeps the controls off the imagery, in the space around the viewport. `overlay` insets them on the slide for edge-to-edge imagery. How the controls are *arranged* (one bar vs prev/next flanking the edges) is the orthogonal `cluster` axis; `side` / `distribution` / `align` / `orientation` then compose on top of both.
   * - `external` — Controls off the imagery, in the space around the viewport (the default). A CSS grid places the parts in tracks beside the viewport.
   * - `overlay` — Controls on the imagery — absolutely positioned over the slide on a translucent scrim, for edge-to-edge photography.
   * @default "external"
   * @see https://primitiv-ui.dev/docs/components/carousel
   */
  placement?: "external" | "overlay";
  /**
   * Which cross-axis edge the indicator cluster (or the joined bar) sits on, relative to the scroll direction. `after` is the trailing edge (below the viewport when horizontal, the inline-end/right side when vertical); `before` is the leading edge (above / inline-start). Orientation-relative and RTL-safe — it composes with `orientation` to reach all four physical edges. Read by both placements and both clusters.
   * - `after` — Trailing edge — below the viewport (horizontal) or the end/right side (vertical). The default.
   * - `before` — Leading edge — above the viewport (horizontal) or the start/left side (vertical).
   * @default "after"
   * @see https://primitiv-ui.dev/docs/components/carousel
   */
  side?: "after" | "before";
  /**
   * How the controls spread along their edge. For `joined` it drives the whole prev/indicators/next bar — `group` (the default) bunches them, `stretch` pushes prev/next to the extremes with the indicators centred (space-between). For `split` it governs the indicator cluster (prev/next stay flanking the viewport edges) — `group` bunches the dots, `stretch` spreads them across the full edge. Applies to both placements.
   * - `group` — Bunch the controls together with a fixed gap, positioned by `align` (the default).
   * - `stretch` — Spread the controls across the full edge (space-between).
   * @default "group"
   * @see https://primitiv-ui.dev/docs/components/carousel
   */
  distribution?: "group" | "stretch";
  /**
   * Where the grouped controls sit along their edge (only read under `distribution=group`; `stretch` fills the edge, so alignment is moot). `center` is the default; `start` / `end` pin the cluster to the leading / trailing end — the whole bar for `joined`, the indicator cluster for `split`. Applies to both placements. Logical, so it mirrors under RTL and follows the scroll axis when vertical.
   * - `start` — Pin the control cluster to the start of the edge (left / top, mirrored under RTL).
   * - `center` — Centre the control cluster on the edge (the default).
   * - `end` — Pin the control cluster to the end of the edge (right / bottom, mirrored under RTL).
   * @default "center"
   * @see https://primitiv-ui.dev/docs/components/carousel
   */
  align?: "start" | "center" | "end";
  /**
   * How the controls are arranged — the orthogonal companion to `placement`, read by both `external` and `overlay`. `split` (the default) sends prev/next to the viewport's two scroll-axis edges (flanking it — left/right when horizontal, top/bottom when vertical) and leaves the indicators as a separate cluster positioned by `side` / `distribution` / `align`. `joined` bundles prev + indicators + next into one `<CarouselControls>` bar that travels together, positioned as a unit by `side` / `distribution` / `align`. Compose the parts inside `<CarouselControls>` for `joined`, as direct children of the root for `split`. Together with `placement` this is the full 2×2 — external/overlay × split/joined.
   * - `split` — Prev/next flank the viewport's scroll-axis edges; the indicators are a separate cluster (the default). Compose the parts as direct children of the root.
   * - `joined` — Bundle prev + indicators + next into one bar that moves together; compose them inside `<CarouselControls>`.
   * @default "split"
   * @see https://primitiv-ui.dev/docs/components/carousel
   */
  cluster?: "split" | "joined";
  /**
   * What the indicators look like. `dots` (the default) is the compact dot row; `thumbnails` swaps each indicator for a rounded-rect image thumbnail — the active one ringed in the primary colour, the classic gallery pattern. Supply the thumbnail content as children of each `<CarouselIndicator>` (an `<img>` or a background element).
   * - `dots` — Compact dots — one per page (the default).
   * - `thumbnails` — Image thumbnails — each indicator shows its slide's thumbnail, the active one ringed in the primary colour.
   * @default "dots"
   * @see https://primitiv-ui.dev/docs/components/carousel
   */
  indicators?: "dots" | "thumbnails";
  /**
   * Scale of the control chrome — the prev/next controls, indicator dots and thumbnails — on a t-shirt ramp, so a carousel matches the density of the UI around it. The viewport and slides stay container-driven (they fill their space); only the controls scale. Composes with the ambient `data-density` (which shifts every slot): `size` picks the slot, density shifts it. The prev/next controls track the shared framed-control ramp, so they match a same-size Button.
   * - `xs` — Extra small controls.
   * - `sm` — Small controls.
   * - `md` — Medium controls (the default).
   * - `lg` — Large controls.
   * - `xl` — Extra large controls.
   * @default "md"
   * @see https://primitiv-ui.dev/docs/components/carousel
   */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /**
   * The carousel's aspect ratio, applied uniformly to every slide (and tracked by the thumbnail indicators). Re-points --primitiv-carousel-slide-aspect-ratio at the root; the vertical viewport's shape defaults to the same knob, so `ratio` shapes the slides in both orientations (square vertical slides, a widescreen vertical scroller, …). Override the knob directly for a bespoke value. (Per-slide ratios are a later revisit.)
   * - `square` — 1:1 — a square slide.
   * - `standard` — 4:3 — the classic photo ratio.
   * - `wide` — 16:9 — widescreen (the default).
   * - `ultrawide` — 21:9 — cinematic ultra-wide.
   * @default "wide"
   * @see https://primitiv-ui.dev/docs/components/carousel
   */
  ratio?: "square" | "standard" | "wide" | "ultrawide";
};

export function Carousel({ peek, gap, padding, surface, placement, side, distribution, align, cluster, indicators, size, ratio, slidesPerPage, className, style, ...props }: CarouselProps) {
  return (
    <CarouselPrimitive.Root
      className={[carousel({ peek, gap, padding, surface, placement, side, distribution, align, cluster, indicators, size, ratio }), className].filter(Boolean).join(" ")}
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

export type CarouselSlideProps = DistributiveOmit<ComponentPropsWithRef<typeof CarouselPrimitive.Slide>, "radius" | "fit"> & {
  /**
   * Corner rounding of the slide.
   * - `md` — Medium rounded corners (the default).
   * - `none` — Sharp, un-rounded corners.
   * @default "md"
   * @see https://primitiv-ui.dev/docs/components/carousel
   */
  radius?: "md" | "none";
  /**
   * How a media child (an img / picture / video) conforms to the slide box. The slide box is always sized by the layout; this decides how a real image — which has its own intrinsic size and ratio — fills it.
   * - `cover` — Fill the slide and crop the overflow, preserving the image's aspect ratio (the default — best for photographic imagery). Set --primitiv-carousel-slide-object-position to move the focal point of the crop.
   * - `contain` — Fit the whole image inside the slide without cropping, letterboxing any leftover space (best for logos / art that must not be cut). The letterbox shows the slide's own background — set one on the slide for a backdrop.
   * @default "cover"
   * @see https://primitiv-ui.dev/docs/components/carousel
   */
  fit?: "cover" | "contain";
};

export function CarouselSlide({ radius, fit, className, ...props }: CarouselSlideProps) {
  return <CarouselPrimitive.Slide className={[carouselSlide({ radius, fit }), className].filter(Boolean).join(" ")} {...props} />;
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
