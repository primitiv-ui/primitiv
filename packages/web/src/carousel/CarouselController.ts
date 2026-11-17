import {
  CAROUSEL_DRAG_SENSITIVITY,
  CAROUSEL_DRAG_THRESHOLD_PX,
  carouselAlignOffset,
  carouselAutoplayRuns,
  carouselBounds,
  carouselDragOverscroll,
  carouselInViewCutoff,
  carouselKeydown,
  carouselLayout,
  carouselPageForSlide,
  carouselPageOffset,
  carouselScrollProgress,
  carouselSlideProgress,
  carouselSnapPoints,
  carouselStep,
  carouselWheelDelta,
  type CarouselBounds,
  type CarouselEdge,
  type CarouselLayout,
  type CarouselLoop,
  type CarouselOrientation,
  type CarouselSnapAlign,
  type CarouselStepDirection,
  type CarouselTransition,
} from "@primitiv-ui/core";

import { CarouselLoopEngine } from "./CarouselLoopEngine.ts";
import { changed, type Key } from "./key.ts";

/** An autoplay transition: a session starting, a tick advancing the page, or the session stopping. */
export type CarouselAutoplayStatus = {
  type: "autoplay.start" | "autoplay" | "autoplay.stop";
  page: number;
  isPlaying: boolean;
};

/** A mouse drag's transitions: starting past the threshold, moving, and releasing. */
export type CarouselDragStatus = {
  type: "dragging.start" | "dragging" | "dragging.end";
  page: number;
  isDragging: boolean;
};

/** A push against an end with nowhere further to go, from the keyboard, the wheel or a drag. */
export type CarouselOverscrollStatus = {
  type: "overscroll.start" | "overscroll" | "overscroll.end";
  edge: CarouselEdge;
  source: "keyboard" | "wheel" | "drag";
  amount: number;
  page: number;
};

/** The state a {@link CarouselController} reads from its host. */
export type CarouselControllerState = {
  /** The active page, already held within the pages there are. */
  page: number;
  playing: boolean;
  /** Whether autoplay is on at all. */
  autoplay: boolean;
  /** How long an autoplay page stays up, in milliseconds. */
  autoplayDelay: number;
  slidesPerPage: number;
  slidesPerMove: number | "auto";
  transition: CarouselTransition;
  snapAlign: CarouselSnapAlign;
  orientation: CarouselOrientation;
  loop: CarouselLoop;
  allowMouseDrag: boolean;
  inViewThreshold: number | readonly number[];
};

/**
 * What a {@link CarouselController} asks of whoever hosts it. The controller
 * owns behaviour and never owns state (RFC 0033 D28): the custom elements keep
 * the page and the playing flag in reflected attributes, the React adapter in
 * React, and each answers these calls from wherever it keeps them.
 */
export type CarouselControllerHost = {
  state(): CarouselControllerState;
  /** The carousel's root: hover, focus and touch on it pause autoplay. */
  root(): HTMLElement;
  /** The scrolling viewport the slides sit in. */
  viewport(): HTMLElement | null;
  /** The real slides, in order — never a loop clone. */
  slides(): readonly HTMLElement[];
  /** The track an infinite loop translates, a direct child of the viewport. */
  track(): HTMLElement | null;
  /** Put the infinite loop's copies before (`head`) and after (`tail`) the real slides, replacing any earlier ones. */
  placeClones(head: readonly HTMLElement[], tail: readonly HTMLElement[]): void;
  /**
   * Apply a page change. Every request is passed on, the same page or not, so
   * the host decides what a repeat means.
   */
  changePage(page: number): void;
  /** Apply a playing change. */
  changePlaying(playing: boolean): void;
  autoplayStatus(status: CarouselAutoplayStatus): void;
  dragStatus(status: CarouselDragStatus): void;
  overscrollStatus(status: CarouselOverscrollStatus): void;
};

/** How long a programmatic scroll is assumed to run where `scrollend` never fires. */
const SCROLL_SETTLE_MS = 600;

/** A mouse drag on the native-scroll viewport. */
type NativeDrag = {
  pointerId: number;
  startClient: number;
  startScroll: number;
  dragging: boolean;
  /** The end the drag is pushing past, while it is. */
  edge: CarouselEdge | null;
};

/** `scrollsnapchange`, which TypeScript's DOM library does not describe yet. */
type SnapChangeEvent = Event & { snapTargetInline?: Element | null; snapTargetBlock?: Element | null };

/**
 * The behaviour of a WAI-ARIA carousel over native scroll-snap: the viewport's
 * keys, wheel and mouse drag; scrolling the viewport to the active page and
 * following the user's own swipes back (`scrollsnapchange`, with an
 * `IntersectionObserver` fallback); the continuous progress signals; autoplay
 * and its hover / focus / touch pause; and, for `loop="infinite"`, the
 * transform engine. A host calls {@link sync} after every change it applies, and
 * each part of the behaviour reruns only when what it depends on has changed.
 */
export class CarouselController {
  readonly #host: CarouselControllerHost;
  readonly #loop: CarouselLoopEngine;
  readonly #reducedMotion: boolean;
  #connection: AbortController | null = null;
  #viewportConnection: AbortController | null = null;
  #boundViewport: HTMLElement | null = null;

  // What pauses autoplay, and whether the user pressed play (which overrides it).
  #hovered = false;
  #focused = false;
  #touching = false;
  #userPlay = false;

  // One-shots a navigation leaves for the next sync to consume.
  #programmatic = false;
  #instant = false;
  #directJump = false;
  #userScroll = false;
  #refreshes = 0;

  // Live measurements the imperative API reads.
  readonly #inView = new Set<number>();
  #dragging = false;
  #overscrolling = false;
  #scrollProgress = 0;
  readonly #slideProgress = new Map<number, number>();

  #drag: NativeDrag | null = null;
  #suppressClick = false;

  #scrollKey: Key = null;
  #scrollSettle: (() => void) | null = null;
  #marginKey: Key = null;
  #margins: ResizeObserver | null = null;
  #progressKey: Key = null;
  #progress: (() => void) | null = null;
  #observerKey: Key = null;
  #observer: IntersectionObserver | null = null;
  #autoplayKey: Key = null;
  #autoplayTimer: ReturnType<typeof setTimeout> | undefined;
  #autoplayRunning = false;

  constructor(host: CarouselControllerHost) {
    this.#host = host;
    this.#reducedMotion = !!globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    this.#loop = new CarouselLoopEngine({
      host,
      consumeInstant: () => this.#consumeInstant(),
      consumeDirectJump: () => this.#consumeDirectJump(),
      goTo: (page) => this.goTo(page),
    });
  }

  /** Start listening on the root. Connecting again while connected does nothing. */
  connect(): void {
    if (this.#connection) return;
    const root = this.#host.root();
    this.#connection = new AbortController();
    const { signal } = this.#connection;
    const suspend = (set: () => void) => () => {
      set();
      this.#syncAutoplay();
    };
    root.addEventListener("mouseenter", suspend(() => (this.#hovered = true)), { signal });
    root.addEventListener("mouseleave", suspend(() => (this.#hovered = false)), { signal });
    root.addEventListener("focusin", suspend(() => (this.#focused = true)), { signal });
    root.addEventListener(
      "focusout",
      (event) => {
        const next = event.relatedTarget as Node | null;
        if (next && root.contains(next)) return;
        this.#focused = false;
        this.#syncAutoplay();
      },
      { signal },
    );
    root.addEventListener(
      "pointerdown",
      (event) => {
        if (event.pointerType !== "touch") return;
        this.#touching = true;
        this.#syncAutoplay();
      },
      { signal },
    );
    root.addEventListener("pointerup", suspend(() => (this.#touching = false)), { signal });
    root.addEventListener("pointercancel", suspend(() => (this.#touching = false)), { signal });
  }

  /**
   * Stop everything: listeners, observers, timers and frames. The keys are
   * forgotten, so a later `connect` and `sync` start afresh.
   */
  disconnect(): void {
    this.#connection?.abort();
    this.#connection = null;
    this.#unbindViewport();
    this.#scrollSettle?.();
    this.#scrollSettle = null;
    this.#margins?.disconnect();
    this.#margins = null;
    this.#progress?.();
    this.#progress = null;
    this.#observer?.disconnect();
    this.#observer = null;
    clearTimeout(this.#autoplayTimer);
    this.#autoplayRunning = false;
    this.#scrollKey = this.#marginKey = this.#progressKey = this.#observerKey = this.#autoplayKey = null;
    this.#hovered = this.#focused = this.#touching = false;
    this.#loop.disconnect();
  }

  /**
   * Bring the behaviour in line with the host's state. A host calls it after
   * every change it applies; each part reruns only when something it depends on
   * has changed, in the order the parts depend on each other.
   */
  sync(): void {
    if (!this.#connection) return;
    const state = this.#host.state();
    const slides = this.#host.slides();
    const layout = carouselLayout(slides.length, state.slidesPerPage, state.slidesPerMove);
    const viewport = this.#host.viewport();
    this.#bindViewport(viewport);
    if (viewport) {
      this.#syncScroll(state, slides, layout, viewport);
      this.#syncMargins(state, slides, layout, viewport);
      this.#syncProgress(state, slides, viewport);
    }
    this.#syncObserver(state, slides);
    this.#loop.sync(state, slides, layout, this.#refreshes);
    this.#syncAutoplay();
  }

  // ── Navigation (the imperative API and the controls) ──────────────────────

  /** Advance one page — wrapping while looping — or do nothing at the last. */
  next(instant?: boolean): void {
    this.#step(1, instant);
  }

  /** Retreat one page — wrapping while looping — or do nothing at the first. */
  previous(instant?: boolean): void {
    this.#step(-1, instant);
  }

  /** Jump to `page`. `instant` skips the smooth scroll for this one move. */
  goTo(page: number, instant?: boolean): void {
    this.#instant = !!instant;
    this.#directJump = true;
    this.#host.changePage(page);
  }

  /** Jump to the page holding slide `slideIndex`. */
  scrollToIndex(slideIndex: number, instant?: boolean): void {
    this.goTo(carouselPageForSlide(this.#layout(), slideIndex), instant);
  }

  /** Start autoplay, overriding the hover and focus pause for this playing session (the APG's user-initiated play). */
  play(): void {
    this.#userPlay = true;
    this.#host.changePlaying(true);
  }

  /** Stop autoplay. */
  pause(): void {
    this.#host.changePlaying(false);
  }

  /** Play when paused, pause when playing — the play / pause control. */
  togglePlaying(): void {
    if (this.#host.state().playing) this.pause();
    else this.play();
  }

  /** Re-issue the scroll for the current page and rebuild the loop's copies, after an outside layout change. */
  refresh(): void {
    this.#refreshes += 1;
    this.sync();
  }

  // ── Reads ─────────────────────────────────────────────────────────────────

  /** Whether each direction has somewhere to go — the triggers' disabled state. */
  bounds(): CarouselBounds {
    const { page, loop } = this.#host.state();
    return carouselBounds({ page, totalPages: this.#layout().totalPages, loop });
  }

  /** The active page, the page count, and how far along they are, 0..1. */
  getProgress(): { page: number; totalPages: number; value: number } {
    const { page } = this.#host.state();
    const { totalPages } = this.#layout();
    return { page, totalPages, value: totalPages > 1 ? page / (totalPages - 1) : 0 };
  }

  /** Every page's leading slide. */
  getPageSnapPoints(): number[] {
    return carouselSnapPoints(this.#layout());
  }

  /** Whether slide `slideIndex` was last reported in view. */
  isInView(slideIndex: number): boolean {
    return this.#inView.has(slideIndex);
  }

  /** Whether a mouse drag is under way. */
  isDragging(): boolean {
    return this.#dragging;
  }

  /** Whether a mouse drag is pushing past an end. */
  isOverscrolling(): boolean {
    return this.#overscrolling;
  }

  /** How far through its scroll the viewport is, 0..1. */
  getScrollProgress(): number {
    return this.#scrollProgress;
  }

  /** How far slide `slideIndex`'s centre is from the viewport's, −1..1. */
  getSlideProgress(slideIndex: number): number {
    return this.#slideProgress.get(slideIndex) ?? 0;
  }

  // ── Internals ─────────────────────────────────────────────────────────────

  #layout(): CarouselLayout {
    const { slidesPerPage, slidesPerMove } = this.#host.state();
    return carouselLayout(this.#host.slides().length, slidesPerPage, slidesPerMove);
  }

  #step(direction: CarouselStepDirection, instant: boolean | undefined): void {
    const { page, loop } = this.#host.state();
    const target = carouselStep({ page, totalPages: this.#layout().totalPages, loop }, direction);
    if (target === null) return;
    this.#programmatic = true;
    this.#instant = !!instant;
    this.#directJump = false;
    this.#host.changePage(target);
  }

  #consumeInstant(): boolean {
    const instant = this.#instant;
    this.#instant = false;
    return instant;
  }

  #consumeDirectJump(): boolean {
    const jump = this.#directJump;
    this.#directJump = false;
    return jump;
  }

  #overscroll(edge: CarouselEdge, source: "keyboard" | "wheel"): void {
    this.#host.overscrollStatus({ type: "overscroll", edge, source, amount: 0, page: this.#host.state().page });
  }

  #bindViewport(viewport: HTMLElement | null): void {
    if (viewport === this.#boundViewport) return;
    this.#unbindViewport();
    if (!viewport) return;
    this.#boundViewport = viewport;
    this.#viewportConnection = new AbortController();
    const options = { signal: this.#viewportConnection.signal };
    viewport.addEventListener("keydown", (event) => this.#onKeydown(event, viewport), options);
    viewport.addEventListener("pointerdown", (event) => this.#onPointerDown(event, viewport), options);
    viewport.addEventListener("pointermove", (event) => this.#onPointerMove(event, viewport), options);
    viewport.addEventListener("pointerup", (event) => this.#onPointerUp(event, viewport), options);
    viewport.addEventListener("pointercancel", (event) => this.#onPointerUp(event, viewport), options);
    viewport.addEventListener("dragstart", (event) => this.#onDragStart(event), options);
    viewport.addEventListener("click", (event) => this.#onClickCapture(event), { ...options, capture: true });
    viewport.addEventListener("wheel", (event) => this.#onWheel(event, viewport), { ...options, passive: false });
    viewport.addEventListener("scrollsnapchange", (event) => this.#onSnapChange(event), options);
  }

  #unbindViewport(): void {
    this.#viewportConnection?.abort();
    this.#viewportConnection = null;
    this.#boundViewport = null;
  }

  /**
   * Keys on the viewport itself, per the WAI-ARIA Carousel pattern: the arrows
   * along the axis page (or report an overscroll at an end) and Home / End
   * jump. Focus inside a slide keeps its own arrow keys.
   */
  #onKeydown(event: KeyboardEvent, viewport: HTMLElement): void {
    if (event.target !== viewport) return;
    const action = carouselKeydown(this.#host.state().orientation, event.key);
    if (!action) return;
    event.preventDefault();
    const bounds = this.bounds();
    if (action === "next") {
      if (bounds.next) this.next();
      else this.#overscroll("end", "keyboard");
    } else if (action === "previous") {
      if (bounds.previous) this.previous();
      else this.#overscroll("start", "keyboard");
    } else {
      this.goTo(action === "first" ? 0 : this.#layout().totalPages - 1);
    }
  }

  #onPointerDown(event: PointerEvent, viewport: HTMLElement): void {
    const state = this.#host.state();
    if (this.#loop.active) {
      this.#loop.pointerDown(event, state);
      return;
    }
    if (!state.allowMouseDrag || event.pointerType !== "mouse" || state.transition !== "slide") return;
    const vertical = state.orientation === "vertical";
    this.#drag = {
      pointerId: event.pointerId,
      startClient: vertical ? event.clientY : event.clientX,
      startScroll: vertical ? viewport.scrollTop : viewport.scrollLeft,
      dragging: false,
      edge: null,
    };
  }

  /**
   * A mouse drag tracks the pointer into the viewport's scroll, amplified, once
   * it clears the threshold — below it, a click still reaches a link or button
   * in a slide. Release lets scroll-snap settle, which `scrollsnapchange` then
   * follows like any swipe.
   */
  #onPointerMove(event: PointerEvent, viewport: HTMLElement): void {
    if (this.#loop.active) {
      this.#loop.pointerMove(event, viewport);
      return;
    }
    const drag = this.#drag;
    if (!drag || event.pointerId !== drag.pointerId) return;
    const state = this.#host.state();
    const vertical = state.orientation === "vertical";
    const delta = (vertical ? event.clientY : event.clientX) - drag.startClient;
    if (!drag.dragging) {
      if (Math.abs(delta) < CAROUSEL_DRAG_THRESHOLD_PX) return;
      drag.dragging = true;
      this.#suppressClick = true;
      viewport.setPointerCapture?.(drag.pointerId);
      viewport.setAttribute("data-dragging", "");
      this.#dragging = true;
      this.#host.dragStatus({ type: "dragging.start", page: state.page, isDragging: true });
    } else {
      this.#host.dragStatus({ type: "dragging", page: state.page, isDragging: true });
    }

    const edge = carouselDragOverscroll(delta, this.bounds());
    if (edge) {
      const type = drag.edge ? "overscroll" : "overscroll.start";
      drag.edge = edge;
      this.#overscrolling = true;
      viewport.setAttribute("data-overscroll", edge);
      const amount = Math.abs(delta) * CAROUSEL_DRAG_SENSITIVITY;
      this.#host.overscrollStatus({ type, edge, source: "drag", amount, page: state.page });
    } else if (drag.edge) {
      this.#endOverscroll(drag, viewport, state.page);
    }

    event.preventDefault();
    const scroll = drag.startScroll - delta * CAROUSEL_DRAG_SENSITIVITY;
    if (vertical) viewport.scrollTop = scroll;
    else viewport.scrollLeft = scroll;
  }

  #endOverscroll(drag: NativeDrag, viewport: HTMLElement, page: number): void {
    const edge = drag.edge as CarouselEdge;
    drag.edge = null;
    this.#overscrolling = false;
    viewport.removeAttribute("data-overscroll");
    this.#host.overscrollStatus({ type: "overscroll.end", edge, source: "drag", amount: 0, page });
  }

  #onPointerUp(event: PointerEvent, viewport: HTMLElement): void {
    if (this.#loop.active) {
      this.#loop.pointerUp(event);
      return;
    }
    const drag = this.#drag;
    if (!drag) return;
    this.#drag = null;
    if (!drag.dragging) return;
    const { page } = this.#host.state();
    viewport.releasePointerCapture?.(drag.pointerId);
    viewport.removeAttribute("data-dragging");
    this.#dragging = false;
    this.#host.dragStatus({ type: "dragging.end", page, isDragging: false });
    if (drag.edge) this.#endOverscroll(drag, viewport, page);
  }

  /** A native image or link drag would compete with the drag-to-scroll, so it is held off while mouse drag is on. */
  #onDragStart(event: DragEvent): void {
    if (this.#host.state().allowMouseDrag) event.preventDefault();
  }

  /** The click a browser synthesises where a drag is released must not reach the link or button under it. */
  #onClickCapture(event: MouseEvent): void {
    if (!this.#suppressClick) return;
    this.#suppressClick = false;
    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * A plain vertical wheel notch scrolls a horizontal carousel (browsers only
   * do so with Shift held), and reports an overscroll at an end. A real
   * horizontal swipe already scrolls it natively and is left alone.
   */
  #onWheel(event: WheelEvent, viewport: HTMLElement): void {
    const { transition, orientation, loop } = this.#host.state();
    if (transition !== "slide" || orientation === "vertical" || loop === "infinite") return;
    const delta = carouselWheelDelta(event, viewport.clientWidth);
    if (delta === null) return;
    const bounds = this.bounds();
    if (delta > 0 && !bounds.next) this.#overscroll("end", "wheel");
    else if (delta < 0 && !bounds.previous) this.#overscroll("start", "wheel");
    event.preventDefault();
    viewport.scrollLeft += delta;
  }

  /** The user's own swipe settled on a slide: follow it to that slide's page. */
  #onSnapChange(event: Event): void {
    const state = this.#host.state();
    if (state.transition !== "slide" || state.loop === "infinite") return;
    const snap = event as SnapChangeEvent;
    const target = state.orientation === "vertical" ? snap.snapTargetBlock : snap.snapTargetInline;
    const slides = this.#host.slides();
    const index = slides.indexOf(target as HTMLElement);
    if (index < 0) return;
    const page = carouselPageForSlide(carouselLayout(slides.length, state.slidesPerPage, state.slidesPerMove), index);
    if (page === state.page) return;
    this.#userScroll = true;
    this.goTo(page);
  }

  /**
   * Scroll the viewport — never the page, as `scrollIntoView` would — so the
   * active page rests where the snap alignment says, measured against the whole
   * page so a multi-slide page is never clipped. A page change the user's own
   * swipe made is already in place and is not scrolled again.
   */
  #syncScroll(state: CarouselControllerState, slides: readonly HTMLElement[], layout: CarouselLayout, viewport: HTMLElement): void {
    const offset = carouselPageOffset(layout, state.page);
    const key = [state.transition, state.snapAlign, state.orientation, state.loop, offset, layout.perPage, this.#refreshes, ...slides];
    if (!changed(this.#scrollKey, key)) return;
    this.#scrollKey = key;
    this.#scrollSettle?.();
    this.#scrollSettle = null;
    if (state.transition !== "slide" || state.loop === "infinite") return;
    const target = slides[offset];
    if (!target) return;
    if (this.#userScroll) {
      this.#userScroll = false;
      return;
    }
    this.#programmatic = true;
    const vertical = state.orientation === "vertical";
    const viewportRect = viewport.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const current = vertical ? viewport.scrollTop : viewport.scrollLeft;
    const delta = vertical ? targetRect.top - viewportRect.top : targetRect.left - viewportRect.left;
    const lastRect = (slides[Math.min(offset + layout.perPage - 1, slides.length - 1)] as HTMLElement).getBoundingClientRect();
    const span = vertical
      ? lastRect.top + lastRect.height - targetRect.top
      : lastRect.left + lastRect.width - targetRect.left;
    const leftover = (vertical ? viewport.clientHeight : viewport.clientWidth) - span;
    const position = current + delta - carouselAlignOffset(target.dataset.snapAlign as CarouselSnapAlign, leftover);
    const behavior: ScrollBehavior = this.#consumeInstant() || this.#reducedMotion ? "instant" : "smooth";
    viewport.scrollTo(vertical ? { top: position, behavior } : { left: position, behavior });

    // Clear the programmatic guard once the scroll settles: `scrollend` where the
    // browser fires it, else a timeout longer than any smooth scroll.
    const settle = (): void => {
      this.#programmatic = false;
    };
    viewport.addEventListener("scrollend", settle, { once: true });
    const timeout = setTimeout(() => {
      viewport.removeEventListener("scrollend", settle);
      settle();
    }, SCROLL_SETTLE_MS);
    this.#scrollSettle = () => {
      clearTimeout(timeout);
      viewport.removeEventListener("scrollend", settle);
    };
  }

  /**
   * Extend each page's leading slide's `scroll-margin` to the page's last
   * member, so the user's own swipe settles on a whole multi-slide page for
   * centre and end alignment, as the programmatic scroll does. Kept current
   * across resizes, since equal-share slides size from the viewport.
   */
  #syncMargins(state: CarouselControllerState, slides: readonly HTMLElement[], layout: CarouselLayout, viewport: HTMLElement): void {
    const key = [state.transition, state.orientation, layout.perPage, layout.move, layout.totalPages, viewport, ...slides];
    if (!changed(this.#marginKey, key)) return;
    this.#marginKey = key;
    this.#margins?.disconnect();
    this.#margins = null;
    if (state.transition !== "slide" || layout.perPage <= 1) return;
    const vertical = state.orientation === "vertical";
    const recompute = (): void => {
      for (const offset of carouselSnapPoints(layout)) {
        const leading = slides[offset] as HTMLElement;
        const last = slides[Math.min(offset + layout.perPage - 1, slides.length - 1)] as HTMLElement;
        const leadingRect = leading.getBoundingClientRect();
        const lastRect = last.getBoundingClientRect();
        const extra = vertical
          ? lastRect.top + lastRect.height - (leadingRect.top + leadingRect.height)
          : lastRect.left + lastRect.width - (leadingRect.left + leadingRect.width);
        leading.style.scrollMarginInlineEnd = vertical ? "" : `${extra}px`;
        leading.style.scrollMarginBlockEnd = vertical ? `${extra}px` : "";
      }
    };
    recompute();
    this.#margins = new ResizeObserver(recompute);
    this.#margins.observe(viewport);
  }

  /**
   * The continuous progress signals, recomputed at most once a frame on scroll
   * and resize: `--carousel-progress` (0..1) on the viewport and
   * `--slide-progress` (−1..1, centre distance) on each slide.
   */
  #syncProgress(state: CarouselControllerState, slides: readonly HTMLElement[], viewport: HTMLElement): void {
    const key = [state.orientation, viewport, ...slides];
    if (!changed(this.#progressKey, key)) return;
    this.#progressKey = key;
    this.#progress?.();
    const vertical = state.orientation === "vertical";
    let frame: number | null = null;
    const recompute = (): void => {
      const maxScroll = vertical
        ? viewport.scrollHeight - viewport.clientHeight
        : viewport.scrollWidth - viewport.clientWidth;
      const progress = carouselScrollProgress(vertical ? viewport.scrollTop : viewport.scrollLeft, maxScroll);
      this.#scrollProgress = progress;
      viewport.style.setProperty("--carousel-progress", String(progress));
      const rect = viewport.getBoundingClientRect();
      const half = (vertical ? rect.height : rect.width) / 2;
      const center = (vertical ? rect.top : rect.left) + half;
      slides.forEach((slide, index) => {
        const slideRect = slide.getBoundingClientRect();
        const slideCenter = vertical ? slideRect.top + slideRect.height / 2 : slideRect.left + slideRect.width / 2;
        const value = carouselSlideProgress(slideCenter, center, half);
        this.#slideProgress.set(index, value);
        slide.style.setProperty("--slide-progress", String(value));
      });
    };
    const schedule = (): void => {
      if (frame !== null) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        recompute();
      });
    };
    recompute();
    viewport.addEventListener("scroll", schedule, { passive: true });
    const resize = new ResizeObserver(schedule);
    resize.observe(viewport);
    this.#progress = () => {
      viewport.removeEventListener("scroll", schedule);
      resize.disconnect();
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }

  /**
   * Which slides are in view, for `isInView`; and, where `scrollsnapchange` is
   * missing, the fallback that follows the user's scroll to the page of the
   * first visible slide. The event, when supported, is authoritative.
   */
  #syncObserver(state: CarouselControllerState, slides: readonly HTMLElement[]): void {
    const key = [state.transition, state.loop, String(state.inViewThreshold), ...slides];
    if (!changed(this.#observerKey, key)) return;
    this.#observerKey = key;
    this.#observer?.disconnect();
    this.#observer = null;
    if (state.transition !== "slide") return;
    const snapEvents = "onscrollsnapchange" in window;
    const cutoff = carouselInViewCutoff(state.inViewThreshold);
    this.#observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const index = slides.indexOf(entry.target as HTMLElement);
          if (entry.isIntersecting && entry.intersectionRatio >= cutoff) this.#inView.add(index);
          else this.#inView.delete(index);
        }
        if (snapEvents || state.loop === "infinite" || this.#inView.size === 0) return;
        const live = this.#host.state();
        const layout = carouselLayout(slides.length, live.slidesPerPage, live.slidesPerMove);
        const page = carouselPageForSlide(layout, Math.min(...this.#inView));
        // A programmatic scroll still in flight shows the old slide; following it would undo the move.
        if (page === live.page || this.#programmatic) return;
        this.#userScroll = true;
        this.goTo(page);
      },
      { threshold: state.inViewThreshold as number | number[] },
    );
    for (const slide of slides) this.#observer.observe(slide);
  }

  /**
   * Run the autoplay timer while autoplay is on, playing, able to advance and
   * not paused by hover, focus or touch (WCAG 2.2.2) — one timer per page, with
   * the status reported as a session starts, ticks and stops.
   */
  #syncAutoplay(): void {
    const state = this.#host.state();
    const { totalPages } = this.#layout();
    const canGoNext = carouselBounds({ page: state.page, totalPages, loop: state.loop }).next;
    const suspended = (this.#hovered || this.#focused || this.#touching) && !this.#userPlay;
    if (!state.playing) this.#userPlay = false;
    const runs = carouselAutoplayRuns({ enabled: state.autoplay, playing: state.playing, canGoNext, suspended });
    const key = [runs, state.autoplayDelay, state.page, totalPages, state.loop];
    if (!changed(this.#autoplayKey, key)) return;
    this.#autoplayKey = key;
    clearTimeout(this.#autoplayTimer);
    const { page } = state;
    if (!runs) {
      if (!this.#autoplayRunning) return;
      this.#autoplayRunning = false;
      this.#host.autoplayStatus({ type: "autoplay.stop", page, isPlaying: false });
      return;
    }
    if (!this.#autoplayRunning) {
      this.#autoplayRunning = true;
      this.#host.autoplayStatus({ type: "autoplay.start", page, isPlaying: true });
    }
    this.#autoplayTimer = setTimeout(() => {
      this.#host.autoplayStatus({ type: "autoplay", page, isPlaying: true });
      this.next();
    }, state.autoplayDelay);
  }
}
