import type { CSSProperties, ReactNode } from "react";
import { useContext, useEffect, useRef, useState } from "react";

import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
} from "@primitiv-ui/icons";
import { CarouselContext } from "@primitiv-ui/react";
import type { CarouselImperativeApi } from "@primitiv-ui/react";

import {
  Carousel,
  CarouselViewport,
  CarouselControls,
  CarouselSlide,
  CarouselSlideContent,
  CarouselPreviousTrigger,
  CarouselNextTrigger,
  CarouselIndicatorGroup,
  CarouselIndicator,
  CarouselIndicators,
  CarouselProgressText,
} from "../components";
import "./CarouselPage.css";

import debugPhoto1 from "../assets/carousel-photos/photo-1.jpg";
import debugPhoto2 from "../assets/carousel-photos/photo-2.jpg";
import debugPhoto3 from "../assets/carousel-photos/photo-3.jpg";
import debugPhoto4 from "../assets/carousel-photos/photo-4.jpg";

// Gradients stand in for photography (the Figma examples do the same — real
// imagery is a per-slide fill override the consumer supplies).
const SLIDES = [
  "linear-gradient(135deg, #1e3a8a, #14b8a6)",
  "linear-gradient(135deg, #7c3aed, #ec4899)",
  "linear-gradient(135deg, #ea580c, #16a34a)",
  "linear-gradient(135deg, #0ea5e9, #6366f1)",
];

// A longer set for the multi-slide gallery, so a 2-/3-/4-up view still has
// slides to scroll to. Long enough (9) that the edge-case grid can slice any
// count it needs (1, 2, 3, 5, 6, 7) and a 4-up infinite loop has three full pages.
const GALLERY = [
  ...SLIDES,
  "linear-gradient(135deg, #db2777, #f59e0b)",
  "linear-gradient(135deg, #0d9488, #4f46e5)",
  "linear-gradient(135deg, #9333ea, #06b6d4)",
  "linear-gradient(135deg, #dc2626, #facc15)",
  "linear-gradient(135deg, #2563eb, #22d3ee)",
];

/**
 * Iteration 1 — the basic responsive single-slide composition: one slide per
 * view, circular external prev/next controls and dots sharing one row below
 * (the "External-row + dots" design). The whole carousel fills its container.
 */
function BasicSingle({
  label,
  radius,
  ratio,
  peek,
  padding,
  surface,
  transition,
  side,
  distribution,
  align,
  gap,
  size,
  loop,
  autoplay,
  allowMouseDrag,
  linked,
}: {
  label: string;
  radius?: "md" | "none";
  ratio?: "square" | "standard" | "wide" | "ultrawide";
  peek?: "none" | "sm" | "md" | "lg";
  padding?: "none" | "sm" | "md" | "lg";
  surface?: "none" | "subtle";
  transition?: "slide" | "fade";
  side?: "before" | "after";
  distribution?: "group" | "stretch";
  align?: "start" | "center" | "end";
  gap?: "none" | "sm" | "md" | "lg";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  loop?: boolean | "wrap" | "infinite";
  autoplay?: boolean;
  allowMouseDrag?: boolean;
  /** Fill each slide with an anchor, so a tap reaches the link but a drag doesn't. */
  linked?: boolean;
}) {
  return (
    <Carousel
      ariaLabel={label}
      size={size}
      cluster="joined"
      peek={peek}
      padding={padding}
      surface={surface}
      transition={transition}
      side={side}
      distribution={distribution}
      align={align}
      gap={gap}
      ratio={ratio}
      loop={loop}
      autoplay={autoplay}
      defaultPlaying={autoplay}
      allowMouseDrag={allowMouseDrag}
    >
      <CarouselViewport>
        {SLIDES.map((bg, i) => (
          <CarouselSlide
            key={i}
            radius={radius}
            style={{ background: bg }}
          >
            {linked ? (
              <a
                href={`#slide-${i}`}
                data-testid={`slide-link-${i}`}
                aria-label={`Open slide ${i + 1}`}
                className="carousel-slide-link"
              >
                Slide {i + 1}
              </a>
            ) : null}
          </CarouselSlide>
        ))}
      </CarouselViewport>
      <CarouselControls>
        <CarouselPreviousTrigger aria-label="Previous slide">
          <ChevronLeft />
        </CarouselPreviousTrigger>
        <CarouselIndicatorGroup label="Choose slide">
          {SLIDES.map((_, i) => (
            <CarouselIndicator key={i} index={i} />
          ))}
        </CarouselIndicatorGroup>
        <CarouselNextTrigger aria-label="Next slide">
          <ChevronRight />
        </CarouselNextTrigger>
      </CarouselControls>
    </Carousel>
  );
}

/**
 * Vertical orientation — the "External-column beside" composition: the viewport
 * scrolls on the block axis (up/down), with the controls stacked into a column
 * beside it (up-control, vertical dots, down-control). The whole thing is the
 * iteration-1 row rotated a quarter turn, driven by a single `orientation` prop.
 */
function VerticalSingle({
  label,
  peek,
  padding,
  side,
  distribution,
  align,
  loop,
}: {
  label: string;
  peek?: "none" | "sm" | "md" | "lg";
  padding?: "none" | "sm" | "md" | "lg";
  side?: "before" | "after";
  distribution?: "group" | "stretch";
  align?: "start" | "center" | "end";
  loop?: boolean | "wrap" | "infinite";
}) {
  return (
    <Carousel
      ariaLabel={label}
      orientation="vertical"
      cluster="joined"
      peek={peek}
      padding={padding}
      side={side}
      distribution={distribution}
      align={align}
      loop={loop}
    >
      <CarouselViewport>
        {SLIDES.map((bg, i) => (
          <CarouselSlide key={i} style={{ background: bg }} />
        ))}
      </CarouselViewport>
      <CarouselControls>
        <CarouselPreviousTrigger aria-label="Previous slide">
          <ChevronUp />
        </CarouselPreviousTrigger>
        <CarouselIndicatorGroup label="Choose slide">
          {SLIDES.map((_, i) => (
            <CarouselIndicator key={i} index={i} />
          ))}
        </CarouselIndicatorGroup>
        <CarouselNextTrigger aria-label="Next slide">
          <ChevronDown />
        </CarouselNextTrigger>
      </CarouselControls>
    </Carousel>
  );
}

/**
 * Overlay placement — the "Overlay + dots" composition: the controls sit *on*
 * the imagery. prev/next flank the slide edges on a translucent scrim and the
 * dots ride in a pill along the bottom, so the slide runs edge to edge with no
 * external control chrome. Driven by a single `placement="overlay"` prop; the
 * parts are direct children of the Carousel (no `__controls` row wrapper).
 */
function OverlaySingle({
  label,
  ratio,
  peek,
  padding,
  transition,
  orientation = 'horizontal',
  side,
  slides = SLIDES,
}: {
  label: string;
  ratio?: "square" | "standard" | "wide" | "ultrawide";
  peek?: "none" | "sm" | "md" | "lg";
  padding?: "none" | "sm" | "md" | "lg";
  transition?: "slide" | "fade";
  orientation?: "horizontal" | "vertical";
  side?: "before" | "after";
  slides?: string[];
}) {
  const Prev = orientation === "vertical" ? ChevronUp : ChevronLeft;
  const Next = orientation === "vertical" ? ChevronDown : ChevronRight;
  return (
    <Carousel
      ariaLabel={label}
      placement="overlay"
      peek={peek}
      padding={padding}
      transition={transition}
      orientation={orientation}
      side={side}
      ratio={ratio}
    >
      <CarouselViewport>
        {slides.map((bg, i) => (
          <CarouselSlide key={i} style={{ background: bg }} />
        ))}
      </CarouselViewport>
      <CarouselPreviousTrigger aria-label="Previous slide">
        <Prev />
      </CarouselPreviousTrigger>
      <CarouselNextTrigger aria-label="Next slide">
        <Next />
      </CarouselNextTrigger>
      <CarouselIndicatorGroup label="Choose slide">
        {slides.map((_, i) => (
          <CarouselIndicator key={i} index={i} />
        ))}
      </CarouselIndicatorGroup>
    </Carousel>
  );
}

/**
 * External + split placement — circular prev/next sit *outside* the viewport's
 * inline edges (left/right) with the indicators centred in a row below. Driven by
 * `placement="external" cluster="split"`; the parts are direct children of the
 * root (no `__controls` wrapper — the grid places each by area), so prev/next swap
 * sides under RTL for free. Indicators can be dots or thumbnails.
 */
function ExternalSplitSingle({
  label,
  ratio,
  peek,
  indicators = "dots",
  side,
  orientation = "horizontal",
}: {
  label: string;
  ratio?: "square" | "standard" | "wide" | "ultrawide";
  peek?: "none" | "sm" | "md" | "lg";
  indicators?: "dots" | "thumbnails";
  side?: "before" | "after";
  orientation?: "horizontal" | "vertical";
}) {
  const Prev = orientation === "vertical" ? ChevronUp : ChevronLeft;
  const Next = orientation === "vertical" ? ChevronDown : ChevronRight;
  return (
    <Carousel
      ariaLabel={label}
      placement="external"
      cluster="split"
      peek={peek}
      indicators={indicators}
      side={side}
      orientation={orientation}
      ratio={ratio}
    >
      <CarouselViewport>
        {SLIDES.map((bg, i) => (
          <CarouselSlide key={i} style={{ background: bg }} />
        ))}
      </CarouselViewport>
      <CarouselPreviousTrigger aria-label="Previous slide">
        <Prev />
      </CarouselPreviousTrigger>
      <CarouselNextTrigger aria-label="Next slide">
        <Next />
      </CarouselNextTrigger>
      <CarouselIndicatorGroup label="Choose slide">
        {SLIDES.map((bg, i) => (
          <CarouselIndicator key={i} index={i}>
            {indicators === "thumbnails" ? <span style={{ background: bg }} /> : null}
          </CarouselIndicator>
        ))}
      </CarouselIndicatorGroup>
    </Carousel>
  );
}

/**
 * Multi-slide-per-view — several slides share the viewport at once, each taking
 * an equal share of the space (minus the inter-slide gap). `slidesPerPage` and
 * `slidesPerMove` are forwarded to the headless page model (they drive the slide
 * width, the indicator count, the boundary clamp and the active window), and the
 * dots come from the auto **`<CarouselIndicators>`** — it renders exactly
 * `totalPages` of them, so the count is always correct without wiring one dot per
 * slide. `count` slices the gallery so each edge case gets exactly the slide
 * total it needs.
 */
function MultiSlide({
  label,
  count,
  slidesPerPage,
  slidesPerMove,
  peek,
  padding,
  orientation,
  gap,
  loop,
  allowMouseDrag,
}: {
  label: string;
  count: number;
  slidesPerPage: number;
  slidesPerMove?: number;
  peek?: "none" | "sm" | "md" | "lg";
  padding?: "none" | "sm" | "md" | "lg";
  orientation?: "horizontal" | "vertical";
  gap?: "none" | "sm" | "md" | "lg";
  loop?: boolean | "wrap" | "infinite";
  allowMouseDrag?: boolean;
}) {
  const Prev = orientation === "vertical" ? ChevronUp : ChevronLeft;
  const Next = orientation === "vertical" ? ChevronDown : ChevronRight;
  return (
    <Carousel
      ariaLabel={label}
      cluster="joined"
      slidesPerPage={slidesPerPage}
      slidesPerMove={slidesPerMove}
      peek={peek}
      padding={padding}
      orientation={orientation}
      gap={gap}
      loop={loop}
      allowMouseDrag={allowMouseDrag}
    >
      <CarouselViewport>
        {GALLERY.slice(0, count).map((bg, i) => (
          <CarouselSlide key={i} style={{ background: bg }} />
        ))}
      </CarouselViewport>
      <CarouselControls>
        <CarouselPreviousTrigger aria-label="Previous page">
          <Prev />
        </CarouselPreviousTrigger>
        <CarouselIndicators label="Choose page" />
        <CarouselNextTrigger aria-label="Next page">
          <Next />
        </CarouselNextTrigger>
      </CarouselControls>
    </Carousel>
  );
}

// pageForSlideIndex (off CarouselContext) resolves an arbitrary target index
// to its *nearest* page start — the right tool for goTo/native-snap-target
// mapping, which is all it's meant for. It's the wrong tool for "which page
// does this slide's thumbnail visually belong to": a thumbnail's own slide
// index is always a genuine member of exactly one page's rendered window
// ([offset, offset + slidesPerPage - 1]), and "nearest offset" disagrees
// with "which window actually contains me" as soon as a page's *last*
// member sits closer to the *next* page's offset than its own (any
// slidesPerPage >= 3), or once the end-aligned last pages overlap (an
// uneven total) — both silently shrink a group's real member count (e.g.
// slidesPerPage=4 with 8 slides gave page 0 only 3 members instead of 4,
// found via human QA). This instead finds the first page whose real window
// contains the index, resolving the rare overlap case (last two pages
// sharing a slide) by preferring the earlier page, so every slide's
// thumbnail belongs to exactly one group.
function pageContainingSlideIndex(
  slideIndex: number,
  slidesPerPage: number,
  effectiveSlidesPerMove: number,
  maxOffset: number,
  totalPages: number,
): number {
  for (let page = 0; page < totalPages; page++) {
    const offset = Math.min(page * effectiveSlidesPerMove, maxOffset);
    if (slideIndex >= offset && slideIndex < offset + slidesPerPage) {
      return page;
    }
  }
  return totalPages - 1;
}

/**
 * One thumbnail per *slide*, grouped onto the *page* it belongs to. `<CarouselIndicator
 * index={N}>` is page-indexed (clicking it calls `goTo(N)`; its active state is
 * `N === currentPage`) — with `slidesPerPage > 1` several slides share a page, so each
 * of their thumbnails needs `index={pageContainingSlideIndex(slideIndex, ...)}`, not the
 * raw slide index, or they'd silently target the wrong (or an out-of-range) page. An
 * uneven last group (e.g. 8 slides ÷ 3 per page → groups of 3/3/2) is handled correctly
 * by construction (see `pageContainingSlideIndex` above).
 * Must render as a descendant of `Carousel` (a plain child suffices; it doesn't need to
 * be `<CarouselIndicatorGroup>`'s direct child) so the context is in scope.
 *
 * Also tracks group hover: hovering any thumbnail in a shared-page group should
 * lift the whole group, mirroring the CSS-only group border below — but hover
 * has no equivalent to `data-state="active"`'s naturally-shared value for CSS
 * to key off (`:hover` only ever applies to the pointed-at element), so this
 * tracks `hoveredPage` here and marks every thumbnail sharing it with
 * `data-group-hover`, which the registry stylesheet treats identically to `:hover`.
 */
function ThumbnailIndicators({
  slides,
  label,
}: {
  slides: string[];
  label: string;
}) {
  const ctx = useContext(CarouselContext);
  // Group hover: with slidesPerPage > 1, several thumbnails share one page —
  // hovering any one should read as hovering the whole group. CSS alone
  // can't express this (:hover only applies to the pointed-at element, with
  // no selector that projects it onto an arbitrary-length sibling run), so
  // "which page is currently hovered" is tracked here and every thumbnail
  // sharing it is marked.
  const [hoveredPage, setHoveredPage] = useState<number | null>(null);
  return (
    <CarouselIndicatorGroup label={label}>
      {slides.map((bg, i) => {
        const page = ctx
          ? pageContainingSlideIndex(
              i,
              ctx.slidesPerPage,
              ctx.effectiveSlidesPerMove,
              ctx.maxOffset,
              ctx.totalPages,
            )
          : i;
        return (
          <CarouselIndicator
            key={i}
            index={page}
            onMouseEnter={() => setHoveredPage(page)}
            onMouseLeave={() => setHoveredPage(null)}
            {...(hoveredPage === page && { "data-group-hover": "" })}
          >
            <span style={{ background: bg }} />
          </CarouselIndicator>
        );
      })}
    </CarouselIndicatorGroup>
  );
}

/**
 * Thumbnail indicators — the gallery pattern: each indicator is a rounded-rect
 * image thumbnail instead of a dot, the active one ringed in the primary colour
 * (`indicators="thumbnails"`). The thumbnail content is supplied as children of
 * each `<CarouselIndicator>` — here a gradient stand-in mirroring the slide. It
 * composes with every placement and orientation: `placement="overlay"` rides the
 * thumbnails in the scrim pill on the imagery; `orientation="vertical"` stacks
 * them into a rail beside the viewport; `showArrows={false}` makes the strip the
 * sole navigation (a pure filmstrip). With `slidesPerPage > 1`, several adjacent
 * thumbnails share one page — they highlight and border together as a group (via
 * `ThumbnailIndicators`) and clicking any one of them jumps to that shared page.
 */
function ThumbnailSingle({
  label,
  placement,
  orientation = "horizontal",
  showArrows = true,
  peek,
  side,
  slides = SLIDES,
  slidesPerPage = 1,
}: {
  label: string;
  placement?: "external" | "overlay";
  orientation?: "horizontal" | "vertical";
  showArrows?: boolean;
  peek?: "none" | "sm" | "md" | "lg";
  side?: "before" | "after";
  slides?: string[];
  slidesPerPage?: number;
}) {
  const Prev = orientation === "vertical" ? ChevronUp : ChevronLeft;
  const Next = orientation === "vertical" ? ChevronDown : ChevronRight;
  const thumbnails = <ThumbnailIndicators slides={slides} label="Choose slide" />;
  return (
    <Carousel
      ariaLabel={label}
      indicators="thumbnails"
      placement={placement}
      cluster={placement === "overlay" ? undefined : "joined"}
      orientation={orientation}
      peek={peek}
      side={side}
      slidesPerPage={slidesPerPage}
    >
      <CarouselViewport>
        {slides.map((bg, i) => (
          <CarouselSlide key={i} style={{ background: bg }} />
        ))}
      </CarouselViewport>
      {placement === "overlay" ? (
        // Overlay: the controls + thumbnail pill sit directly on the imagery, so
        // they are direct children (no __controls row wrapper).
        <>
          {showArrows && (
            <>
              <CarouselPreviousTrigger aria-label="Previous slide">
                <Prev />
              </CarouselPreviousTrigger>
              <CarouselNextTrigger aria-label="Next slide">
                <Next />
              </CarouselNextTrigger>
            </>
          )}
          {thumbnails}
        </>
      ) : (
        // Row / vertical: prev / thumbnails / next flow in the __controls wrapper
        // below (a column beside the viewport under vertical).
        <CarouselControls>
          {showArrows && (
            <CarouselPreviousTrigger aria-label="Previous slide">
              <Prev />
            </CarouselPreviousTrigger>
          )}
          {thumbnails}
          {showArrows && (
            <CarouselNextTrigger aria-label="Next slide">
              <Next />
            </CarouselNextTrigger>
          )}
        </CarouselControls>
      )}
    </Carousel>
  );
}

function Example({
  title,
  note,
  children,
  dir,
  wide,
}: {
  title: string;
  note: string;
  children: ReactNode;
  dir?: "rtl";
  /** Widens the page shell for a carousel-grid page — four columns need more
   * room than the default single/comparison-instance width. */
  wide?: boolean;
}) {
  const className = wide ? "carousel-page carousel-page--wide" : "carousel-page";
  return (
    <article className={className} dir={dir}>
      <h1>{title}</h1>
      <p className="carousel-page__note">{note}</p>
      {children}
    </article>
  );
}

export function CarouselDefault() {
  return (
    <Example
      title="Default — fills its container"
      note="One slide per view at 16:9, circular prev/next and dots sharing one row below. Resize the window to watch it adapt."
    >
      <BasicSingle label="Featured products — default" />
    </Example>
  );
}

export function CarouselResponsive() {
  return (
    <Example
      title="Container adaptation — narrow vs wide"
      note="The same carousel in a fixed-narrow column and a flexible-wide column, proving it adapts to whatever space it is given — no fixed dimensions."
      wide
    >
      <div className="carousel-grid">
        <GridCell
          n={1}
          title="Narrow vs wide container"
          note="A comparison, so it spans the full grid rather than sitting in one equal-width column (which would flatten the very contrast it's showing). Left: a fixed 18rem column. Right: a flexible column that fills the rest. No CSS assumes a minimum or fixed width — the carousel fills whatever box it's given."
          span="full"
        >
          <div className="carousel-page__row">
            <div className="carousel-page__narrow">
              <BasicSingle label="Featured products — narrow container" />
            </div>
            <div className="carousel-page__wide">
              <BasicSingle label="Featured products — wide container" />
            </div>
          </div>
        </GridCell>
      </div>
    </Example>
  );
}

export function CarouselRtl() {
  return (
    <Example
      title={'RTL — dir="rtl"'}
      note="Layout is expressed in logical properties, so the whole carousel mirrors under a right-to-left container with no RTL-specific CSS."
      dir="rtl"
    >
      <BasicSingle label="Featured products — right to left" />
    </Example>
  );
}

export function CarouselSquare() {
  return (
    <Example
      title={'Square slides — radius="none"'}
      note="The slide radius modifier squares off the default rounding via the CarouselSlide radius=“none” prop."
    >
      <BasicSingle label="Featured products — square" radius="none" />
    </Example>
  );
}

export function CarouselVertical() {
  return (
    <Example
      title={'Vertical — orientation="vertical"'}
      note="The block-axis carousel: up/down controls and a column of dots beside a landscape viewport (one 16:9 slide, scroll down to the next). ArrowDown/ArrowUp page it. The same layout under RTL puts the controls on the start (right) side — logical properties, no RTL-specific CSS."
      wide
    >
      <div className="carousel-grid">
        <GridCell
          n={1}
          title="Vertical"
          note="Up/down controls beside a landscape viewport; ArrowDown/ArrowUp page it."
        >
          <VerticalSingle label="Featured products — vertical" />
        </GridCell>
        <GridCell
          n={2}
          title="Vertical, RTL"
          note="The same layout mirrored — logical properties put the controls on the start (right) side with no RTL-specific CSS."
          dir="rtl"
        >
          <VerticalSingle label="Featured products — vertical, right to left" />
        </GridCell>
      </div>
    </Example>
  );
}

export function CarouselOverlay() {
  return (
    <Example
      title={'Overlay — placement="overlay"'}
      note="Controls sit on the imagery: circular prev/next flank the slide edges on a translucent scrim, and the dots ride in a pill overlaid on the slide — so it runs edge to edge with no external chrome. The scrim + glyph are theme-adaptive, so they read on any photo in light or dark. It composes with peek, with RTL (prev/next swap sides, the pill stays centred), and with orientation — a vertical overlay rotates a quarter turn: up/down controls flank the top and bottom, the dots pill rides the end side."
      wide
    >
      <div className="carousel-grid">
        <GridCell
          n={1}
          title="Overlay + peek"
          note="The design cell: a small peek reveals the neighbouring slides while the controls still ride the scrim."
        >
          <OverlaySingle label="Featured products — overlay with peek" peek="sm" />
        </GridCell>
        <GridCell
          n={2}
          title="Overlay, edge to edge"
          note="No peek — the imagery runs flush to the container edges with no external chrome at all."
        >
          <OverlaySingle label="Featured products — overlay, edge to edge" />
        </GridCell>
        <GridCell
          n={3}
          title="Overlay, RTL"
          note="Prev/next swap sides and the dots pill stays centred — logical properties, no RTL-specific CSS."
          dir="rtl"
        >
          <OverlaySingle label="Featured products — overlay, right to left" />
        </GridCell>
        <GridCell
          n={4}
          title="Vertical overlay"
          note="A quarter turn: up/down controls flank the top and bottom edges, the dots pill rides the end side."
        >
          <OverlaySingle
            label="Featured products — vertical overlay"
            orientation="vertical"
          />
        </GridCell>
        <GridCell
          n={5}
          title="Vertical overlay, RTL"
          note="The vertical layout mirrored — the dots pill moves to the start side."
          dir="rtl"
        >
          <OverlaySingle
            label="Featured products — vertical overlay, right to left"
            orientation="vertical"
          />
        </GridCell>
      </div>
    </Example>
  );
}

export function CarouselFade() {
  return (
    <Example
      title={'Fade — transition="fade"'}
      note="A crossfade instead of a scroll: the slides stack and the active one fades in over the others (off the headless data-transition hook). Native swipe/drag and peek don't apply — there's no scroll — but prev/next, the dots, and keyboard paging all still work. It composes with placement, so the second instance is a fade hero with the controls overlaid on the imagery."
      wide
    >
      <div className="carousel-grid">
        <GridCell
          n={1}
          title="Crossfade"
          note="Controls in the row below; prev/next, the dots, and keyboard paging all still work, but there's no scroll to swipe."
        >
          <BasicSingle label="Featured products — crossfade" transition="fade" />
        </GridCell>
        <GridCell
          n={2}
          title="Crossfade hero"
          note="Composes with overlay placement — a hero-style carousel with the controls on the imagery."
        >
          <OverlaySingle
            label="Featured products — crossfade hero"
            transition="fade"
          />
        </GridCell>
      </div>
    </Example>
  );
}

export function CarouselPeek() {
  return (
    <Example
      title="Peek — reveal the adjacent slides"
      note="A cross-cutting `peek` modifier (none · sm · md · lg) shows a sliver of the neighbouring slides on either side of the active one — and it composes with every other variant. It maps to the inline edges when horizontal and the block edges when vertical, so the same prop works in both orientations."
      wide
    >
      <div className="carousel-grid">
        <GridCell n={1} title="Peek small" note="A narrow sliver of each neighbour (space-16).">
          <BasicSingle label="Horizontal peek — small" peek="sm" />
        </GridCell>
        <GridCell n={2} title="Peek medium" note="A more generous reveal (space-32).">
          <BasicSingle label="Horizontal peek — medium" peek="md" />
        </GridCell>
        <GridCell n={3} title="Peek large" note="The widest step (space-48).">
          <BasicSingle label="Horizontal peek — large" peek="lg" />
        </GridCell>
        <GridCell
          n={4}
          title="Vertical peek"
          note="Maps to the block edges instead of inline — the same prop, the axis follows the orientation."
        >
          <VerticalSingle label="Vertical peek" peek="md" />
        </GridCell>
        <GridCell
          n={5}
          title="Peek, RTL"
          note="Mirrors under right-to-left with no RTL-specific CSS."
          dir="rtl"
        >
          <BasicSingle label="Peek under RTL" peek="md" />
        </GridCell>
      </div>
    </Example>
  );
}

export function CarouselPadding() {
  return (
    <Example
      title="Viewport padding — the framed-track grid"
      note="A cross-cutting `padding` modifier (none · sm · md · lg) turns the viewport into a padded, framed track: it insets the slides and draws the track outline (border + rounded corners). The background fill is opt-in via the separate `surface` modifier (cells 3 & 4 below) — padding alone is an outlined track. The gap is coupled to the padding so the resting track stays clean (no accidental peek). Each cell pins a size, the surface opt-in, or a composition."
      wide
    >
      <div className="carousel-grid">
        <GridCell
          n={1}
          title="padding none (baseline)"
          note="The default: a bare, frameless scroll box — no outline, fill or inset. The contrast for the framed cells."
        >
          <BasicSingle label="Padding none" />
        </GridCell>

        <GridCell
          n={2}
          title="padding sm (outlined)"
          note="A small padded track — border + rounded corners, transparent fill. The slides sit inset from the outline by space-16."
        >
          <BasicSingle label="Padding small" padding="sm" />
        </GridCell>

        <GridCell
          n={3}
          title="padding md + surface subtle"
          note="Opt into the fill: the `surface` modifier tints the track with the subtle surface token. Medium inset (space-32)."
        >
          <BasicSingle label="Padding medium, filled" padding="md" surface="subtle" />
        </GridCell>

        <GridCell
          n={4}
          title="padding lg + surface subtle"
          note="The filled track at the large inset (space-48) — surface fill + generous breathing room."
        >
          <BasicSingle label="Padding large, filled" padding="lg" surface="subtle" />
        </GridCell>

        <GridCell
          n={5}
          title="padding md + peek sm"
          note="Peek on top of the frame: a deliberate sliver of the neighbour shows inside the padded track (the gap coupling no longer fully hides it)."
        >
          <BasicSingle label="Padding + small peek" padding="md" peek="sm" />
        </GridCell>

        <GridCell
          n={6}
          title="padding lg + peek md"
          note="A big frame with a generous peek — the two insets stack on the scroll axis."
        >
          <BasicSingle label="Large padding + medium peek" padding="lg" peek="md" />
        </GridCell>

        <GridCell
          n={7}
          title="padding md + square slides"
          note="Slide radius none inside a rounded track: the frame stays rounded while the slides square off (radii are independent)."
        >
          <BasicSingle label="Padding + square slides" padding="md" radius="none" />
        </GridCell>

        <GridCell
          n={8}
          title="padding md + overlay"
          note="A framed track with the controls overlaid on the imagery — prev/next on the scrim, dots in the bottom pill, inside the padded box."
        >
          <OverlaySingle label="Padding + overlay" padding="md" />
        </GridCell>

        <GridCell
          n={9}
          title="padding md + 2-up"
          note="Multi-slide inside the frame: two slides share the padded track, the gap between them coupled to the padding."
        >
          <MultiSlide label="Padding + two per page" count={6} slidesPerPage={2} padding="md" />
        </GridCell>

        <GridCell
          n={10}
          title="padding md + vertical"
          note="The framed track on the block axis: padding runs top/bottom (scroll) and left/right (frame inset), up/down controls beside it."
        >
          <VerticalSingle label="Padding + vertical" padding="md" />
        </GridCell>

        <GridCell
          n={11}
          title="padding md + RTL"
          note="Mirrors under right-to-left — logical properties, no RTL-specific CSS. The frame + inset read identically."
          dir="rtl"
        >
          <BasicSingle label="Padding under RTL" padding="md" />
        </GridCell>

        <GridCell
          n={12}
          title="padding lg + 3-up + peek sm"
          note="A busy composition: a large framed track, three slides per page, and a peek sliver of the next page — every inset feature at once."
        >
          <MultiSlide
            label="Large padding, three per page, peek"
            count={6}
            slidesPerPage={3}
            padding="lg"
            peek="sm"
          />
        </GridCell>
      </div>
    </Example>
  );
}

/**
 * One numbered cell in an example grid (multi-slide, viewport padding, …): a
 * numbered title above the carousel and a short description below, so QA can
 * tick each case off. The `dir` opt lets a cell render right-to-left in place.
 */
function GridCell({
  n,
  title,
  note,
  dir,
  span,
  children,
}: {
  n: number;
  title: string;
  note: string;
  dir?: "rtl";
  /** "full" spans every column — for a cell whose content is itself a
   * comparison (e.g. two different container widths) that an equal-width
   * grid track would flatten. */
  span?: "full";
  children: ReactNode;
}) {
  const className =
    span === "full"
      ? "carousel-grid__cell carousel-grid__cell--full"
      : "carousel-grid__cell";
  return (
    <section className={className} dir={dir}>
      <h2 className="carousel-grid__title">
        {n}. {title}
      </h2>
      {children}
      <p className="carousel-grid__note">{note}</p>
    </section>
  );
}

export function CarouselMulti() {
  return (
    <Example
      title="Multi-slide — the edge-case grid"
      note="slidesPerPage and slidesPerMove are forwarded to the headless page model, so the visible slide count, the indicator count, the boundary clamp and the active window all stay in lockstep — no dot-per-slide miscount. Dots come from the auto <CarouselIndicators>, which renders exactly one per page. Each cell below pins one case: check the dot count, that the ends disable at the true last page, and that every slide is reachable."
      wide
    >
      <div className="carousel-grid">
        <GridCell
          n={1}
          title="perPage 2 · auto · 6 slides"
          note="Clean paged gallery: non-overlapping pages, moves a full page at a time. 3 dots."
        >
          <MultiSlide label="Case 1" count={6} slidesPerPage={2} />
        </GridCell>

        <GridCell
          n={2}
          title="perPage 2 · move 1 · 6 slides"
          note="Sliding window: overlapping pages, advances one slide per click. 5 dots."
        >
          <MultiSlide label="Case 2" count={6} slidesPerPage={2} slidesPerMove={1} />
        </GridCell>

        <GridCell
          n={3}
          title="perPage 2 · auto · 5 slides"
          note="Odd count: the last page end-aligns to a full window [3,4] (no lonely single slide), so it snaps cleanly and stays in sync. 3 dots."
        >
          <MultiSlide label="Case 3" count={5} slidesPerPage={2} />
        </GridCell>

        <GridCell
          n={4}
          title="perPage 3 · auto · 7 slides"
          note="Last page end-aligns to [4,5,6] (overlapping the one before by two) so two Next clicks reach it and the third dot activates — no desync. 3 dots."
        >
          <MultiSlide label="Case 4" count={7} slidesPerPage={3} />
        </GridCell>

        <GridCell
          n={5}
          title="perPage 3 · move 1 · 5 slides"
          note="Overlapping windows one slide apart: [0,1,2] [1,2,3] [2,3,4]. 3 dots."
        >
          <MultiSlide label="Case 5" count={5} slidesPerPage={3} slidesPerMove={1} />
        </GridCell>

        <GridCell
          n={6}
          title="perPage 3 · move 2 · 6 slides"
          note="Inexact move: the last window end-aligns to [3,4,5] so slide 6 stays reachable (not orphaned). 3 dots."
        >
          <MultiSlide label="Case 6" count={6} slidesPerPage={3} slidesPerMove={2} />
        </GridCell>

        <GridCell
          n={7}
          title="perPage 2 · move 3 · 6 slides"
          note="Move is clamped to the page size, so windows stay contiguous — no skipped slides. Behaves as move 2. 3 dots."
        >
          <MultiSlide label="Case 7" count={6} slidesPerPage={2} slidesPerMove={3} />
        </GridCell>

        <GridCell
          n={8}
          title="perPage 2 · 1 slide"
          note="Fewer slides than a page: one page, no navigation — prev/next disabled, one dot."
        >
          <MultiSlide label="Case 8" count={1} slidesPerPage={2} />
        </GridCell>

        <GridCell
          n={9}
          title="perPage 4 · 3 slides"
          note="Fewer slides than a page again: one page, controls disabled, one dot."
        >
          <MultiSlide label="Case 9" count={3} slidesPerPage={4} />
        </GridCell>

        <GridCell
          n={10}
          title="perPage 2 · 2 slides"
          note="Exactly one page: both slides fill the viewport, one dot, no navigation."
        >
          <MultiSlide label="Case 10" count={2} slidesPerPage={2} />
        </GridCell>

        <GridCell
          n={11}
          title="perPage 2 · auto · 6 · peek sm"
          note="Composes with peek: a sliver of the next page shows past the current one. 3 dots."
        >
          <MultiSlide label="Case 11" count={6} slidesPerPage={2} peek="sm" />
        </GridCell>

        <GridCell
          n={12}
          title="perPage 3 · auto · 7 · RTL"
          note="Mirrors under right-to-left — logical properties, no RTL-specific CSS. 3 dots."
          dir="rtl"
        >
          <MultiSlide label="Case 12" count={7} slidesPerPage={3} />
        </GridCell>

        <GridCell
          n={13}
          title="perPage 2 · auto · 6 · vertical"
          note="Multi-slide on the block axis: two slides stacked per page, up/down controls, vertical dots. 3 dots."
        >
          <MultiSlide
            label="Case 13"
            count={6}
            slidesPerPage={2}
            orientation="vertical"
          />
        </GridCell>
      </div>
    </Example>
  );
}

export function CarouselThumbnails() {
  return (
    <Example
      title={'Thumbnails — indicators="thumbnails"'}
      note="The gallery pattern: each indicator is a rounded-rect image thumbnail (a shrunk-down filmstrip) instead of a dot, and the active thumbnail is ringed in the primary colour. Supply the thumbnail content as children of each <CarouselIndicator> (an <img> or a background element — gradient stand-ins here, mirroring each slide). The modifier composes with every control placement and orientation; the grid below pins each control variant so QA can tick them off. With slidesPerPage > 1 (cells 7-9), each page's thumbnails are grouped: they share the active ring + a border framing the whole group, and clicking any one of them jumps to that shared page — including an uneven last group, handled by the same page-offset math the auto dots already use."
      wide
    >
      <div className="carousel-grid">
        <GridCell
          n={1}
          title="Default — controls row below"
          note="The standard gallery: prev / thumbnail strip / next share one row below the viewport. Click a thumbnail to jump; the active one carries the primary ring."
        >
          <ThumbnailSingle label="Thumbnails — default" />
        </GridCell>

        <GridCell
          n={2}
          title="Horizontal filmstrip — thumbnails only"
          note="The thumbnail strip is the sole navigation (no prev/next) — a pure filmstrip. Keyboard users still page via the focused viewport (Arrow/Home/End)."
        >
          <ThumbnailSingle label="Thumbnails — filmstrip" showArrows={false} />
        </GridCell>

        <GridCell
          n={3}
          title='Vertical — orientation="vertical"'
          note="The block-axis gallery: a landscape viewport with the up-control, a vertical thumbnail rail, and the down-control stacked in a column beside it. The thumbnails stack automatically (the group already flips to a column under vertical)."
        >
          <ThumbnailSingle label="Thumbnails — vertical" orientation="vertical" />
        </GridCell>

        <GridCell
          n={4}
          title='Overlay — placement="overlay"'
          note="Controls on the imagery: circular prev/next flank the slide on a translucent scrim and the thumbnail strip rides the bottom pill — an edge-to-edge hero gallery with no external chrome."
        >
          <ThumbnailSingle label="Thumbnails — overlay" placement="overlay" />
        </GridCell>

        <GridCell
          n={5}
          title="RTL — mirrors"
          note="The whole gallery mirrors under a right-to-left container — logical properties, no RTL-specific CSS. Prev/next swap sides; the thumbnail order follows the slides."
          dir="rtl"
        >
          <ThumbnailSingle label="Thumbnails — right to left" />
        </GridCell>

        <GridCell
          n={6}
          title='With peek — peek="sm"'
          note="Composes with peek: a sliver of the neighbouring slides shows in the viewport while the thumbnail strip navigates below — the two axes are independent."
        >
          <ThumbnailSingle label="Thumbnails — with peek" peek="sm" />
        </GridCell>

        <GridCell
          n={7}
          title="slidesPerPage=2 — grouped, even split"
          note="8 slides ÷ 2 per page = 4 clean pairs. Each pair's two thumbnails share one page: both ring + border together, and clicking either jumps to that pair. Prev/next advance a whole pair at a time."
        >
          <ThumbnailSingle
            label="Thumbnails — grouped by 2"
            slides={GALLERY}
            slidesPerPage={2}
          />
        </GridCell>

        <GridCell
          n={8}
          title="slidesPerPage=3 — grouped, uneven last page"
          note="8 slides ÷ 3 per page = groups of 3 / 3 / 2 — the last page end-aligns (the same page-offset math the dots already use), so its group is 2 thumbnails, not 3. The group border adapts automatically: 3-wide, 3-wide, then 2-wide."
        >
          <ThumbnailSingle
            label="Thumbnails — grouped by 3, uneven last"
            slides={GALLERY}
            slidesPerPage={3}
          />
        </GridCell>

        <GridCell
          n={9}
          title="Vertical + slidesPerPage=2 — grouped"
          note="The grouping composes with orientation for free (pageContainingSlideIndex doesn't care about axis) — the border rule swaps to frame each pair's left/right edges instead of top/bottom."
        >
          <ThumbnailSingle
            label="Thumbnails — vertical, grouped by 2"
            orientation="vertical"
            slides={GALLERY}
            slidesPerPage={2}
          />
        </GridCell>
      </div>
    </Example>
  );
}

export function CarouselRatio() {
  return (
    <Example
      title="Aspect ratio — square vs wide slides"
      note="The slide `ratio` modifier (square 1:1 · standard 4:3 · wide 16:9 default · ultrawide 21:9) re-points --primitiv-carousel-slide-aspect-ratio, so a slide keeps its ratio while filling its share of the container — no fixed pixel sizes. The grid pairs the two most distinct ratios row by row: the LEFT column is square (1:1), the RIGHT column is wide (16:9), each row a matching control/peek variant so you can compare the ratio in isolation. It composes with placement (outset row vs overlay) and peek for free — ratio is a slide concern, placement/peek are root concerns."
      wide
    >
      <div className="carousel-grid">
        <GridCell
          n={1}
          title="Square · outset controls"
          note="1:1 slide, controls in the row below (outset — outside the imagery). The baseline square."
        >
          <BasicSingle label="Square, controls below" ratio="square" />
        </GridCell>

        <GridCell
          n={2}
          title="Wide · outset controls"
          note="16:9 slide, controls in the row below. The baseline wide — the same composition as cell 1, only the ratio differs."
        >
          <BasicSingle label="Wide, controls below" ratio="wide" />
        </GridCell>

        <GridCell
          n={3}
          title="Square · overlay controls"
          note="1:1 slide with the controls overlaid on the imagery — prev/next on the scrim, dots in the bottom pill."
        >
          <OverlaySingle label="Square, overlay" ratio="square" />
        </GridCell>

        <GridCell
          n={4}
          title="Wide · overlay controls"
          note="16:9 slide, overlay controls. The wide counterpart to cell 3 — overlay insets ride the slide edges regardless of ratio."
        >
          <OverlaySingle label="Wide, overlay" ratio="wide" />
        </GridCell>

        <GridCell
          n={5}
          title="Square · outset · peek sm"
          note="1:1 slide with a small peek — a sliver of the square neighbours shows past the active slide."
        >
          <BasicSingle label="Square, peek sm" ratio="square" peek="sm" />
        </GridCell>

        <GridCell
          n={6}
          title="Wide · outset · peek sm"
          note="16:9 slide with the same small peek — the reveal is the same gutter, the neighbour just a wider sliver."
        >
          <BasicSingle label="Wide, peek sm" ratio="wide" peek="sm" />
        </GridCell>

        <GridCell
          n={7}
          title="Square · overlay · peek md"
          note="1:1 slide, overlay controls, and a medium peek — the overlay insets clear the peek gutter so prev/next stay on the active slide."
        >
          <OverlaySingle label="Square, overlay, peek md" ratio="square" peek="md" />
        </GridCell>

        <GridCell
          n={8}
          title="Wide · overlay · peek md"
          note="16:9 slide, overlay controls, medium peek — the wide counterpart to cell 7."
        >
          <OverlaySingle label="Wide, overlay, peek md" ratio="wide" peek="md" />
        </GridCell>

        <GridCell
          n={9}
          title="Square · outset · peek lg"
          note="1:1 slide with a large peek — generous neighbour reveal on both sides of the square."
        >
          <BasicSingle label="Square, peek lg" ratio="square" peek="lg" />
        </GridCell>

        <GridCell
          n={10}
          title="Wide · outset · peek lg"
          note="16:9 slide with the large peek — the wide counterpart, closing the square-vs-wide comparison across every peek size."
        >
          <BasicSingle label="Wide, peek lg" ratio="wide" peek="lg" />
        </GridCell>
      </div>
    </Example>
  );
}

export function CarouselPlacement() {
  return (
    <Example
      title="Control placement — the composable framework"
      note="Placement is a set of orthogonal props. `placement` picks external (off the imagery) or overlay (on it); `cluster` picks split (prev/next on the viewport's scroll-axis edges + a separate indicator cluster) or joined (one bar); the shared control-layout vocabulary composes on top — `side` (before/after, orientation-relative), `distribution` (group/stretch) and `align` (start/center/end for a grouped bar). Learn them once — they mean the same everywhere and degrade to a no-op where a placement doesn't read them. Below, every available combination grouped by section: all of external, then all of overlay, then external + split — so the whole surface can be QA'd in one pass."
      wide
    >
      {/* ============================ EXTERNAL ============================ */}
      <h2 className="carousel-page__group">External — a control bar beside the viewport</h2>
      <div className="carousel-grid">
        <GridCell
          n={1}
          title="after · group · start"
          note="Bar below, cluster pinned to the start (left) of the edge."
        >
          <BasicSingle label="external after group start" align="start" />
        </GridCell>
        <GridCell
          n={2}
          title="after · group · center (default)"
          note="The default surface: prev/dots/next bunched and centred below. Every other cell varies from this."
        >
          <BasicSingle label="external after group center" />
        </GridCell>
        <GridCell
          n={3}
          title="after · group · end"
          note="Cluster pinned to the end (right) of the edge below the viewport."
        >
          <BasicSingle label="external after group end" align="end" />
        </GridCell>
        <GridCell
          n={4}
          title="after · stretch"
          note="Prev/next to the two extremes, dots centred — space-between across the whole edge. Align is moot."
        >
          <BasicSingle label="external after stretch" distribution="stretch" />
        </GridCell>
        <GridCell
          n={5}
          title="before · group · start"
          note="`side=before` moves the whole bar above the viewport; cluster at the start."
        >
          <BasicSingle label="external before group start" side="before" align="start" />
        </GridCell>
        <GridCell
          n={6}
          title="before · group · center"
          note="Bar above, cluster centred."
        >
          <BasicSingle label="external before group center" side="before" />
        </GridCell>
        <GridCell
          n={7}
          title="before · group · end"
          note="Bar above, cluster at the end (right)."
        >
          <BasicSingle label="external before group end" side="before" align="end" />
        </GridCell>
        <GridCell
          n={8}
          title="before · stretch"
          note="Bar above, stretched — prev/next at the top corners, dots centred."
        >
          <BasicSingle label="external before stretch" side="before" distribution="stretch" />
        </GridCell>
        <GridCell
          n={9}
          title="vertical · after · group"
          note="Vertical scroll: the bar becomes a column on the end (right) side — up / dots / down."
        >
          <VerticalSingle label="external vertical after group" />
        </GridCell>
        <GridCell
          n={10}
          title="vertical · after · stretch"
          note="Vertical stretch: the control column fills the viewport height — up at the top, down at the bottom."
        >
          <VerticalSingle label="external vertical after stretch" distribution="stretch" />
        </GridCell>
        <GridCell
          n={11}
          title="vertical · before · group"
          note="`side=before` moves the control column to the start (left) side, mirrored under RTL."
        >
          <VerticalSingle label="external vertical before group" side="before" />
        </GridCell>
        <GridCell
          n={12}
          title="vertical · before · stretch"
          note="Vertical column on the left, stretched to the viewport ends."
        >
          <VerticalSingle label="external vertical before stretch" side="before" distribution="stretch" />
        </GridCell>
        <GridCell
          n={13}
          title="stretch + peek"
          note="Distribution composes with peek: prev/next at the extremes while a sliver of the neighbours shows."
        >
          <BasicSingle label="external stretch peek" distribution="stretch" peek="sm" />
        </GridCell>
        <GridCell
          n={14}
          title="group · start + padding"
          note="Alignment over a padded, framed track — a root concern (placement) stacked on a viewport concern (padding)."
        >
          <BasicSingle label="external start padding" align="start" padding="sm" surface="subtle" />
        </GridCell>
        <GridCell
          n={15}
          title="stretch + square ratio"
          note="Stretch over 1:1 slides — the slide `ratio` is orthogonal to the control layout."
        >
          <BasicSingle label="external stretch square" distribution="stretch" ratio="square" />
        </GridCell>
        <GridCell
          n={16}
          title="vertical · before + peek"
          note="Three axes at once: vertical orientation, side=before (left column), and a block-axis peek."
        >
          <VerticalSingle label="external vertical before peek" side="before" peek="sm" />
        </GridCell>
        <GridCell
          n={17}
          title="stretch + RTL"
          note="Stretch under right-to-left — prev/next swap to the mirrored extremes, dots stay centred. Logical, no RTL CSS."
          dir="rtl"
        >
          <BasicSingle label="external stretch rtl" distribution="stretch" />
        </GridCell>
        <GridCell
          n={18}
          title="stretch + thumbnails"
          note="Stretch with a thumbnail filmstrip as the indicators — the control-layout vocabulary works with any indicator style."
        >
          <ThumbnailStretch label="external stretch thumbnails" />
        </GridCell>
      </div>

      {/* ============================ OVERLAY ============================ */}
      <h2 className="carousel-page__group">Overlay — controls on the imagery</h2>
      <div className="carousel-grid">
        <GridCell
          n={1}
          title="after · dots (pill bottom)"
          note="The baseline: prev/next on a translucent scrim flanking the slide, dots in a pill at the bottom."
        >
          <OverlaySingle label="overlay after dots" />
        </GridCell>
        <GridCell
          n={2}
          title="before · dots (pill top)"
          note="`side=before` moves the dots pill to the top edge; prev/next keep flanking the slide."
        >
          <OverlaySingle label="overlay before dots" side="before" />
        </GridCell>
        <GridCell
          n={3}
          title="after · thumbnails"
          note="The thumbnail strip rides the bottom scrim pill — an edge-to-edge hero gallery."
        >
          <ThumbnailSingle label="overlay after thumbnails" placement="overlay" />
        </GridCell>
        <GridCell
          n={4}
          title="before · thumbnails"
          note="The thumbnail pill moved to the top edge with `side=before`."
        >
          <ThumbnailSingle label="overlay before thumbnails" placement="overlay" side="before" />
        </GridCell>
        <GridCell
          n={5}
          title="vertical · after (lane right)"
          note="Vertical overlay: up/down flank the top/bottom edges and the dots pill rides the end (right) inline lane."
        >
          <OverlaySingle label="overlay vertical after" orientation="vertical" />
        </GridCell>
        <GridCell
          n={6}
          title="vertical · before (lane left)"
          note="`side=before` flips the whole control lane (up / pill / down) to the start (left) inline side."
        >
          <OverlaySingle label="overlay vertical before" orientation="vertical" side="before" />
        </GridCell>
        <GridCell
          n={7}
          title="after + peek"
          note="Overlay composing with peek: the prev/next insets clear the peek gutter so they stay on the active slide."
        >
          <OverlaySingle label="overlay after peek" peek="sm" />
        </GridCell>
        <GridCell
          n={8}
          title="after + padding (framed track)"
          note="A framed padded track with the controls overlaid — the insets clear the border + padding so they sit on the slide, not the gutter."
        >
          <OverlaySingle label="overlay after padding" padding="md" />
        </GridCell>
        <GridCell
          n={9}
          title="after + RTL"
          note="Mirrors under right-to-left — prev/next swap sides, the pill stays centred. Logical, no RTL CSS."
          dir="rtl"
        >
          <OverlaySingle label="overlay after rtl" />
        </GridCell>
        <GridCell
          n={10}
          title="dots · many (wrap)"
          note="Many slides: dots can't shrink (fixed hit area), so the tray caps to the slide and the dots wrap to a second row, centred under the first, instead of overflowing."
        >
          <OverlaySingle label="overlay many dots" slides={GALLERY} />
        </GridCell>
        <GridCell
          n={11}
          title="vertical · dots · many (balanced columns)"
          note="The case that overflowed before: the vertical dot lane switches to a balanced grid, spreading the dots across columns (8 → 4+4) so the run stays within the landscape slide's height and clear of the block-centred up/down controls."
        >
          <OverlaySingle label="overlay vertical many dots" orientation="vertical" slides={GALLERY} />
        </GridCell>
        <GridCell
          n={12}
          title="thumbnails · many (shrink)"
          note="Thumbnails do shrink: with many slides the strip caps to the slide and the thumbnails scale down to fit (like external-split), inside the rounded-rect tray."
        >
          <ThumbnailSingle label="overlay many thumbnails" placement="overlay" slides={GALLERY} />
        </GridCell>
      </div>

      {/* ======================= EXTERNAL + SPLIT ======================= */}
      <h2 className="carousel-page__group">External + split — prev/next on the scroll-axis edges</h2>
      <div className="carousel-grid">
        <GridCell
          n={1}
          title="after · dots (indicators below)"
          note="Circular prev/next flanking the viewport's inline edges, a dot row centred below."
        >
          <ExternalSplitSingle label="external-split after dots" />
        </GridCell>
        <GridCell
          n={2}
          title="before · dots (indicators above)"
          note="`side=before` moves the indicator row above the viewport; prev/next stay on the edges."
        >
          <ExternalSplitSingle label="external-split before dots" side="before" />
        </GridCell>
        <GridCell
          n={3}
          title="after · thumbnails"
          note="The external-split + thumbnails design cell: flanking controls, a thumbnail strip below."
        >
          <ExternalSplitSingle label="external-split after thumbnails" indicators="thumbnails" />
        </GridCell>
        <GridCell
          n={4}
          title="before · thumbnails"
          note="The thumbnail strip above the viewport with `side=before`."
        >
          <ExternalSplitSingle label="external-split before thumbnails" indicators="thumbnails" side="before" />
        </GridCell>
        <GridCell
          n={5}
          title="vertical · after (indicators right)"
          note="Vertical external-split: prev/next become up/down flanking the top/bottom edges, the indicator column on the end (right) side."
        >
          <ExternalSplitSingle label="external-split vertical after" orientation="vertical" />
        </GridCell>
        <GridCell
          n={6}
          title="vertical · before (indicators left)"
          note="Vertical external-split with the indicator column on the start (left) side."
        >
          <ExternalSplitSingle label="external-split vertical before" orientation="vertical" side="before" />
        </GridCell>
        <GridCell
          n={7}
          title="after + peek"
          note="Composes with peek: a sliver of the neighbours shows in the viewport, controls still flanking outside it."
        >
          <ExternalSplitSingle label="external-split after peek" peek="sm" />
        </GridCell>
        <GridCell
          n={8}
          title="after + square ratio"
          note="Composes with the slide ratio: 1:1 square slides between the flanking controls."
        >
          <ExternalSplitSingle label="external-split after square" ratio="square" />
        </GridCell>
        <GridCell
          n={9}
          title="after + RTL"
          note="Mirrors under right-to-left — the grid columns follow writing direction, so prev/next swap sides with no RTL CSS."
          dir="rtl"
        >
          <ExternalSplitSingle label="external-split after rtl" />
        </GridCell>
      </div>
    </Example>
  );
}

function ThumbnailStretch({ label }: { label: string }) {
  return (
    <Carousel
      ariaLabel={label}
      indicators="thumbnails"
      cluster="joined"
      distribution="stretch"
    >
      <CarouselViewport>
        {SLIDES.map((bg, i) => (
          <CarouselSlide key={i} style={{ background: bg }} />
        ))}
      </CarouselViewport>
      <CarouselControls>
        <CarouselPreviousTrigger aria-label="Previous slide">
          <ChevronLeft />
        </CarouselPreviousTrigger>
        <CarouselIndicatorGroup label="Choose slide">
          {SLIDES.map((bg, i) => (
            <CarouselIndicator key={i} index={i}>
              <span style={{ background: bg }} />
            </CarouselIndicator>
          ))}
        </CarouselIndicatorGroup>
        <CarouselNextTrigger aria-label="Next slide">
          <ChevronRight />
        </CarouselNextTrigger>
      </CarouselControls>
    </Carousel>
  );
}

export function CarouselExternalSplit() {
  return (
    <Example
      title='External + split — placement="external" cluster="split"'
      note="The prev/next controls sit outside the viewport, flanking its inline edges (left/right), with the indicators centred in a row below — the external-split design cell. The parts are direct children of the root (a 3-column grid: prev | viewport | next), so prev/next swap sides under RTL for free. It composes with dots or thumbnails (the external-split + thumbnails cell), peek, and the slide ratio."
      wide
    >
      <div className="carousel-grid">
        <GridCell
          n={1}
          title="External-split +dots"
          note="The baseline: circular prev/next flanking the viewport, a dot row centred below. Click a control or dot to page."
        >
          <ExternalSplitSingle label="External-split — dots" />
        </GridCell>

        <GridCell
          n={2}
          title="External-split +thumbnails"
          note="The external-split + thumbnails design cell: the same flanking controls with a thumbnail strip below, active one ringed in the primary colour."
        >
          <ExternalSplitSingle label="External-split — thumbnails" indicators="thumbnails" />
        </GridCell>

        <GridCell
          n={3}
          title="External-split +peek sm"
          note="Composes with peek: a sliver of the neighbouring slides shows in the viewport, the controls still flanking outside it."
        >
          <ExternalSplitSingle label="External-split — peek" peek="sm" />
        </GridCell>

        <GridCell
          n={4}
          title="External-split +square slides"
          note="Composes with the slide ratio: 1:1 square slides between the flanking controls."
        >
          <ExternalSplitSingle label="External-split — square" ratio="square" />
        </GridCell>

        <GridCell
          n={5}
          title="External-split +RTL"
          note="Mirrors under right-to-left — the grid columns follow writing direction, so prev/next swap sides with no RTL-specific CSS."
          dir="rtl"
        >
          <ExternalSplitSingle label="External-split — right to left" />
        </GridCell>

        <GridCell
          n={6}
          title="External-split +thumbnails + peek"
          note="A busy composition: flanking controls, a thumbnail strip below, and a peek sliver of the neighbours — every external-split-compatible axis at once."
        >
          <ExternalSplitSingle label="External-split — thumbnails + peek" indicators="thumbnails" peek="sm" />
        </GridCell>
      </div>
    </Example>
  );
}

const SIZE_LADDER = [
  { size: "xs", note: "Extra small — the smallest control slot." },
  { size: "sm", note: "Small." },
  { size: "md", note: "Medium — the default, matching a same-size Button (~40px)." },
  { size: "lg", note: "Large." },
  { size: "xl", note: "Extra large — the biggest control slot." },
] as const;

export function CarouselSize() {
  return (
    <Example
      title="Size — the control chrome scales"
      note="A root `size` modifier (xs · sm · md default · lg · xl) scales the whole control chrome while the viewport and slides stay container-driven. The prev/next controls track the shared framed-control ramp (so a control matches a same-size Button — the box grows 32→40 at md); the dots, their WCAG hit area (floored ≥24), the active pill, the thumbnails and the chrome gaps track the bespoke carousel ramp — the dots deliberately gently, since they're already small. Size composes with the ambient density: flip the header Density control and every cell shifts together (a dense md pulls in as tight as a comfortable xs); the header Size control drives the Builder, where thumbnails at size are visible too."
      wide
    >
      <div className="carousel-grid">
        {SIZE_LADDER.map(({ size, note }, i) => (
          <GridCell key={size} n={i + 1} title={`size="${size}"`} note={note}>
            <BasicSingle label={`Size ${size}`} size={size} />
          </GridCell>
        ))}
      </div>
    </Example>
  );
}

export function CarouselSpacing() {
  return (
    <Example
      title="Slide spacing — the inter-slide gap"
      note="A cross-cutting `gap` modifier (none · sm · md · lg) sets the spacing between slides on a t-shirt scale, re-pointing --primitiv-carousel-gap to a spacing token (space-0 / 8 / 16 default / 32). The gap is only visible when more than one slide shares the viewport, so the ladder uses a 2-up view; it runs on the scroll axis (inline horizontal, block vertical) and composes with every other variant. One caveat: the `padding` modifier couples the gap to its inset for a clean framed track, so it overrides `gap` inside a padded track."
      wide
    >
      <div className="carousel-grid">
        <GridCell
          n={1}
          title="gap none (flush)"
          note="`gap=none` (space-0): the slides sit flush against each other, no channel between them."
        >
          <MultiSlide label="Gap none" count={6} slidesPerPage={2} gap="none" />
        </GridCell>
        <GridCell
          n={2}
          title="gap sm"
          note="A small gap (space-8) — a tight channel between the two visible slides."
        >
          <MultiSlide label="Gap small" count={6} slidesPerPage={2} gap="sm" />
        </GridCell>
        <GridCell
          n={3}
          title="gap md (default)"
          note="The default (space-16) — the spacing every other example uses. `gap=md` is byte-equivalent to the base."
        >
          <MultiSlide label="Gap medium" count={6} slidesPerPage={2} gap="md" />
        </GridCell>
        <GridCell
          n={4}
          title="gap lg"
          note="A large gap (space-32) — a generous channel; the slide flex-basis shrinks to keep two per page."
        >
          <MultiSlide label="Gap large" count={6} slidesPerPage={2} gap="lg" />
        </GridCell>
        <GridCell
          n={5}
          title="gap lg + peek"
          note="Composes with peek: the large inter-slide gap shows in the sliver of the next slide revealed past the active one (single-slide view)."
        >
          <BasicSingle label="Gap large + peek" gap="lg" peek="md" />
        </GridCell>
        <GridCell
          n={6}
          title="gap lg + 3-up"
          note="Composes with multi-slide: three slides per page, each share recomputed from the content box minus the (now larger) gaps."
        >
          <MultiSlide label="Gap large, three up" count={6} slidesPerPage={3} gap="lg" />
        </GridCell>
        <GridCell
          n={7}
          title="gap lg + vertical"
          note="On the block axis: the gap runs vertically between the stacked slides (two per page, vertical scroll)."
        >
          <MultiSlide label="Gap large, vertical" count={6} slidesPerPage={2} gap="lg" orientation="vertical" />
        </GridCell>
        <GridCell
          n={8}
          title="gap lg + RTL"
          note="Mirrors under right-to-left — the gap is a logical inline spacing, so it needs no RTL-specific CSS."
          dir="rtl"
        >
          <MultiSlide label="Gap large, RTL" count={6} slidesPerPage={2} gap="lg" />
        </GridCell>
      </div>
    </Example>
  );
}

// A self-contained placeholder "photo" at a given intrinsic size — a labelled
// gradient SVG data URI. Unlike a gradient *background*, this is a real replaced
// <img> with its own intrinsic size/ratio, so it exercises the slide's object-fit
// handling exactly as a raster photo would (a wide slide can't just make a
// portrait source fill it). The label shows the source's own W×H so a cover-crop
// or contain-letterbox is legible.
function photo(w: number, h: number, from: string, to: string): string {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>` +
    `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
    `<stop offset='0' stop-color='${from}'/><stop offset='1' stop-color='${to}'/></linearGradient></defs>` +
    `<rect width='${w}' height='${h}' fill='url(#g)'/>` +
    `<rect x='6' y='6' width='${w - 12}' height='${h - 12}' fill='none' stroke='white' stroke-opacity='0.5' stroke-width='4' stroke-dasharray='12 10'/>` +
    `<text x='${w / 2}' y='${h / 2}' fill='white' font-family='sans-serif' font-size='${Math.max(18, Math.min(w, h) / 6)}' font-weight='700' text-anchor='middle' dominant-baseline='middle'>${w}×${h}</text>` +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const PORTRAIT = photo(360, 640, "#1e3a8a", "#14b8a6");
const LANDSCAPE = photo(640, 360, "#7c3aed", "#ec4899");
const SQUARE = photo(500, 500, "#ea580c", "#16a34a");

// A same-height "product strip" of real images at six distinct widths — the
// headline variable-width demo needs several *full* items visible in one
// generous viewport (not just two sources compared), so the differing widths
// read clearly against a uniform height, like a real product gallery.
const PRODUCTS = [
  photo(200, 280, "#1e3a8a", "#14b8a6"),
  photo(340, 280, "#7c3aed", "#ec4899"),
  photo(260, 280, "#ea580c", "#16a34a"),
  photo(420, 280, "#0ea5e9", "#6366f1"),
  photo(300, 280, "#db2777", "#f59e0b"),
  photo(240, 280, "#0d9488", "#4f46e5"),
];

type ImageSlide = {
  src: string;
  fit?: "cover" | "contain";
  objectPosition?: string;
  caption?: string;
  surface?: "subtle";
};

// Renders real <img> slides through the styled surface, so the slide's media
// handling (fill + object-fit + object-position + the positioning context for a
// caption overlay) is what's on show — not a gradient background.
function ImageSingle({
  label,
  slides,
  ratio,
}: {
  label: string;
  slides: ImageSlide[];
  ratio?: "square" | "standard" | "wide" | "ultrawide";
}) {
  return (
    <Carousel ariaLabel={label} cluster="joined" ratio={ratio}>
      <CarouselViewport>
        {slides.map((slide, i) => (
          <CarouselSlide key={i} fit={slide.fit} surface={slide.surface}>
            <img
              src={slide.src}
              alt=""
              style={
                slide.objectPosition
                  ? { objectPosition: slide.objectPosition }
                  : undefined
              }
            />
            {slide.caption ? (
              <div
                style={{
                  position: "absolute",
                  insetInline: 0,
                  insetBlockEnd: 0,
                  padding: "10px 14px",
                  background: "linear-gradient(transparent, rgba(0, 0, 0, 0.65))",
                  color: "#fff",
                  font: "600 14px/1.3 sans-serif",
                }}
              >
                {slide.caption}
              </div>
            ) : null}
          </CarouselSlide>
        ))}
      </CarouselViewport>
      <CarouselControls>
        <CarouselPreviousTrigger aria-label="Previous slide">
          <ChevronLeft />
        </CarouselPreviousTrigger>
        <CarouselIndicatorGroup label="Choose slide">
          {slides.map((_, i) => (
            <CarouselIndicator key={i} index={i} />
          ))}
        </CarouselIndicatorGroup>
        <CarouselNextTrigger aria-label="Next slide">
          <ChevronRight />
        </CarouselNextTrigger>
      </CarouselControls>
    </Carousel>
  );
}

export function CarouselImages() {
  return (
    <Example
      title="Images — real <img> slides"
      note="The slide box is always sized by the layout (fill + aspect-ratio), but a real <img> is a replaced element with its own intrinsic size/ratio — so the surface stretches a direct media child to the box and object-fit decides how it conforms. `fit=cover` (default) fills and crops to keep the ratio; the `fit=contain` slide modifier fits the whole image and letterboxes it against the slide's own background. --primitiv-carousel-slide-object-position moves the crop's focal point. The slide is a positioning context, so a caption/overlay drops in with no wrapper. Consumer-side (by nature): the asset itself, srcset/sizes, loading/fetchpriority (eager the first slide for LCP), and alt text."
      wide
    >
      <div className="carousel-grid">
        <GridCell
          n={1}
          title="fit=cover (default) — mixed sources"
          note="Portrait, landscape and square sources page through one 16:9 slot. Each fills the slide and is cropped to keep its ratio — a uniform gallery from non-uniform assets, no per-image CSS."
        >
          <ImageSingle
            label="Cover, mixed sources"
            slides={[{ src: PORTRAIT }, { src: LANDSCAPE }, { src: SQUARE }]}
          />
        </GridCell>
        <GridCell
          n={2}
          title="fit=contain — no crop"
          note="The same sources with `fit=contain`: the whole image fits inside the slide, letterboxed against an opt-in backdrop (the slide `surface=subtle` modifier — the same surface token as the root track). Best for logos / art that must not be cut."
        >
          <ImageSingle
            label="Contain, mixed sources"
            slides={[
              { src: PORTRAIT, fit: "contain", surface: "subtle" },
              { src: LANDSCAPE, fit: "contain", surface: "subtle" },
              { src: SQUARE, fit: "contain", surface: "subtle" },
            ]}
          />
        </GridCell>
        <GridCell
          n={3}
          title="object-position — focal point"
          note="The same portrait cover-cropped at three focal points via object-position (top / center / bottom) — the consumer sets it per slide to control what a crop keeps."
        >
          <ImageSingle
            label="Focal point"
            slides={[
              { src: PORTRAIT, objectPosition: "top" },
              { src: PORTRAIT, objectPosition: "center" },
              { src: PORTRAIT, objectPosition: "bottom" },
            ]}
          />
        </GridCell>
        <GridCell
          n={4}
          title="caption overlay"
          note="The slide is position:relative, so an absolutely-positioned caption anchors to the slide box (and clips to its rounded corners) with no extra wrapper — the common hero pattern of text over imagery."
        >
          <ImageSingle
            label="Captioned"
            slides={[
              { src: LANDSCAPE, caption: "Summer collection — up to 40% off" },
              { src: SQUARE, caption: "New arrivals" },
            ]}
          />
        </GridCell>
        <GridCell
          n={5}
          title="images + ratio=square"
          note="Composes with the root `ratio` modifier: the same sources cover-cropped to a 1:1 slot instead of 16:9. The media conforms to whatever shape the layout gives the slide."
        >
          <ImageSingle
            label="Square ratio"
            ratio="square"
            slides={[{ src: LANDSCAPE }, { src: PORTRAIT }, { src: SQUARE }]}
          />
        </GridCell>
        <GridCell
          n={6}
          title="images + RTL"
          note="Right-to-left mirrors the controls and paging; the media handling is direction-agnostic."
          dir="rtl"
        >
          <ImageSingle
            label="RTL"
            slides={[{ src: SQUARE }, { src: LANDSCAPE }, { src: PORTRAIT }]}
          />
        </GridCell>
      </div>
    </Example>
  );
}

type VariableWidthCard = { width: number; label: string; tone: string };

const CARDS: VariableWidthCard[] = [
  { width: 160, label: "160px", tone: "#1e3a8a" },
  { width: 340, label: "340px", tone: "#7c3aed" },
  { width: 220, label: "220px", tone: "#ea580c" },
  { width: 420, label: "420px", tone: "#0d9488" },
];

// Ark UI's own `autoSize` demo pattern: labels of visibly different lengths,
// no explicit width at all — the slide's flex-basis:auto sizes it to fit its
// own text + padding (max-content sizing), exactly like a normal inline-block
// would. Distinct from CARDS above (an explicit inline width) — this is the
// "bring no width, content decides" case, the more common real-world one.
type NaturalCard = { label: string; tone: string };

const NATURAL_CARDS: NaturalCard[] = [
  { label: "XS", tone: "#1e3a8a" },
  { label: "Small", tone: "#7c3aed" },
  { label: "Medium Size", tone: "#ea580c" },
  { label: "Large", tone: "#0d9488" },
  { label: "Extra Large Item", tone: "#db2777" },
  { label: "S", tone: "#0ea5e9" },
];

// Renders variable-width slides through the `slideWidth` modifier — real
// <img> sources (proving the content-sizing path against a genuine replaced
// element, not a CSS background), content-sized text cards with no explicit
// width at all (Ark's own `autoSize` pattern — the slide's flex-basis:auto
// sizes to its text + padding), or cards with an explicit inline width
// (proving it isn't limited to natural content sizing either).
// `centerIndex` composes the per-slide `snapAlign="center"` override (see
// the "Images" page) onto one slide in an otherwise explicitly
// start-aligned track (root `snapAlign="start"`, overriding the `center`
// default); `snapAlign` sets the *root* default for every slide instead (the classic
// "each active card centres in view" feel a variable-width carousel usually
// wants — the scroll math measures each slide's real rendered width, so
// centering already works regardless of how wide it turns out to be).
function VariableWidthSingle({
  label,
  images,
  natural,
  cards,
  slideWidth = "content",
  orientation,
  peek,
  snapAlign,
  centerIndex,
}: {
  label: string;
  images?: string[];
  natural?: NaturalCard[];
  cards?: VariableWidthCard[];
  slideWidth?: "equal" | "content";
  orientation?: "horizontal" | "vertical";
  peek?: "none" | "sm" | "md" | "lg";
  snapAlign?: "start" | "center" | "end";
  /** Overrides that one slide's snapAlign to "center", demonstrating the
   * per-slide override composing with a variable-width track. */
  centerIndex?: number;
}) {
  const count = images?.length ?? natural?.length ?? cards?.length ?? 0;
  const vertical = orientation === "vertical";
  return (
    <Carousel
      ariaLabel={label}
      cluster="joined"
      slideWidth={slideWidth}
      orientation={orientation}
      peek={peek}
      snapAlign={snapAlign}
    >
      <CarouselViewport>
        {images?.map((src, i) => (
          <CarouselSlide
            key={i}
            snapAlign={i === centerIndex ? "center" : undefined}
          >
            <img src={src} alt="" />
          </CarouselSlide>
        ))}
        {natural?.map((card, i) => (
          <CarouselSlide
            key={i}
            snapAlign={i === centerIndex ? "center" : undefined}
            style={{
              background: card.tone,
              padding: vertical ? "20px 28px" : "24px 32px",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              font: "700 16px/1 sans-serif",
            }}
          >
            {card.label}
          </CarouselSlide>
        ))}
        {cards?.map((card, i) => (
          <CarouselSlide
            key={i}
            snapAlign={i === centerIndex ? "center" : undefined}
            style={{
              width: vertical ? undefined : card.width,
              height: vertical ? card.width : undefined,
              background: card.tone,
              display: "grid",
              placeItems: "center",
              color: "#fff",
              font: "700 14px/1 sans-serif",
            }}
          >
            {card.label}
          </CarouselSlide>
        ))}
      </CarouselViewport>
      <CarouselControls>
        <CarouselPreviousTrigger aria-label="Previous slide">
          {vertical ? <ChevronUp /> : <ChevronLeft />}
        </CarouselPreviousTrigger>
        <CarouselIndicatorGroup label="Choose slide">
          {Array.from({ length: count }, (_, i) => (
            <CarouselIndicator key={i} index={i} />
          ))}
        </CarouselIndicatorGroup>
        <CarouselNextTrigger aria-label="Next slide">
          {vertical ? <ChevronDown /> : <ChevronRight />}
        </CarouselNextTrigger>
      </CarouselControls>
    </Carousel>
  );
}

export function CarouselVariableWidth() {
  return (
    <Example
      title="Variable-width slides — the slideWidth modifier"
      note={
        'A root `slideWidth` modifier (`equal` default · `content`) chooses how each slide\'s width is determined. `equal` shares the viewport evenly (every other example on this page). `content` switches the slide flex-basis to `auto` and stands down the `ratio` aspect-ratio, so each slide sizes to its own content instead — an intrinsically-sized <img>, an explicit inline width, or (the most common case, and Ark UI\'s own `autoSize` demo pattern) plain text + padding with no explicit width at all. Seeing several full-width items at once — the compelling part of the effect — falls out for free from a generous container plus individually narrow slides; it needs no `slidesPerPage` (that axis groups N slides into one indivisible *page* for paging/indicator purposes, which assumes every slide is the same width — fundamentally incompatible with letting each one size itself, so the two axes don\'t combine). `snapAlign="center"` (root default below, or per-slide) already centres correctly whatever width a slide turns out to be — the scroll math measures each slide\'s real rendered width, never an assumed share.'
      }
      wide
    >
      <div className="carousel-grid carousel-grid--roomy">
        <GridCell
          n={1}
          title="content — real product photos, several at once"
          note="Six photos at six different widths (a uniform height, like a real product strip). A couple of full images show side by side at once with no cropping — a consequence of the individual widths vs. the viewport, not slidesPerPage — while the container stays narrow enough that there's still real content to page through. Centre-snapping (snapAlign=&quot;center&quot;, the root default here) keeps whichever card is active centred once a scroll settles."
          span="full"
        >
          <div className="carousel-page__constrain">
            <VariableWidthSingle
              label="Product photos, natural widths"
              images={PRODUCTS}
              slideWidth="content"
              snapAlign="center"
            />
          </div>
        </GridCell>

        <GridCell
          n={2}
          title="content — text sized to itself (Ark UI's autoSize pattern)"
          note={
            'No image, no explicit width at all — each card is padding + a text label, and the slide\'s flex-basis:auto sizes it to fit exactly that (max-content sizing). Longer labels ("Medium Size", "Extra Large Item") are visibly wider than short ones ("XS", "S") with zero per-slide sizing code. Also centre-snapping.'
          }
          span="full"
        >
          <div className="carousel-page__constrain">
            <VariableWidthSingle
              label="Text cards, natural widths"
              natural={NATURAL_CARDS}
              snapAlign="center"
            />
          </div>
        </GridCell>

        <GridCell
          n={3}
          title="equal — the same photos, for contrast"
          note="The same six sources with slideWidth left at its default (`equal`): every slide takes the same share of the viewport and is cropped to fit — the behaviour the rest of this gallery assumes. Compare against cell 1."
        >
          <VariableWidthSingle
            label="Equal-share photos"
            images={PRODUCTS}
            slideWidth="equal"
          />
        </GridCell>

        <GridCell
          n={4}
          title="content — explicit inline width"
          note="Plain content boxes with an explicit inline width each (160 / 340 / 220 / 420px), not a natural/intrinsic size — proving `content` mode also accepts a consumer-supplied width, not just intrinsic sizing."
        >
          <VariableWidthSingle label="Explicit-width cards" cards={CARDS} />
        </GridCell>

        <GridCell
          n={5}
          title="content + peek"
          note="A peek reveals a sliver of the next differently-sized card past the active one — the peek gutter composes with variable widths exactly as it does with equal ones."
        >
          <VariableWidthSingle
            label="Cards with peek"
            natural={NATURAL_CARDS}
            peek="md"
          />
        </GridCell>

        <GridCell
          n={6}
          title="content + one centred slide (start-aligned track)"
          note="Here the root is explicitly set to snapAlign=&quot;start&quot; (the previous default, now that `center` is); only the third card overrides it to `center` for just itself (Carousel.Slide's own snapAlign prop) — it settles centred while its neighbours still align to their leading edge. Distinct from cells 1–2, where every slide centres."
        >
          <VariableWidthSingle
            label="One centred card"
            natural={NATURAL_CARDS}
            snapAlign="start"
            centerIndex={2}
          />
        </GridCell>

        <GridCell
          n={7}
          title="content + RTL"
          note="Right-to-left mirrors the controls and paging; each card keeps its own width regardless of direction."
          dir="rtl"
        >
          <VariableWidthSingle
            label="RTL cards"
            natural={NATURAL_CARDS}
            snapAlign="center"
          />
        </GridCell>

        <GridCell
          n={8}
          title="content + vertical"
          note="The same three images, now block-sized to their own natural height in a vertical track — content-sizing is orientation-agnostic (flex-basis governs whichever axis is the main axis)."
        >
          <VariableWidthSingle
            label="Vertical natural heights"
            images={[PORTRAIT, LANDSCAPE, SQUARE]}
            orientation="vertical"
            snapAlign="center"
          />
        </GridCell>
      </div>
    </Example>
  );
}

/**
 * A single instance wired up two ways: pure CSS reading `--slide-progress`
 * (each slide dims + shrinks slightly the further its center sits from the
 * viewport's) needs no JS at all — the headless primitive already writes it.
 * The bar below reads `getScrollProgress()` imperatively instead, because it
 * lives *outside* the Viewport's own DOM subtree — `--carousel-progress` is
 * set on the Viewport element, so it doesn't cascade sideways to a sibling;
 * the imperative getter is the tool for exactly that case. A polling
 * `requestAnimationFrame` loop (not a scroll listener) picks up resize-driven
 * recomputes too, matching how the headless effect itself recomputes.
 */
function ProgressSingle({ label }: { label: string }) {
  const carouselRef = useRef<CarouselImperativeApi>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSlideProgress, setActiveSlideProgress] = useState(0);

  useEffect(() => {
    let frameId: number;
    const tick = () => {
      const api = carouselRef.current;
      if (api) {
        setScrollProgress(api.getScrollProgress());
        setActiveSlideProgress(api.getSlideProgress(api.getProgress().page));
      }
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <div className="carousel-page__progress-demo">
      <Carousel ariaLabel={label} ref={carouselRef} cluster="joined">
        <CarouselViewport>
          {GALLERY.map((bg, i) => (
            <CarouselSlide
              key={i}
              className="carousel-page__progress-slide"
              style={{ background: bg }}
            />
          ))}
        </CarouselViewport>
        <CarouselControls>
          <CarouselPreviousTrigger aria-label="Previous slide">
            <ChevronLeft />
          </CarouselPreviousTrigger>
          <CarouselIndicatorGroup label="Choose slide">
            {GALLERY.map((_, i) => (
              <CarouselIndicator key={i} index={i} />
            ))}
          </CarouselIndicatorGroup>
          <CarouselNextTrigger aria-label="Next slide">
            <ChevronRight />
          </CarouselNextTrigger>
          <CarouselProgressText className="carousel-page__progress-text" />
        </CarouselControls>
      </Carousel>
      <div className="carousel-page__progress-readout">
        <div className="carousel-page__progress-track" aria-hidden="true">
          <div
            className="carousel-page__progress-fill"
            style={{ inlineSize: `${scrollProgress * 100}%` }}
          />
        </div>
        <p className="carousel-page__progress-values">
          <code>getScrollProgress()</code> = {scrollProgress.toFixed(2)} ·{" "}
          <code>getSlideProgress(active)</code> ={" "}
          {activeSlideProgress.toFixed(2)}
        </p>
      </div>
    </div>
  );
}

export function CarouselProgress() {
  return (
    <Example
      title="Continuous scroll progress"
      note="getScrollProgress() (0..1) and getSlideProgress(index) (-1..0..1) are continuous signals, unlike the page-granular getProgress() / boolean isInView(). Both are mirrored live onto CSS custom properties — --carousel-progress on the Viewport, --slide-progress on each Slide — so a stylesheet can read them directly with no JS. Here every slide dims and shrinks slightly as it moves away from center (pure CSS, --slide-progress); the bar and the live numbers below read the same signal imperatively instead, since they sit outside the Viewport's own DOM subtree."
    >
      <ProgressSingle label="Featured products — scroll progress" />
    </Example>
  );
}

/**
 * Slideshow (parallax) — Blossom Carousel's Slideshow example, replicated
 * against our markup: `effect="parallax"` gives each slide's
 * <CarouselSlideContent> a native, zero-JavaScript drift as the slide crosses
 * the viewport, via a CSS view-timeline scoped to the slide
 * (animation-timeline: view(), animation-range: cover) — the registry
 * stylesheet owns the whole technique, this component just opts in and wraps
 * each slide's media in <CarouselSlideContent> (the layer the animation
 * actually targets; the slide itself keeps clipping it via overflow: hidden).
 * Browsers without view-timeline support (Firefox stable, as of writing) fall
 * back to a CSS rule reading the headless --slide-progress signal instead —
 * still zero JavaScript of this component's own, and the effect disables
 * entirely under prefers-reduced-motion. Composes with orientation, RTL and
 * peek for free, since the effect is just a modifier on the existing surface.
 *
 * The backdrop lives on the Slide itself (a static gradient), and only a
 * small foreground marker sits inside <CarouselSlideContent> — the layer
 * that actually drifts. This marker isn't media, so it isn't auto-oversized;
 * <CarouselSlideContent> fills the slide box exactly (100% × 100%), so a
 * translate up to the full --primitiv-carousel-parallax-amount moves its edge
 * past the slide's own — the transparent region that reveals just shows the
 * matching backdrop underneath rather than a visible gap. (Full-bleed *media* —
 * an <img>/<video>/<picture> in <CarouselSlideContent> — needs no backdrop: the
 * registry auto-oversizes it by --primitiv-carousel-parallax-scale so it pans
 * end to end without exposing an edge. The backdrop pattern here is for the
 * non-media marker case.)
 */
function SlideshowSingle({
  label,
  orientation = "horizontal",
  peek,
  loop,
}: {
  label: string;
  orientation?: "horizontal" | "vertical";
  peek?: "none" | "sm" | "md" | "lg";
  loop?: boolean | "wrap" | "infinite";
}) {
  const Prev = orientation === "vertical" ? ChevronUp : ChevronLeft;
  const Next = orientation === "vertical" ? ChevronDown : ChevronRight;
  return (
    <Carousel
      ariaLabel={label}
      cluster="joined"
      effect="parallax"
      orientation={orientation}
      peek={peek}
      radius="none"
      gap="none"
      loop={loop}
    >
      <CarouselViewport>
        {GALLERY.map((bg, i) => (
          <CarouselSlide key={i} radius="none" style={{ background: bg }}>
            <CarouselSlideContent className="carousel-page__slideshow-content">
              <span className="carousel-page__slideshow-label">{i + 1}</span>
            </CarouselSlideContent>
          </CarouselSlide>
        ))}
      </CarouselViewport>
      <CarouselControls>
        <CarouselPreviousTrigger aria-label="Previous slide">
          <Prev />
        </CarouselPreviousTrigger>
        <CarouselIndicatorGroup label="Choose slide">
          {GALLERY.map((_, i) => (
            <CarouselIndicator key={i} index={i} />
          ))}
        </CarouselIndicatorGroup>
        <CarouselNextTrigger aria-label="Next slide">
          <Next />
        </CarouselNextTrigger>
      </CarouselControls>
    </Carousel>
  );
}

export function CarouselSlideshow() {
  return (
    <Example
      title="Slideshow (parallax) — scroll-driven, zero JavaScript"
      note="effect='parallax' drives each slide's content layer off a native CSS view-timeline (animation-timeline: view(), animation-range: cover) scoped to the slide — no scroll listener, no rAF loop. Requires wrapping the slide's media in <CarouselSlideContent>, the layer the animation targets (the slide itself clips it via overflow: hidden). Gated behind @supports (animation-timeline: view()); browsers without it (Firefox stable, as of writing) fall back to a CSS rule reading the existing --slide-progress signal instead, so the drift still renders everywhere with no extra JavaScript. Disables entirely under prefers-reduced-motion. Composes with orientation, RTL and peek like every other modifier."
      wide
    >
      <div className="carousel-grid">
        <GridCell
          n={1}
          title="Default — horizontal"
          note="Each slide's content drifts as it crosses the viewport — most visible mid-drag or on a slow scroll/swipe."
        >
          <SlideshowSingle label="Featured products — slideshow parallax" />
        </GridCell>

        <GridCell
          n={2}
          title="Vertical"
          note="The view-timeline axis follows the scroll axis — the physical y axis, not x — so the drift runs up/down with the page."
        >
          <SlideshowSingle
            label="Featured products — slideshow parallax, vertical"
            orientation="vertical"
          />
        </GridCell>

        <GridCell
          n={3}
          title="RTL"
          note="Chromium computes a horizontal view-timeline's cover progress wrong in an RTL scroller (the resting slide lands at 0%/100%, not 50%), so horizontal RTL abandons the native timeline and drives the drift off the JS --slide-progress signal instead — the same physical, RTL-correct geometry the no-view-timeline fallback uses. Each number should now rest centred and drift symmetrically like cells 1/2/4."
          dir="rtl"
        >
          <SlideshowSingle label="Featured products — slideshow parallax, RTL" />
        </GridCell>

        <GridCell
          n={4}
          title="Composes with peek"
          note="effect is just another modifier on the existing surface, so it composes with peek (or any other axis) with no extra wiring."
        >
          <SlideshowSingle
            label="Featured products — slideshow parallax, peek"
            peek="md"
          />
        </GridCell>
      </div>
    </Example>
  );
}

/**
 * Cover Flow — the iTunes/Apple "Cover Flow" look (Blossom Carousel's Cover Flow
 * example) via `effect="coverflow"`: each slide's <CarouselSlideContent> tilts in
 * 3D (rotateY + scale off a per-slide perspective) as it crosses the viewport, so
 * the centred slide sits flat, forward and full-size while its neighbours rotate
 * away. Like `parallax`, the registry stylesheet owns the whole technique — this
 * component just opts in and wraps each slide's visual in <CarouselSlideContent>,
 * the layer that tilts (the slide goes overflow: visible so the tilted card can
 * escape its flat slot and overlap its neighbours; the rounding/clip moves onto
 * the content layer). Driven by the same per-slide view-timeline as parallax, with
 * the identical --slide-progress fallback for browsers without view-timeline
 * support (Firefox stable), the same RTL/infinite handling, and disabled entirely
 * under prefers-reduced-motion.
 *
 * Best composed with `peek` (to reveal the tilting neighbours) and
 * snapAlign="center" (so the flat, forward card is the one that rests centred) —
 * the effect is orthogonal to both, so they just compose. The visual (gradient or
 * a real <img>) lives on <CarouselSlideContent> itself, the card that tilts.
 */
function CoverFlowSingle({
  label,
  orientation = "horizontal",
  images = false,
  spread,
  rotate,
}: {
  label: string;
  orientation?: "horizontal" | "vertical";
  images?: boolean;
  /** Overlap amount (% of a slide) — sets --primitiv-carousel-coverflow-spread live. */
  spread?: number;
  /** Edge tilt angle (deg) — sets --primitiv-carousel-coverflow-rotate live. */
  rotate?: number;
}) {
  const Prev = orientation === "vertical" ? ChevronUp : ChevronLeft;
  const Next = orientation === "vertical" ? ChevronDown : ChevronRight;
  const photos = [debugPhoto1, debugPhoto2, debugPhoto3, debugPhoto4];
  const items = images ? photos : GALLERY;
  const tuning = {
    ...(spread === undefined
      ? {}
      : { "--primitiv-carousel-coverflow-spread": `${spread}%` }),
    ...(rotate === undefined
      ? {}
      : { "--primitiv-carousel-coverflow-rotate": `${rotate}deg` }),
  } as CSSProperties;
  return (
    <Carousel
      ariaLabel={label}
      cluster="joined"
      effect="coverflow"
      orientation={orientation}
      peek="lg"
      gap="none"
      snapAlign="center"
      style={
        spread === undefined && rotate === undefined ? undefined : tuning
      }
    >
      <CarouselViewport>
        {items.map((item, i) => (
          <CarouselSlide key={i} radius="md">
            <CarouselSlideContent
              className="carousel-page__coverflow-card"
              style={images ? undefined : { background: item }}
            >
              {images ? (
                <img src={item} alt="" />
              ) : (
                <span className="carousel-page__coverflow-label">{i + 1}</span>
              )}
            </CarouselSlideContent>
          </CarouselSlide>
        ))}
      </CarouselViewport>
      <CarouselControls>
        <CarouselPreviousTrigger aria-label="Previous slide">
          <Prev />
        </CarouselPreviousTrigger>
        <CarouselIndicatorGroup label="Choose slide">
          {items.map((_, i) => (
            <CarouselIndicator key={i} index={i} />
          ))}
        </CarouselIndicatorGroup>
        <CarouselNextTrigger aria-label="Next slide">
          <Next />
        </CarouselNextTrigger>
      </CarouselControls>
    </Carousel>
  );
}

export function CarouselCoverFlow() {
  // Live overlap control (RFC-less QA knob): drives
  // --primitiv-carousel-coverflow-spread on every cell so the whole grid
  // re-tunes as the slider moves — how far the neighbours slide toward the
  // centre and overlap the flat card. 0 = neighbours sit at their scroll-snap
  // positions; higher = tighter, more overlap.
  const [spread, setSpread] = useState(40);
  const [rotate, setRotate] = useState(55);
  return (
    <Example
      title="Cover Flow — scroll-driven 3D, zero JavaScript"
      note="effect='coverflow' tilts each slide's <CarouselSlideContent> in 3D (rotateY + scale off a per-slide perspective) as it crosses the viewport — the iTunes Cover Flow look. Same engine as the Slideshow (parallax) example: a native CSS view-timeline scoped to the slide (animation-range: cover), with a --slide-progress fallback for browsers without view-timeline support, and disabled under prefers-reduced-motion. Pair with peek (to reveal the tilting neighbours) and snapAlign='center'. Tune the look with the --primitiv-carousel-coverflow-{spread,rotate,scale,perspective} knobs — the sliders below drive `spread` and `rotate` live. (Infinite loop still needs its own tuning pass — use native scroll here.)"
      wide
    >
      <div className="carousel-coverflow-controls">
        <label className="carousel-coverflow-controls__field">
          <span className="carousel-coverflow-controls__label">
            Overlap (how close the slides sit / how much they overlap)
          </span>
          <span className="carousel-coverflow-controls__row">
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={spread}
              onChange={(e) => setSpread(e.currentTarget.valueAsNumber)}
              aria-label="Cover Flow overlap amount"
            />
            <output className="carousel-coverflow-controls__value">
              {spread}%
            </output>
          </span>
        </label>
        <label className="carousel-coverflow-controls__field">
          <span className="carousel-coverflow-controls__label">
            Angle (how far the neighbours tilt away)
          </span>
          <span className="carousel-coverflow-controls__row">
            <input
              type="range"
              min={0}
              max={90}
              step={1}
              value={rotate}
              onChange={(e) => setRotate(e.currentTarget.valueAsNumber)}
              aria-label="Cover Flow tilt angle"
            />
            <output className="carousel-coverflow-controls__value">
              {rotate}°
            </output>
          </span>
        </label>
      </div>
      <div className="carousel-grid">
        <GridCell
          n={1}
          title="Default — horizontal"
          note="The centred card sits flat and forward; its neighbours (revealed by peek) tilt away and slide inward by the Overlap amount. Scroll/swipe/drag and the tilt tracks continuously."
        >
          <CoverFlowSingle
            label="Featured products — cover flow"
            spread={spread}
            rotate={rotate}
          />
        </GridCell>

        <GridCell
          n={2}
          title="Vertical"
          note="The view-timeline axis follows the scroll axis, so a vertical scroller tilts on the x axis (rotateX) and the neighbours slide up/down toward the centre — cards fan forward/back up the column."
        >
          <CoverFlowSingle
            label="Featured products — cover flow, vertical"
            orientation="vertical"
            spread={spread}
            rotate={rotate}
          />
        </GridCell>

        <GridCell
          n={3}
          title="RTL"
          note="Chromium mis-resolves a horizontal view-timeline's cover progress in an RTL scroller, so horizontal RTL drives the tilt off the RTL-correct --slide-progress signal instead (same as the parallax example). The centred card should rest flat and its neighbours tilt symmetrically."
          dir="rtl"
        >
          <CoverFlowSingle
            label="Featured products — cover flow, RTL"
            spread={spread}
            rotate={rotate}
          />
        </GridCell>

        <GridCell
          n={4}
          title="Real imagery"
          note="Cover Flow shines with photography: a real <img> in <CarouselSlideContent> tilts as the rounded card, no backdrop needed (unlike parallax's Ken-Burns pan)."
        >
          <CoverFlowSingle
            label="Featured products — cover flow, photos"
            images
            spread={spread}
            rotate={rotate}
          />
        </GridCell>
      </div>
    </Example>
  );
}

/**
 * Loop — wrap-around navigation (Phase C, "no disabled ends"). The `loop` prop
 * makes Next/Previous and autoplay wrap past the ends instead of clamping: the
 * triggers never disable at a boundary, Next on the last slide returns to the
 * first (and Previous on the first goes to the last), and an auto-rotating
 * carousel keeps cycling forever. This is *semantic* wrapping — the wrap
 * smooth-scrolls the whole track back (a visible rewind), the same path `Home`
 * takes; a continuous infinite glide is a separate, additive layer still to
 * come. Check: the arrows stay enabled at both ends in every cell, and the
 * autoplay cell never stops.
 */
/**
 * Debug readout for the infinite-loop geometry — gated behind `?debug` in the URL
 * so it never shows in normal QA. Reads the DOM of the named cell directly (no
 * engine internals) and prints the numbers I need to diagnose a sizing/positioning
 * bug from a device: viewport width, each real slide's width, the clone width, the
 * measured stride, and the live track transform. Poll-refreshes so it tracks as you
 * navigate. Remove once the loop geometry is confirmed on device.
 */
function LoopDebug({ cellTitle }: { cellTitle: string }) {
  const [lines, setLines] = useState<string[]>([]);
  const worst = useRef({ left: 0, right: 0 });
  useEffect(() => {
    let raf = 0;
    const read = () => {
      raf = requestAnimationFrame(read);
      const cell = Array.from(
        document.querySelectorAll<HTMLElement>(".carousel-grid__cell"),
      ).find((el) => el.textContent?.includes(cellTitle));
      const vp = cell?.querySelector<HTMLElement>(".primitiv-carousel__viewport");
      const track = cell?.querySelector<HTMLElement>(".primitiv-carousel__track");
      if (!vp || !track) {
        setLines(["(cell not found)"]);
        return;
      }
      // Coverage: over EVERY slide (real + clone), the leftmost left edge and the
      // rightmost right edge, relative to the viewport box. If leftmost > 0 there's
      // an uncovered strip on the left; if rightmost < width, one on the right.
      const vpRect = vp.getBoundingClientRect();
      const all = Array.from(
        track.querySelectorAll<HTMLElement>("[data-carousel-slide]"),
      );
      let minLeft = Infinity;
      let maxRight = -Infinity;
      for (const el of all) {
        const r = el.getBoundingClientRect();
        minLeft = Math.min(minLeft, r.left - vpRect.left);
        maxRight = Math.max(maxRight, r.right - vpRect.left);
      }
      const leftGap = Math.max(0, Math.round(minLeft));
      const rightGap = Math.max(0, Math.round(vp.clientWidth - maxRight));
      worst.current.left = Math.max(worst.current.left, leftGap);
      worst.current.right = Math.max(worst.current.right, rightGap);
      setLines([
        `viewport clientWidth: ${vp.clientWidth}`,
        `coverage: left ${Math.round(minLeft)}  right ${Math.round(maxRight)}  (0..${vp.clientWidth})`,
        `live gap: left ${leftGap}  right ${rightGap}`,
        `WORST gap seen: left ${worst.current.left}  right ${worst.current.right}`,
        `track transform: ${track.style.transform || "(none)"}`,
      ]);
    };
    raf = requestAnimationFrame(read);
    return () => cancelAnimationFrame(raf);
  }, [cellTitle]);
  return (
    <pre
      style={{
        position: "fixed",
        insetInline: 0,
        top: 0,
        zIndex: 99999,
        margin: 0,
        padding: "8px 12px",
        background: "#111",
        color: "#0f0",
        font: "12px/1.4 ui-monospace, monospace",
        whiteSpace: "pre-wrap",
        pointerEvents: "none",
      }}
    >
      {lines.join("\n")}
    </pre>
  );
}

export function CarouselLoop() {
  // TEMP: always-on geometry readout while diagnosing the device-only sizing bug.
  return (
    <Example
      title="Loop — wrap-around navigation"
      note="loop wraps Next/Previous and autoplay past the ends instead of clamping — the triggers never disable, Next on the last slide returns to the first, and autoplay keeps rotating. A single-page carousel has no wrap target, so its triggers still disable. This is semantic wrapping (the wrap smooth-scrolls the track back — a visible rewind); a continuous infinite loop is a separate layer to come."
      wide
    >
      <LoopDebug cellTitle="Infinite — continuous glide" />
      {/* TEMP diagnostic: outline the infinite viewport box so the slide↔viewport
          boundary is visible. `outline` (not `border`) so it marks the exact box
          edge with zero layout shift — a border would shrink the content by 1px. */}
      <style>{`.primitiv-carousel[data-loop="infinite"] .primitiv-carousel__viewport { outline: 1px solid #000; outline-offset: -1px; }`}</style>
      <div className="carousel-grid">
        <GridCell
          n={1}
          title="Default loop"
          note="Click Next repeatedly: it never disables and returns to the first slide from the last (and Previous wraps the other way). Same as the default carousel otherwise."
        >
          <BasicSingle label="Featured products — loop" loop />
        </GridCell>

        <GridCell
          n={2}
          title="Loop + autoplay"
          note="autoplay + loop = an endlessly rotating hero: without loop, autoplay stops at the last slide; with it, it keeps cycling. Hover or focus to pause (WCAG 2.2.2)."
        >
          <BasicSingle label="Featured products — loop autoplay" loop autoplay />
        </GridCell>

        <GridCell
          n={3}
          title="Loop + vertical"
          note="Wrapping is orientation-agnostic — the up/down controls wrap on the block axis just as the horizontal ones do."
        >
          <VerticalSingle label="Featured products — loop vertical" loop />
        </GridCell>

        <GridCell
          n={4}
          title="Loop + RTL"
          note="Logical navigation, so the wrap follows writing direction with no extra wiring."
          dir="rtl"
        >
          <BasicSingle label="Featured products — loop RTL" loop />
        </GridCell>

        <GridCell
          n={5}
          title="Loop + peek"
          note="loop is a headless passthrough, so it composes with every registry modifier — here a peek sliver reveals the wrap target as you approach the end."
        >
          <BasicSingle label="Featured products — loop peek" loop peek="md" />
        </GridCell>

        <GridCell
          n={6}
          title="Single slide — no wrap target"
          note="With only one page there is nowhere to wrap, so both triggers stay disabled even with loop set — the guard against a pointless self-navigation."
        >
          <Carousel ariaLabel="Featured products — single loop" cluster="joined" loop>
            <CarouselViewport>
              <CarouselSlide style={{ background: SLIDES[0] }} />
            </CarouselViewport>
            <CarouselControls>
              <CarouselPreviousTrigger aria-label="Previous slide">
                <ChevronLeft />
              </CarouselPreviousTrigger>
              <CarouselIndicators label="Choose slide" />
              <CarouselNextTrigger aria-label="Next slide">
                <ChevronRight />
              </CarouselNextTrigger>
            </CarouselControls>
          </Carousel>
        </GridCell>

        <GridCell
          n={7}
          title="Infinite — continuous glide"
          note="loop=&quot;infinite&quot; drives a JS transform track (no clones, no native scroll) so a wrap glides one step onto the adjacent slide with no rewind — GPU-composited for smoothness. Click Next / Prev past the ends: it glides on, never back. Watch the dots keep tracking. Buttons / keyboard / autoplay for now; touch-drag momentum is the next increment. Single-slide-scoped."
        >
          <BasicSingle
            label="Featured products — infinite"
            loop="infinite"
            allowMouseDrag
          />
        </GridCell>

        <GridCell
          n={8}
          title="Infinite + autoplay"
          note="Autoplay rides the same forward-glide, so an infinite carousel auto-rotates forever with no rewind at the seam. Hover/focus to pause (WCAG 2.2.2)."
        >
          <BasicSingle
            label="Featured products — infinite autoplay"
            loop="infinite"
            autoplay
            allowMouseDrag
          />
        </GridCell>

        <GridCell
          n={9}
          title="Infinite + peek"
          note="A natural pairing: at rest the peek gutters show the adjacent slides' seam copies (the previous/last on one side, the next on the other), so you see the wrap coming before it happens — seamlessly. Glide or swipe across the end and confirm the peek stays continuous."
        >
          <BasicSingle
            label="Featured products — infinite peek"
            loop="infinite"
            peek="md"
            allowMouseDrag
          />
        </GridCell>

        <GridCell
          n={10}
          title="Infinite + vertical"
          note="The recentre and glide are axis-generic — up/down should wrap on the block axis with no rewind, just like horizontal. Drag vertically or use the up/down controls."
        >
          <VerticalSingle
            label="Featured products — infinite vertical"
            loop="infinite"
          />
        </GridCell>

        <GridCell
          n={11}
          title="Infinite + RTL"
          note="Logical properties throughout, so the wrap and glide follow writing direction — Next should still glide onward (leftward in RTL), never a rewind."
          dir="rtl"
        >
          <BasicSingle
            label="Featured products — infinite RTL"
            loop="infinite"
            allowMouseDrag
          />
        </GridCell>

        <GridCell
          n={12}
          title="Infinite + multi-slide (2-up)"
          note="Multi-slide infinite: the transform engine glides to each page's leading slide, so Next/Prev advance a whole page (two strides) and paging past the last page wraps onto the first with no rewind. The inter-slide gap returns between the on-screen pair."
        >
          <MultiSlide
            label="Featured products — infinite 2-up"
            count={6}
            slidesPerPage={2}
            loop="infinite"
            allowMouseDrag
          />
        </GridCell>

        <GridCell
          n={13}
          title="Infinite + linked slides"
          note="Each slide is a link. A tap reaches the link (a slide can be a call-to-action); only a drag past the small threshold steers the track and suppresses the click, so a quick flick still navigates the slide it lands on rather than swallowing the tap."
        >
          <BasicSingle
            label="Featured products — infinite linked"
            loop="infinite"
            allowMouseDrag
            linked
          />
        </GridCell>

        <GridCell
          n={14}
          title="Infinite + multi-slide (4-up)"
          note="A wider N-up page (four slides, nine total, three pages). Page to the last page and back: the whole page glides as a unit and the trailing slide glides out with it — the seam copies follow the swept move, so no slide vanishes as the group shifts."
        >
          <MultiSlide
            label="Featured products — infinite 4-up"
            count={9}
            slidesPerPage={4}
            loop="infinite"
            allowMouseDrag
          />
        </GridCell>

        {/* TEMP diagnostic cell: builder QA reported images disappearing under
            placement="overlay" + content="pictures" + loop="infinite" — a
            combination no prior example exercised (every other infinite cell
            above uses the default external placement). A real-browser repro
            (real registry CSS, real engine, Chromium) didn't reproduce it, so
            this cell exists to get a directly comparable, deployed test
            surface rather than debugging blind through the builder's many
            toggles. Remove once the report is confirmed fixed or narrowed
            further. */}
        <GridCell
          n={15}
          title="DEBUG — Infinite + overlay + pictures"
          note="Temporary diagnostic cell for a builder-reported bug (images disappearing under this exact combination). If this renders correctly, the bug is likely builder-specific (a different config axis) rather than this base combination."
        >
          <Carousel
            ariaLabel="Featured products — infinite overlay pictures"
            placement="overlay"
            loop="infinite"
            allowMouseDrag
          >
            <CarouselViewport>
              {[debugPhoto1, debugPhoto2, debugPhoto3, debugPhoto4].map((src, i) => (
                <CarouselSlide key={i}>
                  <img src={src} alt="" />
                </CarouselSlide>
              ))}
            </CarouselViewport>
            <CarouselPreviousTrigger aria-label="Previous slide">
              <ChevronLeft />
            </CarouselPreviousTrigger>
            <CarouselIndicatorGroup label="Choose slide">
              {[0, 1, 2, 3].map((i) => (
                <CarouselIndicator key={i} index={i} />
              ))}
            </CarouselIndicatorGroup>
            <CarouselNextTrigger aria-label="Next slide">
              <ChevronRight />
            </CarouselNextTrigger>
          </Carousel>
        </GridCell>

        <GridCell
          n={16}
          title="Infinite + parallax"
          note="loop=&quot;infinite&quot; drives its own JS transform track, not native scroll, so the parallax effect's usual view-timeline/--slide-progress fallback would otherwise sit frozen (nothing ever scrolls). The transform engine now drives --slide-progress itself, so the drift keeps working here too — compare against the separate 'Slideshow (parallax)' page for the plain, non-infinite version."
        >
          <SlideshowSingle label="Featured products — infinite parallax" loop="infinite" />
        </GridCell>
      </div>
    </Example>
  );
}
