import "../styles/primitiv/carousel/styles.css";
/*
 * Carousel — styled wrapper, generated from contract.json.
 *
 * Do not edit by hand: change registry/components/carousel/contract.json and regenerate.
 * A typed props surface over the headless @primitiv-ui/react component + the
 * generated recipe — the primary DX (RFC 0004 §3.5 / D51).
 */
import { Carousel as CarouselPrimitive } from "@primitiv-ui/react";
import { type ComponentPropsWithRef, type CSSProperties } from "react";
import { carousel, carouselViewport, carouselControls, carouselSlide, carouselSlideContent, carouselPreviousTrigger, carouselNextTrigger, carouselIndicatorGroup, carouselIndicator, carouselIndicators, carouselProgressText } from "./carousel.recipe";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/**
 * A responsive, accessible carousel — a scroll-snap viewport of slides with prev/next controls and indicator dots (WAI-ARIA Carousel pattern). Adapts to its container by default.
 *
 * @see https://primitiv-ui.dev/docs/components/carousel
 */
export type CarouselProps = DistributiveOmit<ComponentPropsWithRef<typeof CarouselPrimitive.Root>, "peek" | "gap" | "padding" | "surface" | "radius" | "placement" | "side" | "distribution" | "align" | "cluster" | "indicators" | "size" | "ratio" | "slideWidth" | "effect" | "glide"> & {
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
   * Opt into rounding the container (the viewport track around the slides), independent of the `padding` frame. Off by default (a square track); `md` rounds it to the shared, size/density-scaled carousel radius, so the track corners match the slide corners. (Distinct from the per-slide `radius` modifier, which rounds each slide; this rounds the track that clips them.)
   * - `none` — Square track corners (the default).
   * - `md` — Round the track to the scaled carousel radius, matching the slides.
   * @default "none"
   * @see https://primitiv-ui.dev/docs/components/carousel
   */
  radius?: "none" | "md";
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
  /**
   * How each slide's width (block size when vertical) is determined. `equal` (the default) shares the viewport's content box evenly across `slidesPerPage` slides, each holding its shape via the `ratio` aspect-ratio. `content` lets each slide size to its own content instead — an intrinsically-sized image, an explicit width on the slide, or any content with a natural size — so slides in one track can have genuinely different widths (Ark UI's `autoSize`). Scoped to `slidesPerPage=1`: the multi-slide windowing math assumes equal shares, which content-driven widths break.
   * - `equal` — Every slide takes an equal share of the viewport and holds the `ratio` aspect-ratio (the default).
   * - `content` — Each slide sizes to its own content — bring your own width (an intrinsically-sized image, an explicit inline width, a natural-width card). The `ratio` aspect-ratio stands down.
   * @default "equal"
   * @see https://primitiv-ui.dev/docs/components/carousel
   */
  slideWidth?: "equal" | "content";
  /**
   * An opt-in scroll-driven visual effect for the slide content, layered on top of scroll-snap paging. `none` (the default) renders slides plain. `parallax` gives each slide's <CarouselSlideContent> a native, zero-JavaScript drift as the slide crosses the viewport (Blossom Carousel's Slideshow example) — a CSS view-timeline scoped to the slide drives the content's transform via animation-range: cover, following the scroll axis (inline horizontal, block vertical). `coverflow` tilts each slide's <CarouselSlideContent> in 3D as it crosses the viewport (the iTunes/Apple Cover Flow look, Blossom's Cover Flow example) — the same view-timeline drives a rotateY (rotateX when vertical) + scale off perspective set on the slide, so the centred slide sits flat and forward while its neighbours rotate away. Best composed with peek (to reveal the tilting neighbours) and snapAlign="center". Both effects require wrapping the slide's media in <CarouselSlideContent>; browsers without animation-timeline: view() support fall back to reading the headless --slide-progress signal instead (an equivalent, continuously-updated transform with no extra JavaScript of our own), and both disable entirely under prefers-reduced-motion.
   * - `none` — Plain slides — no scroll-driven motion (the default).
   * - `parallax` — Each slide's <CarouselSlideContent> drifts against the scroll as the slide crosses the viewport.
   * - `coverflow` — Each slide's <CarouselSlideContent> tilts in 3D (rotateY + scale off a perspective) as it crosses the viewport — the Cover Flow look. Pair with peek and snapAlign="center".
   * @default "none"
   * @see https://primitiv-ui.dev/docs/components/carousel
   */
  effect?: "none" | "parallax" | "coverflow";
  /**
   * How fast the infinite loop glides between pages (loop="infinite" only — every other mode uses native scroll). A preset re-points --primitiv-carousel-glide-duration to a motion duration token; the engine reads it, with --primitiv-carousel-glide-easing, off the track and drives the transform transition. `medium` is the default. For a duration or easing outside the presets, re-point either custom property directly.
   * - `fast` — A quick glide (200ms).
   * - `medium` — The default glide (500ms).
   * - `slow` — A slow, unhurried glide (1000ms).
   * @default "medium"
   * @see https://primitiv-ui.dev/docs/components/carousel
   */
  glide?: "fast" | "medium" | "slow";
};

export function Carousel({ peek, gap, padding, surface, radius, placement, side, distribution, align, cluster, indicators, size, ratio, slideWidth, effect, glide, slidesPerPage, className, style, ...props }: CarouselProps) {
  return (
    <CarouselPrimitive.Root
      className={[carousel({ peek, gap, padding, surface, radius, placement, side, distribution, align, cluster, indicators, size, ratio, slideWidth, effect, glide }), className].filter(Boolean).join(" ")}
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

export type CarouselSlideProps = DistributiveOmit<ComponentPropsWithRef<typeof CarouselPrimitive.Slide>, "radius" | "fit" | "surface"> & {
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
   * - `contain` — Fit the whole image inside the slide without cropping, letterboxing any leftover space (best for logos / art that must not be cut). The letterbox shows the slide's own background — opt into one with the `surface` modifier.
   * @default "cover"
   * @see https://primitiv-ui.dev/docs/components/carousel
   */
  fit?: "cover" | "contain";
  /**
   * Optional slide backdrop — the fill behind the media. Off by default (transparent), so a cover image or a slide with its own background is unaffected; opt in to give a `contain` letterbox (or a transparent image) a surface behind it. Mirrors the root `surface` modifier and uses the same token.
   * - `none` — No backdrop — the slide background is transparent (the default).
   * - `subtle` — Fill the slide with the subtle surface token (--primitiv-surface-subtle) — the backdrop for a contain letterbox, matching the root track's surface.
   * @default "none"
   * @see https://primitiv-ui.dev/docs/components/carousel
   */
  surface?: "none" | "subtle";
};

export function CarouselSlide({ radius, fit, surface, className, ...props }: CarouselSlideProps) {
  return <CarouselPrimitive.Slide className={[carouselSlide({ radius, fit, surface }), className].filter(Boolean).join(" ")} {...props} />;
}

export type CarouselSlideContentProps = ComponentPropsWithRef<"div">;

export function CarouselSlideContent({ className, ...props }: CarouselSlideContentProps) {
  return <div className={[carouselSlideContent(), className].filter(Boolean).join(" ")} {...props} />;
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

export type CarouselProgressTextProps = ComponentPropsWithRef<typeof CarouselPrimitive.ProgressText>;

export function CarouselProgressText({ className, ...props }: CarouselProgressTextProps) {
  return <CarouselPrimitive.ProgressText className={[carouselProgressText(), className].filter(Boolean).join(" ")} {...props} />;
}
