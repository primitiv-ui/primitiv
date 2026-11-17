import {
  CAROUSEL_DRAG_THRESHOLD_PX,
  CAROUSEL_FLING_DECEL_MS,
  carouselFlingTarget,
  carouselLoopAlign,
  carouselLoopIndex,
  carouselLoopPainted,
  carouselNormalizeOffset,
  carouselPageForSlide,
  carouselPageOffset,
  carouselShortestStep,
  carouselSlideProgress,
  type CarouselLayout,
} from "@primitiv-ui/core";

import type { CarouselControllerHost, CarouselControllerState } from "./CarouselController.ts";
import { changed, type Key } from "./key.ts";

/**
 * The glide's fallback timing, for a headless carousel with no stylesheet; the
 * registry's `--primitiv-carousel-glide-duration` / `-easing` override them.
 */
// Stryker disable StringLiteral: static — evaluated once at import, so runtime mutant switching never reaches them; the glide tests pin both.
const GLIDE_DURATION = "500ms";
const GLIDE_EASE = "cubic-bezier(0, 0, 0.2, 1)";
// Stryker restore StringLiteral

/** What the engine borrows from the controller that hosts it. */
export type CarouselLoopContext = {
  host: CarouselControllerHost;
  /** Take the one-shot "skip the animation" flag a navigation left. */
  consumeInstant(): boolean;
  /** Take the one-shot "absolute jump, not a step" flag a navigation left. */
  consumeDirectJump(): boolean;
  goTo(page: number): void;
};

/** Live track measurement the engine paints against. */
type Geometry = {
  track: HTMLElement;
  count: number;
  /** One slide plus the gap after it. */
  stride: number;
  /** One period: the length of the real-slide run. */
  trackLength: number;
  /** Where the first real slide sits in the track, past the leading copies. */
  basePos: number;
  /** One viewport along the axis. */
  trackSize: number;
  /** Where real slide 0 rests, per its snap alignment. */
  align: number;
  /** +1 for a forward axis, −1 for RTL, where the row runs backwards. */
  dir: number;
};

/** A touch or mouse drag of the track. */
type LoopDrag = {
  pointerId: number;
  startClient: number;
  startOffset: number;
  lastClient: number;
  lastTime: number;
  velocity: number;
  dragging: boolean;
  geometry: Geometry;
};

/** The engine's own style writes on a slide, which must not read as the consumer changing it. */
function withoutEngineProps(css: string | null): string {
  return (css ?? "")
    .split(";")
    .map((declaration) => declaration.trim())
    .filter((declaration) => declaration && !declaration.startsWith("visibility:") && !declaration.startsWith("--slide-progress:"))
    .sort()
    .join();
}

/**
 * Whether a mutation inside a real slide changes what its copy should show.
 * `data-state` / `data-index` churn on every navigation and are stripped from
 * the copies anyway; a `style` change counts only beyond the engine's own writes.
 */
function meaningful(mutation: MutationRecord): boolean {
  // A child or text change has no attribute name, so it falls through to "meaningful".
  const name = mutation.attributeName;
  if (name === "data-state" || name === "data-index") return false;
  if (name !== "style") return true;
  return withoutEngineProps(mutation.oldValue) !== withoutEngineProps((mutation.target as Element).getAttribute("style"));
}

/**
 * The infinite-loop transform engine (RFC 0018, clone-strip revision), active
 * for `loop="infinite"` with the slide transition. The track is a static,
 * contiguous strip — a full period of aria-hidden, inert copies of every slide,
 * the real slides, and another period of copies — and navigation only ever
 * translates the whole track. A glide past the last real slide lands on a copy,
 * and a settle-time re-base shifts the track by exactly one period so the
 * identical real slide sits at the same pixels: nothing moves and nothing
 * unpainted is revealed. Programmatic moves glide the short way as a CSS
 * transition; a drag follows the pointer and a release flings to a page.
 *
 * Geometry comes from layout, which only a real browser has; jsdom reports zero
 * and the engine stands down.
 */
export class CarouselLoopEngine {
  readonly #context: CarouselLoopContext;
  #state: CarouselControllerState | null = null;
  // Stryker disable next-line ArrayDeclaration: equivalent — every sync sets it before anything reads it.
  #slides: readonly HTMLElement[] = [];
  #layout: CarouselLayout | null = null;
  #track: HTMLElement | null = null;
  #trackConnection: AbortController | null = null;
  /** The offset in real-slide space: 0 is real slide 0 at `align`. */
  #offset = 0;
  #positioned = false;
  /** A fling's release already drove the glide, so the sync its page change brings must not re-glide. */
  #dragHandled = false;
  #lastGeometry: Key = null;
  #clonesKey: Key = null;
  #positionKey: Key = null;
  #resizeKey: Key = null;
  #content: MutationObserver | null = null;
  #resize: ResizeObserver | null = null;
  #progressFrame: number | null = null;
  #dragFrame: number | null = null;
  #dragPaintFrom = 0;
  #drag: LoopDrag | null = null;

  constructor(context: CarouselLoopContext) {
    this.#context = context;
  }

  /** Whether the engine owns the viewport's pointer: an infinite loop over a slide transition, with a track to drive. */
  get active(): boolean {
    return this.#track !== null;
  }

  /** Bring the engine in line with the controller's state; each part reruns only when its key changes. */
  sync(state: CarouselControllerState, slides: readonly HTMLElement[], layout: CarouselLayout, refreshes: number): void {
    this.#state = state;
    this.#slides = slides;
    this.#layout = layout;
    const track = state.loop === "infinite" && state.transition === "slide" ? this.#context.host.track() : null;
    if (!track) {
      this.#stop();
      return;
    }
    this.#bindTrack(track);
    if (changed(this.#clonesKey, [refreshes, ...slides])) {
      this.#clonesKey = [refreshes, ...slides];
      this.#rebuildClones();
      this.#observeContent();
    }
    const geometryKey = [state.orientation, state.snapAlign, layout.move, ...slides];
    if (changed(this.#positionKey, [carouselPageOffset(layout, state.page), refreshes, ...geometryKey])) {
      this.#positionKey = [carouselPageOffset(layout, state.page), refreshes, ...geometryKey];
      this.#position();
    }
    if (changed(this.#resizeKey, geometryKey)) {
      this.#resizeKey = geometryKey;
      this.#observeResize(track);
    }
  }

  /** Stop observing and listening; the offset is kept, as React keeps its refs across a loop switch. */
  disconnect(): void {
    this.#stop();
  }

  /**
   * Leave infinite mode: take the copies away, undo the track's transform and
   * the slides' visibility (an element's track stays in the page, where React's
   * unmounts), and stop everything that drove the track. The next start
   * positions at once again.
   */
  #stop(): void {
    if (this.#clonesKey !== null) this.#context.host.placeClones([], []);
    if (this.#track) {
      this.#track.style.transform = "";
      this.#track.style.transition = "";
      for (const slide of this.#slides) slide.style.visibility = "";
    }
    this.#positioned = false;
    this.#trackConnection?.abort();
    this.#trackConnection = null;
    this.#track = null;
    this.#content?.disconnect();
    this.#content = null;
    this.#resize?.disconnect();
    this.#resize = null;
    this.#stopProgress();
    if (this.#dragFrame !== null) cancelAnimationFrame(this.#dragFrame);
    this.#dragFrame = null;
    this.#clonesKey = this.#positionKey = this.#resizeKey = null;
  }

  #bindTrack(track: HTMLElement): void {
    // Stryker disable next-line ConditionalExpression: equivalent — rebinding the same track swaps one listener for an identical one.
    if (track === this.#track) return;
    this.#trackConnection?.abort();
    this.#track = track;
    this.#trackConnection = new AbortController();
    // Re-base once a glide settles; idempotent, so an interrupted or spurious event is safe.
    track.addEventListener(
      "transitionend",
      (event) => {
        if (event.propertyName !== "transform") return;
        this.#stopProgress();
        const g = this.#measure();
        if (g) this.#rebase(g);
      },
      { signal: this.#trackConnection.signal },
    );
  }

  #vertical(): boolean {
    return (this.#state as CarouselControllerState).orientation === "vertical";
  }

  /** Measure the track from live layout, or `null` with under two slides or no layout yet. */
  #measure(): Geometry | null {
    const track = this.#track as HTMLElement;
    const slides = this.#slides;
    const count = slides.length;
    if (count < 2) return null;
    const vertical = this.#vertical();
    // Rects carry the track's live transform, so positions are read as differences, which cancel it.
    const start = (r: DOMRect): number => (vertical ? r.top : r.left);
    const extent = (r: DOMRect): number => (vertical ? r.height : r.width);
    const trackRect = track.getBoundingClientRect();
    const r0 = (slides[0] as HTMLElement).getBoundingClientRect();
    const r1 = (slides[1] as HTMLElement).getBoundingClientRect();
    const rawStride = start(r1) - start(r0);
    if (rawStride === 0) return null;
    const dir = Math.sign(rawStride);
    const stride = Math.abs(rawStride);
    const trackSize = extent(trackRect);
    const { snapAlign } = this.#state as CarouselControllerState;
    const pageSpan = ((this.#layout as CarouselLayout).move - 1) * stride + extent(r0);
    return {
      track,
      count,
      stride,
      trackLength: stride * count,
      basePos: start(r0) - start(trackRect),
      trackSize,
      align: carouselLoopAlign(snapAlign, dir, trackSize, pageSpan),
      dir,
    };
  }

  /**
   * Translate the whole track to `offset` — as a CSS transition sweeping from
   * `from` when `animate`, else at once — and paint only the slides on or near
   * the sweep, so the composited strip stays about a screen wide. Each slide's
   * `--slide-progress` is set for where it rests.
   */
  #paint(offset: number, from: number, g: Geometry, animate: boolean): void {
    const vertical = this.#vertical();
    g.track.style.transition = animate ? this.#glide(g.track) : "none";
    const shift = g.align - g.basePos - g.dir * offset;
    g.track.style.transform = vertical ? `translate(0px, ${shift}px)` : `translate(${shift}px, 0px)`;
    const trackRect = g.track.getBoundingClientRect();
    const trackStart = vertical ? trackRect.top : trackRect.left;
    const half = g.trackSize / 2;
    for (const slide of g.track.querySelectorAll<HTMLElement>("[data-carousel-slide]")) {
      const r = slide.getBoundingClientRect();
      const size = vertical ? r.height : r.width;
      const edge = (vertical ? r.top : r.left) - trackStart + g.align - g.basePos;
      const painted = carouselLoopPainted({ edge, size, from, to: offset, dir: g.dir, trackSize: g.trackSize });
      slide.style.visibility = painted ? "" : "hidden";
      const rest = edge - g.dir * offset;
      slide.style.setProperty("--slide-progress", String(carouselSlideProgress(rest + size / 2, half, half)));
    }
  }

  /** The glide's `transition`, from the duration and easing custom properties on the track, or the fallbacks. */
  #glide(track: HTMLElement): string {
    const styles = getComputedStyle(track);
    const duration = styles.getPropertyValue("--primitiv-carousel-glide-duration").trim() || GLIDE_DURATION;
    const easing = styles.getPropertyValue("--primitiv-carousel-glide-easing").trim() || GLIDE_EASE;
    return `transform ${duration} ${easing}`;
  }

  /** `--slide-progress` from where each slide is drawn right now, mid-transition — once a frame during a glide. */
  #liveProgress(g: Geometry): void {
    const vertical = this.#vertical();
    const rect = (g.track.parentElement as HTMLElement).getBoundingClientRect();
    const half = (vertical ? rect.height : rect.width) / 2;
    const center = (vertical ? rect.top : rect.left) + half;
    for (const slide of g.track.querySelectorAll<HTMLElement>("[data-carousel-slide]")) {
      const r = slide.getBoundingClientRect();
      const slideCenter = vertical ? r.top + r.height / 2 : r.left + r.width / 2;
      slide.style.setProperty("--slide-progress", String(carouselSlideProgress(slideCenter, center, half)));
    }
  }

  #startProgress(g: Geometry): void {
    this.#stopProgress();
    const tick = (): void => {
      this.#liveProgress(g);
      this.#progressFrame = requestAnimationFrame(tick);
    };
    this.#progressFrame = requestAnimationFrame(tick);
  }

  #stopProgress(): void {
    if (this.#progressFrame === null) return;
    cancelAnimationFrame(this.#progressFrame);
    this.#progressFrame = null;
  }

  /** Bring the offset back into one period and repaint at once — the same pixels, so invisible. */
  #rebase(g: Geometry): void {
    const normalized = carouselNormalizeOffset(this.#offset, g.trackLength);
    if (normalized === this.#offset) return;
    this.#offset = normalized;
    this.#paint(normalized, normalized, g, false);
  }

  /**
   * Move to `target`, animated unless `instant` or the user prefers reduced
   * motion. A glide may land on a copy and re-bases when it settles; an instant
   * move re-bases first so it never rests on one.
   */
  #glideTo(target: number, instant: boolean, g: Geometry): void {
    const reduce = !!globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!instant && !reduce) {
      const from = this.#offset;
      this.#offset = target;
      this.#paint(target, from, g, true);
      this.#startProgress(g);
    } else {
      this.#offset = carouselNormalizeOffset(target, g.trackLength);
      this.#paint(this.#offset, this.#offset, g, false);
      this.#stopProgress();
    }
  }

  /** A full period of inert, aria-hidden, id-less copies each side of the real slides. */
  #rebuildClones(): void {
    const slides = this.#slides;
    const copies = (): HTMLElement[] =>
      slides.length < 2
        ? []
        : slides.map((slide) => {
            const clone = slide.cloneNode(true) as HTMLElement;
            clone.setAttribute("aria-hidden", "true");
            clone.setAttribute("inert", "");
            clone.setAttribute("data-carousel-clone", "");
            clone.removeAttribute("data-index");
            clone.removeAttribute("data-state");
            clone.style.transform = "";
            // A duplicate id is invalid and would break label associations against the real slide.
            clone.removeAttribute("id");
            for (const withId of clone.querySelectorAll("[id]")) withId.removeAttribute("id");
            return clone;
          });
    this.#context.host.placeClones(copies(), copies());
  }

  /** Rebuild the copies when a real slide's own content changes underneath it. */
  #observeContent(): void {
    this.#content?.disconnect();
    this.#content = new MutationObserver((mutations) => {
      if (mutations.some(meaningful)) this.#rebuildClones();
    });
    for (const slide of this.#slides) {
      this.#content.observe(slide, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeOldValue: true,
        characterData: true,
      });
    }
  }

  /** The geometry a resize is compared against, so a no-change resize never interrupts a glide. */
  #remember(g: Geometry): void {
    this.#lastGeometry = [g.stride, g.align, g.basePos, g.trackSize, g.dir, g.count];
  }

  /**
   * Glide to the active page the short way, so a wrap travels one step onto the
   * adjacent copy — or, for an absolute jump (an indicator), the literal
   * distance, so picking the last page from the first travels through every
   * slide between. The first positioning is instant.
   */
  #position(): void {
    if (this.#dragHandled) {
      this.#dragHandled = false;
      return;
    }
    const g = this.#measure();
    if (!g) return;
    this.#remember(g);
    // Re-base before gliding, so rapid navigation that interrupts a transition can't carry the offset off the copies.
    this.#rebase(g);
    void (this.#vertical() ? g.track.offsetHeight : g.track.offsetWidth);
    const { page } = this.#state as CarouselControllerState;
    const offset = carouselPageOffset(this.#layout as CarouselLayout, page);
    const logical = carouselLoopIndex(this.#offset, g.stride, g.count);
    const step = this.#context.consumeDirectJump() ? offset - logical : carouselShortestStep(logical, offset, g.count);
    const instant = this.#context.consumeInstant() || !this.#positioned;
    this.#positioned = true;
    this.#glideTo(this.#offset + step * g.stride, instant, g);
  }

  /**
   * Re-home to the active page, at once, whenever the track or a slide resizes
   * with geometry that has really changed — a container, peek, ratio or density
   * change the engine has no other signal for.
   */
  #observeResize(track: HTMLElement): void {
    this.#resize?.disconnect();
    this.#resize = new ResizeObserver(() => {
      const g = this.#measure();
      if (!g) return;
      if (!changed(this.#lastGeometry, [g.stride, g.align, g.basePos, g.trackSize, g.dir, g.count])) return;
      this.#remember(g);
      const { page } = this.#state as CarouselControllerState;
      const offset = carouselPageOffset(this.#layout as CarouselLayout, page);
      this.#offset = carouselNormalizeOffset(offset * g.stride, g.trackLength);
      this.#paint(this.#offset, this.#offset, g, false);
    });
    this.#resize.observe(track);
    for (const slide of this.#slides) this.#resize.observe(slide);
  }

  #client(event: PointerEvent): number {
    return this.#vertical() ? event.clientY : event.clientX;
  }

  /** Start a drag: touch always (there is no native scroll to fall back to), the mouse only when allowed. */
  pointerDown(event: PointerEvent, state: CarouselControllerState): void {
    if (event.pointerType === "mouse" && !state.allowMouseDrag) return;
    const geometry = this.#measure();
    if (!geometry) return;
    const client = this.#client(event);
    this.#drag = {
      pointerId: event.pointerId,
      startClient: client,
      startOffset: this.#offset,
      lastClient: client,
      lastTime: event.timeStamp,
      velocity: 0,
      dragging: false,
      geometry,
    };
  }

  /**
   * Follow the pointer 1:1, wrapping within the one-period buffer however far it
   * runs, and track its velocity for the fling. The paint coalesces to one per
   * frame; the offset and velocity stay exact on every event.
   */
  pointerMove(event: PointerEvent, viewport: HTMLElement): void {
    const drag = this.#drag;
    if (!drag || event.pointerId !== drag.pointerId) return;
    const client = this.#client(event);
    const g = drag.geometry;
    const elapsed = event.timeStamp - drag.lastTime;
    if (elapsed > 0) drag.velocity = (-g.dir * (client - drag.lastClient)) / elapsed;
    drag.lastClient = client;
    drag.lastTime = event.timeStamp;
    if (!drag.dragging && Math.abs(client - drag.startClient) > CAROUSEL_DRAG_THRESHOLD_PX) {
      drag.dragging = true;
      viewport.setPointerCapture?.(drag.pointerId);
      this.#stopProgress();
      this.#dragPaintFrom = this.#offset;
    }
    if (!drag.dragging) return;
    this.#offset = carouselNormalizeOffset(drag.startOffset - g.dir * (client - drag.startClient), g.trackLength);
    if (this.#dragFrame !== null) return;
    this.#dragFrame = requestAnimationFrame(() => {
      this.#dragFrame = null;
      // Sweep from the last painted offset, so a frame that wraps the seam paints what it reveals.
      this.#paint(this.#offset, this.#dragPaintFrom, g, false);
      this.#dragPaintFrom = this.#offset;
    });
  }

  /**
   * Release: paint where the pointer really let go, fling to the projected page
   * boundary, and then sync the page to where it lands — telling the sync that
   * follows not to glide again.
   */
  pointerUp(event: PointerEvent): void {
    const drag = this.#drag;
    if (!drag || event.pointerId !== drag.pointerId) return;
    this.#drag = null;
    if (!drag.dragging) return;
    const g = drag.geometry;
    // Paint where the pointer let go now, not on a frame still pending — the
    // fling's glide must start from what is on screen.
    if (this.#dragFrame !== null) {
      cancelAnimationFrame(this.#dragFrame);
      this.#dragFrame = null;
      // Stryker disable next-line BooleanLiteral: equivalent — the fling's own glide sets the transition straight after.
      this.#paint(this.#offset, this.#dragPaintFrom, g, false);
    }
    const layout = this.#layout as CarouselLayout;
    const target = carouselFlingTarget(this.#offset, drag.velocity, CAROUSEL_FLING_DECEL_MS, g.stride * layout.move);
    this.#glideTo(target, false, g);
    const page = carouselPageForSlide(layout, carouselLoopIndex(target, g.stride, g.count));
    // Only a page change brings a sync to skip; flagging a same-page fling would swallow the next navigation.
    this.#dragHandled = page !== (this.#state as CarouselControllerState).page;
    this.#context.goTo(page);
  }
}
