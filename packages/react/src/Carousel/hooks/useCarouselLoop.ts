import { useCallback, useEffect, useRef } from "react";

import { shortestStep, wrapShift } from "../loopEngine.ts";
import { useCarouselContext } from "./useCarouselContext";

// The programmatic glide (button / keyboard / indicator / autoplay) is a CSS
// transition on the track — GPU-composited, so it's smooth on mobile where a
// per-frame JS repaint of the slides stutters. Ease-out gives the momentum feel.
const GLIDE_DURATION_MS = 400;
const GLIDE_EASE = "cubic-bezier(0.33, 1, 0.68, 1)";

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
 * **short way** to that page via a GPU-composited CSS transition, wrapping across
 * the ends with no rewind. Drag + fling momentum land in a later cycle.
 *
 * Geometry is read from layout (`offsetLeft`/`offsetTop`), so it's
 * transform-independent and correct under the live per-slide shifts; it is only
 * meaningful in a real browser (jsdom reports zero), so the pixel behaviour is
 * exercised in Playwright while the control flow is unit-tested with mocked
 * geometry.
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
  // The scroll position in track space (px) — an `index * stride` boundary at
  // rest; the CSS transition animates the track between boundaries.
  const offsetRef = useRef(0);
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

  // Position the track at `offset` against already-measured geometry. `animate`
  // drives the move as a GPU-composited CSS transition on the track (the smooth
  // glide); the per-slide wrap shifts are set instantly (never transitioned —
  // they only ever change while a slide is off-screen at the seam, so a copy
  // repositions invisibly). A 3D translate keeps the track on its own compositor
  // layer.
  const paint = useCallback(
    (offset: number, g: Geometry, animate: boolean) => {
      const translate = (value: number) =>
        vertical
          ? `translate3d(0px, ${value}px, 0px)`
          : `translate3d(${value}px, 0px, 0px)`;
      g.track.style.transition = animate
        ? `transform ${GLIDE_DURATION_MS}ms ${GLIDE_EASE}`
        : "none";
      g.track.style.transform = translate(g.align - offset);
      g.slides.forEach((slide, index) => {
        const shift = wrapShift(index * g.stride, offset, g.trackLength);
        slide.style.transform = shift === 0 ? "" : translate(shift);
      });
    },
    [vertical],
  );

  // Move the track to `target` — animated unless this is an `instant` nav, the
  // first positioning, or the user prefers reduced motion.
  const glideTo = useCallback(
    (target: number, instant: boolean, g: Geometry) => {
      const reduce = !!window.matchMedia?.("(prefers-reduced-motion: reduce)")
        ?.matches;
      offsetRef.current = target;
      paint(target, g, !instant && !reduce);
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

  return { trackRef: trackCallbackRef, isInfinite };
}
