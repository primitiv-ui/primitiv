import { ComponentProps, ReactNode, RefObject } from "react";

/**
 * Discriminated label shape for `Carousel.Root` — exactly one of
 * `ariaLabel` or `ariaLabelledBy` must be supplied so every carousel
 * has an accessible name (per the WAI-ARIA Carousel pattern). TypeScript
 * rejects shapes that supply both or neither.
 */
export type CarouselRootLabelProps =
  | { ariaLabel: string; ariaLabelledBy?: never }
  | { ariaLabel?: never; ariaLabelledBy: string };

/**
 * Uncontrolled page state — the Root owns the active page internally,
 * optionally seeded by `defaultPage`. The discriminated union below
 * rejects passing `page` or `onPageChange` alongside it.
 */
export type UncontrolledCarouselPageProps = {
  /** Uncontrolled active page index. Defaults to `0`. */
  defaultPage?: number;
  page?: never;
  onPageChange?: never;
};

/**
 * Controlled page state — the parent owns the active page; the Root
 * defers every state change back through `onPageChange`. Both props
 * must be supplied together.
 */
export type ControlledCarouselPageProps = {
  /** Controlled active page index. */
  page: number;
  /** Callback invoked when the active page should change (e.g. when the
   * user clicks `Carousel.NextTrigger` or `Carousel.PreviousTrigger`).
   * The callback is responsible for re-rendering with the new `page`. */
  onPageChange: (page: number) => void;
  defaultPage?: never;
};

/**
 * Discriminated state union — TypeScript rejects mixed shapes (e.g.
 * `defaultPage` + `page`, or `page` without `onPageChange`).
 */
export type CarouselRootPageStateProps =
  | UncontrolledCarouselPageProps
  | ControlledCarouselPageProps;

/**
 * Uncontrolled playing state — the Root owns the "playing" flag
 * internally, optionally seeded by `defaultPlaying`.
 */
export type UncontrolledCarouselPlayingProps = {
  /** Uncontrolled initial playing flag. Defaults to `false`. */
  defaultPlaying?: boolean;
  playing?: never;
  onPlayingChange?: never;
};

/**
 * Controlled playing state — the parent owns the "playing" flag; the
 * Root defers every change back through `onPlayingChange`. Both props
 * must be supplied together.
 */
export type ControlledCarouselPlayingProps = {
  /** Controlled playing flag. */
  playing: boolean;
  /** Callback invoked when the playing flag should toggle. The callback
   * is responsible for re-rendering with the new `playing` value. */
  onPlayingChange: (playing: boolean) => void;
  defaultPlaying?: never;
};

/**
 * Discriminated playing-state union — mirrors the page-state pattern.
 */
export type CarouselRootPlayingStateProps =
  | UncontrolledCarouselPlayingProps
  | ControlledCarouselPlayingProps;

/**
 * Autoplay configuration. Pass `true` for the default 4000ms cadence,
 * `false` (default) to disable autoplay entirely, or `{ delay: N }` to
 * tune the interval. The active page advances on each tick while
 * `playing` is `true`; the timer stops once the active page reaches the
 * last slide.
 */
export type CarouselAutoplay = boolean | { delay: number };

/**
 * Visual transition mode for the viewport. The resolved value is
 * published on the Root as `data-transition` so consumer CSS can switch
 * the visual off a single hook.
 *
 * - `"slide"` (default) — relies on native CSS scroll-snap; the
 *   Viewport scrolls programmatically when the page changes and
 *   listens for `scrollsnapchange` to update React state when the
 *   user swipes.
 * - `"fade"` — installs no scroll wiring (like `"none"`), but names the
 *   intent so a styled surface can ship a crossfade by default: stack
 *   the slides and cross-fade opacity off the per-slide `data-state`
 *   hook. Native swipe/drag and peek don't apply (there's no scroll);
 *   controls, indicators, and keyboard paging still work.
 * - `"none"` — the Viewport installs no scroll wiring at all, and the
 *   styled surface ships no default visual: consumer CSS owns the
 *   transition entirely via the `data-state` hook on each slide, which
 *   still flips with the active page.
 */
export type CarouselTransition = "slide" | "fade" | "none";

/**
 * Scroll-snap alignment that the Viewport should target when
 * programmatically scrolling to a page.
 *
 * - `"start"` (default) — scrolls so the first slide of the target
 *   page aligns with the **start** (left) edge of the Viewport.
 *   Matches `scroll-snap-align: start` in consumer CSS.
 * - `"center"` — scrolls so the first slide of the target page is
 *   **centred** in the Viewport. The target is offset inward by
 *   `(viewportWidth − slideWidth) / 2`. Use this with
 *   `scroll-snap-align: center` in consumer CSS (e.g. Cover Flow
 *   layouts where slides are narrower than the Viewport).
 * - `"end"` — scrolls so the first slide of the target page's
 *   **trailing** edge aligns with the Viewport's trailing edge. The
 *   target is offset inward by the full `viewportWidth − slideWidth`.
 *   Use with `scroll-snap-align: end`.
 *
 * Settable on `Carousel.Root` (the default for every slide) and
 * overridden per-slide via {@link CarouselSlideProps.snapAlign} — e.g. a
 * variable-width layout where only some slides should centre. Matches
 * Ark UI's per-`Item` `snapAlign`.
 */
export type CarouselSnapAlign = "start" | "center" | "end";

/**
 * `scroll-snap-type` strictness the Viewport scrolls with.
 *
 * - `"mandatory"` (default) — the browser always rests on a snap point;
 *   scrolling can't stop mid-way between slides.
 * - `"proximity"` — the browser only nudges toward a snap point when the
 *   scroll ends *near* one, otherwise leaving the scroll wherever it
 *   stopped — for a looser, free-scrolling feel (e.g. a gallery where
 *   forcing a rest on every slide feels too rigid).
 *
 * The resolved value is published on the Viewport as `data-snap-type` so
 * consumer CSS can switch `scroll-snap-type`'s strictness off a single hook.
 * Matches Ark UI's `snapType`.
 */
export type CarouselSnapType = "mandatory" | "proximity";

/**
 * Payload passed to `Carousel.Root`'s `onDragStatusChange` on every
 * mouse-drag status transition (only reachable when `allowMouseDrag` is
 * `true`):
 *
 * - `"dragging.start"` — the pointer just crossed the click-vs-drag
 *   movement threshold; a drag has begun.
 * - `"dragging"` — a subsequent pointer move while already dragging.
 * - `"dragging.end"` — the drag ended (`pointerup` or `pointercancel`).
 *
 * `page` is the live active page at the moment of the event; `isDragging`
 * mirrors the imperative `isDragging()` snapshot at that moment (`true`
 * for `"dragging.start"`/`"dragging"`, `false` for `"dragging.end"`).
 * Matches Ark UI's `onDragStatusChange` shape.
 */
export type CarouselDragStatus = {
  type: "dragging.start" | "dragging" | "dragging.end";
  page: number;
  isDragging: boolean;
};

/**
 * Payload passed to `Carousel.Root`'s `onAutoplayStatusChange` on every
 * autoplay status transition (only reachable when `autoplay` is enabled):
 *
 * - `"autoplay.start"` — the timer just became active: autoplay is
 *   enabled, `playing` is `true`, another page remains, and the timer
 *   isn't suspended by hover/focus/touch.
 * - `"autoplay"` — a scheduled tick fired and is about to advance the
 *   page, while the timer stays active.
 * - `"autoplay.stop"` — the timer stopped running, whether because
 *   `playing` flipped `false`, the last page was reached, or
 *   hover/focus/touch suspended it.
 *
 * Fires on every tick, not just play/pause toggles. `page` is the active
 * page at the moment of the event; `isPlaying` mirrors whether the timer
 * is running right after the event (`true` for `"autoplay.start"`/
 * `"autoplay"`, `false` for `"autoplay.stop"`). Matches Ark UI's
 * `onAutoplayStatusChange` shape.
 */
export type CarouselAutoplayStatus = {
  type: "autoplay.start" | "autoplay" | "autoplay.stop";
  page: number;
  isPlaying: boolean;
};

/**
 * Axis the carousel scrolls and paginates along.
 *
 * - `"horizontal"` (default) — slides lay out inline; the viewport
 *   scroll-snaps on the inline (x) axis. `Carousel.NextTrigger` /
 *   `Carousel.PreviousTrigger` and the viewport `ArrowRight` /
 *   `ArrowLeft` keys advance / retreat.
 * - `"vertical"` — slides lay out in the block direction; the viewport
 *   scroll-snaps on the block (y) axis. The viewport `ArrowDown` /
 *   `ArrowUp` keys advance / retreat instead (the horizontal arrows are
 *   inert), and programmatic paging scrolls on the block axis.
 *
 * The resolved value is published on the Root as `data-orientation` so
 * consumer CSS can switch layout (e.g. a column viewport with a
 * `scroll-snap-type: y mandatory`) off a single hook.
 */
export type CarouselOrientation = "horizontal" | "vertical";

/**
 * Pin DOM `id`s on the rendered sub-components for SSR / hydration
 * stability or for external `aria-controls` references. Any keys you
 * omit leave the corresponding element unidentified (or with whatever
 * the consumer attaches to that sub-component directly via its own
 * `id` prop, which always wins).
 */
export type CarouselIds = {
  root?: string;
  viewport?: string;
  previousTrigger?: string;
  nextTrigger?: string;
  playPauseTrigger?: string;
  indicatorGroup?: string;
};

/**
 * Override the default user-visible strings the component owns —
 * intended for internationalisation. Any keys you omit fall back to
 * the English defaults.
 */
export type CarouselTranslations = {
  /** Format used for the auto-generated slide aria-label. Receives
   * 1-indexed `index` and the live `total`. Default:
   * `({ index, total }) => "${index} of ${total}"`. */
  slideLabel?: (params: { index: number; total: number }) => string;
  /** Format used for the auto-generated indicator aria-label. Receives
   * the 1-indexed page position. Default:
   * `({ index }) => "Slide ${index}"`. */
  indicatorLabel?: (params: { index: number }) => string;
  /** Accessible name for `Carousel.PlayPauseTrigger` while paused.
   * Default: `"Start automatic slide show"`. */
  startSlideshow?: string;
  /** Accessible name for `Carousel.PlayPauseTrigger` while playing.
   * Default: `"Stop automatic slide show"`. */
  stopSlideshow?: string;
  /** Format used for `Carousel.ProgressText`'s default rendered content.
   * Receives the 0-indexed active `page` and the live `totalPages`.
   * Default: `({ page, totalPages }) => "${page + 1} of ${totalPages}"`. */
  progressText?: (params: { page: number; totalPages: number }) => string;
};

/** Props for `Carousel.Root` — the labelled `<section>` wrapping the whole widget; combines label, page-state, and playing-state shapes with autoplay, transition, and layout options. */
export type CarouselRootProps = Omit<
  ComponentProps<"section">,
  "aria-label" | "aria-labelledby"
> &
  CarouselRootLabelProps &
  CarouselRootPageStateProps &
  CarouselRootPlayingStateProps & {
    /** Autoplay configuration — see {@link CarouselAutoplay}. */
    autoplay?: CarouselAutoplay;
    /** Visual transition mode — see {@link CarouselTransition}.
     * Defaults to `"slide"`. */
    transition?: CarouselTransition;
    /** Number of slides visible per page. Defaults to `1`. With values
     * greater than `1`, slides are grouped into pages of that size for
     * navigation purposes: indicators auto-render per page, boundary
     * clamp moves to the last page, and `Carousel.NextTrigger` /
     * `Carousel.PreviousTrigger` advance one page at a time. The **last
     * page always end-aligns** (its window is full, flush with the track
     * end) rather than leaving a partial page — a partial page's leading
     * slide can't align to the viewport start, which desyncs the active
     * page against the scroll. So 7 slides at `slidesPerPage={3}` are 3
     * pages — `[0,1,2] [3,4,5] [4,5,6]` — the last shifted back by one to
     * stay full. Coerced to an integer ≥ 1 — `0`, negative, fractional,
     * and non-finite values are clamped (e.g. `2.5 → 2`, `0 → 1`) so the
     * page maths never divides by zero. */
    slidesPerPage?: number;
    /** Number of slides advanced by `Carousel.NextTrigger` /
     * `Carousel.PreviousTrigger`. `"auto"` (default) advances one full page
     * at a time (= `slidesPerPage`); a number advances exactly that many
     * slides per click and pages are windowed so the visible window always
     * stays full. A numeric move is coerced to an integer in
     * `[1, slidesPerPage]` — it can neither drop below one nor skip past a
     * page (which would orphan the slides in the gap) — and the **last page
     * is end-aligned to the track end**, so every slide stays reachable even
     * when the move doesn't divide the slide count evenly (e.g. 6 slides,
     * `slidesPerPage={3}`, `slidesPerMove={2}` yields pages
     * `[0,1,2] [2,3,4] [3,4,5]`). */
    slidesPerMove?: number | "auto";
    /** Override the default user-visible strings the component owns —
     * see {@link CarouselTranslations}. Useful for i18n. */
    translations?: CarouselTranslations;
    /** Pin DOM `id`s on the rendered sub-components — see
     * {@link CarouselIds}. Useful for SSR hydration stability and
     * external `aria-controls` linkage. */
    ids?: CarouselIds;
    /** Scroll-snap alignment the Viewport targets when programmatically
     * scrolling to a page — see {@link CarouselSnapAlign}.
     * Defaults to `"start"`. Set to `"center"` when consumer CSS uses
     * `scroll-snap-align: center` on slides (e.g. Cover Flow layouts
     * where slides are narrower than the Viewport). */
    snapAlign?: CarouselSnapAlign;
    /** Axis the carousel scrolls and paginates along — see
     * {@link CarouselOrientation}. Defaults to `"horizontal"`. Switches
     * the viewport scroll axis, the arrow-key bindings, and the
     * `data-orientation` styling hook on the Root. */
    orientation?: CarouselOrientation;
    /** Whether the Viewport supports mouse click-and-drag scrolling —
     * the pointer tracks 1:1 into `scrollLeft`/`scrollTop` (no momentum)
     * once past a small movement threshold, release lets the existing
     * `scroll-snap-type` settle. Defaults to `false`: an unconditionally-on
     * drag can conflict with a consumer's own drag-sensitive slide content
     * (a nested carousel, a draggable card, a canvas), so it's opt-in.
     * Touch/pen scrolling is unaffected either way — that's native,
     * independent of this prop. */
    allowMouseDrag?: boolean;
    /** Fires on every mouse-drag status transition — see
     * {@link CarouselDragStatus}. Matches Ark UI's `onDragStatusChange`.
     * No-op unless `allowMouseDrag` is `true` (a drag can't start
     * otherwise). */
    onDragStatusChange?: (status: CarouselDragStatus) => void;
    /** Fires on every autoplay status transition — see
     * {@link CarouselAutoplayStatus}. Matches Ark UI's
     * `onAutoplayStatusChange`. Fires on every tick, not just play/pause
     * toggles — useful for analytics. No-op unless `autoplay` is enabled. */
    onAutoplayStatusChange?: (status: CarouselAutoplayStatus) => void;
    /** Visibility threshold(s) the `isInView` fallback's
     * `IntersectionObserver` uses — both as the observer's own `threshold`
     * option and (for an array, the highest value) the cutoff a slide's
     * `intersectionRatio` must clear to count as "in view". Matches Ark
     * UI's `inViewThreshold` shape. Defaults to `0.6`. */
    inViewThreshold?: number | number[];
    /** `scroll-snap-type` strictness — see {@link CarouselSnapType}.
     * Defaults to `"mandatory"`. */
    snapType?: CarouselSnapType;
  };

/**
 * Shape of the context published by `Carousel.Root` to descendants.
 * Fields are added as future cycles introduce shared state (active
 * page, autoplay, etc.).
 */
export type CarouselContextValue = {
  /** Self-registers a slide. Called as a callback ref by `Carousel.Slide`
   * with the rendered DOM node on mount and `null` on unmount. */
  registerSlide: (key: string, element: HTMLDivElement | null) => void;
  /** Live map from slide key to rendered DOM node. Used by the
   * Viewport to read `getBoundingClientRect` on the first slide of
   * the target page when programmatically scrolling. */
  slidesRef: RefObject<Map<string, HTMLDivElement>>;
  /** Ordered list of currently-mounted slide keys. The slide's index is
   * its position in this array; the array's length is the total. */
  slideKeys: string[];
  /** Number of slides visible per page — the consumer's `slidesPerPage`
   * coerced to an integer ≥ 1 (0 / negative / non-finite → 1). */
  slidesPerPage: number;
  /** Resolved slides advanced per Prev/Next click — equal to
   * `slidesPerPage` when the consumer left `slidesPerMove="auto"`, else
   * the numeric value coerced to an integer in `[1, slidesPerPage]` (a
   * move can neither drop below one nor skip past a page). */
  effectiveSlidesPerMove: number;
  /** Start slide index of the currently-active window. In `"auto"`
   * (paged) mode this is `currentPage * slidesPerPage` (the last page may
   * be partial); in numeric (windowed) mode the last page is end-aligned
   * — clamped to `total − slidesPerPage` — so every slide stays reachable
   * even when the move doesn't divide the track evenly. Drives the slide
   * `data-state` window and the viewport scroll target. */
  currentPageOffset: number;
  /** Map a leading slide index (e.g. a user swipe's snap target) back to
   * its page index, clamped into `[0, totalPages − 1]`. Paged mode groups
   * by `slidesPerPage`; windowed mode inverts the move offset to the
   * nearest window start. */
  pageForSlideIndex: (slideIndex: number) => number;
  /** Live total page count — `ceil(total / slidesPerPage)` in `"auto"`
   * mode (partial last page allowed), else
   * `floor((total - slidesPerPage) / effectiveSlidesPerMove) + 1`
   * (always full-windowed). Drives indicator count and boundary
   * clamp. */
  totalPages: number;
  /** Zero-based index of the currently-active page. */
  currentPage: number;
  /** `true` when there is a forward navigation target (a page ahead of
   * the active one). Drives the `disabled` attribute on
   * `Carousel.NextTrigger` and short-circuits `next()` when there's
   * nowhere to go. */
  canGoNext: boolean;
  /** `true` when there is a backward navigation target. Drives the
   * `disabled` attribute on `Carousel.PreviousTrigger`. */
  canGoPrevious: boolean;
  /** Advance the active page by one step. No-op when `!canGoNext`. Pass
   * `instant` to bypass the resolved smooth/reduced-motion scroll for
   * just this one call — see {@link CarouselImperativeApi.next}. */
  next: (instant?: boolean) => void;
  /** Retreat the active page by one step. No-op when `!canGoPrevious`.
   * See {@link CarouselContextValue.next} for the `instant` override. */
  previous: (instant?: boolean) => void;
  /** Jump directly to `target` (zero-based page index). Used by
   * `Carousel.Indicator` to dispatch click-to-jump. See
   * {@link CarouselContextValue.next} for the `instant` override. */
  goTo: (target: number, instant?: boolean) => void;
  /** Whether autoplay is currently in the "playing" state. */
  playing: boolean;
  /** Toggles `playing`. Used by `Carousel.PlayPauseTrigger`. */
  togglePlaying: () => void;
  /** `true` when the consumer enabled autoplay (regardless of the
   * `playing` flag). Used by `Carousel.PlayPauseTrigger` to validate
   * its own configuration. */
  autoplayEnabled: boolean;
  /** `true` when autoplay is enabled AND `playing` is `true` — i.e. the
   * timer could fire any moment. Drives the Viewport's `aria-live`
   * flip ("off" while auto-rotating, "polite" otherwise) so screen
   * readers don't get spammed by every tick. */
  isAutoRotating: boolean;
  /** Translations merged with English defaults — every field is
   * present, even if the consumer passed only a subset. */
  translations: Required<CarouselTranslations>;
  /** Custom DOM ids — every field optional. Sub-components apply
   * their respective entry via spread, so consumer-supplied `id`
   * props on the sub-component still win. */
  ids: CarouselIds;
  /** Resolved visual transition mode (defaults to `"slide"`). */
  transition: CarouselTransition;
  /** Resolved scroll-snap alignment (defaults to `"start"`). */
  snapAlign: CarouselSnapAlign;
  /** Resolved scroll/pagination axis (defaults to `"horizontal"`).
   * Drives the viewport scroll axis, the arrow-key bindings, and the
   * `data-orientation` hook on the Root. */
  orientation: CarouselOrientation;
  /** Resolved mouse click-and-drag scrolling opt-in (defaults to
   * `false`). */
  allowMouseDrag: boolean;
  /** Resolved `isInView` IntersectionObserver threshold(s) (defaults to
   * `0.6`). */
  inViewThreshold: number | number[];
  /** Resolved `scroll-snap-type` strictness (defaults to `"mandatory"`). */
  snapType: CarouselSnapType;
  /** Bumped by `refresh()` to force the viewport's scroll-align
   * effect to re-run without a page change. */
  refreshTick: number;
  /** Live set of slide indices currently visible per IntersectionObserver
   * (≥ 60% intersection). Mutated by the Viewport hook and read by
   * the imperative `isInView`. */
  visibleSlideIndicesRef: RefObject<Set<number>>;
  /** Used by the Viewport hook to record visibility transitions. */
  setSlideInView: (slideIndex: number, inView: boolean) => void;
  /** Set to `true` by `next()` and `previous()` the moment programmatic
   * navigation begins, and cleared by the Viewport hook once the scroll
   * animation settles (`scrollend` or a timeout fallback). The
   * IntersectionObserver callback checks this flag before calling `goTo`
   * so that IO entries firing mid-animation cannot undo the navigation. */
  isProgrammaticScrollRef: RefObject<boolean>;
  /** One-shot override of the resolved smooth/reduced-motion
   * `scrollBehavior`, set by `next()` / `previous()` / `goTo()` on every
   * call (`true` when their optional `instant` argument was passed,
   * `false` otherwise) and consumed — then reset to `false` — by the
   * Viewport hook's scroll effect on its very next run, so an instant
   * jump never outlives the single call that requested it. */
  instantScrollRef: RefObject<boolean>;
  /** Live mouse-drag state (only ever `true` when `allowMouseDrag` is
   * `true`). Mutated by the Viewport hook and read by the imperative
   * `isDragging()`. */
  isDraggingRef: RefObject<boolean>;
  /** Used by the Viewport hook to record drag start/end transitions. */
  setDragging: (value: boolean) => void;
  /** The consumer's `onDragStatusChange`, if provided — called by the
   * Viewport hook on every drag status transition. */
  onDragStatusChange?: (status: CarouselDragStatus) => void;
};

/** Props for `Carousel.Viewport` — the scroll-snap slide container; accepts all native `<div>` props. */
export type CarouselViewportProps = ComponentProps<"div">;

/** Props for `Carousel.Slide` — an individual slide that self-registers with the Root; native `<div>` props plus an optional accessible-label override. */
export type CarouselSlideProps = Omit<ComponentProps<"div">, "aria-label"> & {
  /** Override the auto-generated `"N of M"` `aria-label`. Use this when
   * the slide has a more meaningful description than its position
   * (e.g. `"Hand-picked for you"`). When omitted, slides are labelled
   * with their live index and total in registration order. */
  ariaLabel?: string;
  /** Override the root's {@link CarouselRootProps.snapAlign | `snapAlign`}
   * for this slide only — e.g. a variable-width layout where only some
   * slides should centre or end-align. Only takes effect on a slide
   * that's a valid scroll-snap resting position (a page's leading
   * slide); an interior slide of a multi-slide page never snaps,
   * regardless of this prop. Matches Ark UI's per-`Item` `snapAlign`. */
  snapAlign?: CarouselSnapAlign;
};

/** Props for `Carousel.NextTrigger` — the button that advances one page; native `<button>` props plus `asChild`. */
export type CarouselNextTriggerProps = ComponentProps<"button"> & {
  /** Render the child element instead of the default `<button>`. All
   * trigger props (onClick, disabled, ids.nextTrigger, …) are merged
   * onto the child via `Slot`. The child must accept a `ref`. */
  asChild?: boolean;
};

/** Props for `Carousel.PreviousTrigger` — the button that retreats one page; native `<button>` props plus `asChild`. */
export type CarouselPreviousTriggerProps = ComponentProps<"button"> & {
  /** See `CarouselNextTriggerProps.asChild`. */
  asChild?: boolean;
};

/**
 * Discriminated label shape for `Carousel.IndicatorGroup` — exactly one
 * of `label` (becomes `aria-label`) or `ariaLabelledBy` (points at an
 * external label element) must be supplied. TypeScript rejects
 * both-or-neither at compile time.
 */
export type CarouselIndicatorGroupProps = Omit<
  ComponentProps<"div">,
  "label" | "aria-labelledby"
> &
  (
    | { label: string; ariaLabelledBy?: never }
    | { label?: never; ariaLabelledBy: string }
  );

/** Props for `Carousel.Indicator` — a button that jumps to its target page; native `<button>` props plus the target `index` and `asChild`. */
export type CarouselIndicatorProps = ComponentProps<"button"> & {
  /** Zero-based page this indicator targets. Clicking jumps to it. */
  index: number;
  /** Renders a presentational-only `<span>` instead of a `<button>`:
   * `aria-hidden="true"`, and clicking no longer calls `goTo`. Use for a
   * progress display when navigation happens some other way (e.g. a
   * carousel driven solely by `allowMouseDrag`). The consumer's own
   * `onClick`, if passed, still fires. Default `false`. */
  readOnly?: boolean;
  /** Render the child element instead of the default `<button>`.
   * Trigger props (onClick, aria-label, aria-disabled, data-state)
   * are merged onto the child via `Slot`. The child must accept a
   * `ref`. */
  asChild?: boolean;
};

/**
 * Imperative handle exposed via `ref` on `Carousel.Root`. Routes
 * through the same internal state machine the trigger components
 * use, so controlled-mode `onPageChange` / `onPlayingChange` still
 * fire as if the user had clicked.
 */
export type CarouselImperativeApi = {
  /** Advance the active page by one. No-op on the last page. Pass
   * `instant` (default `false`) to bypass the resolved smooth/
   * reduced-motion scroll for just this one call — e.g. an instant
   * jump on initial deep-link vs. smooth for user-initiated
   * navigation. Matches Ark UI's `scrollNext(instant?)`. */
  next: (instant?: boolean) => void;
  /** Retreat the active page by one. No-op on the first page. See
   * `next`'s `instant` parameter. Matches Ark UI's
   * `scrollPrev(instant?)`. */
  previous: (instant?: boolean) => void;
  /** Jump directly to `target` (zero-based page index). See `next`'s
   * `instant` parameter. Matches Ark UI's `scrollTo(page, instant?)`. */
  goTo: (target: number, instant?: boolean) => void;
  /** Jump to the page containing the given zero-based **slide** index —
   * slide granularity, distinct from `goTo`'s page granularity. In a
   * multi-slide (`slidesPerPage > 1`) layout an interior slide isn't its
   * own scroll-snap position, so this lands on that slide's *containing*
   * page (the same mapping `Carousel.Indicator` uses internally). See
   * `next`'s `instant` parameter. Matches Ark UI's
   * `scrollToIndex(index, instant?)`. */
  scrollToIndex: (slideIndex: number, instant?: boolean) => void;
  /** Set `playing` to `true`. Dismisses the hover/focus pause for the
   * lifetime of the resulting playing session. */
  play: () => void;
  /** Set `playing` to `false`. */
  pause: () => void;
  /** Re-issue the viewport's scrollTo for the current page. Call when
   * external layout changes (window resize, container reflow) leave
   * the scroll position misaligned with React state. */
  refresh: () => void;
  /** Live progress snapshot: the active page, the total page count,
   * and a normalised `value` in `[0, 1]` (0 when there's at most one
   * page). */
  getProgress: () => { page: number; totalPages: number; value: number };
  /** Reports whether the slide at the zero-based index is currently
   * visible in the viewport (per IntersectionObserver, ≥ 60%
   * intersection). Useful for lazy-loading slide content. */
  isInView: (slideIndex: number) => boolean;
  /** The leading slide index each page snaps to, one entry per page
   * (length `totalPages`). The last entry is the end-aligned offset
   * (see the multi-slide page model), not necessarily a clean multiple
   * of `slidesPerMove`. Useful for a custom progress bar or indicator
   * that needs the raw offsets rather than just the page count. */
  getPageSnapPoints: () => number[];
  /** Live snapshot of whether a mouse drag is currently in progress
   * (`allowMouseDrag`-gated — always `false` when it's off). Mirrors
   * Ark UI's `api.isDragging`; see also `onDragStatusChange`. */
  isDragging: () => boolean;
};

/** Live progress snapshot reported by the carousel: the active page, the total page count, and a normalised `value` in `[0, 1]`. */
export type CarouselProgress = {
  page: number;
  totalPages: number;
  value: number;
};

/**
 * Convenience wrapper that auto-renders one `Carousel.Indicator` per
 * registered slide. Reuses the same discriminated label shape as
 * `Carousel.IndicatorGroup`. `children` is reserved (the auto-mapped
 * indicators take that slot) — drop down to `Carousel.IndicatorGroup`
 * + `Carousel.Indicator` if you need custom indicator content.
 */
export type CarouselIndicatorsProps = Omit<
  ComponentProps<"div">,
  "label" | "aria-labelledby" | "children"
> &
  (
    | { label: string; ariaLabelledBy?: never }
    | { label?: never; ariaLabelledBy: string }
  ) & {
    /** Forwarded to every generated `Carousel.Indicator`. See
     * `CarouselIndicatorProps.readOnly`. Default `false`. */
    readOnly?: boolean;
  };

/**
 * Render-prop or static children supported by
 * `Carousel.PlayPauseTrigger`. The function form receives the live
 * `playing` flag so consumers can swap icons / labels per state.
 */
export type CarouselPlayPauseTriggerChildren =
  | ReactNode
  | ((state: { playing: boolean }) => ReactNode);

/** Props for `Carousel.PlayPauseTrigger` — toggles autoplay; native `<button>` props with a state-aware render-prop `children` and `asChild`. */
export type CarouselPlayPauseTriggerProps = Omit<
  ComponentProps<"button">,
  "children"
> & {
  children?: CarouselPlayPauseTriggerChildren;
  /** Render the child element instead of the default `<button>`.
   * The child must accept a `ref`. The render-prop form of `children`
   * is not supported under `asChild`; pass a single element instead. */
  asChild?: boolean;
};

/**
 * Props for `Carousel.ProgressText` — renders the live active-page
 * progress as text; native `<span>` props. `children`, if provided,
 * overrides the default `translations.progressText` content. */
export type CarouselProgressTextProps = ComponentProps<"span">;
