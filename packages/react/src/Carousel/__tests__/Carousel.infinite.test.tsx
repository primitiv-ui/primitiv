import { render, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Carousel } from "../index.ts";

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
  Object.defineProperty(event, "timeStamp", { configurable: true, value: time });
  act(() => {
    fireEvent(target, event);
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
  } = props;
  const result = render(
    <Carousel.Root
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
  it("wraps the slides in a track for infinite, and not for other modes", () => {
    const infinite = renderInfinite({ loop: "infinite" });
    expect(infinite.track).not.toBeNull();
    expect(
      infinite.track!.querySelectorAll("[data-carousel-slide]"),
    ).toHaveLength(4);

    const wrap = renderInfinite({ loop: "wrap" });
    expect(wrap.track).toBeNull();
  });

  it("positions the track on the active page at rest, instantly (no glide on load)", () => {
    const { track } = renderInfinite({ snapAlign: "center" });
    // align (VIEWPORT−SLIDE)/2 = 0, offset 0 → translate3d(0). First paint is
    // instant, so no transition.
    expect(track!.style.transform).toBe("translate3d(0px, 0px, 0px)");
    expect(track!.style.transition).toBe("none");
  });

  it("glides forward one stride via a CSS transition when Next advances a page", async () => {
    const user = userEvent.setup();
    const { track, getByRole } = renderInfinite();

    await user.click(getByRole("button", { name: "Next" }));

    // Page 0 → 1: offset 1×stride = 100 → translate3d(align − 100) = −100, driven
    // by a transform transition (the smooth, GPU-composited glide).
    expect(track!.style.transform).toBe("translate3d(-100px, 0px, 0px)");
    expect(track!.style.transition).toContain("transform");
  });

  it("wraps the SHORT way from the last page to the first (no rewind)", async () => {
    const user = userEvent.setup();
    // 4 slides, start on the last. slide 3 is one step *back* from slide 0, so it
    // rests at offset −100 (translate3d(align − (−100)) = 100).
    const { track, getByRole } = renderInfinite({ defaultPage: 3 });
    expect(track!.style.transform).toBe("translate3d(100px, 0px, 0px)");

    await user.click(getByRole("button", { name: "Next" }));

    // 3 → 0 is +1 forward: offset −100 → 0, a single step onward (no rewind).
    expect(track!.style.transform).toBe("translate3d(0px, 0px, 0px)");
  });

  it("gives an off-screen slide a 2D wrapShift so a copy fills the seam", () => {
    const { getByTestId } = renderInfinite({ defaultPage: 3 });

    // At page 3 (offset −100) slide 3's flex position (300) would sit off the
    // right (track translate +100 → 400); a wrapShift of −trackLength (−400)
    // pulls its copy back under the viewport — the clone-free seam fill. It's a
    // *2D* translate so the copy paints into the track's single compositor layer,
    // not onto its own (an off-screen per-slide layer is the iOS white-flash).
    const slide3 = getByTestId("slide-3");
    expect(slide3.style.transform).toBe("translateX(-400px)");
  });

  it("leaves the on-screen slides untransformed so they ride the track layer", () => {
    // The active slide (0) and the forward neighbour (1) don't wrap, so they carry
    // no transform at all — they paint into the track's already-rasterised bitmap
    // and are there before they glide into view (no per-slide layer to rasterise
    // late). Only the far slides (2, 3) wrap to fill the seam.
    const { getByTestId } = renderInfinite({ defaultPage: 0 });
    expect(getByTestId("slide-0").style.transform).toBe("");
    expect(getByTestId("slide-1").style.transform).toBe("");
    expect(getByTestId("slide-3").style.transform).toBe("translateX(-400px)");
  });

  it("jumps instantly with no transition under reduced motion", async () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    const user = userEvent.setup();
    const { track, getByRole } = renderInfinite();

    await user.click(getByRole("button", { name: "Next" }));

    expect(track!.style.transform).toBe("translate3d(-100px, 0px, 0px)");
    expect(track!.style.transition).toBe("none");
  });

  it("drives the block axis for a vertical infinite loop", async () => {
    const user = userEvent.setup();
    const { track, getByRole } = renderInfinite({ orientation: "vertical" });

    await user.click(getByRole("button", { name: "Next" }));

    expect(track!.style.transform).toBe("translate3d(0px, -100px, 0px)");
  });

  it("advances a whole page (not one slide) for multi-slide infinite", async () => {
    // 6 slides, 2 per page → pages lead at slide 0, 2, 4. Next must glide to the
    // next page's leading slide (index 2 = two strides), not one slide: the engine
    // has to drive off the page's leading slide index, not the page number.
    // The track holds the whole 2-slide page (span = stride + slide = 200), so it's
    // sized to 200 and the page rests flush (align 0) instead of one slide centred.
    Object.defineProperty(HTMLElement.prototype, "clientWidth", {
      configurable: true,
      get(this: HTMLElement) {
        return this.hasAttribute?.("data-carousel-track") ? 200 : 0;
      },
    });
    const user = userEvent.setup();
    const { track, getByRole } = renderInfinite({ count: 6, slidesPerPage: 2 });

    expect(track!.style.transform).toBe("translate3d(0px, 0px, 0px)");

    await user.click(getByRole("button", { name: "Next" }));

    // Page 0 → 1: leading slide 0 → 2, a two-stride glide (a full page), not −100.
    expect(track!.style.transform).toBe("translate3d(-200px, 0px, 0px)");
  });

  it("keeps the trailing slide in place when a multi-slide page glides back", async () => {
    // Regression: 6 slides, 2-up. Page forward to the last page (0→1→2) so both
    // slides 4 and 5 are on-screen, then Previous back to page 1. The trailing
    // slide (5) sits near the ±trackLength/2 antipode, so centring the wrap window
    // on the page's LEADING edge flips its nearest copy and — because seam shifts
    // are applied instantly, never transitioned — teleports it off-screen the
    // moment the glide starts ("the last slide disappears as the group moves").
    // Centring on the page MIDPOINT keeps it in place to glide out normally.
    Object.defineProperty(HTMLElement.prototype, "clientWidth", {
      configurable: true,
      get(this: HTMLElement) {
        return this.hasAttribute?.("data-carousel-track") ? 200 : 0;
      },
    });
    const user = userEvent.setup();
    const { track, getByRole, getByTestId } = renderInfinite({
      count: 6,
      slidesPerPage: 2,
    });

    await user.click(getByRole("button", { name: "Next" })); // page 1 (offset 200)
    await user.click(getByRole("button", { name: "Next" })); // page 2 (offset 400)
    // On the last page slide 5 is the on-screen trailing slide — untransformed.
    expect(getByTestId("slide-5").style.transform).toBe("");

    await user.click(getByRole("button", { name: "Previous" })); // back to page 1

    // Page 2 → 1: the track glides back one page (offset 400 → 200)…
    expect(track!.style.transform).toBe("translate3d(-200px, 0px, 0px)");
    // …and slide 5 stays put (glides out with the track) rather than being yanked
    // to translateX(-600px) the instant the move begins.
    expect(getByTestId("slide-5").style.transform).toBe("");
  });

  it("mirrors the inline direction under RTL (negative stride)", async () => {
    // RTL reverses the flex row, so slide i's physical offsetLeft DECREASES with
    // i (slide 0 is rightmost). The engine reads the negative stride as dir = −1
    // rather than bailing, and mirrors every inline move.
    Object.defineProperty(HTMLElement.prototype, "offsetLeft", {
      configurable: true,
      get(this: HTMLElement) {
        const index = this.getAttribute?.("data-index");
        return index != null ? -Number(index) * STRIDE : 0;
      },
    });
    const user = userEvent.setup();
    const { track, getByRole, getByTestId } = renderInfinite();

    // Page 0 rests at 0 (align 0), same as LTR.
    expect(track!.style.transform).toBe("translate3d(0px, 0px, 0px)");
    // The far slide's seam copy is shifted the *opposite* way (dir × wrapShift).
    expect(getByTestId("slide-3").style.transform).toBe("translateX(400px)");

    await user.click(getByRole("button", { name: "Next" }));

    // Next advances the inline-forward slide, which in RTL translates the track to
    // the RIGHT (+100) — the mirror of LTR's −100, still one step, no rewind.
    expect(track!.style.transform).toBe("translate3d(100px, 0px, 0px)");
  });

  it("offsets the track for start and end alignment", () => {
    // Widen the track so alignment is visible: redefine its clientWidth to 300.
    Object.defineProperty(HTMLElement.prototype, "clientWidth", {
      configurable: true,
      get(this: HTMLElement) {
        return this.hasAttribute?.("data-carousel-track") ? 300 : 0;
      },
    });
    const start = renderInfinite({ snapAlign: "start" });
    // start align = 0 → translate3d(0).
    expect(start.track!.style.transform).toBe("translate3d(0px, 0px, 0px)");

    const end = renderInfinite({ snapAlign: "end" });
    // end align = viewport(300) − slide(100) = 200 → translate3d(200).
    expect(end.track!.style.transform).toBe("translate3d(200px, 0px, 0px)");
  });

  it("mirrors start/end alignment under RTL (reading start is the right edge)", () => {
    // RTL: negative stride (dir −1) and a 300-wide track. The engine ignores a
    // slide's absolute offsetLeft (only its sign/magnitude), so the align term must
    // be dir-mirrored: reading "start" is the RIGHT edge (leading slide flush right,
    // trackShift W−slide = 200) and "end" is the LEFT edge (trackShift 0) — the
    // mirror of LTR. An unmirrored align swaps them.
    Object.defineProperty(HTMLElement.prototype, "offsetLeft", {
      configurable: true,
      get(this: HTMLElement) {
        const index = this.getAttribute?.("data-index");
        return index != null ? -Number(index) * STRIDE : 0;
      },
    });
    Object.defineProperty(HTMLElement.prototype, "clientWidth", {
      configurable: true,
      get(this: HTMLElement) {
        return this.hasAttribute?.("data-carousel-track") ? 300 : 0;
      },
    });
    const start = renderInfinite({ snapAlign: "start" });
    // Reading start = right: leading slide flush right → translate3d(300 − 100).
    expect(start.track!.style.transform).toBe("translate3d(200px, 0px, 0px)");

    const end = renderInfinite({ snapAlign: "end" });
    // Reading end = left: leading slide flush left → translate3d(0).
    expect(end.track!.style.transform).toBe("translate3d(0px, 0px, 0px)");
  });

  it("aligns against the track's own box, not the padded viewport (peek)", () => {
    // Under peek the viewport is padded (clientWidth 140) and the track is inset +
    // narrowed to the slide (100). The CSS already centres the track in the
    // viewport, so the engine must align within the TRACK (100), not the padded
    // viewport — else it double-counts the peek and shoves the slide off-centre.
    Object.defineProperty(HTMLElement.prototype, "clientWidth", {
      configurable: true,
      get(this: HTMLElement) {
        if (this.hasAttribute?.("data-carousel-track")) return 100;
        if (this.hasAttribute?.("data-carousel-viewport")) return 140;
        return 0;
      },
    });
    const { track } = renderInfinite({ snapAlign: "center" });
    // align = (track 100 − slide 100) / 2 = 0 → no shift. (Measuring the padded
    // viewport 140 would read +20 and push the slide out of centre.)
    expect(track!.style.transform).toBe("translate3d(0px, 0px, 0px)");
  });

  it("does nothing when there are too few slides to loop", () => {
    const { track } = renderInfinite({ count: 1 });
    // measure() bails (count < 2) — the track renders but gets no transform.
    expect(track!.style.transform).toBe("");
  });

  it("does not loop when slides report a zero stride (not yet laid out)", () => {
    // Collapse every slide onto position 0 → stride 0 → measure bails.
    Object.defineProperty(HTMLElement.prototype, "offsetLeft", {
      configurable: true,
      get: () => 0,
    });
    const { track } = renderInfinite();
    expect(track!.style.transform).toBe("");
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

    // offset = startOffset(0) − (140 − 200) = 60 → track translate3d(align − 60).
    // Dragging paints instantly (no transition) so the track tracks the finger.
    expect(track!.style.transform).toBe("translate3d(-60px, 0px, 0px)");
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
    expect(track!.style.transform).toBe("translate3d(0px, 0px, 0px)");
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
    expect(track!.style.transform).toBe("translate3d(-100px, 0px, 0px)");
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
    expect(track!.style.transform).toBe("translate3d(-100px, 0px, 0px)");
  });

  it("treats a press that never crosses the threshold as a tap (no move, no glide)", () => {
    const { track, getByTestId } = renderInfinite();
    const viewport = getByTestId("viewport");

    pointer(viewport, "pointerdown", { client: 200, time: 0 });
    pointer(viewport, "pointermove", { client: 202, time: 50 }); // 2px < 3px
    pointer(viewport, "pointerup", { client: 202, time: 60 });

    // Never became a drag: the track stays put and no fling runs.
    expect(track!.style.transform).toBe("translate3d(0px, 0px, 0px)");
  });

  it("ignores mouse drags unless allowMouseDrag is set", () => {
    const { track, getByTestId } = renderInfinite({ allowMouseDrag: false });
    const viewport = getByTestId("viewport");

    pointer(viewport, "pointerdown", { client: 200, time: 0, pointerType: "mouse" });
    pointer(viewport, "pointermove", { client: 120, time: 100, pointerType: "mouse" });
    pointer(viewport, "pointerup", { client: 120, time: 120, pointerType: "mouse" });

    // pointerdown bailed on the mouse gate, so no drag state was ever created.
    expect(track!.style.transform).toBe("translate3d(0px, 0px, 0px)");
  });

  it("drags with the mouse when allowMouseDrag is set", () => {
    const { track, getByTestId } = renderInfinite({ allowMouseDrag: true });
    const viewport = getByTestId("viewport");

    pointer(viewport, "pointerdown", { client: 200, time: 0, pointerType: "mouse" });
    pointer(viewport, "pointermove", { client: 140, time: 100, pointerType: "mouse" });

    expect(track!.style.transform).toBe("translate3d(-60px, 0px, 0px)");
  });

  it("drags along the block axis for a vertical loop", () => {
    const { track, getByTestId } = renderInfinite({ orientation: "vertical" });
    const viewport = getByTestId("viewport");

    pointer(viewport, "pointerdown", { client: 200, time: 0 });
    pointer(viewport, "pointermove", { client: 140, time: 100 });

    // Vertical reads clientY (the helper sets both), so the block axis moves.
    expect(track!.style.transform).toBe("translate3d(0px, -60px, 0px)");
  });

  it("skips the velocity update when two moves share a timestamp", () => {
    const { track, getByTestId } = renderInfinite();
    const viewport = getByTestId("viewport");

    pointer(viewport, "pointerdown", { client: 200, time: 0 });
    pointer(viewport, "pointermove", { client: 140, time: 100 });
    // Same timestamp → elapsed 0 → velocity keeps its prior value, no divide.
    pointer(viewport, "pointermove", { client: 100, time: 100 });

    // The move still repositions (offset 100) even though velocity wasn't updated.
    expect(track!.style.transform).toBe("translate3d(-100px, 0px, 0px)");
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

    expect(track!.style.transform).toBe("translate3d(-60px, 0px, 0px)");
  });

  it("ignores a move with no active drag", () => {
    const { track, getByTestId } = renderInfinite();
    const viewport = getByTestId("viewport");

    // A move with no preceding pointerdown is a no-op (nothing to steer).
    pointer(viewport, "pointermove", { client: 140, time: 100 });

    expect(track!.style.transform).toBe("translate3d(0px, 0px, 0px)");
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
    Object.defineProperty(HTMLElement.prototype, "clientWidth", {
      configurable: true,
      get(this: HTMLElement) {
        return this.hasAttribute?.("data-carousel-track") ? 200 : 0;
      },
    });
    const { track, getByTestId } = renderInfinite({ count: 6, slidesPerPage: 2 });
    const viewport = getByTestId("viewport");

    pointer(viewport, "pointerdown", { client: 200, time: 0 });
    pointer(viewport, "pointermove", { client: 80, time: 100 }); // offset 120
    pointer(viewport, "pointermove", { client: 80, time: 200 }); // zero velocity
    pointer(viewport, "pointerup", { client: 80, time: 220 });

    // Page-snap → offset 200 (page 1 lead), a single glide. Slide-snap would land
    // on offset 100 then bounce back to 0.
    expect(track!.style.transform).toBe("translate3d(-200px, 0px, 0px)");
  });

  it("ends a drag cleanly on pointercancel", () => {
    const { track, getByTestId } = renderInfinite();
    const viewport = getByTestId("viewport");

    pointer(viewport, "pointerdown", { client: 200, time: 0 });
    pointer(viewport, "pointermove", { client: 140, time: 100 });
    pointer(viewport, "pointermove", { client: 140, time: 200 });
    // Cancel resolves the fling the same way a release does.
    pointer(viewport, "pointercancel", { client: 140, time: 220 });

    expect(track!.style.transform).toBe("translate3d(-100px, 0px, 0px)");
  });
});
