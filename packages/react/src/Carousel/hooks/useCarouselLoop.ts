import { PointerEvent, useCallback, useEffect, useRef } from "react";

import { flingTarget, normalizeOffset, shortestStep } from "../loopEngine.ts";
import { useCarouselContext } from "./useCarouselContext";

// The programmatic glide (button / keyboard / indicator / autoplay) is a CSS
// transition on the track — GPU-composited, so it's smooth on mobile where a
// per-frame JS repaint of the slides stutters. These are the fallback timing for
// the headless package used with no registry stylesheet; the registry sheet's
// --primitiv-carousel-glide-{duration,easing} (default: the same motion tokens,
// re-pointable per --glide-* preset or by hand) override them. Ease-out gives the
// momentum feel of a page flying in and settling.
const GLIDE_DURATION = "500ms";
const GLIDE_EASE = "cubic-bezier(0, 0, 0.2, 1)";

// Build the glide's `transition` value, reading the duration/easing custom
// properties off the track (a consumer retunes them via CSS) and falling back to
// the built-in timing when they're unset. Only the infinite loop uses this — every
// other mode glides via native scroll, whose speed/easing the browser owns.
function glideTransition(track: HTMLElement): string {
  const styles = getComputedStyle(track);
  const duration =
    styles.getPropertyValue("--primitiv-carousel-glide-duration").trim() ||
    GLIDE_DURATION;
  const easing =
    styles.getPropertyValue("--primitiv-carousel-glide-easing").trim() ||
    GLIDE_EASE;
  return `transform ${duration} ${easing}`;
}
// Pointer travel (px, along the axis) before a press becomes a drag — below it
// a tap still reaches a link/button inside a slide.
const DRAG_THRESHOLD_PX = 3;
// How far a fling carries past the release point: released velocity (px/ms) ×
// this (ms) is the projected distance, then snapped to a page boundary. Larger
// = a flick travels further. Tuned for feel on device.
const FLING_DECEL_MS = 120;

/** Live track measurement the engine paints against. */
type Geometry = {
  track: HTMLElement;
  slides: HTMLDivElement[];
  count: number;
  stride: number;
  // One period: the length of the real-slide run. The clone buffers are a full
  // period each side, so the strip is periodic with this length and a re-base by
  // it shows pixel-identical content.
  trackLength: number;
  // The measured layout position of the first REAL slide (past the leading clone
  // buffer). Subtracting it places real slide 0 at `align`, so the constant
  // buffer offset — and RTL, where the buffer sits on the other side — are handled
  // by measurement rather than a hard-coded term.
  basePos: number;
  // The track's own content-box size along the axis (one viewport). The window
  // that decides which slides stay painted is measured against it.
  trackSize: number;
  align: number;
  // +1 for a left-to-right / top-to-bottom axis, −1 for RTL (where the flex row
  // reverses and slide positions run backwards). The offset and drag delta are
  // multiplied by it, so the logical engine stays direction-agnostic and only the
  // physical paint mirrors.
  dir: number;
};

/**
 * The infinite-loop transform engine (RFC 0018, clone-strip revision). Active
 * only for `loop="infinite"` (+ `transition="slide"`); every other mode keeps the
 * native-scroll-snap {@link useCarouselViewport}.
 *
 * **Why clones.** The track is a static, contiguous strip —
 * `[clones of every slide] [the real slides] [clones of every slide]` — laid out
 * as one flex row on a single compositor layer. Navigation only ever translates
 * the *whole track*; no slide ever moves relative to it. When a glide carries past
 * the last real slide onto a clone, a settle-time **re-base** shifts the track by
 * exactly one period so the identical real slide sits at the same pixels. Because
 * the strip is periodic and every slide is already-painted DOM, the re-base
 * reveals nothing unrasterised and nothing moves — structurally eliminating the
 * iOS seam flash a per-slide `wrapShift` fill could never avoid (it moved slides
 * discontinuously, which iOS can't pre-rasterise).
 *
 * **Programmatic** navigation glides the **short way** to the active page via a
 * GPU-composited transition. **Touch / mouse drag** follows the pointer 1:1
 * (transition off) and, on release, a velocity-projected fling snaps to the
 * nearest **page** boundary. Drag paints at the normalized offset so it wraps
 * within the one-period buffer no matter how far you drag.
 *
 * Geometry is read from layout (`offsetLeft`/`offsetTop`); it's only meaningful in
 * a real browser (jsdom reports zero), so the pixel behaviour is exercised in
 * Playwright while the control flow is unit-tested with mocked geometry.
 */
export function useCarouselLoop() {
  const {
    slideKeys,
    slidesRef,
    currentPageOffset,
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
  const headCloneRef = useRef<HTMLDivElement | null>(null);
  const tailCloneRef = useRef<HTMLDivElement | null>(null);
  // The scroll position in real-slide space (px): 0 = real slide 0 at `align`.
  // At rest it's a page boundary within [0, trackLength); a glide may carry it
  // outside that range onto a clone, and the settle re-base brings it back.
  const offsetRef = useRef(0);
  // Latest active-page leading index, read by the resize observer — so it can
  // re-home to the current page without re-subscribing on every navigation.
  const currentPageOffsetRef = useRef(currentPageOffset);
  currentPageOffsetRef.current = currentPageOffset;
  // The geometry the resize observer last acted on — lets it no-op a spurious
  // fire (see the observer effect below) instead of unconditionally interrupting
  // whatever the track is currently doing.
  const lastResizeGeometryRef = useRef<{
    stride: number;
    align: number;
    basePos: number;
    trackSize: number;
    dir: number;
    count: number;
  } | null>(null);
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
  const headCallbackRef = useCallback((node: HTMLDivElement | null) => {
    headCloneRef.current = node;
  }, []);
  const tailCallbackRef = useCallback((node: HTMLDivElement | null) => {
    tailCloneRef.current = node;
  }, []);

  const realSlides = useCallback(
    () =>
      slideKeys
        .map((key) => slidesRef.current!.get(key))
        .filter((el): el is HTMLDivElement => el != null),
    [slideKeys, slidesRef],
  );

  // Measure the track from live layout. Null when there's nothing to loop
  // (fewer than two slides) or the browser hasn't laid it out yet (jsdom
  // reports a zero stride).
  const measure = useCallback((): Geometry | null => {
    const track = trackRef.current!;
    const slides = realSlides();
    const count = slides.length;
    if (count < 2) return null;
    // Measure with getBoundingClientRect, not offsetLeft/Width: the latter round
    // to whole pixels, and on a multi-slide page that rounding accumulates over
    // the page's several strides into a visible edge misalignment (a slide clipped
    // at one viewport edge, a gap at the other). Every rect carries the track's
    // current transform, so positions are read as DIFFERENCES (slide − slide,
    // slide − track): the transform cancels, leaving the pure sub-pixel layout.
    const start = (r: DOMRect) => (vertical ? r.top : r.left);
    const extent = (r: DOMRect) => (vertical ? r.height : r.width);
    const trackRect = track.getBoundingClientRect();
    const r0 = slides[0]!.getBoundingClientRect();
    const r1 = slides[1]!.getBoundingClientRect();
    // Signed gap between the first two slides. RTL lays the row out backwards, so
    // it comes out negative — the sign is the axis direction, the magnitude the
    // stride. Zero means the browser hasn't laid the track out yet (jsdom): bail.
    const rawStride = start(r1) - start(r0);
    if (rawStride === 0) return null;
    const dir = rawStride < 0 ? -1 : 1;
    const stride = Math.abs(rawStride);
    const trackLength = stride * count;
    const basePos = start(r0) - start(trackRect);
    const trackSize = extent(trackRect);
    const slideSize = extent(r0);
    // Where real slide 0 should rest, per its snap alignment. The active page can
    // span several slides; `align` places the whole page. Under RTL (dir −1) the
    // reading start is the RIGHT edge, so start/end swap; centre is symmetric.
    const pageSpan = (effectiveSlidesPerMove - 1) * stride + slideSize;
    const edgeAlign =
      dir < 0
        ? snapAlign === "start"
          ? "end"
          : snapAlign === "end"
            ? "start"
            : "center"
        : snapAlign;
    const align =
      edgeAlign === "center"
        ? (trackSize - pageSpan) / 2
        : edgeAlign === "end"
          ? trackSize - pageSpan
          : 0;
    return {
      track,
      slides,
      count,
      stride,
      trackLength,
      basePos,
      trackSize,
      align,
      dir,
    };
  }, [realSlides, vertical, snapAlign, effectiveSlidesPerMove]);

  // Translate the whole track from `from` to `offset`. `animate` runs it as a
  // GPU-composited CSS transition (the smooth glide) that sweeps that range;
  // otherwise it snaps (`from` === `offset`). No per-slide transform — every
  // slide (real and clone) rides the track's single bitmap.
  const paint = useCallback(
    (offset: number, from: number, g: Geometry, animate: boolean) => {
      g.track.style.transition = animate ? glideTransition(g.track) : "none";
      // Place real slide 0 (at layout position basePos) at `align`, then carry the
      // offset. dir mirrors the offset under RTL; the block axis never mirrors. A 2D
      // translate (not translate3d) so the wide clone strip isn't force-promoted to
      // one permanent GPU layer — iOS rasterises such a layer in tiles on demand,
      // blanking slides at rest until they fill in.
      const trackShift = g.align - g.basePos - g.dir * offset;
      g.track.style.transform = vertical
        ? `translate(0px, ${trackShift}px)`
        : `translate(${trackShift}px, 0px)`;
      // Window the painted set. The strip is much wider than the screen, and iOS
      // rasterises a wide composited surface in tiles on demand — the entering
      // edge blanks for a frame. So paint only the slides on (or sweeping through,
      // or within a viewport's slack of) the viewport and `visibility: hidden` the
      // rest: a hidden slide is still laid out — measured, registered, interactive
      // once shown — but contributes nothing to rasterise, keeping the surface
      // ~one screen wide. The window covers the whole glide sweep [from, offset]
      // so an entering slide is already painted before it arrives and a leaving one
      // stays painted until it's gone.
      const margin = g.trackSize;
      const viewportHalf = g.trackSize / 2;
      const trackRect = g.track.getBoundingClientRect();
      const trackStart = vertical ? trackRect.top : trackRect.left;
      for (const el of g.track.querySelectorAll<HTMLElement>(
        "[data-carousel-slide]",
      )) {
        // Layout position within the track, transform-cancelled (same trick as
        // measure): the slide and the track carry the same live transform.
        const r = el.getBoundingClientRect();
        const p = (vertical ? r.top : r.left) - trackStart;
        const sz = vertical ? r.height : r.width;
        const edge = p + g.align - g.basePos;
        const a = edge - g.dir * from;
        const b = edge - g.dir * offset;
        const near = Math.max(a, b) + sz >= -margin;
        const far = Math.min(a, b) <= g.trackSize + margin;
        el.style.visibility = near && far ? "" : "hidden";
        // --slide-progress: the same -1..0..1 signal native scroll mode writes
        // (see useCarouselViewport's "Continuous scroll progress" effect) —
        // parallax (and any other consumer) reads this, and native mode derives
        // it from real scroll position, which never exists here (the engine
        // translates the track via transform; nothing ever scrolls). `b` is
        // already this slide's viewport-relative position at the settled
        // offset, so its center compared to the viewport's own center
        // (trackSize/2) gives the identical signal with no extra DOM reads —
        // correct for every discrete paint (instant moves, and every one of a
        // drag's many calls); an animated glide's *live* mid-transition value
        // is additionally driven by the rAF ticker below.
        const slideCenter = b + sz / 2;
        const progress =
          viewportHalf > 0
            ? Math.max(-1, Math.min(1, (slideCenter - viewportHalf) / viewportHalf))
            : 0;
        el.style.setProperty("--slide-progress", String(progress));
      }
    },
    [vertical],
  );

  // Re-read *live* (as-currently-rendered) positions and re-derive
  // --slide-progress from them — unlike paint()'s analytic version (which
  // computes the settled value from the target offset, correct for every
  // discrete call but not for what's on screen mid-transition), this reflects
  // whatever position the CSS transition has actually interpolated to at the
  // moment of the call. Mirrors useCarouselViewport's native recomputeProgress
  // (viewport-center vs. slide-center, both from getBoundingClientRect) — the
  // same signal, just derived from the track's transform instead of real
  // scroll, since nothing here ever scrolls.
  const liveSlideProgress = useCallback(
    (g: Geometry) => {
      // Structural, not defensive: the track is always rendered as the
      // viewport's direct child (Carousel.tsx) whenever isInfinite is true,
      // which is the only condition under which this ever runs.
      const viewportEl = g.track.parentElement!;
      const viewportRect = viewportEl.getBoundingClientRect();
      const viewportCenter = vertical
        ? viewportRect.top + viewportRect.height / 2
        : viewportRect.left + viewportRect.width / 2;
      const viewportHalf =
        (vertical ? viewportRect.height : viewportRect.width) / 2;
      for (const el of g.track.querySelectorAll<HTMLElement>(
        "[data-carousel-slide]",
      )) {
        const r = el.getBoundingClientRect();
        const center = vertical
          ? r.top + r.height / 2
          : r.left + r.width / 2;
        const progress =
          viewportHalf > 0
            ? Math.max(-1, Math.min(1, (center - viewportCenter) / viewportHalf))
            : 0;
        el.style.setProperty("--slide-progress", String(progress));
      }
    },
    [vertical],
  );

  // Live-read on every frame for the DURATION of an animated glide, so a
  // parallax slide's content drifts smoothly alongside the track's own CSS
  // transition instead of snapping straight to the settled value paint()
  // already set. Only animated glides need this — an instant move or a drag
  // (which calls paint() on every pointermove) is already exact and smooth
  // from the analytic value alone.
  const progressRafRef = useRef<number | null>(null);
  const stopProgressTicker = useCallback(() => {
    if (progressRafRef.current !== null) {
      cancelAnimationFrame(progressRafRef.current);
      progressRafRef.current = null;
    }
  }, []);
  const startProgressTicker = useCallback(
    (g: Geometry) => {
      stopProgressTicker();
      const tick = () => {
        liveSlideProgress(g);
        progressRafRef.current = requestAnimationFrame(tick);
      };
      progressRafRef.current = requestAnimationFrame(tick);
    },
    [stopProgressTicker, liveSlideProgress],
  );
  // Stop any in-flight ticker on unmount — otherwise it keeps firing against a
  // detached DOM forever.
  useEffect(() => stopProgressTicker, [stopProgressTicker]);

  // Bring `offsetRef` back into [0, trackLength) and repaint instantly. A period
  // is a whole clone buffer, so the shown pixels are identical — invisible.
  const rebase = useCallback(
    (g: Geometry) => {
      const normalized = normalizeOffset(offsetRef.current, g.trackLength);
      if (normalized === offsetRef.current) return;
      offsetRef.current = normalized;
      paint(normalized, normalized, g, false);
    },
    [paint],
  );

  // Re-base BEFORE a glide, not only on settle. Rapid navigation retargets the
  // transition before it ends, so `transitionend` never fires and the offset would
  // otherwise accumulate a stride per step and translate the track clean off the
  // one-period clone buffer into unpainted space (a blank until you pause). The
  // forced reflow commits the instant re-base so the animated glide starts from the
  // bounded position; the whole-period shift is invisible.
  const boundGlideStart = useCallback(
    (g: Geometry) => {
      rebase(g);
      void (vertical ? g.track.offsetHeight : g.track.offsetWidth);
    },
    [rebase, vertical],
  );

  // Move the track to `target` — animated unless this is an `instant` nav, the
  // first positioning, or the user prefers reduced motion. An animated glide runs
  // to the raw target (which may land on a clone) and re-bases on transitionend;
  // an instant move re-bases up front so it never rests on a clone.
  const glideTo = useCallback(
    (target: number, instant: boolean, g: Geometry) => {
      const reduce = !!window.matchMedia?.("(prefers-reduced-motion: reduce)")
        ?.matches;
      const animate = !instant && !reduce;
      if (animate) {
        // Sweep from where the track sits now to the target so the window covers
        // every slide the glide passes over.
        const from = offsetRef.current;
        offsetRef.current = target;
        paint(target, from, g, true);
        startProgressTicker(g);
      } else {
        offsetRef.current = normalizeOffset(target, g.trackLength);
        paint(offsetRef.current, offsetRef.current, g, false);
        stopProgressTicker();
      }
    },
    [paint, startProgressTicker, stopProgressTicker],
  );

  // Rebuild the clone buffers: a full period of aria-hidden, inert copies each
  // side makes the strip periodic so every seam is contiguous already-painted
  // DOM. Copies are presentational only — they carry no registration, index, or
  // focusable state.
  const rebuildClones = useCallback(() => {
    // The holders render with the track in infinite mode, so they're mounted
    // by the time this runs (same guarantee measure() relies on) — including
    // when called from the mutation observer below, whose own cleanup
    // (disconnect) tears down in the same synchronous effect-flush pass that
    // unmounts the holders, so there's no window where this runs with stale
    // refs.
    const head = headCloneRef.current!;
    const tail = tailCloneRef.current!;
    head.replaceChildren();
    tail.replaceChildren();
    const slides = realSlides();
    if (slides.length < 2) return;
    for (const holder of [head, tail]) {
      for (const slide of slides) {
        const clone = slide.cloneNode(true) as HTMLElement;
        clone.setAttribute("aria-hidden", "true");
        clone.setAttribute("inert", "");
        clone.setAttribute("data-carousel-clone", "");
        clone.removeAttribute("data-index");
        clone.removeAttribute("data-state");
        clone.style.transform = "";
        // Strip every id in the copied subtree: a duplicate id is invalid HTML and
        // would break `getElementById` / label associations against the real slide.
        clone.removeAttribute("id");
        for (const withId of clone.querySelectorAll("[id]"))
          withId.removeAttribute("id");
        holder.appendChild(clone);
      }
    }
  }, [realSlides]);

  // Rebuild whenever the slide *set* changes (count, order, identity).
  useEffect(() => {
    if (!isInfinite) return;
    rebuildClones();
  }, [isInfinite, slideKeys, refreshTick, rebuildClones]);

  // Also rebuild whenever a slide's own *content* changes underneath the same
  // key — e.g. a consumer swapping a slide's children (an image for a
  // gradient, text for a different caption) without touching the slide
  // count/keys. The effect above doesn't see this (its deps are all
  // structural), so a clone would otherwise keep showing stale content
  // indefinitely: crossing the seam briefly shows the stale clone before the
  // settle re-base swaps in the fresh real slide at the same pixels — a
  // flash of old content that "quickly changes" to the new one. A
  // MutationObserver on each real slide's subtree catches this regardless of
  // *what* changed; no extra coalescing needed on top of it — the browser
  // already batches every mutation from one synchronous commit into a single
  // callback invocation (unlike a native 'scroll' event, which is why
  // useCarouselViewport's own progress effect needs its own rAF batching).
  useEffect(() => {
    if (!isInfinite) return;
    const slides = realSlides();
    if (slides.length === 0) return;
    // data-state/data-index churn every navigation (the leading slide's active
    // state flips) — routine, and stripped from the clone anyway
    // (rebuildClones removes both), so reacting to them would rebuild on every
    // page change for no visible difference, including mid-glide while a
    // clone might be on screen (the exact class of flash this whole engine
    // exists to avoid). Everything else — a slide's own attributes (style, for
    // a consumer that swaps a gradient via inline style), its children, or
    // their text — genuinely can change the clone's content, so those still
    // trigger a rebuild.
    const observer = new MutationObserver((mutations) => {
      const meaningful = mutations.some(
        (m) =>
          m.type !== "attributes" ||
          (m.attributeName !== "data-state" && m.attributeName !== "data-index"),
      );
      if (meaningful) rebuildClones();
    });
    for (const slide of slides) {
      observer.observe(slide, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      });
    }
    return () => observer.disconnect();
  }, [isInfinite, slideKeys, refreshTick, realSlides, rebuildClones]);

  // Re-base once a glide settles. jsdom runs no transitions, so this fires only in
  // a real browser (tests dispatch a synthetic transitionend); it's idempotent, so
  // an interrupted or spurious event is safe.
  useEffect(() => {
    if (!isInfinite) return;
    // Mounted with the track in infinite mode (as measure() assumes).
    const track = trackRef.current!;
    const onEnd = (event: TransitionEvent) => {
      if (event.propertyName !== "transform") return;
      // The glide is over — stop live-reading every frame (rebase's own
      // paint(), if it runs, already set the settled analytic value).
      stopProgressTicker();
      const g = measure();
      if (g) rebase(g);
    };
    track.addEventListener("transitionend", onEnd);
    return () => track.removeEventListener("transitionend", onEnd);
  }, [isInfinite, measure, rebase, stopProgressTicker]);

  // Drive the track to the active page whenever it changes — the short way, so a
  // wrap glides one step onto the adjacent (clone) slide. Targets the page's
  // **leading slide index** (`currentPageOffset`): for multi-slide a page move
  // glides a whole page of strides. `refreshTick`/`slideKeys` re-home the track
  // after a layout or slide-set change.
  useEffect(() => {
    if (!isInfinite) return;
    const g = measure();
    if (!g) return;
    // Keep the resize observer's baseline current, so even its guaranteed first
    // fire (browsers report an element's size once right after `.observe()`, with
    // no real change) has a snapshot to compare against and correctly no-ops
    // instead of interrupting this navigation (see the observer effect below).
    lastResizeGeometryRef.current = {
      stride: g.stride,
      align: g.align,
      basePos: g.basePos,
      trackSize: g.trackSize,
      dir: g.dir,
      count: g.count,
    };
    // Bound the offset first so rapid, transition-interrupting navigation can't
    // accumulate it off the clone buffer.
    boundGlideStart(g);
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
    boundGlideStart,
    instantScrollRef,
  ]);

  // Re-measure on any layout / size change. The native-scroll viewport has its own
  // ResizeObservers; the transform engine needs one too, or it keeps stale geometry
  // whenever the container resizes or a size-affecting knob changes with no React
  // signal the engine can see (peek, ratio, density, a multi-slide gap — all
  // registry CSS) — leaving the track misaligned, or the paint window hiding the
  // wrong slides, until the next navigation. Observing the track catches container /
  // peek changes; observing a slide catches ratio / density / multi-slide-gap
  // changes (which resize the slide but not the 100%-wide track). Re-home to the
  // current page instantly, which also re-runs the paint window against the fresh
  // geometry — this is what recovers slides a first, pre-layout measure mis-hid.
  useEffect(() => {
    if (!isInfinite) return;
    const track = trackRef.current!;
    const rehome = () => {
      const g = measure();
      if (!g) return;
      // The browser fires a ResizeObserver callback once automatically right
      // after `.observe()`, even when nothing has actually resized (it reports
      // the initial size — real behaviour our test double doesn't replicate, so
      // this only surfaces on a device). An unconditional rehome would then
      // unconditionally interrupt whatever the track is doing: mid-glide, it'd
      // kill the CSS transition, snap straight to the rest position, and collapse
      // the paint window to a single point instead of the swept range — hiding
      // the slide still mid-transition (the "current slide vanishes on Prev"
      // report). Skip when the measured geometry hasn't actually changed; a
      // *genuine* resize (a real one always changes at least one of these) still
      // rehomes as before.
      const last = lastResizeGeometryRef.current;
      if (
        last &&
        last.stride === g.stride &&
        last.align === g.align &&
        last.basePos === g.basePos &&
        last.trackSize === g.trackSize &&
        last.dir === g.dir &&
        last.count === g.count
      ) {
        return;
      }
      lastResizeGeometryRef.current = {
        stride: g.stride,
        align: g.align,
        basePos: g.basePos,
        trackSize: g.trackSize,
        dir: g.dir,
        count: g.count,
      };
      offsetRef.current = normalizeOffset(
        currentPageOffsetRef.current * g.stride,
        g.trackLength,
      );
      paint(offsetRef.current, offsetRef.current, g, false);
    };
    const observer = new ResizeObserver(rehome);
    // The track catches container / peek changes; the slides catch ratio /
    // density / multi-slide-gap changes (which resize a slide but not the
    // 100%-wide track). One observer, many targets.
    observer.observe(track);
    for (const slide of realSlides()) observer.observe(slide);
    return () => observer.disconnect();
  }, [isInfinite, measure, paint, realSlides]);

  const axisClient = useCallback(
    (event: PointerEvent) => (vertical ? event.clientY : event.clientX),
    [vertical],
  );

  // Start a drag (these handlers are only wired for infinite — see dragHandlers).
  // Touch drag is always on (there's no native scroll to fall back to); mouse
  // drag stays opt-in via allowMouseDrag. Bails when there's nothing to loop.
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

  // Follow the pointer 1:1 (offset moves opposite the finger), tracking velocity
  // for the release fling. The painted offset is normalized so the track wraps
  // within the one-period buffer however far the drag runs — invisibly, since a
  // period shows identical content. Crossing the threshold captures the pointer
  // and marks it a drag so the synthesised click is suppressed.
  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;
      const client = axisClient(event);
      const g = drag.geometry;
      const elapsed = event.timeStamp - drag.lastTime;
      if (elapsed > 0) {
        drag.velocity = (-g.dir * (client - drag.lastClient)) / elapsed;
      }
      drag.lastClient = client;
      drag.lastTime = event.timeStamp;
      if (
        !drag.dragging &&
        Math.abs(client - drag.startClient) > DRAG_THRESHOLD_PX
      ) {
        drag.dragging = true;
        event.currentTarget.setPointerCapture?.(drag.pointerId);
        // A drag starting mid-glide takes over from here — every subsequent
        // pointermove already repaints the analytic value, so a still-running
        // ticker from that interrupted glide would just be redundant work.
        stopProgressTicker();
      }
      if (!drag.dragging) return;
      const raw = drag.startOffset - g.dir * (client - drag.startClient);
      offsetRef.current = normalizeOffset(raw, g.trackLength);
      paint(offsetRef.current, offsetRef.current, g, false);
    },
    [axisClient, paint, stopProgressTicker],
  );

  // Release: project the fling to a page boundary, glide there, and sync the
  // active page to where it lands (which the page effect then sees as a no-op).
  const onPointerUp = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;
      dragRef.current = null;
      if (!drag.dragging) return;
      const g = drag.geometry;
      // Snap to PAGE boundaries: a page advances `effectiveSlidesPerMove` slides.
      // For a single-slide page this is just `g.stride`.
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

  return {
    trackRef: trackCallbackRef,
    headCloneRef: headCallbackRef,
    tailCloneRef: tailCallbackRef,
    isInfinite,
    dragHandlers,
  };
}
