/** The axis a carousel pages along. */
export type CarouselOrientation = "horizontal" | "vertical";

/** How navigation behaves past the ends: clamp, rewind, or glide on continuously. */
export type CarouselLoop = "none" | "wrap" | "infinite";

/** How a carousel shows a page change: native scrolling, or a state flip CSS animates. */
export type CarouselTransition = "slide" | "fade" | "none";

/** Where a page rests in the viewport. */
export type CarouselSnapAlign = "start" | "center" | "end";

/** A page-step direction: forward (`1`) or back (`-1`). */
export type CarouselStepDirection = 1 | -1;

/** What a key press on the viewport asks for. */
export type CarouselKeyAction = "next" | "previous" | "first" | "last";

/** The viewport edge an overscroll pushes past. */
export type CarouselEdge = "start" | "end";

/** Whether each direction has somewhere to go. */
export type CarouselBounds = { previous: boolean; next: boolean };

/** How long an autoplay page stays up when no delay is given, in milliseconds. */
export const CAROUSEL_AUTOPLAY_DELAY_MS = 4000;

/** Pointer travel, along the axis, before a mouse press becomes a drag — below it, a click still lands. */
export const CAROUSEL_DRAG_THRESHOLD_PX = 3;

/** How much a mouse drag amplifies the pointer's travel into scroll. */
export const CAROUSEL_DRAG_SENSITIVITY = 2;

/** The visibility ratio at which a slide counts as in view, when none is given. */
export const CAROUSEL_IN_VIEW_THRESHOLD = 0.6;

/** The strings a carousel owns, in English: React's `translations` defaults. */
export const CAROUSEL_LABELS: {
  slideLabel: (position: { index: number; total: number }) => string;
  indicatorLabel: (position: { index: number }) => string;
  startSlideshow: string;
  stopSlideshow: string;
  progressText: (progress: { page: number; totalPages: number }) => string;
} = {
  slideLabel: ({ index, total }) => `${index} of ${total}`,
  indicatorLabel: ({ index }) => `Slide ${index}`,
  startSlideshow: "Start automatic slide show",
  stopSlideshow: "Stop automatic slide show",
  progressText: ({ page, totalPages }) => `${page + 1} of ${totalPages}`,
};

/** How a carousel's slides group into pages. */
export type CarouselLayout = {
  /** The slides there are. */
  total: number;
  /** Slides on a page: a whole number, at least one. */
  perPage: number;
  /** Slides a page step advances: a whole number from one to `perPage`. */
  move: number;
  /** The last page's leading slide — the last page end-aligns, so it is always full. */
  maxOffset: number;
  /** The pages there are. */
  totalPages: number;
};

/** A consumer's count as a whole number of at least `min`: 0, negatives, fractions and non-numbers degrade. */
function count(n: number, min: number): number {
  return Number.isFinite(n) ? Math.max(min, Math.floor(n)) : min;
}

/**
 * How `total` slides page at `slidesPerPage` a page, stepping `slidesPerMove`
 * slides at a time (`"auto"` is a whole page). Pages step from slide 0 and the
 * **last page end-aligns** to the track end, so every page is a full window
 * that can start-snap cleanly; a numeric move is held to a page, so a step
 * never skips slides.
 */
export function carouselLayout(total: number, slidesPerPage: number, slidesPerMove: number | "auto"): CarouselLayout {
  const perPage = count(slidesPerPage, 1);
  const move = slidesPerMove === "auto" ? perPage : Math.min(perPage, count(slidesPerMove, 1));
  const maxOffset = Math.max(0, total - perPage);
  const totalPages = total === 0 ? 0 : Math.ceil(maxOffset / move) + 1;
  return { total, perPage, move, maxOffset, totalPages };
}

/** The leading slide of `page`. */
export function carouselPageOffset({ move, maxOffset }: CarouselLayout, page: number): number {
  return Math.min(page * move, maxOffset);
}

/** Every page's leading slide, in page order. */
export function carouselSnapPoints(layout: CarouselLayout): number[] {
  return Array.from({ length: layout.totalPages }, (_, page) => carouselPageOffset(layout, page));
}

/**
 * The page a slide belongs to: the one whose leading slide is nearest, ties
 * going to the earlier page. The last page end-aligns, so the offsets are not
 * a clean multiple series and rounding cannot invert them.
 */
export function carouselPageForSlide(layout: CarouselLayout, slideIndex: number): number {
  let best = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  carouselSnapPoints(layout).forEach((offset, page) => {
    const distance = Math.abs(offset - slideIndex);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = page;
    }
  });
  return best;
}

/** Whether slide `index` is in the window `page` shows. */
export function carouselSlideActive(layout: CarouselLayout, page: number, index: number): boolean {
  const offset = carouselPageOffset(layout, page);
  return index >= offset && index < offset + layout.perPage;
}

/**
 * Whether slide `index` is a page's leading slide — the only kind that is a
 * valid scroll-snap resting place, so an interior slide of a multi-slide page
 * never snaps.
 */
export function carouselSnapStart({ maxOffset, move }: CarouselLayout, index: number): boolean {
  return index >= 0 && index <= maxOffset && (index === maxOffset || index % move === 0);
}

/**
 * A `loop` setting as a mode: `true`, the empty attribute and `"wrap"` rewind;
 * `"infinite"` glides on; anything else clamps.
 */
export function carouselLoopMode(loop: boolean | string | null | undefined): CarouselLoop {
  if (loop === true || loop === "" || loop === "wrap") return "wrap";
  return loop === "infinite" ? "infinite" : "none";
}

/** `page` held within the pages there are; left alone while there are none. */
export function carouselClampPage(page: number, totalPages: number): number {
  return totalPages > 0 ? Math.max(0, Math.min(page, totalPages - 1)) : page;
}

/** The page model navigation reads. */
export type CarouselNavigationState = { page: number; totalPages: number; loop: CarouselLoop };

/**
 * Whether each direction has somewhere to go: clamped at the ends, or — while
 * looping — both ways once there is a second page to wrap to.
 */
export function carouselBounds({ page, totalPages, loop }: CarouselNavigationState): CarouselBounds {
  if (loop !== "none") return { previous: totalPages > 1, next: totalPages > 1 };
  return { previous: totalPages > 0 && page > 0, next: page < totalPages - 1 };
}

/** The page one `step` away, wrapping while looping, or `null` at an end. */
export function carouselStep({ page, totalPages, loop }: CarouselNavigationState, step: CarouselStepDirection): number | null {
  if (loop !== "none" && totalPages > 1) return (page + step + totalPages) % totalPages;
  const target = page + step;
  return target >= 0 && target < totalPages ? target : null;
}

/**
 * What a key on the viewport asks for: the arrows along the scroll axis page
 * (Right / Left horizontally, Down / Up vertically) and Home / End jump to the
 * ends; any other key is not the carousel's.
 */
export function carouselKeydown(orientation: CarouselOrientation, key: string): CarouselKeyAction | null {
  const vertical = orientation === "vertical";
  if (key === (vertical ? "ArrowDown" : "ArrowRight")) return "next";
  if (key === (vertical ? "ArrowUp" : "ArrowLeft")) return "previous";
  if (key === "Home") return "first";
  return key === "End" ? "last" : null;
}

/** What decides whether the autoplay timer runs. */
export type CarouselAutoplayState = {
  enabled: boolean;
  playing: boolean;
  canGoNext: boolean;
  /** Hover, focus or a touch inside the carousel, unless the user pressed play (WCAG 2.2.2). */
  suspended: boolean;
};

/** Whether the autoplay timer runs. */
export function carouselAutoplayRuns({ enabled, playing, canGoNext, suspended }: CarouselAutoplayState): boolean {
  return enabled && playing && canGoNext && !suspended;
}

/** How far a page sits in from the viewport's start, given the space it leaves over. */
export function carouselAlignOffset(align: CarouselSnapAlign, leftover: number): number {
  if (align === "center") return leftover / 2;
  return align === "end" ? leftover : 0;
}

/**
 * How far through its scroll a viewport is, 0..1. The position's magnitude is
 * used, since right-to-left scrolling counts down from 0.
 */
export function carouselScrollProgress(position: number, maxScroll: number): number {
  return maxScroll > 0 ? Math.min(Math.abs(position) / maxScroll, 1) : 0;
}

/** How far a slide's centre is from the viewport's, in half-viewports, clamped to −1..1. */
export function carouselSlideProgress(slideCenter: number, viewportCenter: number, viewportHalf: number): number {
  if (viewportHalf <= 0) return 0;
  return Math.max(-1, Math.min(1, (slideCenter - viewportCenter) / viewportHalf));
}

/**
 * The edge a mouse drag of `delta` pushes past with nowhere further to go, or
 * `null`. A positive delta drags toward the start.
 */
export function carouselDragOverscroll(delta: number, bounds: CarouselBounds): CarouselEdge | null {
  if (delta > 0 && !bounds.previous) return "start";
  return delta < 0 && !bounds.next ? "end" : null;
}

/** The parts of a wheel event the carousel reads. */
export type CarouselWheel = { deltaX: number; deltaY: number; deltaMode: number };

/**
 * The horizontal scroll a plain vertical wheel notch should become, in pixels
 * (lines are 16 px, a page is `pageSize`), or `null` for a real horizontal
 * swipe, which already scrolls a horizontal viewport natively.
 */
export function carouselWheelDelta({ deltaX, deltaY, deltaMode }: CarouselWheel, pageSize: number): number | null {
  if (Math.abs(deltaX) > 0.5) return null;
  if (deltaMode === 1) return deltaY * 16;
  return deltaMode === 2 ? deltaY * pageSize : deltaY;
}

/**
 * The visibility ratio at which a slide counts as in view: a single threshold,
 * or the highest of several — the strictest crossing.
 */
export function carouselInViewCutoff(threshold: number | readonly number[]): number {
  return typeof threshold === "number" ? threshold : Math.max(...threshold);
}

/** `template` with every `{name}` replaced by its value; a name with no value is left as written. */
export function carouselFormat(template: string, values: Readonly<Record<string, number | string>>): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) => String(values[name] ?? match));
}
