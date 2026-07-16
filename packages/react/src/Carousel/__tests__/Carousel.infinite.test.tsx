import { render, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Carousel } from "../index.ts";

// The infinite transform engine (RFC 0018 / useCarouselLoop). Real geometry is
// browser-only (jsdom lays nothing out), so these mock the layout the engine
// reads (offsetLeft/Top, offsetWidth/Height, clientWidth/Height) plus rAF +
// performance.now to step the tween deterministically, and assert the resulting
// track / per-slide transforms. Pixel behaviour is verified in Playwright.

const STRIDE = 100; // slide size + gap
const SLIDE = 100;
const VIEWPORT = 100; // → centre align offset 0, so transforms read cleanly

let now = 0;
let frames: FrameRequestCallback[] = [];

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
  const viewportSize = function (this: HTMLElement) {
    return this.hasAttribute?.("data-carousel-viewport") ? VIEWPORT : 0;
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

/** Run all queued frames, advancing the clock by `dt` before each batch. */
function flush(times = 20, dt = 30) {
  act(() => {
    for (let i = 0; i < times; i++) {
      now += dt;
      const batch = frames;
      frames = [];
      batch.forEach((cb) => cb(now));
    }
  });
}

beforeEach(() => {
  now = 0;
  frames = [];
  vi.spyOn(performance, "now").mockImplementation(() => now);
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    frames.push(cb);
    return frames.length;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {});
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
  }> = {},
) {
  const {
    loop = "infinite",
    orientation = "horizontal",
    snapAlign = "center",
    defaultPage = 0,
    count = 4,
  } = props;
  const result = render(
    <Carousel.Root
      ariaLabel="Featured products"
      loop={loop}
      orientation={orientation}
      snapAlign={snapAlign}
      defaultPage={defaultPage}
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
    // The real slides live inside the track.
    expect(
      infinite.track!.querySelectorAll("[data-carousel-slide]"),
    ).toHaveLength(4);

    const wrap = renderInfinite({ loop: "wrap" });
    expect(wrap.track).toBeNull();
  });

  it("positions the track on the active page at rest (centre align → offset 0)", () => {
    const { track } = renderInfinite({ snapAlign: "center" });
    flush();
    // align (VIEWPORT−SLIDE)/2 = 0, offset 0 → translateX(0).
    expect(track!.style.transform).toBe("translateX(0px)");
  });

  it("glides forward one stride when Next advances a page", async () => {
    const user = userEvent.setup();
    const { track, getByRole } = renderInfinite();
    flush();

    await user.click(getByRole("button", { name: "Next" }));
    flush();

    // Page 0 → 1: offset 1×stride = 100 → translateX(align − 100) = −100.
    expect(track!.style.transform).toBe("translateX(-100px)");
  });

  it("wraps the SHORT way from the last page to the first (no rewind)", async () => {
    const user = userEvent.setup();
    // 4 slides, start on the last. Next wraps 3 → 0 forward: offset advances by
    // one stride (300 → 400), never back across the whole track.
    const { track, getByRole } = renderInfinite({ defaultPage: 3 });
    flush();
    // The engine takes the short way: slide 3 is one step *back* from slide 0,
    // so it rests at offset −100 (translateX(align − (−100)) = 100), not +300.
    expect(track!.style.transform).toBe("translateX(100px)");

    await user.click(getByRole("button", { name: "Next" }));
    flush();

    // 3 → 0 is +1 forward: offset −100 → 0, a single step onward (no rewind).
    expect(track!.style.transform).toBe("translateX(0px)");
  });

  it("gives an off-screen slide a wrapShift so a copy fills the seam", () => {
    const { getByTestId } = renderInfinite({ defaultPage: 3 });
    flush();

    // At page 3 (offset −100) slide 3's flex position (300) would sit off the
    // right (track translate +100 → 400); a wrapShift of −trackLength (−400)
    // pulls its copy back under the viewport (screen 0) — the clone-free seam.
    const slide3 = getByTestId("slide-3");
    expect(slide3.style.transform).toBe("translateX(-400px)");
  });

  it("jumps instantly with no tween under reduced motion", async () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    const user = userEvent.setup();
    const { track, getByRole } = renderInfinite();
    flush();

    await user.click(getByRole("button", { name: "Next" }));
    // No frames needed — reduced motion sets the offset immediately.
    expect(track!.style.transform).toBe("translateX(-100px)");
    expect(frames).toHaveLength(0);
  });

  it("drives the block axis for a vertical infinite loop", async () => {
    const user = userEvent.setup();
    const { track, getByRole } = renderInfinite({ orientation: "vertical" });
    flush();
    await user.click(getByRole("button", { name: "Next" }));
    flush();

    expect(track!.style.transform).toBe("translateY(-100px)");
  });

  it("offsets the track for start and end alignment", () => {
    // Widen the viewport so alignment is visible: redefine clientWidth to 300.
    Object.defineProperty(HTMLElement.prototype, "clientWidth", {
      configurable: true,
      get(this: HTMLElement) {
        return this.hasAttribute?.("data-carousel-viewport") ? 300 : 0;
      },
    });
    const start = renderInfinite({ snapAlign: "start" });
    flush();
    // start align = 0 → translateX(0).
    expect(start.track!.style.transform).toBe("translateX(0px)");

    const end = renderInfinite({ snapAlign: "end" });
    flush();
    // end align = viewport(300) − slide(100) = 200 → translateX(200).
    expect(end.track!.style.transform).toBe("translateX(200px)");
  });

  it("does nothing when there are too few slides to loop", () => {
    const { track } = renderInfinite({ count: 1 });
    flush();
    // measure() bails (count < 2) — the track renders but gets no transform.
    expect(track!.style.transform).toBe("");
  });

  it("cancels an in-flight glide when a new nav interrupts it", async () => {
    const user = userEvent.setup();
    const cancel = vi.fn();
    vi.stubGlobal("cancelAnimationFrame", cancel);
    const { getByRole } = renderInfinite();
    flush();

    await user.click(getByRole("button", { name: "Next" }));
    // A frame is queued mid-glide; a second nav cancels it before starting anew.
    await user.click(getByRole("button", { name: "Previous" }));

    expect(cancel).toHaveBeenCalled();
  });

  it("does not loop when slides report a zero stride (not yet laid out)", () => {
    // Collapse every slide onto position 0 → stride 0 → measure bails.
    Object.defineProperty(HTMLElement.prototype, "offsetLeft", {
      configurable: true,
      get: () => 0,
    });
    const { track } = renderInfinite();
    flush();
    expect(track!.style.transform).toBe("");
  });

  it("cancels an in-flight glide when the carousel unmounts", async () => {
    const user = userEvent.setup();
    const cancel = vi.fn();
    vi.stubGlobal("cancelAnimationFrame", cancel);
    const { getByRole, unmount } = renderInfinite();
    flush();
    await user.click(getByRole("button", { name: "Next" }));
    // Mid-tween (frames still queued), unmount → the pending frame is cancelled.
    act(() => unmount());
    expect(cancel).toHaveBeenCalled();
  });
});
