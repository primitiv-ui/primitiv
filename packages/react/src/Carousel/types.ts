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
 * Visual transition mode for the viewport.
 *
 * - `"slide"` (default) — relies on native CSS scroll-snap; the
 *   Viewport scrolls programmatically when the page changes and
 *   listens for `scrollsnapchange` to update React state when the
 *   user swipes.
 * - `"none"` — the Viewport installs no scroll wiring at all.
 *   Consumer CSS owns the visual transition (e.g. crossfade,
 *   dissolve) via the `data-state` hook on each slide, which still
 *   flips with the active page.
 */
export type CarouselTransition = "slide" | "none";

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
 */
export type CarouselSnapAlign = "start" | "center";

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
};

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
     * `Carousel.PreviousTrigger` advance one page at a time. */
    slidesPerPage?: number;
    /** Number of slides advanced by `Carousel.NextTrigger` /
     * `Carousel.PreviousTrigger`. `"auto"` (default) advances one
     * full page at a time (= `slidesPerPage`); a number advances
     * exactly that many slides per click and pages are computed so
     * the visible window always stays full. */
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
  /** Number of slides visible per page (default `1`). */
  slidesPerPage: number;
  /** Resolved slides advanced per Prev/Next click — equal to
   * `slidesPerPage` when the consumer left `slidesPerMove="auto"`,
   * else the numeric value. */
  effectiveSlidesPerMove: number;
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
  /** Advance the active page by one step. No-op when `!canGoNext`. */
  next: () => void;
  /** Retreat the active page by one step. No-op when `!canGoPrevious`. */
  previous: () => void;
  /** Jump directly to `target` (zero-based page index). Used by
   * `Carousel.Indicator` to dispatch click-to-jump. */
  goTo: (target: number) => void;
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
};

export type CarouselViewportProps = ComponentProps<"div">;

export type CarouselSlideProps = Omit<ComponentProps<"div">, "aria-label"> & {
  /** Override the auto-generated `"N of M"` `aria-label`. Use this when
   * the slide has a more meaningful description than its position
   * (e.g. `"Hand-picked for you"`). When omitted, slides are labelled
   * with their live index and total in registration order. */
  ariaLabel?: string;
};

export type CarouselNextTriggerProps = ComponentProps<"button"> & {
  /** Render the child element instead of the default `<button>`. All
   * trigger props (onClick, disabled, ids.nextTrigger, …) are merged
   * onto the child via `Slot`. The child must accept a `ref`. */
  asChild?: boolean;
};

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

export type CarouselIndicatorProps = ComponentProps<"button"> & {
  /** Zero-based page this indicator targets. Clicking jumps to it. */
  index: number;
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
  /** Advance the active page by one. No-op on the last page. */
  next: () => void;
  /** Retreat the active page by one. No-op on the first page. */
  previous: () => void;
  /** Jump directly to `target` (zero-based page index). */
  goTo: (target: number) => void;
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
};

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
  );

/**
 * Render-prop or static children supported by
 * `Carousel.PlayPauseTrigger`. The function form receives the live
 * `playing` flag so consumers can swap icons / labels per state.
 */
export type CarouselPlayPauseTriggerChildren =
  | ReactNode
  | ((state: { playing: boolean }) => ReactNode);

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
