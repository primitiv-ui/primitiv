import { Ref, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";

import {
  CAROUSEL_AUTOPLAY_DELAY_MS,
  CAROUSEL_LABELS,
  carouselBounds,
  carouselClampPage,
  carouselLayout,
  carouselLoopMode,
  carouselPageOffset,
} from "@primitiv-ui/core";
import { CarouselController, type CarouselControllerState } from "@primitiv-ui/web";

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

function resolveAutoplay(autoplay: CarouselAutoplay | undefined): {
  enabled: boolean;
  delay: number;
} {
  if (autoplay === true) return { enabled: true, delay: CAROUSEL_AUTOPLAY_DELAY_MS };
  if (autoplay && typeof autoplay === "object") return { enabled: true, delay: autoplay.delay };
  return { enabled: false, delay: CAROUSEL_AUTOPLAY_DELAY_MS };
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
  /** Wrap navigation around the ends instead of clamping — `boolean` for
   * ergonomics (`true` = `"wrap"`) or a named mode. Defaults to `false`. */
  loop?: boolean | "wrap" | "infinite";
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

/** What the hosted controller reads through `latest()`: the render's state and callbacks. */
type Snapshot = {
  state: CarouselControllerState;
  slideKeys: string[];
  isControlled: boolean;
  isPlayingControlled: boolean;
  onPageChange?: (page: number) => void;
  onPlayingChange?: (playing: boolean) => void;
  onAutoplayStatusChange?: (status: CarouselAutoplayStatus) => void;
  onDragStatusChange?: (status: CarouselDragStatus) => void;
  onOverscrollStatusChange?: (status: CarouselOverscrollStatus) => void;
};

/**
 * Owns the Root-side state for a Carousel — the slide registration, the
 * active page and the playing flag, each controlled or uncontrolled — and
 * hosts the shared `CarouselController` (`@primitiv-ui/web`, RFC 0033 D30),
 * the same behaviour `<primitiv-carousel>` runs: scrolling the viewport to the
 * page and following the user's swipes back, the keys, wheel and mouse drag,
 * the progress signals, autoplay and its hover / focus / touch pause, and the
 * infinite loop's transform engine. React keeps the state and answers the
 * controller; every change goes through `onPageChange` / `onPlayingChange`.
 *
 * Slide keys are `useState`, so registration re-renders every slide's
 * `data-index` / `data-total` / `data-state` and the triggers' `disabled`.
 * In controlled mode an out-of-range `page` throws once slides exist; in
 * uncontrolled mode it is clamped, since the page can briefly outlive the
 * page count while slides re-register one by one.
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
    snapAlign = "center",
    orientation = "horizontal",
    loop = false,
    allowMouseDrag = false,
    onDragStatusChange,
    onOverscrollStatusChange,
    inViewThreshold = 0.6,
    snapType = "mandatory",
  }: UseCarouselRootProps = {},
  imperativeRef?: Ref<CarouselImperativeApi>,
) {
  const { enabled: autoplayEnabled, delay: autoplayDelay } = resolveAutoplay(autoplay);
  const slidesRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const [slideKeys, setSlideKeys] = useState<string[]>([]);
  const [internalPage, setInternalPage] = useState(defaultPage);
  const isControlled = page !== undefined;
  const rawPage = isControlled ? (page as number) : internalPage;
  const loopMode = carouselLoopMode(loop);
  const layout = carouselLayout(slideKeys.length, slidesPerPage, slidesPerMove);
  const { totalPages } = layout;

  // In controlled mode an out-of-range page prop is a consumer error —
  // throw loudly so it surfaces during development rather than shipping
  // as a silent no-op carousel.
  if (isControlled && totalPages > 0 && (rawPage < 0 || rawPage >= totalPages)) {
    throw new Error(`Carousel: page index ${rawPage} is out of range (totalPages: ${totalPages})`);
  }
  const currentPage = isControlled ? rawPage : carouselClampPage(rawPage, totalPages);
  const currentPageOffset = carouselPageOffset(layout, currentPage);
  const { previous: canGoPrevious, next: canGoNext } = carouselBounds({
    page: currentPage,
    totalPages,
    loop: loopMode,
  });

  const [internalPlaying, setInternalPlaying] = useState(defaultPlaying);
  const isPlayingControlled = playing !== undefined;
  const currentPlaying = isPlayingControlled ? playing : internalPlaying;

  const registerSlide = useCallback((key: string, element: HTMLDivElement | null) => {
    if (element) {
      slidesRef.current.set(key, element);
    } else {
      slidesRef.current.delete(key);
    }
    setSlideKeys(Array.from(slidesRef.current.keys()));
  }, []);

  const rootRef = useRef<HTMLElement | null>(null);
  const viewportElementRef = useRef<HTMLDivElement | null>(null);
  const trackElementRef = useRef<HTMLDivElement | null>(null);
  const headClonesElementRef = useRef<HTMLDivElement | null>(null);
  const tailClonesElementRef = useRef<HTMLDivElement | null>(null);
  const rootElementRef = useCallback((element: HTMLElement | null) => {
    rootRef.current = element;
  }, []);
  const viewportRef = useCallback((element: HTMLDivElement | null) => {
    viewportElementRef.current = element;
  }, []);
  const trackRef = useCallback((element: HTMLDivElement | null) => {
    trackElementRef.current = element;
  }, []);
  const headClonesRef = useCallback((element: HTMLDivElement | null) => {
    headClonesElementRef.current = element;
  }, []);
  const tailClonesRef = useCallback((element: HTMLDivElement | null) => {
    tailClonesElementRef.current = element;
  }, []);

  const latest = useRef<Snapshot>(null as unknown as Snapshot);
  latest.current = {
    state: {
      page: currentPage,
      playing: currentPlaying,
      autoplay: autoplayEnabled,
      autoplayDelay,
      slidesPerPage,
      slidesPerMove,
      transition,
      snapAlign,
      orientation,
      loop: loopMode,
      allowMouseDrag,
      inViewThreshold,
    },
    slideKeys,
    isControlled,
    isPlayingControlled,
    onPageChange,
    onPlayingChange,
    onAutoplayStatusChange,
    onDragStatusChange,
    onOverscrollStatusChange,
  };

  // Built once, on the first render, so the imperative API and the triggers
  // can reach it before the first effect; it listens only while mounted.
  const controllerRef = useRef<CarouselController | null>(null);
  controllerRef.current ??= new CarouselController({
    state: () => latest.current.state,
    root: () => rootRef.current as HTMLElement,
    viewport: () => viewportElementRef.current,
    track: () => trackElementRef.current,
    slides: () =>
      latest.current.slideKeys
        .map((key) => slidesRef.current.get(key))
        .filter((element): element is HTMLDivElement => element !== undefined),
    placeClones: (head, tail) => {
      headClonesElementRef.current?.replaceChildren(...head);
      tailClonesElementRef.current?.replaceChildren(...tail);
    },
    changePage: (target) => {
      if (latest.current.isControlled) latest.current.onPageChange?.(target);
      else setInternalPage(target);
    },
    changePlaying: (next) => {
      if (latest.current.isPlayingControlled) latest.current.onPlayingChange?.(next);
      else setInternalPlaying(next);
    },
    autoplayStatus: (status) => latest.current.onAutoplayStatusChange?.(status),
    dragStatus: (status) => latest.current.onDragStatusChange?.(status),
    overscrollStatus: (status) => latest.current.onOverscrollStatusChange?.(status),
  });
  const controller = controllerRef.current;

  useEffect(() => {
    controller.connect();
    return () => controller.disconnect();
  }, [controller]);
  // After every render, bring the behaviour in line with it; each part of the
  // controller reruns only when what it depends on has changed.
  useEffect(() => controller.sync());

  const next = useCallback((instant?: boolean) => controller.next(instant), [controller]);
  const previous = useCallback((instant?: boolean) => controller.previous(instant), [controller]);
  const goTo = useCallback((target: number, instant?: boolean) => controller.goTo(target, instant), [controller]);
  const togglePlaying = useCallback(() => controller.togglePlaying(), [controller]);

  useImperativeHandle(
    imperativeRef,
    () => ({
      next,
      previous,
      goTo,
      scrollToIndex: (slideIndex, instant) => controller.scrollToIndex(slideIndex, instant),
      play: () => controller.play(),
      pause: () => controller.pause(),
      refresh: () => controller.refresh(),
      getProgress: () => controller.getProgress(),
      isInView: (slideIndex) => controller.isInView(slideIndex),
      getPageSnapPoints: () => controller.getPageSnapPoints(),
      isDragging: () => controller.isDragging(),
      isOverscrolling: () => controller.isOverscrolling(),
      getScrollProgress: () => controller.getScrollProgress(),
      getSlideProgress: (slideIndex) => controller.getSlideProgress(slideIndex),
    }),
    [controller, next, previous, goTo],
  );

  const isAutoRotating = autoplayEnabled && currentPlaying;

  const resolvedTranslations = useMemo<Required<CarouselTranslations>>(
    () => ({ ...CAROUSEL_LABELS, ...translations }),
    [translations],
  );

  const contextValue = useMemo<CarouselContextValue>(
    () => ({
      registerSlide,
      slideKeys,
      slidesPerPage: layout.perPage,
      effectiveSlidesPerMove: layout.move,
      maxOffset: layout.maxOffset,
      currentPageOffset,
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
      loop: loopMode,
      allowMouseDrag,
      inViewThreshold,
      snapType,
      viewportRef,
      trackRef,
      headClonesRef,
      tailClonesRef,
    }),
    [
      registerSlide,
      slideKeys,
      layout.perPage,
      layout.move,
      layout.maxOffset,
      currentPageOffset,
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
      loopMode,
      allowMouseDrag,
      inViewThreshold,
      snapType,
      viewportRef,
      trackRef,
      headClonesRef,
      tailClonesRef,
    ],
  );

  return { contextValue, rootRef: rootElementRef };
}
