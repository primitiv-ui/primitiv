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
  peek,
  padding,
  surface,
  transition,
}: {
  label: string;
  radius?: "md" | "none";
  peek?: "none" | "sm" | "md" | "lg";
  padding?: "none" | "sm" | "md" | "lg";
  surface?: "none" | "subtle";
  transition?: "slide" | "fade";
}) {
  return (
    <Carousel
      ariaLabel={label}
      peek={peek}
      padding={padding}
      surface={surface}
      transition={transition}
    >
      <CarouselViewport>
        {SLIDES.map((bg, i) => (
          <CarouselSlide key={i} radius={radius} style={{ background: bg }} />
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
}: {
  label: string;
  peek?: "none" | "sm" | "md" | "lg";
  padding?: "none" | "sm" | "md" | "lg";
}) {
  return (
    <Carousel
      ariaLabel={label}
      orientation="vertical"
      peek={peek}
      padding={padding}
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
  peek,
  padding,
  transition,
  orientation = 'horizontal',
}: {
  label: string;
  peek?: "none" | "sm" | "md" | "lg";
  padding?: "none" | "sm" | "md" | "lg";
  transition?: "slide" | "fade";
  orientation?: "horizontal" | "vertical";
}) {
  return (
    <Carousel
      ariaLabel={label}
      placement="overlay"
      peek={peek}
      padding={padding}
      transition={transition}
      orientation={orientation}
    >
      <CarouselViewport>
        {SLIDES.map((bg, i) => (
          <CarouselSlide key={i} style={{ background: bg }} />
        ))}
      </CarouselViewport>
      <CarouselPreviousTrigger aria-label="Previous slide">
        <ChevronLeft />
      </CarouselPreviousTrigger>
      <CarouselNextTrigger aria-label="Next slide">
        <ChevronRight />
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
      note="Controls sit on the imagery: circular prev/next flank the slide edges on a translucent scrim, and the dots ride in a pill along the bottom — so the slide runs edge to edge with no external chrome. The scrim + glyph are theme-adaptive, so they read on any photo in light or dark. It composes with peek, and under RTL the prev/next swap sides while the pill stays centred (logical properties, no RTL-specific CSS)."
    >
      {/* The design cell: overlay + a small peek. */}
      <OverlaySingle label="Featured products — overlay with peek" peek="sm" />

      {/* Edge-to-edge (no peek) vs the same under RTL, side by side. */}
      <div className="carousel-page__row">
        <div className="carousel-page__wide">
          <OverlaySingle label="Featured products — overlay, edge to edge" />
        </div>
        <div className="carousel-page__wide" dir="rtl">
          <OverlaySingle label="Featured products — overlay, right to left" />
        </div>
      </div>
      <div className="carousel-page__row">
        <div className="carousel-page__wide">
          <OverlaySingle label="Featured products — overlay, edge to edge" orientation="vertical" />
        </div>
        <div className="carousel-page__wide" dir="rtl">
          <OverlaySingle label="Featured products — overlay, right to left" orientation="vertical" />
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
