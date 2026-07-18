import { createRef } from "react";
import { render, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MockResizeObserver } from "../../test/resizeObserverPolyfill";
import { Carousel } from "../index.ts";
import type { CarouselImperativeApi } from "../index.ts";

/**
 * Dispatch a pointer event with a controlled `timeStamp` (jsdom's is not
 * settable via fireEvent props) so drag velocity is deterministic. clientX and
 * clientY both carry `client` so the same helper drives either axis.
 */
function pointer(
  target: Element,
  type: string,
  {
    client,
    time = 0,
    id = 1,
    pointerType = "touch",
  }: { client: number; time?: number; id?: number; pointerType?: string },
) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.assign(event, {
    clientX: client,
    clientY: client,
    pointerId: id,
    pointerType,
  });
  Object.defineProperty(event, "timeStamp", {
    configurable: true,
    value: time,
  });
  act(() => {
    fireEvent(target, event);
  });
}

/**
 * Fire the track's `transitionend` (jsdom runs no transitions, so the glide
 * settle that triggers the re-base is simulated). Carries `propertyName:
 * "transform"` — the engine ignores any other property.
 */
function fireEnd(track: Element, propertyName = "transform") {
  const event = new Event("transitionend", { bubbles: true });
  Object.assign(event, { propertyName });
  act(() => {
    fireEvent(track, event);
  });
}

// The infinite transform engine (RFC 0018 / useCarouselLoop). Real geometry is
// browser-only (jsdom lays nothing out), so these mock the layout the engine
// reads (offsetLeft/Top, offsetWidth/Height, clientWidth/Height) and assert the
// resulting track / per-slide transforms and the CSS transition that drives the
// glide. Pixel behaviour and smoothness are verified in Playwright.

const STRIDE = 100; // slide size + gap
const SLIDE = 100;
const VIEWPORT = 100; // → centre align offset 0, so transforms read cleanly

function defineGeometry() {
  // A slide's layout position is its index × stride; every slide is SLIDE wide;
  // the viewport is VIEWPORT wide. Defined on the prototype so both axes read
  // the same numbers (horizontal uses left/width, vertical top/height).
  const indexPos = function (this: HTMLElement) {
    const index = this.getAttribute?.("data-index");
    return index != null ? Number(index) * STRIDE : 0;
  };
  const slideSize = function (this: HTMLElement) {
    return this.hasAttribute?.("data-carousel-slide") ? SLIDE : 0;
  };
  // The engine measures the TRACK's own content box (peek/padding is the
  // viewport's, kept out of the maths), so the harness sizes the track.
  const viewportSize = function (this: HTMLElement) {
    return this.hasAttribute?.("data-carousel-track") ? VIEWPORT : 0;
  };
  for (const [prop, get] of [
    ["offsetLeft", indexPos],
    ["offsetTop", indexPos],
    ["offsetWidth", slideSize],
    ["offsetHeight", slideSize],
    ["clientWidth", viewportSize],
    ["clientHeight", viewportSize],
  ] as const) {
    Object.defineProperty(HTMLElement.prototype, prop, {
      configurable: true,
      get,
    });
  }
  // The engine measures via getBoundingClientRect (sub-pixel). Compose the same
  // numbers into a rect: a slide starts at index × stride and is SLIDE big; the
  // track starts at 0 and is VIEWPORT big (its own content box). jsdom applies no
  // transform, so the mock is the pure layout the engine reads via differences.
  stdRect();
}

// Install a getBoundingClientRect that derives left/top/width/height from a
// per-element { start, size } (both axes share the numbers, as the offsets do).
function defineRect(
  layout: (this: HTMLElement) => { start: number; size: number },
) {
  Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", {
    configurable: true,
    value: function (this: HTMLElement) {
      const { start, size } = layout.call(this);
      return {
        left: start,
        top: start,
        right: start + size,
        bottom: start + size,
        width: size,
        height: size,
        x: start,
        y: start,
        toJSON() {},
      } as DOMRect;
    },
  });
}

// The standard rect layout, with per-test overrides: the track (and, by
// default, the viewport around it — coincident with no peek/padding) is
// `trackSize` wide, a slide is SLIDE, and a real slide (data-index) starts at
// `startFor(i)` (default index × stride; negate for RTL, offset for the clone
// buffer, zero to collapse the stride). Clones/other elements start at 0.
function stdRect({
  trackSize = VIEWPORT,
  viewportSize = trackSize,
  startFor = (i: number) => i * STRIDE,
}: {
  trackSize?: number;
  viewportSize?: number;
  startFor?: (index: number) => number;
} = {}) {
  defineRect(function (this: HTMLElement) {
    const raw = this.getAttribute?.("data-index");
    const index = raw != null ? Number(raw) : null;
    const isTrack = this.hasAttribute?.("data-carousel-track");
    const isViewport = this.hasAttribute?.("data-carousel-viewport");
    const isSlide = this.hasAttribute?.("data-carousel-slide");
    return {
      start: index != null ? startFor(index) : 0,
      size: isTrack
        ? trackSize
        : isViewport
          ? viewportSize
          : isSlide
            ? SLIDE
            : 0,
    };
  });
}

beforeEach(() => {
  defineGeometry();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  for (const prop of [
    "offsetLeft",
    "offsetTop",
    "offsetWidth",
    "offsetHeight",
    "clientWidth",
    "clientHeight",
    "getBoundingClientRect",
  ]) {
    delete (HTMLElement.prototype as unknown as Record<string, unknown>)[prop];
  }
});

function renderInfinite(
  props: Partial<{
    loop: "infinite" | "wrap";
    orientation: "horizontal" | "vertical";
    snapAlign: "start" | "center" | "end";
    defaultPage: number;
    count: number;
    allowMouseDrag: boolean;
    slidesPerPage: number;
    apiRef: React.Ref<CarouselImperativeApi>;
  }> = {},
) {
  const {
    loop = "infinite",
    orientation = "horizontal",
    snapAlign = "center",
    defaultPage = 0,
    count = 4,
    allowMouseDrag = false,
    slidesPerPage = 1,
    apiRef,
  } = props;
  const result = render(
    <Carousel.Root
      ref={apiRef}
      ariaLabel="Featured products"
      loop={loop}
      orientation={orientation}
      snapAlign={snapAlign}
      defaultPage={defaultPage}
      allowMouseDrag={allowMouseDrag}
      slidesPerPage={slidesPerPage}
    >
      <Carousel.Viewport data-testid="viewport">
        {Array.from({ length: count }).map((_, i) => (
          <Carousel.Slide key={i} data-testid={`slide-${i}`} />
        ))}
      </Carousel.Viewport>
      <Carousel.PreviousTrigger>Previous</Carousel.PreviousTrigger>
      <Carousel.NextTrigger>Next</Carousel.NextTrigger>
    </Carousel.Root>,
  );
  const track = result.container.querySelector<HTMLElement>(
    "[data-carousel-track]",
  );
  return { ...result, track };
}

describe("Carousel infinite — transform engine", () => {
  it("wraps the real slides in a track for infinite, and not for other modes", () => {
    const infinite = renderInfinite({ loop: "infinite" });
    expect(infinite.track).not.toBeNull();
    // The real slides carry a data-index (the clones have it stripped).
    expect(
      infinite.track!.querySelectorAll("[data-carousel-slide][data-index]"),
    ).toHaveLength(4);

    const wrap = renderInfinite({ loop: "wrap" });
    expect(wrap.track).toBeNull();
  });

  it("flanks the real slides with a full period of aria-hidden, inert clones", () => {
    const { track } = renderInfinite({ count: 4 });
    const head = track!.querySelector('[data-carousel-clones="head"]')!;
    const tail = track!.querySelector('[data-carousel-clones="tail"]')!;
    // One period each side → a periodic strip whose every seam is painted DOM.
    expect(head.children).toHaveLength(4);
    expect(tail.children).toHaveLength(4);
    const clone = head.children[0] as HTMLElement;
    expect(clone.getAttribute("aria-hidden")).toBe("true");
    expect(clone.hasAttribute("inert")).toBe(true);
    expect(clone.hasAttribute("data-carousel-clone")).toBe(true);
    // A clone is presentational only — no index/state that would double-count.
    expect(clone.hasAttribute("data-index")).toBe(false);
  });

  it("rebuilds clones when a slide's own content changes, not just its count", async () => {
    // The builder toggles a slide's *content* (gradient <-> picture) without
    // changing the slide count/keys — the clone-rebuild effect's deps
    // (isInfinite, slideKeys, refreshTick) don't fire for that, so a stale
    // clone kept showing the OLD content until something else happened to
    // rebuild it. Crossing the seam then briefly shows the stale clone before
    // the settle re-base swaps in the fresh real slide at the same pixels —
    // "I still see the gradient momentarily, then it quickly changes to a
    // picture." Same key, same count, only the children differ.
    function App({ label }: { label: string }) {
      return (
        <Carousel.Root ariaLabel="Featured" loop="infinite">
          <Carousel.Viewport>
            {[0, 1, 2, 3].map((i) => (
              <Carousel.Slide key={i}>{label}</Carousel.Slide>
            ))}
          </Carousel.Viewport>
        </Carousel.Root>
      );
    }
    const { container, rerender } = render(<App label="gradient" />);
    const head = container.querySelector('[data-carousel-clones="head"]')!;
    expect(head.children[0]!.textContent).toBe("gradient");

    rerender(<App label="picture" />);
    // MutationObserver callbacks fire as a microtask, not synchronously
    // within rerender() — flush one before asserting the clone caught up.
    await act(async () => {
      await Promise.resolve();
    });

    expect(head.children[0]!.textContent).toBe("picture");
  });

  it("does not rebuild clones for the engine's own visibility/--slide-progress writes", async () => {
    // paint() writes `visibility` and `--slide-progress` onto every real
    // slide's inline style on every navigation, drag pointermove, and rAF
    // tick of an animated glide. The clone-content observer must not mistake
    // that continuous bookkeeping for a genuine consumer change, or it
    // thrashes rebuildClones() (full clone-strip teardown/rebuild) dozens of
    // times a second — exactly the DOM churn that made images flicker/blank
    // during a drag or glide. rebuildClones() replaces every clone with a
    // brand-new node (`replaceChildren` + fresh `cloneNode`s), so a rebuild
    // is observable as a change of node *identity* at `head.children[0]` —
    // comparing the node's own attributes to itself would prove nothing,
    // since a detached node's attributes never change after the fact.
    render(
      <Carousel.Root ariaLabel="Featured" loop="infinite">
        <Carousel.Viewport>
          {[0, 1, 2, 3].map((i) => (
            <Carousel.Slide key={i}>{i}</Carousel.Slide>
          ))}
        </Carousel.Viewport>
      </Carousel.Root>,
    );
    const head = document.querySelector('[data-carousel-clones="head"]')!;
    const realSlide = document.querySelector(
      '[data-carousel-slide][data-index="0"]',
    ) as HTMLElement;
    const cloneBefore = head.children[0];

    realSlide.style.visibility = "hidden";
    realSlide.style.setProperty("--slide-progress", "0.987654");
    await act(async () => {
      await Promise.resolve();
    });

    expect(head.children[0]).toBe(cloneBefore);
  });

  it("does not rebuild clones when a real slide's style attribute is cleared entirely", async () => {
    // Exercises the other half of the before/after style comparison: the
    // *current* side reading `null` (no style attribute at all) rather than
    // the *old* side. A plain slide's only inline style is the engine's own
    // visibility/--slide-progress, so removing the whole attribute strips to
    // the same "nothing" on both sides — still not a genuine content change.
    render(
      <Carousel.Root ariaLabel="Featured" loop="infinite">
        <Carousel.Viewport>
          {[0, 1, 2, 3].map((i) => (
            <Carousel.Slide key={i}>{i}</Carousel.Slide>
          ))}
        </Carousel.Viewport>
      </Carousel.Root>,
    );
    const head = document.querySelector('[data-carousel-clones="head"]')!;
    const realSlide = document.querySelector(
      '[data-carousel-slide][data-index="0"]',
    ) as HTMLElement;
    const cloneBefore = head.children[0];

    realSlide.removeAttribute("style");
    await act(async () => {
      await Promise.resolve();
    });

    expect(head.children[0]).toBe(cloneBefore);
  });

  it("still rebuilds clones when a slide's own inline style changes for real", async () => {
    // The reported bug used an inline-style content swap specifically (the
    // builder's gradient <-> picture toggle sets `style={{ background }}`
    // directly on the slide) — stripping the engine's own visibility/
    // --slide-progress properties out of the comparison (above) must not
    // also blind the observer to this genuine case.
    function App({ background }: { background: string }) {
      return (
        <Carousel.Root ariaLabel="Featured" loop="infinite">
          <Carousel.Viewport>
            {[0, 1, 2, 3].map((i) => (
              <Carousel.Slide key={i} style={{ background }} />
            ))}
          </Carousel.Viewport>
        </Carousel.Root>
      );
    }
    const { container, rerender } = render(<App background="red" />);
    const head = container.querySelector('[data-carousel-clones="head"]')!;
    expect((head.children[0] as HTMLElement).style.background).toBe("red");

    rerender(<App background="blue" />);
    await act(async () => {
      await Promise.resolve();
    });

    expect((head.children[0] as HTMLElement).style.background).toBe("blue");
  });

  it("rebuilds clones when a slide's own class (or any other attribute) changes", async () => {
    // Only "style" needs the finer before/after check (the engine and a
    // consumer both write it) and only data-state/data-index are routine
    // per-navigation noise — every other attribute a consumer might set
    // (className, aria-*, a data-* the app owns) still means genuinely new
    // clone content and must still trigger a rebuild.
    render(
      <Carousel.Root ariaLabel="Featured" loop="infinite">
        <Carousel.Viewport>
          {[0, 1, 2, 3].map((i) => (
            <Carousel.Slide key={i}>{i}</Carousel.Slide>
          ))}
        </Carousel.Viewport>
      </Carousel.Root>,
    );
    const head = document.querySelector('[data-carousel-clones="head"]')!;
    const realSlide = document.querySelector(
      '[data-carousel-slide][data-index="0"]',
    ) as HTMLElement;
    const cloneBefore = head.children[0];

    realSlide.className = "featured-slide";
    await act(async () => {
      await Promise.resolve();
    });

    expect(head.children[0]).not.toBe(cloneBefore);
  });

  it("keeps the offset within one period under rapid navigation (no run-off)", async () => {
    // Rapid Next clicks retarget the transition before it ends, so the settle
    // re-base never fires; without a start-of-glide re-base the offset accumulates
    // (+100 per click) and the track translates right off the one-period clone
    // buffer into unpainted space — a blank until you pause. Six Nexts on a 4-slide
    // loop must stay bounded to one period, not reach −600.
    const user = userEvent.setup();
    const { track, getByRole } = renderInfinite();
    const next = getByRole("button", { name: "Next" });
    for (let i = 0; i < 6; i++) await user.click(next);
    // 6 Nexts, re-based each glide: offset cycles 100,200,300,400→0,100,200 → −200.
    expect(track!.style.transform).toBe("translate(-200px, 0px)");
  });

  it("subtracts the first real slide's position so the clone buffer is offset out", () => {
    // In a real browser the leading clone buffer pushes real slide 0 to
    // offsetLeft = bufferWidth (measured track-relative). Simulate that: real
    // slides sit at (index + 4) × stride, so basePos = 400. The track transform
    // must subtract it (align − basePos − offset) so real slide 0 still rests at
    // `align`, not shoved off by the buffer.
    stdRect({ startFor: (i) => (i + 4) * STRIDE });
    const { track } = renderInfinite({ snapAlign: "center" });
    // align 0, basePos 400, offset 0 → translate(0 − 400 − 0) = −400.
    expect(track!.style.transform).toBe("translate(-400px, 0px)");
  });

  it("positions the track on the active page at rest, instantly (no glide on load)", () => {
    const { track } = renderInfinite({ snapAlign: "center" });
    // align (VIEWPORT−SLIDE)/2 = 0, offset 0 → translate3d(0). First paint is
    // instant, so no transition.
    expect(track!.style.transform).toBe("translate(0px, 0px)");
    expect(track!.style.transition).toBe("none");
  });

  it("glides forward one stride via a CSS transition when Next advances a page", async () => {
    const user = userEvent.setup();
    const { track, getByRole } = renderInfinite();

    await user.click(getByRole("button", { name: "Next" }));

    // Page 0 → 1: offset 1×stride = 100 → translate3d(align − 100) = −100, driven
    // by a transform transition (the smooth, GPU-composited glide).
    expect(track!.style.transform).toBe("translate(-100px, 0px)");
    expect(track!.style.transition).toContain("transform");
  });

  it("drives the glide with the CSS custom properties when they are set", () => {
    // The engine reads --primitiv-carousel-glide-duration / -easing off the track
    // (a consumer sets them via a --glide-* preset or their own CSS) and builds the
    // transform transition from them, so glide timing and easing are customisable —
    // only for the infinite loop, which owns its JS transition (native modes glide
    // via browser scroll). Spy on getComputedStyle, delegating everything but the
    // two glide props to the real one.
    const real = window.getComputedStyle.bind(window);
    vi.spyOn(window, "getComputedStyle").mockImplementation((el: Element) => {
      const style = real(el);
      return new Proxy(style, {
        get(target, prop) {
          if (prop === "getPropertyValue")
            return (name: string) =>
              name === "--primitiv-carousel-glide-duration"
                ? "250ms"
                : name === "--primitiv-carousel-glide-easing"
                  ? "ease-in"
                  : target.getPropertyValue(name);
          const value = Reflect.get(target, prop);
          return typeof value === "function" ? value.bind(target) : value;
        },
      }) as CSSStyleDeclaration;
    });
    const { track, getByRole } = renderInfinite();

    fireEvent.click(getByRole("button", { name: "Next" }));

    expect(track!.style.transition).toBe("transform 250ms ease-in");
  });

  it("defaults the glide to 500ms ease-out when no custom properties are set", () => {
    // Fallback for the headless package with no registry stylesheet: the built-in
    // glide matches the default (`medium`) the stylesheet would otherwise supply.
    const { track, getByRole } = renderInfinite();

    fireEvent.click(getByRole("button", { name: "Next" }));

    expect(track!.style.transition).toBe(
      "transform 500ms cubic-bezier(0, 0, 0.2, 1)",
    );
  });

  it("wraps the SHORT way from the last page to the first, then re-bases", async () => {
    const user = userEvent.setup();
    // 4 slides, start on the last. The re-base normalizes the mount to offset 300
    // (real slide 3 at its own position) → translate3d(−300).
    const { track, getByRole } = renderInfinite({ defaultPage: 3 });
    expect(track!.style.transform).toBe("translate(-300px, 0px)");

    await user.click(getByRole("button", { name: "Next" }));

    // 3 → 0 is +1 forward: offset 300 → 400 (onto the clone of slide 0), a single
    // step onward, not a rewind. The glide animates to the clone…
    expect(track!.style.transform).toBe("translate(-400px, 0px)");
    expect(track!.style.transition).toContain("transform");

    // …and once it settles the track re-bases by one period to the REAL slide 0
    // at the identical pixels (offset 0), instantly and invisibly.
    fireEnd(track!);
    expect(track!.style.transform).toBe("translate(0px, 0px)");
    expect(track!.style.transition).toBe("none");
  });

  it("travels the LITERAL way for a direct goTo jump, not the ring's wrap shortcut", () => {
    // Clicking the LAST indicator/thumbnail from the first should visibly pass
    // through every slide in between, matching the indicators' own reading
    // order — unlike Next/Previous, a direct jump has no "wrap" to shortcut.
    // 4 slides, start on the first (offset 0). shortestStep(0, 3, 4) would take
    // the ring's short way (a single step BACKWARD, onto the tail clone); the
    // literal distance is +3 forward instead.
    const ref = createRef<CarouselImperativeApi>();
    const { track } = renderInfinite({ apiRef: ref });
    expect(track!.style.transform).toBe("translate(0px, 0px)");

    act(() => {
      ref.current!.goTo(3);
    });

    // offset 0 → 300 (real slide 3's own position): +3 forward, not the -1
    // wrap shortcut (which would have read translate(100px, 0px)).
    expect(track!.style.transform).toBe("translate(-300px, 0px)");
  });

  it("travels the LITERAL way in reverse too — last page back to the first", () => {
    // The reverse of the above: starting on the last page and jumping to the
    // first should travel BACKWARD through every slide, not take the +1
    // wrap-forward shortcut onto the head clone.
    const ref = createRef<CarouselImperativeApi>();
    const { track } = renderInfinite({ apiRef: ref, defaultPage: 3 });
    expect(track!.style.transform).toBe("translate(-300px, 0px)");

    act(() => {
      ref.current!.goTo(0);
    });

    // offset 300 → 0: -3 backward, not the +1 wrap shortcut (which would have
    // read translate(-400px, 0px), the clone-of-0 pixel).
    expect(track!.style.transform).toBe("translate(0px, 0px)");
  });

  it("still wraps the SHORT way for next()/previous(), even after a direct goTo", () => {
    // The one-shot directJumpRef must not leak past the single navigation that
    // set it — a goTo() followed by a plain Next should go straight back to
    // using the wrap shortcut.
    const ref = createRef<CarouselImperativeApi>();
    const { track, getByRole } = renderInfinite({
      apiRef: ref,
      defaultPage: 3,
    });
    expect(track!.style.transform).toBe("translate(-300px, 0px)");

    act(() => {
      ref.current!.goTo(0);
    });
    expect(track!.style.transform).toBe("translate(0px, 0px)");
    fireEnd(track!);

    fireEvent.click(getByRole("button", { name: "Previous" }));

    // 0 → 3 the short way is -1 (onto the tail clone at offset -100), not the
    // literal -3 a leaked directJumpRef would have produced.
    expect(track!.style.transform).toBe("translate(100px, 0px)");
  });

  it("never gives a real slide its own transform (all ride the track layer)", () => {
    // The seam is filled by clones, not by shifting individual slides, so no real
    // slide ever carries a transform — the whole strip paints into the track's one
    // compositor layer (an off-screen per-slide layer is the iOS white-flash).
    const { track } = renderInfinite({ defaultPage: 0 });
    const realSlides = track!.querySelectorAll<HTMLElement>(
      "[data-carousel-slide][data-index]",
    );
    expect(realSlides).toHaveLength(4);
    for (const slide of realSlides) expect(slide.style.transform).toBe("");
  });

  it("windows the painted set — hides slides far from the viewport at rest", () => {
    // The clone strip is far wider than the screen; iOS rasterises a wide
    // composited layer in tiles on demand, blanking the entering edge for a
    // frame. Windowing paints only the on-screen slides (plus a viewport of
    // slack) and `visibility: hidden`s the rest, so the composited surface is
    // ~one screen wide — a hidden slide is still laid out (measured, registered,
    // interactive when shown) but contributes nothing to rasterise.
    const { track } = renderInfinite({ count: 4 });
    const real = (i: number) =>
      track!.querySelector<HTMLElement>(
        `[data-carousel-slide][data-index="${i}"]`,
      )!;
    // At rest (offset 0, viewport 100) slide 0 is on-screen and slide 2 is
    // within the one-viewport margin; slide 3 (three strides right) is beyond
    // it → hidden.
    expect(real(0).style.visibility).toBe("");
    expect(real(2).style.visibility).toBe("");
    expect(real(3).style.visibility).toBe("hidden");
  });

  it("keeps --slide-progress live across a navigation, the way native scroll mode does", async () => {
    // Parallax (and any other consumer of the "Continuous scroll progress"
    // signal) reads --slide-progress. Native mode's effect (useCarouselViewport)
    // recomputes it from real scroll position — a `scroll` event fires on every
    // native scroll step. Under infinite, nothing ever scrolls (the engine
    // translates the TRACK via CSS transform instead), so that effect's
    // listeners never fire again after its one synchronous read on mount: the
    // signal is coincidentally correct at rest (mount happens to run after the
    // engine's own first paint) but then FROZEN forever — parallax would never
    // visibly drift on any subsequent navigation. Click Next and confirm the
    // newly-active slide (1) becomes centred (0) and the previously-active one
    // (0) moves off-centre (1) — this is what would stay stale without the
    // engine driving its own --slide-progress.
    const user = userEvent.setup();
    const { track, getByRole } = renderInfinite({ count: 4 });
    const real = (i: number) =>
      track!.querySelector<HTMLElement>(
        `[data-carousel-slide][data-index="${i}"]`,
      )!;
    expect(real(0).style.getPropertyValue("--slide-progress")).toBe("0");

    await user.click(getByRole("button", { name: "Next" }));

    expect(real(1).style.getPropertyValue("--slide-progress")).toBe("0");
    expect(real(0).style.getPropertyValue("--slide-progress")).toBe("-1");
  });

  it("defends --slide-progress against a zero-size track (divide-by-zero guard)", () => {
    // Mirrors the native scroll-progress signal's own defensive guard
    // (Carousel.scroll-progress.test.tsx) for the same reason: a 0 track (and,
    // by default, viewport) size — nothing measured yet — would otherwise
    // divide by zero. Covers both paint()'s analytic guard and the live
    // ticker's own copy of it (triggered by an animated glide).
    stdRect({ trackSize: 0 });
    vi.useFakeTimers();
    try {
      const { track, getByRole } = renderInfinite({ count: 4 });
      const real0 = track!.querySelector<HTMLElement>(
        '[data-carousel-slide][data-index="0"]',
      )!;
      expect(real0.style.getPropertyValue("--slide-progress")).toBe("0");

      fireEvent.click(getByRole("button", { name: "Next" }));
      expect(() => vi.advanceTimersToNextFrame()).not.toThrow();
      expect(real0.style.getPropertyValue("--slide-progress")).toBe("0");
    } finally {
      vi.useRealTimers();
    }
  });

  it("live-updates --slide-progress on the block axis for a vertical infinite loop", () => {
    // Same live ticker as the horizontal case, just the block-axis branch of
    // its viewport-center / slide-center math.
    vi.useFakeTimers();
    try {
      const { track, getByRole } = renderInfinite({
        count: 4,
        orientation: "vertical",
      });
      const real0 = track!.querySelector<HTMLElement>(
        '[data-carousel-slide][data-index="0"]',
      )!;

      fireEvent.click(getByRole("button", { name: "Next" }));
      expect(() => vi.advanceTimersToNextFrame()).not.toThrow();
      expect(real0.style.getPropertyValue("--slide-progress")).toBe("0");
    } finally {
      vi.useRealTimers();
    }
  });

  it("live-updates --slide-progress every frame while an animated glide is in flight, then stops on settle", () => {
    // Unlike paint()'s analytic value (set once, correct only for the settled
    // target), a button-driven glide's *visual* position is mid-transition for
    // its whole duration — parallax content needs to track that continuously or
    // it snaps to the end value instead of drifting alongside the slide. The
    // engine runs a rAF ticker for exactly the animated-glide duration, reading
    // live positions each frame. jsdom applies no real transform (this harness's
    // mocked rects are transform-invariant by design, like every other geometry
    // mock in this file), so the ticker's *value* can't be distinguished from
    // paint()'s here — device/Playwright confirms the visual drift — but its
    // code path (including the zero-guard) still runs and must not throw, and it
    // must stop itself once the transition ends (an indefinitely-running ticker
    // would burn a frame's work forever).
    vi.useFakeTimers();
    try {
      const { track, getByRole } = renderInfinite({ count: 4 });
      const real0 = track!.querySelector<HTMLElement>(
        '[data-carousel-slide][data-index="0"]',
      )!;
      const cancelSpy = vi.spyOn(window, "cancelAnimationFrame");

      fireEvent.click(getByRole("button", { name: "Next" }));
      expect(() => vi.advanceTimersToNextFrame()).not.toThrow();
      expect(real0.style.getPropertyValue("--slide-progress")).toBe("0");

      // The settle (transitionend) stops the ticker.
      fireEnd(track!);
      expect(cancelSpy).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("strips ids from the cloned subtree so no id is duplicated", () => {
    const { container } = render(
      <Carousel.Root ariaLabel="Featured" loop="infinite">
        <Carousel.Viewport>
          <Carousel.Slide>
            <span id="deep-link">link</span>
          </Carousel.Slide>
          <Carousel.Slide />
        </Carousel.Viewport>
      </Carousel.Root>,
    );
    // The real subtree keeps its id; the clones (a full period each side) must not
    // duplicate it — exactly one #deep-link in the whole tree.
    expect(container.querySelectorAll("#deep-link")).toHaveLength(1);
    const head = container.querySelector('[data-carousel-clones="head"]')!;
    expect(head.querySelector("#deep-link")).toBeNull();
    expect(head.querySelector("span")).not.toBeNull(); // content still cloned
  });

  it("re-bases only when the settled offset is out of the real range", async () => {
    const user = userEvent.setup();
    const { track, getByRole } = renderInfinite();

    await user.click(getByRole("button", { name: "Next" }));
    // Offset 100 is already within [0, 400): the settle is a no-op, the transform
    // stays put (and the transition flips to none on the instant no-op repaint…
    // which doesn't run — the guard returns early, so the transition is untouched).
    expect(track!.style.transform).toBe("translate(-100px, 0px)");
    fireEnd(track!);
    expect(track!.style.transform).toBe("translate(-100px, 0px)");
  });

  it("ignores a transitionend for a property other than transform", async () => {
    const user = userEvent.setup();
    // defaultPage 3 rests at offset 300; Next glides to 400 (a clone) awaiting a
    // transform settle to re-base. A non-transform transitionend must not re-base.
    const { track, getByRole } = renderInfinite({ defaultPage: 3 });
    await user.click(getByRole("button", { name: "Next" }));
    expect(track!.style.transform).toBe("translate(-400px, 0px)");

    fireEnd(track!, "opacity");
    expect(track!.style.transform).toBe("translate(-400px, 0px)");
    // The real transform settle still re-bases.
    fireEnd(track!, "transform");
    expect(track!.style.transform).toBe("translate(0px, 0px)");
  });

  it("ignores a transform settle when there is nothing to measure", () => {
    // One slide → measure() bails, so a settle can't re-base (nothing to loop).
    const { track } = renderInfinite({ count: 1 });
    expect(() => fireEnd(track!)).not.toThrow();
    expect(track!.style.transform).toBe("");
  });

  it("jumps instantly with no transition under reduced motion", async () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    const user = userEvent.setup();
    const { track, getByRole } = renderInfinite();

    await user.click(getByRole("button", { name: "Next" }));

    expect(track!.style.transform).toBe("translate(-100px, 0px)");
    expect(track!.style.transition).toBe("none");
  });

  it("drives the block axis for a vertical infinite loop", async () => {
    const user = userEvent.setup();
    const { track, getByRole } = renderInfinite({ orientation: "vertical" });

    await user.click(getByRole("button", { name: "Next" }));

    expect(track!.style.transform).toBe("translate(0px, -100px)");
  });

  it("advances a whole page (not one slide) for multi-slide infinite", async () => {
    // 6 slides, 2 per page → pages lead at slide 0, 2, 4. Next must glide to the
    // next page's leading slide (index 2 = two strides), not one slide: the engine
    // has to drive off the page's leading slide index, not the page number.
    // The track holds the whole 2-slide page (span = stride + slide = 200), so it's
    // sized to 200 and the page rests flush (align 0) instead of one slide centred.
    stdRect({ trackSize: 200 });
    const user = userEvent.setup();
    const { track, getByRole } = renderInfinite({ count: 6, slidesPerPage: 2 });

    expect(track!.style.transform).toBe("translate(0px, 0px)");

    await user.click(getByRole("button", { name: "Next" }));

    // Page 0 → 1: leading slide 0 → 2, a two-stride glide (a full page), not −100.
    expect(track!.style.transform).toBe("translate(-200px, 0px)");
  });

  it("glides a multi-slide page back as a unit, no per-slide transform", async () => {
    // 6 slides, 2-up. Page forward to the last page then Previous back to page 1:
    // the whole track glides as one unit (offset 400 → 200) and every real slide
    // stays untransformed — the seam is filled by clones, so a trailing slide can
    // never be yanked off-screen ("disappear as the group moves").
    stdRect({ trackSize: 200 });
    const user = userEvent.setup();
    const { track, getByRole } = renderInfinite({ count: 6, slidesPerPage: 2 });

    await user.click(getByRole("button", { name: "Next" })); // page 1 (offset 200)
    await user.click(getByRole("button", { name: "Next" })); // page 2 (offset 400)
    await user.click(getByRole("button", { name: "Previous" })); // back to page 1

    // Page 2 → 1: the track glides back one page (offset 400 → 200)…
    expect(track!.style.transform).toBe("translate(-200px, 0px)");
    // …and no real slide carries a transform of its own.
    for (const slide of track!.querySelectorAll<HTMLElement>(
      "[data-carousel-slide][data-index]",
    )) {
      expect(slide.style.transform).toBe("");
    }
  });

  it("glides a wide (4-up) page as a unit for any N-up count", async () => {
    // 9 slides, 4-up. A full backward page (page 1 → 0) glides the whole track and
    // leaves every real slide untransformed — the clone strip makes the wide-page
    // seam contiguous, so there's no antipode a trailing slide could teleport past.
    stdRect({ trackSize: 400 });
    const user = userEvent.setup();
    const { track, getByRole } = renderInfinite({ count: 9, slidesPerPage: 4 });

    await user.click(getByRole("button", { name: "Next" })); // page 1 (offset 400)
    await user.click(getByRole("button", { name: "Previous" })); // back to page 0

    expect(track!.style.transform).toBe("translate(0px, 0px)");
    for (const slide of track!.querySelectorAll<HTMLElement>(
      "[data-carousel-slide][data-index]",
    )) {
      expect(slide.style.transform).toBe("");
    }
  });

  it("lands a deep multi-slide page exactly (sub-pixel, no accumulated rounding)", () => {
    // offsetLeft/Width round to whole pixels; over a page several strides in that
    // rounding accumulates into a visible edge misalignment (one slide clipped by
    // the viewport, a gap at the other edge — the multi-slide bug). Fractional
    // geometry: slide 265.5 + gap 8 = stride 273.5, track 539 (a 2-up page). On the
    // LAST page (leading slide 4) the track must land at exactly 4 × 273.5, which a
    // whole-pixel stride (273 or 274) would miss by pixels.
    defineRect(function (this: HTMLElement) {
      const raw = this.getAttribute?.("data-index");
      const isTrack = this.hasAttribute?.("data-carousel-track");
      const isSlide = this.hasAttribute?.("data-carousel-slide");
      return {
        start: raw != null ? Number(raw) * 273.5 : 0,
        size: isTrack ? 539 : isSlide ? 265.5 : 0,
      };
    });
    const { track } = renderInfinite({
      count: 6,
      slidesPerPage: 2,
      defaultPage: 2,
    });
    // align (539 − pageSpan 539)/2 = 0, basePos 0, offset 4 × 273.5 = 1094.
    expect(track!.style.transform).toBe("translate(-1094px, 0px)");
  });

  it("mirrors the inline direction under RTL (negative stride)", async () => {
    // RTL reverses the flex row, so slide i's physical offsetLeft DECREASES with
    // i (slide 0 is rightmost). The engine reads the negative stride as dir = −1
    // rather than bailing, and mirrors the track translate.
    stdRect({ startFor: (i) => -i * STRIDE });
    const user = userEvent.setup();
    const { track, getByRole } = renderInfinite();

    // Page 0 rests at 0 (align 0), same as LTR.
    expect(track!.style.transform).toBe("translate(0px, 0px)");

    await user.click(getByRole("button", { name: "Next" }));

    // Next advances the inline-forward slide, which in RTL translates the track to
    // the RIGHT (+100) — the mirror of LTR's −100, still one step, no rewind.
    expect(track!.style.transform).toBe("translate(100px, 0px)");
  });

  it("offsets the track for start and end alignment", () => {
    // Widen the track so alignment is visible: redefine its clientWidth to 300.
    stdRect({ trackSize: 300 });
    const start = renderInfinite({ snapAlign: "start" });
    // start align = 0 → translate(0).
    expect(start.track!.style.transform).toBe("translate(0px, 0px)");

    const end = renderInfinite({ snapAlign: "end" });
    // end align = viewport(300) − slide(100) = 200 → translate(200).
    expect(end.track!.style.transform).toBe("translate(200px, 0px)");
  });

  it("mirrors start/end alignment under RTL (reading start is the right edge)", () => {
    // RTL: negative stride (dir −1) and a 300-wide track. The engine ignores a
    // slide's absolute offsetLeft (only its sign/magnitude), so the align term must
    // be dir-mirrored: reading "start" is the RIGHT edge (leading slide flush right,
    // trackShift W−slide = 200) and "end" is the LEFT edge (trackShift 0) — the
    // mirror of LTR. An unmirrored align swaps them.
    stdRect({ trackSize: 300, startFor: (i) => -i * STRIDE });
    const start = renderInfinite({ snapAlign: "start" });
    // Reading start = right: leading slide flush right → translate(300 − 100).
    expect(start.track!.style.transform).toBe("translate(200px, 0px)");

    const end = renderInfinite({ snapAlign: "end" });
    // Reading end = left: leading slide flush left → translate(0).
    expect(end.track!.style.transform).toBe("translate(0px, 0px)");
  });

  it("aligns against the track's own box, not the padded viewport (peek)", () => {
    // Under peek the viewport is padded and the track is inset + narrowed to the
    // slide (100). The engine measures the TRACK's own rect, so it aligns within
    // the track (100) and can't double-count the peek — it never reads the padded
    // viewport box at all.
    stdRect({ trackSize: 100 });
    const { track } = renderInfinite({ snapAlign: "center" });
    // align = (track 100 − slide 100) / 2 = 0 → no shift. (Measuring the padded
    // viewport 140 would read +20 and push the slide out of centre.)
    expect(track!.style.transform).toBe("translate(0px, 0px)");
  });

  it("does nothing when there are too few slides to loop", () => {
    const { track } = renderInfinite({ count: 1 });
    // measure() bails (count < 2) — the track renders but gets no transform.
    expect(track!.style.transform).toBe("");
    // A resize is a no-op too — the observer's re-home bails on the same measure.
    expect(() =>
      act(() => {
        MockResizeObserver.fireAll();
      }),
    ).not.toThrow();
    expect(track!.style.transform).toBe("");
  });

  it("does not loop when slides report a zero stride (not yet laid out)", () => {
    // Collapse every slide onto position 0 → stride 0 → measure bails.
    stdRect({ startFor: () => 0 });
    const { track } = renderInfinite();
    expect(track!.style.transform).toBe("");
  });

  it("re-measures and re-homes on a resize with the fresh geometry", () => {
    // The infinite engine gets no React signal for a CSS-driven size change (peek,
    // ratio, density, a container resize), so a ResizeObserver re-homes it. Mount on
    // page 2 at stride 100 (rests at −200); grow the stride to 150 and fire the
    // observer — it must re-home page 2 at the NEW stride (−300), not stay stale.
    const { track } = renderInfinite({ defaultPage: 2 });
    expect(track!.style.transform).toBe("translate(-200px, 0px)");

    stdRect({ startFor: (i) => i * 150 });
    act(() => {
      MockResizeObserver.fireAll();
    });

    expect(track!.style.transform).toBe("translate(-300px, 0px)");
  });

  it("ignores a spurious resize fire mid-glide instead of interrupting it", async () => {
    // Real browsers fire a ResizeObserver callback once automatically right after
    // `.observe()`, even with no actual size change (spec: report the initial
    // size) — a mock only replicates on an explicit `.fireAll()`, but a device
    // still gets this for free. An unconditional rehome would abort whatever the
    // track is doing: mid-glide it kills the CSS transition, snaps to the rest
    // position, and collapses the paint window to a point — hiding the slide
    // still mid-transition ("current slide vanishes on Prev"). A same-geometry
    // resize must be a no-op instead.
    const user = userEvent.setup();
    const { track, getByRole } = renderInfinite();

    await user.click(getByRole("button", { name: "Next" }));
    expect(track!.style.transform).toBe("translate(-100px, 0px)");
    expect(track!.style.transition).toContain("transform");

    act(() => {
      MockResizeObserver.fireAll();
    });

    // The in-flight glide is untouched — not reset to the instant rest position.
    expect(track!.style.transform).toBe("translate(-100px, 0px)");
    expect(track!.style.transition).toContain("transform");
  });

  it("does not throw when the loop mode switches at runtime (slides reparent)", () => {
    // Switching loop reparents the slides into / out of the transform track, so
    // they unmount + re-register in the same commit that re-runs the native-scroll
    // effects — the key is still in slideKeys but its element is momentarily out of
    // slidesRef. Those effects must skip the orphaned key, not read
    // getBoundingClientRect on `undefined` (white-screen crash in the builder).
    function App({ loop }: { loop?: "infinite" | "wrap" }) {
      return (
        <Carousel.Root ariaLabel="Featured" loop={loop}>
          <Carousel.Viewport>
            {Array.from({ length: 4 }).map((_, i) => (
              <Carousel.Slide key={i} />
            ))}
          </Carousel.Viewport>
        </Carousel.Root>
      );
    }
    const { rerender } = render(<App loop="infinite" />);
    expect(() => rerender(<App loop="wrap" />)).not.toThrow();
    expect(() => rerender(<App loop={undefined} />)).not.toThrow();
  });

  it("re-homes the track without erroring when unmounted mid-interaction", async () => {
    const user = userEvent.setup();
    const { getByRole, unmount } = renderInfinite();
    await user.click(getByRole("button", { name: "Next" }));
    expect(() => act(() => unmount())).not.toThrow();
  });
});

describe("Carousel infinite — drag + fling", () => {
  it("follows the pointer 1:1 while dragging, with no transition", () => {
    const { track, getByTestId } = renderInfinite();
    const viewport = getByTestId("viewport");

    pointer(viewport, "pointerdown", { client: 200, time: 0 });
    pointer(viewport, "pointermove", { client: 140, time: 100 });

    // offset = startOffset(0) − (140 − 200) = 60 → track translate(align − 60).
    // Dragging paints instantly (no transition) so the track tracks the finger.
    expect(track!.style.transform).toBe("translate(-60px, 0px)");
    expect(track!.style.transition).toBe("none");
  });

  it("settles back to the current slide when the drag stays under half a stride", () => {
    const { track, getByTestId } = renderInfinite();
    const viewport = getByTestId("viewport");

    pointer(viewport, "pointerdown", { client: 200, time: 0 });
    pointer(viewport, "pointermove", { client: 180, time: 100 });
    // A second move at the same point zeroes the release velocity.
    pointer(viewport, "pointermove", { client: 180, time: 200 });
    pointer(viewport, "pointerup", { client: 180, time: 220 });

    // offset 20, velocity 0 → snap to the nearest stride (0). Back home, animated.
    expect(track!.style.transform).toBe("translate(0px, 0px)");
    expect(track!.style.transition).toContain("transform");
  });

  it("advances a slide when the drag passes the half-stride point", () => {
    const { track, getByTestId } = renderInfinite();
    const viewport = getByTestId("viewport");

    pointer(viewport, "pointerdown", { client: 200, time: 0 });
    pointer(viewport, "pointermove", { client: 140, time: 100 });
    pointer(viewport, "pointermove", { client: 140, time: 200 });
    pointer(viewport, "pointerup", { client: 140, time: 220 });

    // offset 60, velocity 0 → snaps forward to stride 100 (page 1).
    expect(track!.style.transform).toBe("translate(-100px, 0px)");
  });

  it("flings forward when a quick flick carries the projected distance past half a stride", () => {
    const { track, getByTestId } = renderInfinite();
    const viewport = getByTestId("viewport");

    // Truthy timestamps: React's SyntheticEvent does `nativeEvent.timeStamp ||
    // Date.now()`, so a falsy 0 on the first event would be replaced by the real
    // clock and skew the first elapsed — this gesture depends on real velocity.
    pointer(viewport, "pointerdown", { client: 200, time: 1000 });
    // Only 30px of travel (would settle home) but at 0.6px/ms.
    pointer(viewport, "pointermove", { client: 170, time: 1050 });
    pointer(viewport, "pointerup", { client: 170, time: 1050 });

    // flingTarget(30, 0.6, 120, 100) = snap(30 + 72) = 100 → the flick advances.
    expect(track!.style.transform).toBe("translate(-100px, 0px)");
  });

  it("treats a press that never crosses the threshold as a tap (no move, no glide)", () => {
    const { track, getByTestId } = renderInfinite();
    const viewport = getByTestId("viewport");

    pointer(viewport, "pointerdown", { client: 200, time: 0 });
    pointer(viewport, "pointermove", { client: 202, time: 50 }); // 2px < 3px
    pointer(viewport, "pointerup", { client: 202, time: 60 });

    // Never became a drag: the track stays put and no fling runs.
    expect(track!.style.transform).toBe("translate(0px, 0px)");
  });

  it("ignores mouse drags unless allowMouseDrag is set", () => {
    const { track, getByTestId } = renderInfinite({ allowMouseDrag: false });
    const viewport = getByTestId("viewport");

    pointer(viewport, "pointerdown", {
      client: 200,
      time: 0,
      pointerType: "mouse",
    });
    pointer(viewport, "pointermove", {
      client: 120,
      time: 100,
      pointerType: "mouse",
    });
    pointer(viewport, "pointerup", {
      client: 120,
      time: 120,
      pointerType: "mouse",
    });

    // pointerdown bailed on the mouse gate, so no drag state was ever created.
    expect(track!.style.transform).toBe("translate(0px, 0px)");
  });

  it("drags with the mouse when allowMouseDrag is set", () => {
    const { track, getByTestId } = renderInfinite({ allowMouseDrag: true });
    const viewport = getByTestId("viewport");

    pointer(viewport, "pointerdown", {
      client: 200,
      time: 0,
      pointerType: "mouse",
    });
    pointer(viewport, "pointermove", {
      client: 140,
      time: 100,
      pointerType: "mouse",
    });

    expect(track!.style.transform).toBe("translate(-60px, 0px)");
  });

  it("drags along the block axis for a vertical loop", () => {
    const { track, getByTestId } = renderInfinite({ orientation: "vertical" });
    const viewport = getByTestId("viewport");

    pointer(viewport, "pointerdown", { client: 200, time: 0 });
    pointer(viewport, "pointermove", { client: 140, time: 100 });

    // Vertical reads clientY (the helper sets both), so the block axis moves.
    expect(track!.style.transform).toBe("translate(0px, -60px)");
  });

  it("skips the velocity update when two moves share a timestamp", () => {
    const { track, getByTestId } = renderInfinite();
    const viewport = getByTestId("viewport");

    pointer(viewport, "pointerdown", { client: 200, time: 0 });
    pointer(viewport, "pointermove", { client: 140, time: 100 });
    // Same timestamp → elapsed 0 → velocity keeps its prior value, no divide.
    pointer(viewport, "pointermove", { client: 100, time: 100 });

    // The move still repositions (offset 100) even though velocity wasn't updated.
    expect(track!.style.transform).toBe("translate(-100px, 0px)");
  });

  it("sweeps the wrap frame's window instead of just the post-wrap point", () => {
    // A drag that crosses the loop seam wraps offsetRef by a whole trackLength
    // in a single pointermove (normalizeOffset) — a discontinuity in the raw
    // number, even though the finger only moved a normal few px. Painting that
    // frame with the post-wrap value alone (the pre-fix behaviour) computes a
    // window around only where the drag ended up, not where it came from —
    // the same "entering edge blanks for a frame" risk the click-glide's own
    // swept window already exists to avoid, just reached here by a drag's
    // continuous wrap instead of an animated transition.
    // 8 slides, starting on the last (rest offset 700, trackLength 800).
    // Dragging forward past the end: move 1 lands just before the wrap
    // (raw 790), move 2 crosses it (raw 810 -> wraps to 10). A real slide
    // sitting near the middle of the strip (index 4, edge 400) is far
    // outside a window centred on the post-wrap value (10) alone, but falls
    // inside the swept range [790, 10] the fix passes to paint() instead.
    const { getByTestId, container } = renderInfinite({
      count: 8,
      defaultPage: 7,
    });
    const viewport = getByTestId("viewport");

    pointer(viewport, "pointerdown", { client: 200, time: 0 });
    pointer(viewport, "pointermove", { client: 110, time: 50 });
    pointer(viewport, "pointermove", { client: 90, time: 100 });

    const midSlide = container.querySelector<HTMLElement>(
      '[data-carousel-slide][data-index="4"]',
    )!;
    expect(midSlide.style.visibility).toBe("");
  });

  it("ignores pointer events from a second, different pointer", () => {
    const { track, getByTestId } = renderInfinite();
    const viewport = getByTestId("viewport");

    pointer(viewport, "pointerdown", { client: 200, time: 0, id: 1 });
    // A different pointerId must not steer or end the active drag.
    pointer(viewport, "pointermove", { client: 500, time: 50, id: 2 });
    pointer(viewport, "pointerup", { client: 500, time: 60, id: 2 });
    // The original pointer still drives it.
    pointer(viewport, "pointermove", { client: 140, time: 100, id: 1 });

    expect(track!.style.transform).toBe("translate(-60px, 0px)");
  });

  it("ignores a move with no active drag", () => {
    const { track, getByTestId } = renderInfinite();
    const viewport = getByTestId("viewport");

    // A move with no preceding pointerdown is a no-op (nothing to steer).
    pointer(viewport, "pointermove", { client: 140, time: 100 });

    expect(track!.style.transform).toBe("translate(0px, 0px)");
  });

  it("does not start a drag when there is nothing to loop", () => {
    const { track, getByTestId } = renderInfinite({ count: 1 });
    const viewport = getByTestId("viewport");

    // measure() bails (count < 2), so pointerdown records no drag state.
    pointer(viewport, "pointerdown", { client: 200, time: 0 });
    pointer(viewport, "pointermove", { client: 140, time: 100 });

    expect(track!.style.transform).toBe("");
  });

  it("snaps a multi-slide fling to the nearest PAGE, not the nearest slide", () => {
    // 6 slides, 2 per page → pages lead at slide 0, 2, 4 (page stride = 200). A
    // drag of 120px is past the half-PAGE point (100) so it should advance a whole
    // page to offset 200. Snapping to the nearest SLIDE instead lands on slide 1
    // (offset 100) mid-page, whose page is 0, so the page effect then jerks back to
    // offset 0 — the two-step this fixes.
    stdRect({ trackSize: 200 });
    const { track, getByTestId } = renderInfinite({
      count: 6,
      slidesPerPage: 2,
    });
    const viewport = getByTestId("viewport");

    pointer(viewport, "pointerdown", { client: 200, time: 0 });
    pointer(viewport, "pointermove", { client: 80, time: 100 }); // offset 120
    pointer(viewport, "pointermove", { client: 80, time: 200 }); // zero velocity
    pointer(viewport, "pointerup", { client: 80, time: 220 });

    // Page-snap → offset 200 (page 1 lead), a single glide. Slide-snap would land
    // on offset 100 then bounce back to 0.
    expect(track!.style.transform).toBe("translate(-200px, 0px)");
  });

  it("ends a drag cleanly on pointercancel", () => {
    const { track, getByTestId } = renderInfinite();
    const viewport = getByTestId("viewport");

    pointer(viewport, "pointerdown", { client: 200, time: 0 });
    pointer(viewport, "pointermove", { client: 140, time: 100 });
    pointer(viewport, "pointermove", { client: 140, time: 200 });
    // Cancel resolves the fling the same way a release does.
    pointer(viewport, "pointercancel", { client: 140, time: 220 });

    expect(track!.style.transform).toBe("translate(-100px, 0px)");
  });
});
