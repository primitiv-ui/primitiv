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
// slides to scroll to.
const MULTI_SLIDES = [
  ...SLIDES,
  "linear-gradient(135deg, #db2777, #f59e0b)",
  "linear-gradient(135deg, #0d9488, #4f46e5)",
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
  transition,
}: {
  label: string;
  radius?: "md" | "none";
  peek?: "none" | "sm" | "md" | "lg";
  padding?: "none" | "sm" | "md" | "lg";
  transition?: "slide" | "fade";
}) {
  return (
    <Carousel
      ariaLabel={label}
      peek={peek}
      padding={padding}
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
  transition,
}: {
  label: string;
  peek?: "none" | "sm" | "md" | "lg";
  transition?: "slide" | "fade";
}) {
  return (
    <Carousel
      ariaLabel={label}
      placement="overlay"
      peek={peek}
      transition={transition}
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
 * Multi-slide-per-view — a 2-/3-/4-up gallery: several slides share the viewport
 * at once, each taking an equal share of the space (minus the inter-slide gap).
 * Driven by a single `slidesPerPage` prop; still one snap point per slide, so
 * prev/next and the dots advance by one. Uses the row-below controls.
 */
function MultiSlide({
  label,
  slidesPerPage,
  peek,
}: {
  label: string;
  slidesPerPage: "2" | "3" | "4";
  peek?: "none" | "sm" | "md" | "lg";
}) {
  return (
    <Carousel ariaLabel={label} slidesPerPage={slidesPerPage} peek={peek}>
      <CarouselViewport>
        {MULTI_SLIDES.map((bg, i) => (
          <CarouselSlide key={i} style={{ background: bg }} />
        ))}
      </CarouselViewport>
      <CarouselControls>
        <CarouselPreviousTrigger aria-label="Previous slide">
          <ChevronLeft />
        </CarouselPreviousTrigger>
        <CarouselIndicatorGroup label="Choose slide">
          {MULTI_SLIDES.map((_, i) => (
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
      title="Viewport padding — frame it in a gutter"
      note="A cross-cutting `padding` modifier (none · sm · md · lg) insets the whole carousel from its container with an outer gutter — breathing room framing the viewport. Each carousel below sits in a tinted container so the gutter is visible as the surface between the container edge and the slide. It is deliberately distinct from peek: padding is the outer gutter (it never reveals a neighbour), peek is the inner reveal — they stack, so with both set the edge inset grows but the neighbour sliver stays exactly peek."
    >
      {/* Padding size ladder — each in a frame so the gutter reads. */}
      <div className="carousel-page__stack">
        <div className="carousel-page__frame">
          <BasicSingle label="Viewport padding — small" padding="sm" />
        </div>
        <div className="carousel-page__frame">
          <BasicSingle label="Viewport padding — medium" padding="md" />
        </div>
        <div className="carousel-page__frame">
          <BasicSingle label="Viewport padding — large" padding="lg" />
        </div>
      </div>

      {/* The composition the sizing question raised: padding + peek together.
          The gutter frames the carousel while peek still reveals the neighbour
          slivers — the two stack rather than fight. Alongside it, padding on the
          vertical (block-axis gutter) and under RTL (mirrors). */}
      <div className="carousel-page__row">
        <div className="carousel-page__wide">
          <div className="carousel-page__frame">
            <BasicSingle
              label="Padding + peek together"
              padding="md"
              peek="sm"
            />
          </div>
        </div>
        <div className="carousel-page__vertical">
          <div className="carousel-page__frame">
            <VerticalSingle label="Vertical padding" padding="md" />
          </div>
        </div>
        <div className="carousel-page__wide" dir="rtl">
          <div className="carousel-page__frame">
            <BasicSingle label="Padding under RTL" padding="md" />
          </div>
        </div>
      </div>
    </Example>
  );
}

export function CarouselMulti() {
  return (
    <Example
      title="Multi-slide — slidesPerPage"
      note="Several slides share the viewport at once (a 2-/3-/4-up gallery). Each takes an equal share of the space minus the inter-slide gap, and stays responsive — resize to watch the shares adapt. There's still one snap point per slide, so prev/next and the dots advance by one. It composes with peek (a sliver of the next page shows) and mirrors under RTL."
    >
      {/* Count ladder: 2-up, 3-up, 4-up. */}
      <div className="carousel-page__stack">
        <MultiSlide label="Two per page" slidesPerPage="2" />
        <MultiSlide label="Three per page" slidesPerPage="3" />
        <MultiSlide label="Four per page" slidesPerPage="4" />
      </div>

      {/* Multi-slide composing with peek, and under RTL, side by side. */}
      <div className="carousel-page__row">
        <div className="carousel-page__wide">
          <MultiSlide label="Two per page with peek" slidesPerPage="2" peek="sm" />
        </div>
        <div className="carousel-page__wide" dir="rtl">
          <MultiSlide label="Three per page, right to left" slidesPerPage="3" />
        </div>
      </div>
    </Example>
  );
}
