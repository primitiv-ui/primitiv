import type { ReactNode } from "react";

import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
} from "@primitiv-ui/icons";

import {
  Carousel,
  CarouselViewport,
  CarouselControls,
  CarouselSlide,
  CarouselPreviousTrigger,
  CarouselNextTrigger,
  CarouselIndicatorGroup,
  CarouselIndicator,
  CarouselIndicators,
} from "../components";
import "./CarouselPage.css";

// Gradients stand in for photography (the Figma examples do the same — real
// imagery is a per-slide fill override the consumer supplies).
const SLIDES = [
  "linear-gradient(135deg, #1e3a8a, #14b8a6)",
  "linear-gradient(135deg, #7c3aed, #ec4899)",
  "linear-gradient(135deg, #ea580c, #16a34a)",
  "linear-gradient(135deg, #0ea5e9, #6366f1)",
];

// A longer set for the multi-slide gallery, so a 2-/3-/4-up view still has
// slides to scroll to. Long enough (8) that the edge-case grid can slice any
// count it needs (1, 2, 3, 5, 6, 7).
const GALLERY = [
  ...SLIDES,
  "linear-gradient(135deg, #db2777, #f59e0b)",
  "linear-gradient(135deg, #0d9488, #4f46e5)",
  "linear-gradient(135deg, #9333ea, #06b6d4)",
  "linear-gradient(135deg, #dc2626, #facc15)",
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
}) {
  return (
    <Carousel
      ariaLabel={label}
      peek={peek}
      padding={padding}
      surface={surface}
      transition={transition}
      side={side}
      distribution={distribution}
      align={align}
    >
      <CarouselViewport>
        {SLIDES.map((bg, i) => (
          <CarouselSlide
            key={i}
            radius={radius}
            ratio={ratio}
            style={{ background: bg }}
          />
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
}: {
  label: string;
  peek?: "none" | "sm" | "md" | "lg";
  padding?: "none" | "sm" | "md" | "lg";
  side?: "before" | "after";
  distribution?: "group" | "stretch";
  align?: "start" | "center" | "end";
}) {
  return (
    <Carousel
      ariaLabel={label}
      orientation="vertical"
      peek={peek}
      padding={padding}
      side={side}
      distribution={distribution}
      align={align}
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
}: {
  label: string;
  ratio?: "square" | "standard" | "wide" | "ultrawide";
  peek?: "none" | "sm" | "md" | "lg";
  padding?: "none" | "sm" | "md" | "lg";
  transition?: "slide" | "fade";
  orientation?: "horizontal" | "vertical";
  side?: "before" | "after";
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
    >
      <CarouselViewport>
        {SLIDES.map((bg, i) => (
          <CarouselSlide key={i} ratio={ratio} style={{ background: bg }} />
        ))}
      </CarouselViewport>
      <CarouselPreviousTrigger aria-label="Previous slide">
        <Prev />
      </CarouselPreviousTrigger>
      <CarouselNextTrigger aria-label="Next slide">
        <Next />
      </CarouselNextTrigger>
      <CarouselIndicatorGroup label="Choose slide">
        {SLIDES.map((_, i) => (
          <CarouselIndicator key={i} index={i} />
        ))}
      </CarouselIndicatorGroup>
    </Carousel>
  );
}

/**
 * External-flank placement — the "External-flank + dots/thumbnails" composition:
 * circular prev/next sit *outside* the viewport's inline edges (left/right) with
 * the indicators centred in a row below. Driven by `placement="flank"`; the parts
 * are direct children of the root (no `__controls` wrapper — the grid places each
 * by area), so prev/next swap sides under RTL for free. Indicators can be dots or
 * thumbnails (the flank + thumbnails design cell).
 */
function FlankSingle({
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
      placement="flank"
      peek={peek}
      indicators={indicators}
      side={side}
      orientation={orientation}
    >
      <CarouselViewport>
        {SLIDES.map((bg, i) => (
          <CarouselSlide key={i} ratio={ratio} style={{ background: bg }} />
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
}: {
  label: string;
  count: number;
  slidesPerPage: number;
  slidesPerMove?: number;
  peek?: "none" | "sm" | "md" | "lg";
  padding?: "none" | "sm" | "md" | "lg";
  orientation?: "horizontal" | "vertical";
}) {
  const Prev = orientation === "vertical" ? ChevronUp : ChevronLeft;
  const Next = orientation === "vertical" ? ChevronDown : ChevronRight;
  return (
    <Carousel
      ariaLabel={label}
      slidesPerPage={slidesPerPage}
      slidesPerMove={slidesPerMove}
      peek={peek}
      padding={padding}
      orientation={orientation}
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

/**
 * Thumbnail indicators — the gallery pattern: each indicator is a rounded-rect
 * image thumbnail instead of a dot, the active one ringed in the primary colour
 * (`indicators="thumbnails"`). The thumbnail content is supplied as children of
 * each `<CarouselIndicator>` — here a gradient stand-in mirroring the slide. It
 * composes with every placement and orientation: `placement="overlay"` rides the
 * thumbnails in the scrim pill on the imagery; `orientation="vertical"` stacks
 * them into a rail beside the viewport; `showArrows={false}` makes the strip the
 * sole navigation (a pure filmstrip).
 */
function ThumbnailSingle({
  label,
  placement,
  orientation = "horizontal",
  showArrows = true,
  peek,
  side,
}: {
  label: string;
  placement?: "external" | "overlay";
  orientation?: "horizontal" | "vertical";
  showArrows?: boolean;
  peek?: "none" | "sm" | "md" | "lg";
  side?: "before" | "after";
}) {
  const Prev = orientation === "vertical" ? ChevronUp : ChevronLeft;
  const Next = orientation === "vertical" ? ChevronDown : ChevronRight;
  const thumbnails = (
    <CarouselIndicatorGroup label="Choose slide">
      {SLIDES.map((bg, i) => (
        <CarouselIndicator key={i} index={i}>
          <span style={{ background: bg }} />
        </CarouselIndicator>
      ))}
    </CarouselIndicatorGroup>
  );
  return (
    <Carousel
      ariaLabel={label}
      indicators="thumbnails"
      placement={placement}
      orientation={orientation}
      peek={peek}
      side={side}
    >
      <CarouselViewport>
        {SLIDES.map((bg, i) => (
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
}: {
  title: string;
  note: string;
  children: ReactNode;
  dir?: "rtl";
}) {
  return (
    <article className="carousel-page" dir={dir}>
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
    >
      <div className="carousel-page__row">
        <div className="carousel-page__narrow">
          <BasicSingle label="Featured products — narrow container" />
        </div>
        <div className="carousel-page__wide">
          <BasicSingle label="Featured products — wide container" />
        </div>
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
    >
      <div className="carousel-page__row">
        <div className="carousel-page__vertical">
          <VerticalSingle label="Featured products — vertical" />
        </div>
        <div className="carousel-page__vertical" dir="rtl">
          <VerticalSingle label="Featured products — vertical, right to left" />
        </div>
      </div>
    </Example>
  );
}

export function CarouselOverlay() {
  return (
    <Example
      title={'Overlay — placement="overlay"'}
      note="Controls sit on the imagery: circular prev/next flank the slide edges on a translucent scrim, and the dots ride in a pill overlaid on the slide — so it runs edge to edge with no external chrome. The scrim + glyph are theme-adaptive, so they read on any photo in light or dark. It composes with peek, with RTL (prev/next swap sides, the pill stays centred), and with orientation — a vertical overlay rotates a quarter turn: up/down controls flank the top and bottom, the dots pill rides the end side."
    >
      {/* The design cell: overlay + a small peek. */}
      <OverlaySingle label="Featured products — overlay with peek" peek="sm" />

      {/* Horizontal: edge-to-edge (no peek) vs the same under RTL, side by side. */}
      <div className="carousel-page__row">
        <div className="carousel-page__wide">
          <OverlaySingle label="Featured products — overlay, edge to edge" />
        </div>
        <div className="carousel-page__wide" dir="rtl">
          <OverlaySingle label="Featured products — overlay, right to left" />
        </div>
      </div>

      {/* Vertical overlay: up/down controls on the top/bottom edges, dots pill on
          the end side — and the same mirrored under RTL. */}
      <div className="carousel-page__row">
        <div className="carousel-page__wide">
          <OverlaySingle
            label="Featured products — vertical overlay"
            orientation="vertical"
          />
        </div>
        <div className="carousel-page__wide" dir="rtl">
          <OverlaySingle
            label="Featured products — vertical overlay, right to left"
            orientation="vertical"
          />
        </div>
      </div>
    </Example>
  );
}

export function CarouselFade() {
  return (
    <Example
      title={'Fade — transition="fade"'}
      note="A crossfade instead of a scroll: the slides stack and the active one fades in over the others (off the headless data-transition hook). Native swipe/drag and peek don't apply — there's no scroll — but prev/next, the dots, and keyboard paging all still work. It composes with placement, so the second instance is a fade hero with the controls overlaid on the imagery."
    >
      {/* Crossfade with the controls in the row below. */}
      <BasicSingle label="Featured products — crossfade" transition="fade" />

      {/* Crossfade composing with overlay placement — a hero-style carousel. */}
      <OverlaySingle
        label="Featured products — crossfade hero"
        transition="fade"
      />
    </Example>
  );
}

export function CarouselPeek() {
  return (
    <Example
      title="Peek — reveal the adjacent slides"
      note="A cross-cutting `peek` modifier (none · sm · md · lg) shows a sliver of the neighbouring slides on either side of the active one — and it composes with every other variant. It maps to the inline edges when horizontal and the block edges when vertical, so the same prop works in both orientations."
    >
      {/* Peek size ladder on the horizontal single-slide. */}
      <div className="carousel-page__stack">
        <BasicSingle label="Horizontal peek — small" peek="sm" />
        <BasicSingle label="Horizontal peek — medium" peek="md" />
        <BasicSingle label="Horizontal peek — large" peek="lg" />
      </div>

      {/* Peek composing with the other variants: vertical (block-axis peek) and
          RTL (mirrors), side by side. */}
      <div className="carousel-page__row">
        <div className="carousel-page__vertical">
          <VerticalSingle label="Vertical peek" peek="md" />
        </div>
        <div className="carousel-page__wide" dir="rtl">
          <BasicSingle label="Peek under RTL" peek="md" />
        </div>
      </div>
    </Example>
  );
}

export function CarouselPadding() {
  return (
    <Example
      title="Viewport padding — the framed-track grid"
      note="A cross-cutting `padding` modifier (none · sm · md · lg) turns the viewport into a padded, framed track: it insets the slides and draws the track outline (border + rounded corners). The background fill is opt-in via the separate `surface` modifier (cells 3 & 4 below) — padding alone is an outlined track. The gap is coupled to the padding so the resting track stays clean (no accidental peek). Each cell pins a size, the surface opt-in, or a composition."
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
  children,
}: {
  n: number;
  title: string;
  note: string;
  dir?: "rtl";
  children: ReactNode;
}) {
  return (
    <section className="carousel-grid__cell" dir={dir}>
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
      note="The gallery pattern: each indicator is a rounded-rect image thumbnail (a shrunk-down filmstrip) instead of a dot, and the active thumbnail is ringed in the primary colour. Supply the thumbnail content as children of each <CarouselIndicator> (an <img> or a background element — gradient stand-ins here, mirroring each slide). The modifier composes with every control placement and orientation; the grid below pins each control variant so QA can tick them off."
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
      </div>
    </Example>
  );
}

export function CarouselRatio() {
  return (
    <Example
      title="Aspect ratio — square vs wide slides"
      note="The slide `ratio` modifier (square 1:1 · standard 4:3 · wide 16:9 default · ultrawide 21:9) re-points --primitiv-carousel-slide-aspect-ratio, so a slide keeps its ratio while filling its share of the container — no fixed pixel sizes. The grid pairs the two most distinct ratios row by row: the LEFT column is square (1:1), the RIGHT column is wide (16:9), each row a matching control/peek variant so you can compare the ratio in isolation. It composes with placement (outset row vs overlay) and peek for free — ratio is a slide concern, placement/peek are root concerns."
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
      note="Placement is four orthogonal props. `placement` picks the family (external · overlay · flank); the shared control-layout vocabulary composes on top — `side` (before/after, orientation-relative), `distribution` (group/stretch) and `align` (start/center/end for a grouped bar). Learn them once — they mean the same everywhere and degrade to a no-op where a family doesn't read them. Below, every available combination grouped by family: all of external, then all of overlay, then all of flank — so the whole surface can be QA'd in one pass."
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
      </div>

      {/* ============================ FLANK ============================ */}
      <h2 className="carousel-page__group">Flank — prev/next split onto the scroll-axis edges</h2>
      <div className="carousel-grid">
        <GridCell
          n={1}
          title="after · dots (indicators below)"
          note="Circular prev/next flanking the viewport's inline edges, a dot row centred below."
        >
          <FlankSingle label="flank after dots" />
        </GridCell>
        <GridCell
          n={2}
          title="before · dots (indicators above)"
          note="`side=before` moves the indicator row above the viewport; prev/next stay on the edges."
        >
          <FlankSingle label="flank before dots" side="before" />
        </GridCell>
        <GridCell
          n={3}
          title="after · thumbnails"
          note="The External-flank + thumbnails design cell: flanking controls, a thumbnail strip below."
        >
          <FlankSingle label="flank after thumbnails" indicators="thumbnails" />
        </GridCell>
        <GridCell
          n={4}
          title="before · thumbnails"
          note="The thumbnail strip above the viewport with `side=before`."
        >
          <FlankSingle label="flank before thumbnails" indicators="thumbnails" side="before" />
        </GridCell>
        <GridCell
          n={5}
          title="vertical · after (indicators right)"
          note="Vertical flank: prev/next become up/down flanking the top/bottom edges, the indicator column on the end (right) side."
        >
          <FlankSingle label="flank vertical after" orientation="vertical" />
        </GridCell>
        <GridCell
          n={6}
          title="vertical · before (indicators left)"
          note="Vertical flank with the indicator column on the start (left) side."
        >
          <FlankSingle label="flank vertical before" orientation="vertical" side="before" />
        </GridCell>
        <GridCell
          n={7}
          title="after + peek"
          note="Composes with peek: a sliver of the neighbours shows in the viewport, controls still flanking outside it."
        >
          <FlankSingle label="flank after peek" peek="sm" />
        </GridCell>
        <GridCell
          n={8}
          title="after + square ratio"
          note="Composes with the slide ratio: 1:1 square slides between the flanking controls."
        >
          <FlankSingle label="flank after square" ratio="square" />
        </GridCell>
        <GridCell
          n={9}
          title="after + RTL"
          note="Mirrors under right-to-left — the grid columns follow writing direction, so prev/next swap sides with no RTL CSS."
          dir="rtl"
        >
          <FlankSingle label="flank after rtl" />
        </GridCell>
      </div>
    </Example>
  );
}

function ThumbnailStretch({ label }: { label: string }) {
  return (
    <Carousel ariaLabel={label} indicators="thumbnails" distribution="stretch">
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

export function CarouselFlank() {
  return (
    <Example
      title='External-flank — placement="flank"'
      note="The prev/next controls sit outside the viewport, flanking its inline edges (left/right), with the indicators centred in a row below — the External-flank design cell. The parts are direct children of the root (a 3-column grid: prev | viewport | next), so prev/next swap sides under RTL for free. It composes with dots or thumbnails (the External-flank + thumbnails cell), peek, and the slide ratio."
    >
      <div className="carousel-grid">
        <GridCell
          n={1}
          title="Flank + dots"
          note="The baseline: circular prev/next flanking the viewport, a dot row centred below. Click a control or dot to page."
        >
          <FlankSingle label="Flank — dots" />
        </GridCell>

        <GridCell
          n={2}
          title="Flank + thumbnails"
          note="The External-flank + thumbnails design cell: the same flanking controls with a thumbnail strip below, active one ringed in the primary colour."
        >
          <FlankSingle label="Flank — thumbnails" indicators="thumbnails" />
        </GridCell>

        <GridCell
          n={3}
          title="Flank + peek sm"
          note="Composes with peek: a sliver of the neighbouring slides shows in the viewport, the controls still flanking outside it."
        >
          <FlankSingle label="Flank — peek" peek="sm" />
        </GridCell>

        <GridCell
          n={4}
          title="Flank + square slides"
          note="Composes with the slide ratio: 1:1 square slides between the flanking controls."
        >
          <FlankSingle label="Flank — square" ratio="square" />
        </GridCell>

        <GridCell
          n={5}
          title="Flank + RTL"
          note="Mirrors under right-to-left — the grid columns follow writing direction, so prev/next swap sides with no RTL-specific CSS."
          dir="rtl"
        >
          <FlankSingle label="Flank — right to left" />
        </GridCell>

        <GridCell
          n={6}
          title="Flank + thumbnails + peek"
          note="A busy composition: flanking controls, a thumbnail strip below, and a peek sliver of the neighbours — every flank-compatible axis at once."
        >
          <FlankSingle label="Flank — thumbnails + peek" indicators="thumbnails" peek="sm" />
        </GridCell>
      </div>
    </Example>
  );
}
