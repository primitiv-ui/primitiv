import {
  FocusEvent,
  PointerEvent,
  Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  CarouselAutoplay,
  CarouselAutoplayStatus,
  CarouselContextValue,
  CarouselDragStatus,
  CarouselIds,
  CarouselImperativeApi,
  CarouselOrientation,
  CarouselOverscrollStatus,
  CarouselSnapAlign,
  CarouselSnapType,
  CarouselTransition,
  CarouselTranslations,
} from "../types";

const EMPTY_IDS: CarouselIds = {};

const DEFAULT_AUTOPLAY_DELAY_MS = 4000;

const DEFAULT_TRANSLATIONS: Required<CarouselTranslations> = {
  slideLabel: ({ index, total }) => `${index} of ${total}`,
  indicatorLabel: ({ index }) => `Slide ${index}`,
  startSlideshow: "Start automatic slide show",
  stopSlideshow: "Stop automatic slide show",
  progressText: ({ page, totalPages }) => `${page + 1} of ${totalPages}`,
};

/**
 * Coerce a consumer-supplied layout count to a safe integer ≥ `min`. The
 * slide count and `slidesPerPage` / `slidesPerMove` come from the consumer,
 * so 0, negative, fractional, or non-finite values must degrade to a sane
 * integer — otherwise the page maths divides by zero (Infinity pages → a
 * thrown RangeError from the indicator map) or the carousel goes inert.
 */
function clampCount(n: number, min: number): number {
  return Number.isFinite(n) ? Math.max(min, Math.floor(n)) : min;
}

function resolveAutoplay(autoplay: CarouselAutoplay | undefined): {
  enabled: boolean;
  delay: number;
} {
  if (autoplay === true)
    return { enabled: true, delay: DEFAULT_AUTOPLAY_DELAY_MS };
  if (autoplay && typeof autoplay === "object")
    return { enabled: true, delay: autoplay.delay };
  return { enabled: false, delay: DEFAULT_AUTOPLAY_DELAY_MS };
}

type UseCarouselRootProps = {
  /** Uncontrolled seed for the active page. Defaults to `0`. */
  defaultPage?: number;
  /** Controlled active page. When provided, the hook is in controlled
   * mode and defers all state changes back through `onPageChange`. */
  page?: number;
  /** Required when `page` is provided. Invoked with the next page
   * value the Root would like to advance to. */
  onPageChange?: (page: number) => void;
  /** Uncontrolled seed for the playing flag. Defaults to `false`. */
  defaultPlaying?: boolean;
  /** Controlled playing flag. When provided, the hook is in controlled
   * mode and defers all state changes back through `onPlayingChange`. */
  playing?: boolean;
  /** Required when `playing` is provided. Invoked with the proposed
   * next playing value. */
  onPlayingChange?: (playing: boolean) => void;
  /** Autoplay configuration — see {@link CarouselAutoplay}. */
  autoplay?: CarouselAutoplay;
  /** Fires on every autoplay status transition — see
   * {@link CarouselAutoplayStatus}. */
  onAutoplayStatusChange?: (status: CarouselAutoplayStatus) => void;
  /** Number of slides visible per page. Defaults to `1`. */
  slidesPerPage?: number;
  /** Slides advanced per Prev/Next click — `"auto"` (default) is
   * `slidesPerPage`. */
  slidesPerMove?: number | "auto";
  /** Override the default user-visible strings — see
   * {@link CarouselTranslations}. */
  translations?: CarouselTranslations;
  /** Custom DOM ids for the rendered sub-components — see
   * {@link CarouselIds}. */
  ids?: CarouselIds;
  /** Visual transition mode — see {@link CarouselTransition}. */
  transition?: CarouselTransition;
  /** Scroll-snap alignment — see {@link CarouselSnapAlign}. */
  snapAlign?: CarouselSnapAlign;
  /** Scroll/pagination axis — see {@link CarouselOrientation}. */
  orientation?: CarouselOrientation;
  /** Opt-in mouse click-and-drag scrolling. */
  allowMouseDrag?: boolean;
  /** Fires on every mouse-drag status transition — see
   * {@link CarouselDragStatus}. */
  onDragStatusChange?: (status: CarouselDragStatus) => void;
  /** Fires whenever the keyboard, wheel, or a mouse drag pushes against a
   * boundary with nowhere further to go — see
   * {@link CarouselOverscrollStatus}. */
  onOverscrollStatusChange?: (status: CarouselOverscrollStatus) => void;
  /** IntersectionObserver visibility threshold(s) for the `isInView`
   * fallback. Defaults to `0.6`. */
  inViewThreshold?: number | number[];
  /** `scroll-snap-type` strictness — see {@link CarouselSnapType}.
   * Defaults to `"mandatory"`. */
  snapType?: CarouselSnapType;
};

/**
 * Owns the Root-side state for a Carousel: the slide registration map,
 * the ordered list of registered slide keys, and the active page.
 *
 * Slide keys are tracked as `useState` so registration and unregistration
 * trigger a re-render — descendants that depend on slide order, count, or
 * the active page (e.g. each `Carousel.Slide`'s `data-index` /
 * `data-total` / `data-state`, and the prev/next triggers' `disabled`
 * attribute) update automatically when slides mount and unmount.
 *
 * The active page supports two modes, statically discriminated at the
 * `CarouselRootProps` level:
 *
 * - **Uncontrolled** — pass `defaultPage` (or omit it for `0`); the hook
 *   owns updates internally via the `next` / `previous` callbacks.
 * - **Controlled** — pass `page` and `onPageChange`; the hook defers
 *   every change back through `onPageChange` and reads the live value
 *   from the `page` prop on every render.
 *
 * `next` and `previous` clamp at the ends — `next` is a no-op on the
 * last page and `previous` a no-op on the first. `canGoNext` /
 * `canGoPrevious` on the published context drive the `disabled`
 * attribute on the prev/next triggers.
 */
export function useCarouselRoot(
  {
    defaultPage = 0,
    page,
    onPageChange,
    defaultPlaying = false,
    playing,
    onPlayingChange,
    autoplay,
    onAutoplayStatusChange,
    slidesPerPage = 1,
    slidesPerMove = "auto",
    translations,
    ids = EMPTY_IDS,
    transition = "slide",
    snapAlign = "start",
    orientation = "horizontal",
    allowMouseDrag = false,
    onDragStatusChange,
    onOverscrollStatusChange,
    inViewThreshold = 0.6,
    snapType = "mandatory",
  }: UseCarouselRootProps = {},
  imperativeRef?: Ref<CarouselImperativeApi>,
) {
  const { enabled: autoplayEnabled, delay: autoplayDelay } =
    resolveAutoplay(autoplay);
  const slidesRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const [slideKeys, setSlideKeys] = useState<string[]>([]);
  const [internalPage, setInternalPage] = useState(defaultPage);
  const isControlled = page !== undefined;
  const rawPage = isControlled ? (page as number) : internalPage;
  const total = slideKeys.length;
  // Guard the layout counts (see clampCount). perPage is an integer ≥ 1; a
  // numeric slidesPerMove is additionally clamped to ≤ perPage so a move can
  // never skip past a page and orphan the slides in the gap. "auto" moves a
  // full page.
  const perPage = clampCount(slidesPerPage, 1);
  // Slides advanced per page step: a full page in "auto" mode, else the numeric
  // move clamped to ≤ perPage so a move can never skip past a page and orphan
  // the slides in the gap.
  const effectiveSlidesPerMove =
    slidesPerMove === "auto"
      ? perPage
      : Math.min(perPage, clampCount(slidesPerMove, 1));
  // Pages step by `effectiveSlidesPerMove` from 0, and the **last page always
  // end-aligns** to `maxOffset` (the track end minus a full page). This is the
  // single offset model for both modes: it guarantees every page is a full
  // window that can start-snap cleanly, so a total that isn't a whole number of
  // pages can't leave a partial last page whose leading slide can't reach the
  // viewport start (which desyncs the active page against the scroll). The
  // formula is identical to `ceil(total / perPage)` when the step is a full
  // page, so the page *count* is unchanged — only the last page's offset shifts
  // back to keep its window full.
  const maxOffset = Math.max(0, total - perPage);
  const totalPages =
    total === 0
      ? 0
      : total <= perPage
        ? 1
        : Math.ceil(maxOffset / effectiveSlidesPerMove) + 1;

  // In controlled mode an out-of-range page prop is a consumer error —
  // throw loudly so it surfaces during development rather than shipping
  // as a silent no-op carousel.
  if (isControlled && totalPages > 0 && (rawPage < 0 || rawPage >= totalPages)) {
    throw new Error(
      `Carousel: page index ${rawPage} is out of range (totalPages: ${totalPages})`,
    );
  }
  // In uncontrolled mode, clamp silently: the page can temporarily
  // outlive totalPages during slide re-registration (HMR, tab switch)
  // where slides unmount and re-register one by one, briefly lowering
  // totalPages below the previously-valid current page.
  const currentPage =
    !isControlled && totalPages > 0
      ? Math.max(0, Math.min(rawPage, totalPages - 1))
      : rawPage;

  // Start slide index of the active window: step by move, but the last page
  // end-aligns (clamped to maxOffset) so its window is always full.
  const currentPageOffset = Math.min(
    currentPage * effectiveSlidesPerMove,
    maxOffset,
  );

  // Inverse of the offset model: which page does a leading slide index belong
  // to? Because the last page end-aligns, the offsets aren't a clean multiple
  // series (the final step is short), so round/floor can't invert them — pick
  // the page whose start offset is nearest the slide. Ties favour the earlier
  // page (`<`). Returns 0 for the empty carousel (the loop runs zero times) —
  // pageForSlideIndex is only called once slides exist anyway.
  const pageForSlideIndex = useCallback(
    (slideIndex: number) => {
      let best = 0;
      let bestDistance = Infinity;
      for (let page = 0; page < totalPages; page++) {
        const offset = Math.min(page * effectiveSlidesPerMove, maxOffset);
        const distance = Math.abs(offset - slideIndex);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = page;
        }
      }
      return best;
    },
    [effectiveSlidesPerMove, maxOffset, totalPages],
  );

  const [internalPlaying, setInternalPlaying] = useState(defaultPlaying);
  const isPlayingControlled = playing !== undefined;
  const currentPlaying = isPlayingControlled ? playing : internalPlaying;

  // Tracked separately so a focus move between two descendants of the
  // Root (e.g. tabbing from Prev to Next) doesn't release the pause —
  // mouseLeave only fires when the pointer exits the Root's outer
  // boundary, and onBlur's relatedTarget tells us whether focus is
  // still inside.
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  // Touch is tracked separately because mouseenter doesn't always
  // fire on touch devices, and pointerdown/up are filtered to
  // pointerType === "touch" so mouse interaction stays on the
  // hover-pause path.
  const [touchActive, setTouchActive] = useState(false);

  // Per the WAI-ARIA APG carousel example: when the user explicitly
  // resumes the slideshow via PlayPauseTrigger, the hover/focus pause
  // is suspended for the lifetime of that playing session — otherwise
  // they'd fight a pause every time the pointer was already over the
  // carousel. The ref is set inside togglePlaying() on a false→true
  // transition and reset by the effect below when playing flips back
  // to false. External (non-trigger) playing changes don't set it.
  const userInitiatedPlayRef = useRef(false);
  const suspended =
    (hovered || focused || touchActive) && !userInitiatedPlayRef.current;

  // Boundary derivation: navigation requires at least one page. The
  // ends clamp at the last page (which, with slidesPerPage > 1, is
  // generally before the last slide).
  const canGoPrevious = totalPages > 0 && currentPage > 0;
  const canGoNext = totalPages > 0 && currentPage < totalPages - 1;

  const registerSlide = useCallback(
    (key: string, element: HTMLDivElement | null) => {
      if (element) {
        slidesRef.current.set(key, element);
      } else {
        slidesRef.current.delete(key);
      }
      setSlideKeys(Array.from(slidesRef.current.keys()));
    },
    [],
  );

  // next/previous are only reachable via Carousel.NextTrigger /
  // Carousel.PreviousTrigger — both are disabled by the HTML disabled
  // attribute when canGoNext / canGoPrevious is false, so the click
  // never fires at boundaries. Guards become reachable (and necessary)
  // once the imperative API or autoplay land; they're added then.
  const isProgrammaticScrollRef = useRef(false);

  // One-shot override for the resolved smooth/reduced-motion scrollBehavior,
  // consumed by the Viewport hook's scroll effect on the very next run and
  // reset immediately after (see useCarouselViewport.ts) — so it never
  // outlives the single call that requested it.
  const instantScrollRef = useRef(false);

  const next = useCallback(
    (instant?: boolean) => {
      if (currentPage >= totalPages - 1) return;
      isProgrammaticScrollRef.current = true;
      instantScrollRef.current = !!instant;
      const target = currentPage + 1;
      if (isControlled) {
        onPageChange?.(target);
      } else {
        setInternalPage(target);
      }
    },
    [currentPage, totalPages, isControlled, onPageChange],
  );

  const previous = useCallback(
    (instant?: boolean) => {
      if (currentPage <= 0) return;
      isProgrammaticScrollRef.current = true;
      instantScrollRef.current = !!instant;
      const target = currentPage - 1;
      if (isControlled) {
        onPageChange?.(target);
      } else {
        setInternalPage(target);
      }
    },
    [currentPage, isControlled, onPageChange],
  );

  const goTo = useCallback(
    (target: number, instant?: boolean) => {
      instantScrollRef.current = !!instant;
      if (isControlled) {
        onPageChange?.(target);
      } else {
        setInternalPage(target);
      }
    },
    [isControlled, onPageChange],
  );

  // Slide-granularity counterpart to page-granularity goTo — maps the
  // target slide index to its containing page via pageForSlideIndex (a
  // multi-slide page's interior slides aren't independently reachable,
  // so this always lands on the page start closest to slideIndex) and
  // defers to the same goTo the trigger components use. Matches Ark UI's
  // scrollToIndex(index, instant?).
  const scrollToIndex = useCallback(
    (slideIndex: number, instant?: boolean) => {
      goTo(pageForSlideIndex(slideIndex), instant);
    },
    [goTo, pageForSlideIndex],
  );

  // Autoplay timer. Schedules a single setTimeout per active page; when
  // next() runs it bumps currentPage, which retriggers the effect with
  // a fresh timer. canGoNext gates the schedule so autoplay stops at
  // the last page.
  // The suspended flag pauses the timer while the user is hovering or
  // has focus inside the Root, per WCAG 2.2.2.
  // isAutoplayRunningRef edge-triggers onAutoplayStatusChange's
  // "autoplay.start"/"autoplay.stop" pair around a running session — the
  // effect reruns on every page change (autoplayRunning stays true, so no
  // duplicate "start"), and "autoplay" fires once per tick from inside the
  // scheduled callback, right before next() advances the page.
  const isAutoplayRunningRef = useRef(false);
  useEffect(() => {
    const eligible =
      autoplayEnabled && currentPlaying && canGoNext && !suspended;
    if (!eligible) {
      if (isAutoplayRunningRef.current) {
        isAutoplayRunningRef.current = false;
        onAutoplayStatusChange?.({
          type: "autoplay.stop",
          page: currentPage,
          isPlaying: false,
        });
      }
      return;
    }
    if (!isAutoplayRunningRef.current) {
      isAutoplayRunningRef.current = true;
      onAutoplayStatusChange?.({
        type: "autoplay.start",
        page: currentPage,
        isPlaying: true,
      });
    }
    const id = setTimeout(() => {
      onAutoplayStatusChange?.({
        type: "autoplay",
        page: currentPage,
        isPlaying: true,
      });
      next();
    }, autoplayDelay);
    return () => clearTimeout(id);
  }, [
    autoplayEnabled,
    currentPlaying,
    canGoNext,
    suspended,
    autoplayDelay,
    next,
    currentPage,
    onAutoplayStatusChange,
  ]);

  // Handlers spread onto the Root <section>. mouseEnter / mouseLeave
  // fire once at the outer boundary (they don't bubble through inner
  // hovers). onFocus / onBlur in React do bubble; relatedTarget on
  // onBlur tells us whether focus is moving to another descendant —
  // in which case we keep `focused` true.
  const onMouseEnter = useCallback(() => setHovered(true), []);
  const onMouseLeave = useCallback(() => setHovered(false), []);
  const onFocus = useCallback(() => setFocused(true), []);
  const onBlur = useCallback((event: FocusEvent<HTMLElement>) => {
    const next = event.relatedTarget;
    if (!next || !event.currentTarget.contains(next)) {
      setFocused(false);
    }
  }, []);
  const onPointerDown = useCallback((event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === "touch") setTouchActive(true);
  }, []);
  // pointerup / pointercancel always release the suspension — only
  // pointerdown is gated on pointerType, so a non-touch release is a
  // no-op anyway (touchActive was already false).
  const onPointerUp = useCallback(() => setTouchActive(false), []);
  const onPointerCancel = useCallback(() => setTouchActive(false), []);

  const rootHandlers = useMemo(
    () => ({
      onMouseEnter,
      onMouseLeave,
      onFocus,
      onBlur,
      onPointerDown,
      onPointerUp,
      onPointerCancel,
    }),
    [
      onMouseEnter,
      onMouseLeave,
      onFocus,
      onBlur,
      onPointerDown,
      onPointerUp,
      onPointerCancel,
    ],
  );

  const play = useCallback(() => {
    userInitiatedPlayRef.current = true;
    if (isPlayingControlled) {
      onPlayingChange?.(true);
    } else {
      setInternalPlaying(true);
    }
  }, [isPlayingControlled, onPlayingChange]);

  const pause = useCallback(() => {
    if (isPlayingControlled) {
      onPlayingChange?.(false);
    } else {
      setInternalPlaying(false);
    }
  }, [isPlayingControlled, onPlayingChange]);

  const togglePlaying = useCallback(() => {
    if (currentPlaying) pause();
    else play();
  }, [currentPlaying, play, pause]);

  const [refreshTick, setRefreshTick] = useState(0);
  const refresh = useCallback(() => setRefreshTick((t) => t + 1), []);

  const getProgress = useCallback(
    () => ({
      page: currentPage,
      totalPages,
      value: totalPages > 1 ? currentPage / (totalPages - 1) : 0,
    }),
    [currentPage, totalPages],
  );

  // The same offset formula `currentPageOffset` uses for the active page,
  // computed for every page — the leading slide index each page snaps to.
  // Exposed so a consumer can build a custom progress bar / indicator from
  // the raw offsets instead of re-deriving the end-align math themselves.
  const getPageSnapPoints = useCallback(
    () =>
      Array.from({ length: totalPages }, (_, page) =>
        Math.min(page * effectiveSlidesPerMove, maxOffset),
      ),
    [totalPages, effectiveSlidesPerMove, maxOffset],
  );

  // Visibility tracking is a ref (not state) because callers read on
  // demand via isInView() and the IO callback in useCarouselViewport
  // mutates many entries per tick — re-rendering on each addition
  // would be wasteful and unnecessary.
  const visibleSlideIndicesRef = useRef<Set<number>>(new Set());
  const setSlideInView = useCallback((slideIndex: number, inView: boolean) => {
    if (inView) visibleSlideIndicesRef.current.add(slideIndex);
    else visibleSlideIndicesRef.current.delete(slideIndex);
  }, []);
  const isInView = useCallback(
    (slideIndex: number) => visibleSlideIndicesRef.current.has(slideIndex),
    [],
  );

  // Same ref-not-state reasoning as visibility tracking above: isDragging()
  // is read on demand, and the Viewport hook's pointermove handler would
  // otherwise re-render on every tick of a drag for no benefit (the DOM
  // data-dragging hook already handles the visual).
  const isDraggingRef = useRef(false);
  const setDragging = useCallback((value: boolean) => {
    isDraggingRef.current = value;
  }, []);
  const isDragging = useCallback(() => isDraggingRef.current, []);

  // Same ref-not-state reasoning again: isOverscrolling() is read on
  // demand, and set/cleared from inside the Viewport hook's pointermove
  // handler on every tick of a drag-overscroll (the data-overscroll DOM
  // hook already handles the visual).
  const isOverscrollingRef = useRef(false);
  const setOverscrolling = useCallback((value: boolean) => {
    isOverscrollingRef.current = value;
  }, []);
  const isOverscrolling = useCallback(() => isOverscrollingRef.current, []);

  useImperativeHandle(
    imperativeRef,
    () => ({
      next,
      previous,
      goTo,
      scrollToIndex,
      play,
      pause,
      refresh,
      getProgress,
      isInView,
      getPageSnapPoints,
      isDragging,
      isOverscrolling,
    }),
    [
      next,
      previous,
      goTo,
      scrollToIndex,
      play,
      pause,
      refresh,
      getProgress,
      isInView,
      getPageSnapPoints,
      isDragging,
      isOverscrolling,
    ],
  );

  // Reset the user-initiated flag when the playing session ends, so a
  // subsequent external (non-trigger) flip to playing=true doesn't
  // inherit the bypass.
  useEffect(() => {
    if (!currentPlaying) {
      userInitiatedPlayRef.current = false;
    }
  }, [currentPlaying]);

  const isAutoRotating = autoplayEnabled && currentPlaying;

  const resolvedTranslations = useMemo<Required<CarouselTranslations>>(
    () => ({ ...DEFAULT_TRANSLATIONS, ...translations }),
    [translations],
  );

  const contextValue = useMemo<CarouselContextValue>(
    () => ({
      registerSlide,
      slidesRef,
      slideKeys,
      slidesPerPage: perPage,
      effectiveSlidesPerMove,
      currentPageOffset,
      pageForSlideIndex,
      totalPages,
      currentPage,
      canGoNext,
      canGoPrevious,
      next,
      previous,
      goTo,
      playing: currentPlaying,
      togglePlaying,
      autoplayEnabled,
      isAutoRotating,
      translations: resolvedTranslations,
      ids,
      transition,
      snapAlign,
      orientation,
      allowMouseDrag,
      onDragStatusChange,
      onOverscrollStatusChange,
      inViewThreshold,
      snapType,
      refreshTick,
      visibleSlideIndicesRef,
      setSlideInView,
      isProgrammaticScrollRef,
      instantScrollRef,
      isDraggingRef,
      setDragging,
      isOverscrollingRef,
      setOverscrolling,
    }),
    [
      registerSlide,
      slidesRef,
      slideKeys,
      perPage,
      effectiveSlidesPerMove,
      currentPageOffset,
      pageForSlideIndex,
      totalPages,
      currentPage,
      canGoNext,
      canGoPrevious,
      next,
      previous,
      goTo,
      currentPlaying,
      togglePlaying,
      autoplayEnabled,
      isAutoRotating,
      resolvedTranslations,
      ids,
      transition,
      snapAlign,
      orientation,
      allowMouseDrag,
      onDragStatusChange,
      onOverscrollStatusChange,
      inViewThreshold,
      snapType,
      refreshTick,
      setSlideInView,
      setDragging,
      setOverscrolling,
    ],
  );

  return { contextValue, rootHandlers };
}
