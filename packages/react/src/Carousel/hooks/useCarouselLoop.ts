import { useCallback, useEffect, useRef } from "react";

import {
  shortestStep,
  tweenValue,
  wrapShift,
} from "../loopEngine.ts";
import { useCarouselContext } from "./useCarouselContext";

// Duration of a programmatic glide (button / keyboard / indicator / autoplay).
const GLIDE_DURATION_MS = 400;

/** Live track measurement the engine paints against. */
type Geometry = {
  track: HTMLElement;
  slides: HTMLDivElement[];
  count: number;
  stride: number;
  trackLength: number;
  align: number;
};

/**
 * The infinite-loop transform engine (RFC 0018). Active only for
 * `loop="infinite"` (+ `transition="slide"`); every other mode keeps the
 * native-scroll-snap {@link useCarouselViewport}. Instead of a scroll container
 * with a clone buffer, it drives a `translate`d **track** and gives each slide a
 * `wrapShift` so copies fill the seam — seamless in both directions with no
 * native snap to fight (the thing that broke on iOS).
 *
 * This cycle covers **programmatic** navigation: whenever `currentPage` changes
 * (Prev/Next, keyboard, indicator, `goTo`, autoplay) the track glides the
 * **short way** to that page via an eased `requestAnimationFrame` tween, wrapping
 * across the ends with no rewind. Drag + fling momentum land in a later cycle.
 *
 * Geometry is read from layout (`offsetLeft`/`offsetTop`), so it's
 * transform-independent and correct under the live per-slide shifts; it is only
 * meaningful in a real browser (jsdom reports zero), so the pixel behaviour is
 * exercised in Playwright while the control flow is unit-tested with mocked
 * geometry + rAF.
 */
export function useCarouselLoop() {
  const {
    slideKeys,
    slidesRef,
    currentPage,
    orientation,
    transition,
    loop,
    snapAlign,
    refreshTick,
    instantScrollRef,
  } = useCarouselContext();

  const isInfinite = loop === "infinite" && transition === "slide";
  const vertical = orientation === "vertical";
  const trackRef = useRef<HTMLDivElement | null>(null);
  // The continuous scroll position in track space (px). At rest it sits on an
  // `index * stride` boundary; the tween animates it between boundaries.
  const offsetRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  // The first positioning is instant — a glide from slide 0 to the initial page
  // on mount would be a pointless animation on load.
  const positionedRef = useRef(false);

  const trackCallbackRef = useCallback((node: HTMLDivElement | null) => {
    trackRef.current = node;
  }, []);

  // Measure the track from live layout. Null when there's nothing to loop
  // (fewer than two slides) or the browser hasn't laid it out yet (jsdom
  // reports a zero stride). `trackRef` is non-null here: this only runs from the
  // effect below, which fires post-commit while `isInfinite` renders the track.
  const measure = useCallback((): Geometry | null => {
    const track = trackRef.current!;
    const slides = slideKeys
      .map((key) => slidesRef.current!.get(key))
      .filter((el): el is HTMLDivElement => el != null);
    const count = slides.length;
    if (count < 2) return null;
    const pos = (el: HTMLElement) => (vertical ? el.offsetTop : el.offsetLeft);
    const size = (el: HTMLElement) =>
      vertical ? el.offsetHeight : el.offsetWidth;
    const stride = pos(slides[1]!) - pos(slides[0]!);
    if (stride <= 0) return null;
    const trackLength = stride * count;
    const viewport = track.parentElement!;
    const viewportSize = vertical ? viewport.clientHeight : viewport.clientWidth;
    const slideSize = size(slides[0]!);
    // Where `offset === index * stride` should place the active slide, per its
    // snap alignment: flush to the start, centred, or flush to the end.
    const align =
      snapAlign === "center"
        ? (viewportSize - slideSize) / 2
        : snapAlign === "end"
          ? viewportSize - slideSize
          : 0;
    return { track, slides, count, stride, trackLength, align };
  }, [slideKeys, slidesRef, vertical, snapAlign]);

  // Paint the track translate + per-slide wrap for a given offset against
  // already-measured geometry (no re-measure — a glide's geometry is stable).
  const paint = useCallback(
    (offset: number, g: Geometry) => {
      const axis = vertical ? "Y" : "X";
      g.track.style.transform = `translate${axis}(${g.align - offset}px)`;
      g.slides.forEach((slide, index) => {
        const shift = wrapShift(index * g.stride, offset, g.trackLength);
        slide.style.transform = shift === 0 ? "" : `translate${axis}(${shift}px)`;
      });
    },
    [vertical],
  );

  // Animate the offset to `target`, or set it instantly (reduced motion, an
  // `instant` nav, or a zero-distance move).
  const glideTo = useCallback(
    (target: number, instant: boolean, g: Geometry) => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      const start = offsetRef.current;
      const reduce = !!window.matchMedia?.("(prefers-reduced-motion: reduce)")
        ?.matches;
      if (instant || reduce || start === target) {
        offsetRef.current = target;
        paint(target, g);
        return;
      }
      const startedAt = performance.now();
      const frame = (now: number) => {
        const elapsed = now - startedAt;
        if (elapsed >= GLIDE_DURATION_MS) {
          offsetRef.current = target;
          paint(target, g);
          frameRef.current = null;
          return;
        }
        const value = tweenValue(start, target, elapsed, GLIDE_DURATION_MS);
        offsetRef.current = value;
        paint(value, g);
        frameRef.current = requestAnimationFrame(frame);
      };
      frameRef.current = requestAnimationFrame(frame);
    },
    [paint],
  );

  // Drive the track to `currentPage` whenever it changes — the short way, so a
  // wrap glides one step instead of rewinding. `refreshTick`/`slideKeys` re-runs
  // re-home the track after a layout or slide-set change (a no-op glide when the
  // page is unchanged).
  useEffect(() => {
    if (!isInfinite) return;
    const g = measure();
    if (!g) return;
    const logical =
      (((Math.round(offsetRef.current / g.stride) % g.count) + g.count) %
        g.count);
    const step = shortestStep(logical, currentPage, g.count);
    const target = offsetRef.current + step * g.stride;
    const instant = instantScrollRef.current || !positionedRef.current;
    instantScrollRef.current = false;
    positionedRef.current = true;
    glideTo(target, instant, g);
  }, [
    isInfinite,
    currentPage,
    refreshTick,
    slideKeys,
    measure,
    glideTo,
    instantScrollRef,
  ]);

  // Stop any in-flight animation frame on unmount.
  useEffect(
    () => () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    },
    [],
  );

  return { trackRef: trackCallbackRef, isInfinite };
}
