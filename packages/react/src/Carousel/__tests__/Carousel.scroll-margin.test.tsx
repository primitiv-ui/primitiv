import { act, render, screen } from "@testing-library/react";

import { MockResizeObserver } from "../../test/resizeObserverPolyfill";
import { Carousel } from "../index.ts";

// scroll-margin extends a multi-slide page's *leading* slide's native
// scroll-snap "snap area" out to the page's actual last member, so a user's
// own swipe/wheel/touch settling (driven entirely by the browser's snap
// engine, never our JS) agrees with the programmatic scrollTo fix in
// Carousel.scroll-sync.test.tsx — both now measure the whole page, not just
// the leading slide's own box. Mocks are attached to the shared prototypes
// (not specific instances found via screen.getByTestId after render) since
// the effect that sets scroll-margin runs on the very first render.
describe("Carousel multi-slide scroll-margin", () => {
  function mockRects(rectsByTestId: Record<string, Partial<DOMRect>>) {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function (this: HTMLElement) {
        const rect = rectsByTestId[this.dataset.testid ?? ""];
        return { left: 0, top: 0, width: 0, height: 0, ...rect } as DOMRect;
      },
    );
  }

  it("should set scroll-margin-inline-end on each page's leading slide to reach its last member", () => {
    mockRects({
      "slide-0": { left: 0, width: 240 },
      "slide-1": { left: 240, width: 240 },
      "slide-2": { left: 480, width: 240 },
      "slide-3": { left: 720, width: 240 },
    });

    render(
      <Carousel.Root ariaLabel="Featured products" slidesPerPage={2}>
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
          <Carousel.Slide data-testid="slide-3" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    // Page 0 = [slide-0, slide-1]; page 1 = [slide-2, slide-3]. Each leading
    // slide's own trailing edge (240 / 720) must extend to its page's real
    // last member's trailing edge (480 / 960) — 240px either way.
    expect(screen.getByTestId("slide-0").style.scrollMarginInlineEnd).toBe(
      "240px",
    );
    expect(screen.getByTestId("slide-2").style.scrollMarginInlineEnd).toBe(
      "240px",
    );
    // Non-leading members never get it set at all.
    expect(screen.getByTestId("slide-1").style.scrollMarginInlineEnd).toBe("");
    expect(screen.getByTestId("slide-3").style.scrollMarginInlineEnd).toBe("");
  });

  it("should not set any scroll-margin when slidesPerPage is 1 (the common case)", () => {
    mockRects({
      "slide-0": { left: 0, width: 480 },
      "slide-1": { left: 480, width: 480 },
    });

    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    expect(screen.getByTestId("slide-0").style.scrollMarginInlineEnd).toBe("");
    expect(screen.getByTestId("slide-1").style.scrollMarginInlineEnd).toBe("");
  });

  it("should use scroll-margin-block-end (not inline) when vertical, leaving inline unset", () => {
    mockRects({
      "slide-0": { top: 0, height: 180 },
      "slide-1": { top: 180, height: 180 },
    });

    render(
      <Carousel.Root
        ariaLabel="Featured products"
        orientation="vertical"
        slidesPerPage={2}
      >
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    expect(screen.getByTestId("slide-0").style.scrollMarginBlockEnd).toBe(
      "180px",
    );
    expect(screen.getByTestId("slide-0").style.scrollMarginInlineEnd).toBe("");
  });

  it("should correctly measure the offset-shifted, overlapping last page (uneven total)", () => {
    // total=5, perPage=2: offsets 0, 2, maxOffset=3 → windows [0,1] [2,3] [3,4].
    // The last page's leading slide is 3, sharing slide-3 with the middle
    // page — its scroll-margin must still reach slide-4, not slide-1 or a
    // stale value from the earlier page.
    mockRects({
      "slide-0": { left: 0, width: 200 },
      "slide-1": { left: 200, width: 200 },
      "slide-2": { left: 400, width: 200 },
      "slide-3": { left: 600, width: 200 },
      "slide-4": { left: 800, width: 200 },
    });

    render(
      <Carousel.Root ariaLabel="Featured products" slidesPerPage={2}>
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
          <Carousel.Slide data-testid="slide-3" />
          <Carousel.Slide data-testid="slide-4" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    expect(screen.getByTestId("slide-3").style.scrollMarginInlineEnd).toBe(
      "200px",
    );
  });

  it("should recompute the scroll-margin when the viewport resizes", () => {
    mockRects({
      "slide-0": { left: 0, width: 240 },
      "slide-1": { left: 240, width: 240 },
    });

    render(
      <Carousel.Root ariaLabel="Featured products" slidesPerPage={2}>
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    expect(screen.getByTestId("slide-0").style.scrollMarginInlineEnd).toBe(
      "240px",
    );

    // Simulate a narrower viewport shrinking both slides proportionally.
    mockRects({
      "slide-0": { left: 0, width: 120 },
      "slide-1": { left: 120, width: 120 },
    });

    act(() => {
      MockResizeObserver.latest?.fire();
    });

    expect(screen.getByTestId("slide-0").style.scrollMarginInlineEnd).toBe(
      "120px",
    );
  });
});
