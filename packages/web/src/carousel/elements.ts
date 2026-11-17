import {
  CAROUSEL_AUTOPLAY_DELAY_MS,
  CAROUSEL_IN_VIEW_THRESHOLD,
  CAROUSEL_LABELS,
  carouselBounds,
  carouselClampPage,
  carouselFormat,
  carouselLayout,
  carouselLoopMode,
  carouselSlideActive,
  carouselSnapStart,
  type CarouselOrientation,
  type CarouselSnapAlign,
  type CarouselTransition,
} from "@primitiv-ui/core";

import { defineElements, ElementBase, reportOnce, write, type ElementRegistry } from "../internal/element.ts";
import { PrimitivRootElement } from "../internal/RootElement.ts";
import {
  CarouselController,
  type CarouselAutoplayStatus,
  type CarouselControllerHost,
  type CarouselControllerState,
  type CarouselDragStatus,
  type CarouselOverscrollStatus,
} from "./CarouselController.ts";

export type { ElementRegistry };

// Stryker disable StringLiteral: static — evaluated once at import, so runtime mutant switching never reaches them; the names are pinned by the defineCarousel registry test instead.
const ROOT = "primitiv-carousel";
const VIEWPORT = "primitiv-carousel-viewport";
const TRACK = "primitiv-carousel-track";
const SLIDE = "primitiv-carousel-slide";
const PREVIOUS = "primitiv-carousel-previous-trigger";
const NEXT = "primitiv-carousel-next-trigger";
const PLAY = "primitiv-carousel-play-pause-trigger";
const GROUP = "primitiv-carousel-indicator-group";
const INDICATORS = "primitiv-carousel-indicators";
const INDICATOR = "primitiv-carousel-indicator";
const PROGRESS = "primitiv-carousel-progress-text";
const CLONE = "data-carousel-clone";
// Stryker restore StringLiteral

/** A whole-number attribute, or `fallback` when it is absent or not a number. */
function numberAttribute(element: Element, name: string, fallback: number): number {
  const value = Number(element.getAttribute(name) ?? Number.NaN);
  return Number.isNaN(value) ? fallback : value;
}

/** An attribute that must be one of `options`, or the first option. */
function oneOf<T extends string>(element: Element, name: string, options: readonly T[]): T {
  const value = element.getAttribute(name) as T;
  return options.includes(value) ? value : (options[0] as T);
}

/** The one element child an interactive part decorates, or `null`, reported once. */
function decoratable(part: HTMLElement): HTMLElement | null {
  if (part.childElementCount === 1) return part.firstElementChild as HTMLElement;
  reportOnce(part, `<${part.localName}> needs exactly one element child (a <button>) to decorate.`);
  return null;
}

/**
 * `<primitiv-carousel>` — the state owner of a WAI-ARIA carousel: a scroll-snap
 * viewport of slides, paged by previous / next triggers, indicators, the keys,
 * the wheel, a swipe or a mouse drag, with optional autoplay.
 *
 * The root is the `region` (name it with `aria-label` or `aria-labelledby`) and
 * hosts the shared `CarouselController` — the behaviour React's Carousel runs.
 * It finds its own parts, so a carousel nested in a slide keeps its own, and
 * reconciles every part from its reflected `page` and `playing` whenever a part
 * arrives, leaves, or changes an attribute it reads. Like React's, it writes the
 * measurements the styles read (`--carousel-progress`, `--slide-progress`, a
 * multi-slide page's `scroll-margin`) and, for `loop="infinite"`, translates the
 * `<primitiv-carousel-track>` and fills it with inert copies of the slides.
 *
 * @customElement primitiv-carousel
 * @summary The state owner of a carousel: the active page, autoplay and every paging behaviour.
 * @attr {number} page - The active page, zero-based. Reflected: it changes as the user pages, so a server re-render or a history snapshot sees the live page. An out-of-range page is held to the pages there are.
 * @attr {boolean} playing - Whether autoplay is playing. Reflected.
 * @attr {boolean} autoplay - Turns autoplay on, but on its own it does not play: write `autoplay playing` to start on load, or leave `playing` off for a carousel the user starts. While `playing`, the page advances on a timer, paused by hover, focus or a touch inside the carousel unless the play control started it (WCAG 2.2.2).
 * @attr {number} autoplay-delay - How long each page stays up while playing, in milliseconds. Default 4000.
 * @attr {number} slides-per-page - Slides shown per page. Default 1. The element publishes it as `--primitiv-carousel-slides-per-page`, which the styled slide width reads; to change the count per breakpoint, change this attribute (a `matchMedia` listener does it).
 * @attr {number | "auto"} slides-per-move - Slides a step advances: `auto` (the default) is a whole page; a number windows the page that many slides at a time.
 * @attr {"slide" | "fade" | "none"} transition - `slide` (the default) scrolls natively; `fade` and `none` scroll nothing and leave the change to CSS on each slide's `data-state`.
 * @attr {"start" | "center" | "end"} snap-align - Where a page rests in the viewport. Default `center`. Each slide's `snap-align` overrides it for that slide.
 * @attr {"mandatory" | "proximity"} snap-type - The scroll-snap strictness, mirrored on the viewport as `data-snap-type`. Default `mandatory`.
 * @attr {"horizontal" | "vertical"} orientation - The axis the carousel pages along, which picks the arrow keys. Default `horizontal`.
 * @attr {"" | "wrap" | "infinite"} loop - Navigation past either end: present (or `wrap`) rewinds to the other end; `infinite` glides on through copies of the slides, in a `<primitiv-carousel-track>`. Absent, the ends clamp.
 * @attr {boolean} allow-mouse-drag - Lets a mouse click-and-drag scroll the viewport. Touch and pen scroll natively either way.
 * @attr {string} in-view-threshold - The visibility ratio, or several separated by spaces, at which a slide counts as in view. Default 0.6.
 * @attr {string} slide-label - Each slide's name, from `{index}` and `{total}`. Default `{index} of {total}`.
 * @attr {string} indicator-label - Each indicator's name, from `{index}`. Default `Slide {index}`.
 * @attr {string} start-label - The play control's name while paused. Default `Start automatic slide show`.
 * @attr {string} stop-label - The play control's name while playing. Default `Stop automatic slide show`.
 * @attr {string} progress-label - The progress text, from `{page}` (one-based) and `{total}`. Default `{page} of {total}`.
 * @fires {CustomEvent<{ page: number }>} primitiv-carousel-change - Bubbles, cancelable, fired before a page change is applied — a trigger, an indicator, a key, a swipe or an autoplay tick. Call `preventDefault()` to veto it.
 * @fires {CustomEvent<{ playing: boolean }>} primitiv-carousel-playing-change - Bubbles, cancelable, fired before the play control (or `play()` / `pause()`) changes `playing`.
 * @fires {CustomEvent<CarouselAutoplayStatus>} primitiv-carousel-autoplay-status - Bubbles as an autoplay session starts, ticks and stops.
 * @fires {CustomEvent<CarouselDragStatus>} primitiv-carousel-drag-status - Bubbles as a mouse drag starts, moves and ends.
 * @fires {CustomEvent<CarouselOverscrollStatus>} primitiv-carousel-overscroll-status - Bubbles when the keys, the wheel or a drag push past an end with nowhere further to go.
 */
export class PrimitivCarouselElement extends PrimitivRootElement {
  /** The copies an infinite loop placed in the track, so they can be taken out again. */
  #clones: readonly HTMLElement[] = [];
  readonly #carousel: CarouselController = new CarouselController(this.#host());
  /** The parts' clicks, while connected. */
  #listening: AbortController | null = null;
  protected readonly controller: { connect(): void; disconnect(): void } = {
    connect: (): void => this.#connect(),
    disconnect: (): void => this.#disconnect(),
  };
  protected readonly reconcileOn: readonly string[] = [
    "page",
    "playing",
    "autoplay",
    "autoplay-delay",
    "slides-per-page",
    "slides-per-move",
    "transition",
    "snap-align",
    "snap-type",
    "orientation",
    "loop",
    "allow-mouse-drag",
    "in-view-threshold",
    "slide-label",
    "indicator-label",
    "start-label",
    "stop-label",
    "progress-label",
    "label",
    "index",
    "read-only",
    "disabled",
  ];

  /** The active page, zero-based, reflected as the `page` attribute. */
  get page(): number {
    return numberAttribute(this, "page", 0);
  }

  set page(next: number) {
    this.setAttribute("page", String(next));
  }

  /** Whether autoplay is playing, reflected as the boolean `playing` attribute. */
  get playing(): boolean {
    return this.hasAttribute("playing");
  }

  set playing(next: boolean) {
    this.toggleAttribute("playing", next);
  }

  /** Advance one page — wrapping while looping. `instant` skips the smooth scroll for this one move. */
  next(instant?: boolean): void {
    this.#carousel.next(instant);
  }

  /** Retreat one page — wrapping while looping. */
  previous(instant?: boolean): void {
    this.#carousel.previous(instant);
  }

  /** Jump to `page`. */
  goTo(page: number, instant?: boolean): void {
    this.#carousel.goTo(page, instant);
  }

  /** Jump to the page holding slide `slideIndex`. */
  scrollToIndex(slideIndex: number, instant?: boolean): void {
    this.#carousel.scrollToIndex(slideIndex, instant);
  }

  /** Start autoplay, as the play control does: hover and focus no longer pause this session. */
  play(): void {
    this.#carousel.play();
  }

  /** Stop autoplay. */
  pause(): void {
    this.#carousel.pause();
  }

  /** Re-issue the scroll for the current page and rebuild the loop's copies, after an outside layout change. */
  refresh(): void {
    this.#carousel.refresh();
  }

  /** The active page, the page count, and how far along they are, 0..1. */
  getProgress(): { page: number; totalPages: number; value: number } {
    return this.#carousel.getProgress();
  }

  /** Every page's leading slide. */
  getPageSnapPoints(): number[] {
    return this.#carousel.getPageSnapPoints();
  }

  /** Whether slide `slideIndex` was last reported in view. */
  isInView(slideIndex: number): boolean {
    return this.#carousel.isInView(slideIndex);
  }

  /** Whether a mouse drag is under way. */
  isDragging(): boolean {
    return this.#carousel.isDragging();
  }

  /** Whether a mouse drag is pushing past an end. */
  isOverscrolling(): boolean {
    return this.#carousel.isOverscrolling();
  }

  /** How far through its scroll the viewport is, 0..1. */
  getScrollProgress(): number {
    return this.#carousel.getScrollProgress();
  }

  /** How far slide `slideIndex`'s centre is from the viewport's, −1..1. */
  getSlideProgress(slideIndex: number): number {
    return this.#carousel.getSlideProgress(slideIndex);
  }

  #slides(): HTMLElement[] {
    return this.parts(SLIDE).filter((slide) => !slide.hasAttribute(CLONE));
  }

  #state(): CarouselControllerState {
    const slidesPerPage = numberAttribute(this, "slides-per-page", 1);
    const move = this.getAttribute("slides-per-move");
    const slidesPerMove = move === null || move === "auto" ? "auto" : numberAttribute(this, "slides-per-move", 1);
    const loop = carouselLoopMode(this.getAttribute("loop"));
    const { totalPages } = carouselLayout(this.#slides().length, slidesPerPage, slidesPerMove);
    const thresholds = (this.getAttribute("in-view-threshold") ?? "").split(/[\s,]/).filter(Boolean).map(Number);
    return {
      page: carouselClampPage(this.page, totalPages),
      playing: this.playing,
      autoplay: this.hasAttribute("autoplay"),
      autoplayDelay: numberAttribute(this, "autoplay-delay", CAROUSEL_AUTOPLAY_DELAY_MS),
      slidesPerPage,
      slidesPerMove,
      transition: oneOf<CarouselTransition>(this, "transition", ["slide", "fade", "none"]),
      snapAlign: oneOf<CarouselSnapAlign>(this, "snap-align", ["center", "start", "end"]),
      orientation: oneOf<CarouselOrientation>(this, "orientation", ["horizontal", "vertical"]),
      loop,
      allowMouseDrag: this.hasAttribute("allow-mouse-drag"),
      inViewThreshold: thresholds.length > 1 ? thresholds : (thresholds[0] ?? CAROUSEL_IN_VIEW_THRESHOLD),
    };
  }

  /** The controller's view of this element: state lives in reflected attributes. */
  #host(): CarouselControllerHost {
    const report =
      <T>(type: string) =>
      (status: T): void => {
        this.dispatchEvent(new CustomEvent(type, { bubbles: true, detail: status }));
      };
    return {
      state: () => this.#state(),
      root: () => this,
      viewport: () => this.parts(VIEWPORT)[0] ?? null,
      track: () => this.parts(TRACK)[0] ?? null,
      slides: () => this.#slides(),
      placeClones: (head, tail) => this.#placeClones(head, tail),
      changePage: (page) => {
        if (page !== this.#state().page && this.announce("primitiv-carousel-change", { page })) this.page = page;
      },
      changePlaying: (playing) => {
        if (playing !== this.playing && this.announce("primitiv-carousel-playing-change", { playing })) {
          this.playing = playing;
        }
      },
      autoplayStatus: report<CarouselAutoplayStatus>("primitiv-carousel-autoplay-status"),
      dragStatus: report<CarouselDragStatus>("primitiv-carousel-drag-status"),
      overscrollStatus: report<CarouselOverscrollStatus>("primitiv-carousel-overscroll-status"),
    };
  }

  /** Swap the loop's copies: the old ones out, the new ones either side of the real slides. */
  #placeClones(head: readonly HTMLElement[], tail: readonly HTMLElement[]): void {
    for (const clone of this.#clones) clone.remove();
    this.#clones = [...head, ...tail];
    const slides = this.#slides();
    slides[0]?.before(...head);
    slides.at(-1)?.after(...tail);
  }

  #connect(): void {
    this.#carousel.connect();
    if (this.#listening) return;
    this.#listening = new AbortController();
    this.addEventListener("click", (event) => this.#onClick(event), { signal: this.#listening.signal });
  }

  #disconnect(): void {
    this.#carousel.disconnect();
    (this.#listening as AbortController).abort();
    this.#listening = null;
  }

  /** A click on a decorated control: the part it belongs to decides what it asks for. */
  #onClick(event: MouseEvent): void {
    const target = event.target as Element;
    const part = target.closest(`${PREVIOUS}, ${NEXT}, ${PLAY}, ${INDICATOR}`);
    // A control inside a nested carousel belongs to that carousel.
    if (!part || part.closest(ROOT) !== this) return;
    const control = part.firstElementChild;
    if (!control?.contains(target) || part.childElementCount !== 1) return;
    const bounds = this.#carousel.bounds();
    if (part.localName === PLAY) {
      if (this.hasAttribute("autoplay")) this.#carousel.togglePlaying();
    } else if (part.localName === INDICATOR) {
      if (!part.hasAttribute("read-only")) this.#carousel.goTo(numberAttribute(part, "index", 0));
    } else if (!part.hasAttribute("disabled")) {
      if (part.localName === NEXT && bounds.next) this.#carousel.next();
      else if (part.localName === PREVIOUS && bounds.previous) this.#carousel.previous();
    }
  }

  protected reconcile(): void {
    const state = this.#state();
    const slides = this.#slides();
    const layout = carouselLayout(slides.length, state.slidesPerPage, state.slidesPerMove);
    const bounds = carouselBounds({ page: state.page, totalPages: layout.totalPages, loop: state.loop });
    const labels = {
      slide: this.getAttribute("slide-label"),
      indicator: this.getAttribute("indicator-label"),
      start: this.getAttribute("start-label") ?? CAROUSEL_LABELS.startSlideshow,
      stop: this.getAttribute("stop-label") ?? CAROUSEL_LABELS.stopSlideshow,
      progress: this.getAttribute("progress-label"),
    };

    write(this, "role", "region");
    write(this, "aria-roledescription", "carousel");
    write(this, "data-orientation", state.orientation);
    write(this, "data-transition", state.transition);
    write(this, "data-loop", state.loop);
    // The styled slide width reads the count from this property, so the element
    // keeps it in step with its attribute: one value to change, by the
    // attribute (from a `matchMedia` listener, for a count per breakpoint).
    this.style.setProperty("--primitiv-carousel-slides-per-page", String(state.slidesPerPage));

    for (const viewport of this.parts(VIEWPORT)) {
      write(viewport, "data-carousel-viewport", "");
      write(viewport, "data-snap-type", oneOf(this, "snap-type", ["mandatory", "proximity"]));
      if (!viewport.hasAttribute("tabindex")) viewport.tabIndex = 0;
      write(viewport, "aria-live", state.autoplay && state.playing ? "off" : "polite");
      write(viewport, "data-mouse-drag", state.allowMouseDrag ? "" : null);
    }
    for (const track of this.parts(TRACK)) {
      write(track, "data-carousel-track", "");
      write(track, "data-slides-per-page", String(layout.perPage));
    }
    if (state.loop === "infinite" && state.transition === "slide" && !this.parts(TRACK).length) {
      reportOnce(this, `<${ROOT} loop="infinite"> needs a <${TRACK}> around its slides to translate.`);
    }

    slides.forEach((slide, index) => {
      const total = slides.length;
      write(slide, "role", "group");
      write(slide, "aria-roledescription", "slide");
      write(slide, "data-carousel-slide", "");
      write(slide, "data-index", String(index));
      write(slide, "data-total", String(total));
      write(slide, "data-state", carouselSlideActive(layout, state.page, index) ? "active" : "inactive");
      const label = slide.getAttribute("label");
      const auto = labels.slide
        ? carouselFormat(labels.slide, { index: index + 1, total })
        : CAROUSEL_LABELS.slideLabel({ index: index + 1, total });
      write(slide, "aria-label", label ?? auto);
      const align = oneOf<CarouselSnapAlign | "">(slide, "snap-align", ["", "start", "center", "end"]) || state.snapAlign;
      write(slide, "data-snap-align", carouselSnapStart(layout, index) ? align : null);
    });

    for (const [tag, open] of [
      [PREVIOUS, bounds.previous],
      [NEXT, bounds.next],
    ] as const) {
      for (const part of this.parts(tag)) {
        const button = decoratable(part);
        if (!button) continue;
        const disabled = part.hasAttribute("disabled") || !open;
        write(button, "disabled", disabled ? "" : null);
        write(button, "aria-disabled", String(disabled));
      }
    }

    for (const part of this.parts(PLAY)) {
      if (!state.autoplay) {
        reportOnce(part, `<${PLAY}> needs autoplay on its <${ROOT}>.`);
        continue;
      }
      const button = decoratable(part);
      if (!button) continue;
      write(button, "aria-label", state.playing ? labels.stop : labels.start);
      write(button, "data-state", state.playing ? "playing" : "paused");
      for (const shown of button.querySelectorAll("[data-play-state]")) {
        write(shown, "hidden", shown.getAttribute("data-play-state") === (state.playing ? "playing" : "paused") ? null : "");
      }
    }

    for (const group of this.parts(`${GROUP}, ${INDICATORS}`)) {
      write(group, "role", "group");
      const label = group.getAttribute("label");
      if (label !== null) write(group, "aria-label", label);
    }
    for (const indicators of this.parts(INDICATORS)) this.#stamp(indicators, layout.totalPages);

    for (const part of this.parts(INDICATOR)) {
      const button = decoratable(part);
      if (!button) continue;
      const index = numberAttribute(part, "index", 0);
      const active = index === state.page;
      const readOnly = part.hasAttribute("read-only");
      write(button, "data-carousel-indicator", "");
      write(button, "data-state", active ? "active" : "inactive");
      write(button, "aria-hidden", readOnly ? "true" : null);
      const name = labels.indicator
        ? carouselFormat(labels.indicator, { index: index + 1 })
        : CAROUSEL_LABELS.indicatorLabel({ index: index + 1 });
      write(button, "aria-label", readOnly ? null : name);
      write(button, "aria-disabled", readOnly ? null : String(active));
    }

    for (const progress of this.parts(PROGRESS)) {
      const text = labels.progress
        ? carouselFormat(labels.progress, { page: state.page + 1, total: layout.totalPages })
        : CAROUSEL_LABELS.progressText({ page: state.page, totalPages: layout.totalPages });
      if (progress.textContent !== text) progress.textContent = text;
    }

    this.#carousel.sync();
  }

  /**
   * One `<primitiv-carousel-indicator>` per page inside `indicators`, each
   * holding a copy of its `<template>`'s first element (a bare `<button>`
   * without one). Indicators already there are kept, so a server-rendered set
   * is adopted as it is.
   */
  #stamp(indicators: HTMLElement, pages: number): void {
    const rendered = [...indicators.children].filter((child) => child.localName === INDICATOR);
    for (const extra of rendered.slice(pages)) extra.remove();
    const template = indicators.querySelector<HTMLTemplateElement>(":scope > template");
    for (let index = rendered.length; index < pages; index++) {
      const indicator = document.createElement(INDICATOR);
      indicator.setAttribute("index", String(index));
      const control = template?.content.firstElementChild?.cloneNode(true) as HTMLElement | undefined;
      indicator.append(control ?? Object.assign(document.createElement("button"), { type: "button" }));
      indicators.append(indicator);
    }
  }
}

/**
 * `<primitiv-carousel-viewport>` — the scroll container the slides sit in.
 * Structural: the root makes it focusable, the live region for page changes
 * (`aria-live` off while autoplay rotates), and the target of the arrow keys,
 * the wheel and a mouse drag.
 *
 * @customElement primitiv-carousel-viewport
 */
export class PrimitivCarouselViewportElement extends ElementBase {}

/**
 * `<primitiv-carousel-track>` — the strip an infinite loop translates, a direct
 * child of the viewport around the slides. Needed only for `loop="infinite"`;
 * the root fills it with inert, aria-hidden copies of the slides either side.
 *
 * @customElement primitiv-carousel-track
 */
export class PrimitivCarouselTrackElement extends ElementBase {}

/**
 * `<primitiv-carousel-slide>` — one slide: a `group` with the role description
 * "slide", named "N of M" unless it has a `label`.
 *
 * @customElement primitiv-carousel-slide
 * @attr {string} label - The slide's name, in place of the "N of M" the root writes.
 * @attr {"start" | "center" | "end"} snap-align - Where this slide rests, overriding the root's `snap-align`. Read only on a page's leading slide.
 */
export class PrimitivCarouselSlideElement extends ElementBase {}

/**
 * `<primitiv-carousel-previous-trigger>` — an interactive part decorating the
 * one `<button>` it holds: it retreats a page, and is disabled at the first
 * (unless looping).
 *
 * @customElement primitiv-carousel-previous-trigger
 * @attr {boolean} disabled - Disables the control whatever the page.
 */
export class PrimitivCarouselPreviousTriggerElement extends ElementBase {}

/**
 * `<primitiv-carousel-next-trigger>` — an interactive part decorating the one
 * `<button>` it holds: it advances a page, and is disabled at the last (unless
 * looping).
 *
 * @customElement primitiv-carousel-next-trigger
 * @attr {boolean} disabled - Disables the control whatever the page.
 */
export class PrimitivCarouselNextTriggerElement extends ElementBase {}

/**
 * `<primitiv-carousel-play-pause-trigger>` — an interactive part decorating the
 * one `<button>` it holds: it starts and stops autoplay, named for what it will
 * do. Elements inside the button marked `data-play-state="playing"` or
 * `"paused"` show only in that state, for a glyph that swaps; they are hidden
 * with `hidden`, which an `<svg>` ignores, so mark a `<span>` around each glyph.
 * Needs `autoplay` on the root.
 *
 * @customElement primitiv-carousel-play-pause-trigger
 */
export class PrimitivCarouselPlayPauseTriggerElement extends ElementBase {}

/**
 * `<primitiv-carousel-indicator-group>` — a `group` holding indicators you
 * write yourself (thumbnails, custom marks).
 *
 * @customElement primitiv-carousel-indicator-group
 * @attr {string} label - The group's name. Give it this or `aria-labelledby`.
 */
export class PrimitivCarouselIndicatorGroupElement extends ElementBase {}

/**
 * `<primitiv-carousel-indicators>` — a `group` the root fills with one
 * indicator per page, each a copy of its `<template>`'s first element, or a bare
 * `<button>` without one. Indicators already inside are kept.
 *
 * @customElement primitiv-carousel-indicators
 * @attr {string} label - The group's name. Give it this or `aria-labelledby`.
 */
export class PrimitivCarouselIndicatorsElement extends ElementBase {}

/**
 * `<primitiv-carousel-indicator>` — an interactive part decorating the one
 * `<button>` it holds: it jumps to its page, named "Slide N", and marked
 * `aria-disabled` while its page is active.
 *
 * @customElement primitiv-carousel-indicator
 * @attr {number} index - The zero-based page it jumps to.
 * @attr {boolean} read-only - Shows the state but navigates nowhere, hidden from assistive technology.
 */
export class PrimitivCarouselIndicatorElement extends ElementBase {}

/**
 * `<primitiv-carousel-progress-text>` — text the root keeps as "N of M", from
 * the root's `progress-label`.
 *
 * @customElement primitiv-carousel-progress-text
 */
export class PrimitivCarouselProgressTextElement extends ElementBase {}

/**
 * Define the eleven Carousel elements on `registry` (the global
 * `customElements` by default). Safe to call more than once, and a no-op where
 * there is no registry (a server render).
 */
export function defineCarousel(registry: ElementRegistry | undefined = globalThis.customElements): void {
  defineElements(registry, [
    [ROOT, PrimitivCarouselElement],
    [VIEWPORT, PrimitivCarouselViewportElement],
    [TRACK, PrimitivCarouselTrackElement],
    [SLIDE, PrimitivCarouselSlideElement],
    [PREVIOUS, PrimitivCarouselPreviousTriggerElement],
    [NEXT, PrimitivCarouselNextTriggerElement],
    [PLAY, PrimitivCarouselPlayPauseTriggerElement],
    [GROUP, PrimitivCarouselIndicatorGroupElement],
    [INDICATORS, PrimitivCarouselIndicatorsElement],
    [INDICATOR, PrimitivCarouselIndicatorElement],
    [PROGRESS, PrimitivCarouselProgressTextElement],
  ]);
}
