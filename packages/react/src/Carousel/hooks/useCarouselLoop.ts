import { PointerEvent, useCallback, useEffect, useRef } from "react";

import { flingTarget, shortestStep, wrapShift } from "../loopEngine.ts";
import { useCarouselContext } from "./useCarouselContext";

// The programmatic glide (button / keyboard / indicator / autoplay) is a CSS
// transition on the track — GPU-composited, so it's smooth on mobile where a
// per-frame JS repaint of the slides stutters. Ease-out gives the momentum feel.
const GLIDE_DURATION_MS = 400;
const GLIDE_EASE = "cubic-bezier(0.33, 1, 0.68, 1)";
// Pointer travel (px, along the axis) before a press becomes a drag — below it
// a tap still reaches a link/button inside a slide.
const DRAG_THRESHOLD_PX = 3;
// How far a fling carries past the release point: released velocity (px/ms) ×
// this (ms) is the projected distance, then snapped to the nearest slide. Larger
// = a flick travels further. Tuned for feel on device.
const FLING_DECEL_MS = 120;

/** Live track measurement the engine paints against. */
type Geometry = {
  track: HTMLElement;
  slides: HTMLDivElement[];
  count: number;
  stride: number;
  trackLength: number;
  align: number;
  // +1 for a left-to-right / top-to-bottom axis, −1 for RTL (where the flex row
  // reverses and slide positions run backwards). Every inline translate, seam
  // shift and drag delta is multiplied by it, so the logical engine stays
  // direction-agnostic and only the physical paint mirrors.
  dir: number;
};

/**
 * The infinite-loop transform engine (RFC 0018). Active only for
 * `loop="infinite"` (+ `transition="slide"`); every other mode keeps the
 * native-scroll-snap {@link useCarouselViewport}. Instead of a scroll container
 * with a clone buffer, it drives a `translate`d **track** and gives each slide a
 * `wrapShift` so copies fill the seam — seamless in both directions with no
 * native snap to fight (the thing that broke on iOS).
 *
 * **Programmatic** navigation — whenever `currentPage` changes (Prev/Next,
 * keyboard, indicator, `goTo`, autoplay) the track glides the **short way** to
 * that page via a GPU-composited CSS transition, wrapping across the ends with no
 * rewind. **Touch / mouse drag** — the track follows the pointer 1:1 (transition
 * off), and on release a velocity-projected fling snaps to the nearest **page**
 * boundary with the same glide, updating `currentPage` from where it lands. (For a
 * multi-slide page the snap is a whole page, so a fling can't settle mid-page and
 * get jerked to the page lead.)
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
    currentPageOffset,
    slidesPerPage,
    effectiveSlidesPerMove,
    orientation,
    transition,
    loop,
    snapAlign,
    refreshTick,
    instantScrollRef,
    goTo,
    pageForSlideIndex,
    allowMouseDrag,
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
  // Live drag state: null when not dragging.
  const dragRef = useRef<{
    pointerId: number;
    startClient: number;
    startOffset: number;
    lastClient: number;
    lastTime: number;
    velocity: number;
    dragging: boolean;
    geometry: Geometry;
  } | null>(null);

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
    // Signed gap between the first two slides. RTL lays the row out backwards, so
    // it comes out negative — the sign is the axis direction, the magnitude the
    // stride. Zero means the browser hasn't laid the track out yet (jsdom): bail.
    const rawStride = pos(slides[1]!) - pos(slides[0]!);
    if (rawStride === 0) return null;
    const dir = rawStride < 0 ? -1 : 1;
    const stride = Math.abs(rawStride);
    const trackLength = stride * count;
    // Align against the TRACK's own content box, not the viewport's clientWidth.
    // Under peek / viewport padding the track is inset and narrowed, and the CSS
    // already centres it in the viewport (symmetric padding); measuring the track
    // keeps the padding out of the maths so it isn't double-counted.
    const trackSize = vertical ? track.clientHeight : track.clientWidth;
    const slideSize = size(slides[0]!);
    // The active *page* spans slidesPerPage slides (+ the gaps between them):
    // from the leading slide's edge to the last member's far edge. Centre/anchor
    // the whole page, so a multi-slide page fills the track instead of one slide
    // being centred with the rest overflowing.
    const pageSpan = (slidesPerPage - 1) * stride + slideSize;
    // Where `offset === index * stride` should place the active page, per its
    // snap alignment: flush to the start, centred, or flush to the end.
    const align =
      snapAlign === "center"
        ? (trackSize - pageSpan) / 2
        : snapAlign === "end"
          ? trackSize - pageSpan
          : 0;
    return { track, slides, count, stride, trackLength, align, dir };
  }, [slideKeys, slidesRef, vertical, snapAlign, slidesPerPage]);

  // Position the track at `offset` against already-measured geometry. `animate`
  // drives the move as a GPU-composited CSS transition on the track (the smooth
  // glide); the per-slide wrap shifts are set instantly (never transitioned —
  // they only ever change while a slide is off-screen at the seam, so a copy
  // repositions invisibly). A 3D translate keeps the track on its own compositor
  // layer.
  const paint = useCallback(
    (offset: number, g: Geometry, animate: boolean) => {
      // The track is the one intentional compositor layer (translate3d + the
      // sheet's backface-visibility): the glide animates its transform on the GPU.
      g.track.style.transition = animate
        ? `transform ${GLIDE_DURATION_MS}ms ${GLIDE_EASE}`
        : "none";
      // The physical inline translate mirrors under RTL (dir = −1); the block axis
      // never mirrors, so vertical keeps dir = +1. The transform is relative to the
      // track's natural (already peek-inset) layout position, so no inset term.
      const trackShift = g.align - g.dir * offset;
      g.track.style.transform = vertical
        ? `translate3d(0px, ${trackShift}px, 0px)`
        : `translate3d(${trackShift}px, 0px, 0px)`;
      g.slides.forEach((slide, index) => {
        // The seam shift is computed in logical (positive-stride) space, then
        // mirrored to the physical axis by dir.
        const shift = g.dir * wrapShift(index * g.stride, offset, g.trackLength);
        // A slide is shifted only when it wraps to fill the seam, and with a *2D*
        // translate so it paints INTO the track's layer rather than onto its own.
        // An off-screen per-slide layer is exactly what iOS Safari leaves
        // unrasterised — a white tile for the first frame it glides into view (the
        // entering-slide flash). Interior slides carry no transform at all, so they
        // ride the track's already-painted bitmap and are there before they enter.
        slide.style.transform =
          shift === 0
            ? ""
            : vertical
              ? `translateY(${shift}px)`
              : `translateX(${shift}px)`;
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

  // Drive the track to the active page whenever it changes — the short way, so a
  // wrap glides one step instead of rewinding. Targets the page's **leading slide
  // index** (`currentPageOffset`), not the page number: for multi-slide they
  // differ (page 1 of a 2-up leads at slide 2), so a page move glides a whole page
  // of strides. `refreshTick`/`slideKeys` re-runs re-home the track after a layout
  // or slide-set change (a no-op glide when the page is unchanged).
  useEffect(() => {
    if (!isInfinite) return;
    const g = measure();
    if (!g) return;
    const logical =
      (((Math.round(offsetRef.current / g.stride) % g.count) + g.count) %
        g.count);
    const step = shortestStep(logical, currentPageOffset, g.count);
    const target = offsetRef.current + step * g.stride;
    const instant = instantScrollRef.current || !positionedRef.current;
    instantScrollRef.current = false;
    positionedRef.current = true;
    glideTo(target, instant, g);
  }, [
    isInfinite,
    currentPageOffset,
    refreshTick,
    slideKeys,
    measure,
    glideTo,
    instantScrollRef,
  ]);

  const axisClient = useCallback(
    (event: PointerEvent) => (vertical ? event.clientY : event.clientX),
    [vertical],
  );

  // Start a drag (these handlers are only wired for infinite — see dragHandlers).
  // Touch drag is always on (there's no native scroll to fall back to); mouse
  // drag stays opt-in via allowMouseDrag, like the scroll modes. Bails when
  // there's nothing to loop.
  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "mouse" && !allowMouseDrag) return;
      const geometry = measure();
      if (!geometry) return;
      const client = axisClient(event);
      dragRef.current = {
        pointerId: event.pointerId,
        startClient: client,
        startOffset: offsetRef.current,
        lastClient: client,
        lastTime: event.timeStamp,
        velocity: 0,
        dragging: false,
        geometry,
      };
    },
    [allowMouseDrag, measure, axisClient],
  );

  // Follow the pointer 1:1 (offset moves opposite the finger) with the transition
  // off, tracking velocity for the release fling. Crossing the threshold captures
  // the pointer so the gesture survives leaving the element, and marks it a drag
  // so the synthesised click is suppressed.
  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;
      const client = axisClient(event);
      const dir = drag.geometry.dir;
      const elapsed = event.timeStamp - drag.lastTime;
      if (elapsed > 0) {
        // Logical-offset velocity: the physical finger delta mirrored by dir, so a
        // fling projects the right way under RTL.
        drag.velocity = (-dir * (client - drag.lastClient)) / elapsed;
      }
      drag.lastClient = client;
      drag.lastTime = event.timeStamp;
      if (!drag.dragging && Math.abs(client - drag.startClient) > DRAG_THRESHOLD_PX) {
        drag.dragging = true;
        event.currentTarget.setPointerCapture?.(drag.pointerId);
      }
      if (!drag.dragging) return;
      // Offset follows the finger 1:1 in logical space (physical delta × dir).
      offsetRef.current = drag.startOffset - dir * (client - drag.startClient);
      paint(offsetRef.current, drag.geometry, false);
    },
    [axisClient, paint],
  );

  // Release: project the fling to a resting offset, glide there, and sync the
  // active page to where it lands (which the page effect then sees as a no-op).
  const onPointerUp = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;
      dragRef.current = null;
      if (!drag.dragging) return;
      const g = drag.geometry;
      // Snap to PAGE boundaries, not slide boundaries: a page advances
      // `effectiveSlidesPerMove` slides, so its stride is that many. For a
      // single-slide page this is just `g.stride`. Snapping to the slide instead
      // lets a multi-slide fling settle mid-page, then the page effect jerks it to
      // the page lead — the two-step this avoids.
      const pageStride = g.stride * effectiveSlidesPerMove;
      const target = flingTarget(
        offsetRef.current,
        drag.velocity,
        FLING_DECEL_MS,
        pageStride,
      );
      glideTo(target, false, g);
      const index =
        (((Math.round(target / g.stride) % g.count) + g.count) % g.count);
      goTo(pageForSlideIndex(index));
    },
    [glideTo, goTo, pageForSlideIndex, effectiveSlidesPerMove],
  );

  const dragHandlers = isInfinite
    ? {
        onPointerDown,
        onPointerMove,
        onPointerUp,
        onPointerCancel: onPointerUp,
      }
    : null;

  return { trackRef: trackCallbackRef, isInfinite, dragHandlers };
}
