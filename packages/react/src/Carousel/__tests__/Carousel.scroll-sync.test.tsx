import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Carousel } from "../index.ts";

describe("Carousel scroll sync (programmatic page change)", () => {
  it("should scroll the viewport itself, not the slide's scrollable ancestors (so the page doesn't scroll)", async () => {
    const user = userEvent.setup();
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
        </Carousel.Viewport>
        <Carousel.NextTrigger>Next</Carousel.NextTrigger>
      </Carousel.Root>,
    );

    // scrollIntoView walks every scrollable ancestor (including the page/window),
    // so it scrolls the whole document when a carousel is off-screen. The viewport
    // must scroll itself instead.
    const viewportScrollTo = vi.spyOn(screen.getByTestId("viewport"), "scrollTo");
    const slideScrollIntoView = vi.spyOn(
      screen.getByTestId("slide-1"),
      "scrollIntoView",
    );

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(viewportScrollTo).toHaveBeenCalled();
    expect(slideScrollIntoView).not.toHaveBeenCalled();
  });

  it("should call scrollTo on the viewport for the first slide of the target page when the active page changes", async () => {
    const user = userEvent.setup();
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
        </Carousel.Viewport>
        <Carousel.NextTrigger>Next</Carousel.NextTrigger>
      </Carousel.Root>,
    );

    const scrollToSpy = vi.spyOn(screen.getByTestId("viewport"), "scrollTo");

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(scrollToSpy).toHaveBeenCalled();
  });

  it("should centre the target slide in the viewport on the inline axis by default (center)", async () => {
    const user = userEvent.setup();
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
        </Carousel.Viewport>
        <Carousel.IndicatorGroup label="Choose">
          <Carousel.Indicator index={0} />
          <Carousel.Indicator index={1} />
          <Carousel.Indicator index={2} />
        </Carousel.IndicatorGroup>
      </Carousel.Root>,
    );

    // The viewport sits at the origin, is 1000px wide, and the target slide
    // is 320px wide, 640px to its right: 640 - (1000 - 320) / 2 = 300.
    const viewport = screen.getByTestId("viewport");
    Object.defineProperty(viewport, "clientWidth", { value: 1000, configurable: true });
    const scrollToSpy = vi.spyOn(viewport, "scrollTo");
    vi.spyOn(screen.getByTestId("slide-2"), "getBoundingClientRect").mockReturnValue(
      { left: 640, top: 0, width: 320, height: 180 } as DOMRect,
    );

    await user.click(screen.getByRole("button", { name: "Slide 3" }));

    expect(scrollToSpy).toHaveBeenCalledWith({ left: 300, behavior: "smooth" });
  });

  it("should target the first slide of a multi-slide page", async () => {
    const user = userEvent.setup();
    render(
      // snapAlign="start" isolates this test's concern (multi-slide page
      // targeting: index = page * slidesPerPage) from the root's default
      // alignment, which centre-aligns and would otherwise shift the
      // expected scroll position for a reason unrelated to what this test
      // is checking.
      <Carousel.Root ariaLabel="Featured products" slidesPerPage={2} snapAlign="start">
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
          <Carousel.Slide data-testid="slide-3" />
        </Carousel.Viewport>
        <Carousel.NextTrigger>Next</Carousel.NextTrigger>
      </Carousel.Root>,
    );

    // Page 0 → page 1 means the first visible slide becomes slide 2
    // (index = page * slidesPerPage): its offset is what drives the scroll.
    const scrollToSpy = vi.spyOn(screen.getByTestId("viewport"), "scrollTo");
    vi.spyOn(screen.getByTestId("slide-2"), "getBoundingClientRect").mockReturnValue(
      { left: 500, top: 0, width: 240, height: 180 } as DOMRect,
    );

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(scrollToSpy).toHaveBeenCalledWith({ left: 500, behavior: "smooth" });
  });

  it("should centre the target slide in the viewport when snapAlign is 'center'", async () => {
    const user = userEvent.setup();
    render(
      <Carousel.Root ariaLabel="Featured products" snapAlign="center">
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
        </Carousel.Viewport>
        <Carousel.NextTrigger>Next</Carousel.NextTrigger>
      </Carousel.Root>,
    );

    // A 400-wide slide at inline 400 in a 1000-wide viewport centres at
    // 400 - (1000 - 400) / 2 = 100.
    const viewport = screen.getByTestId("viewport");
    Object.defineProperty(viewport, "clientWidth", { value: 1000, configurable: true });
    const scrollToSpy = vi.spyOn(viewport, "scrollTo");
    vi.spyOn(screen.getByTestId("slide-1"), "getBoundingClientRect").mockReturnValue(
      { left: 400, top: 0, width: 400, height: 180 } as DOMRect,
    );

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(scrollToSpy).toHaveBeenCalledWith({ left: 100, behavior: "smooth" });
  });

  it("should align the target slide's trailing edge to the viewport when snapAlign is 'end'", async () => {
    const user = userEvent.setup();
    render(
      <Carousel.Root ariaLabel="Featured products" snapAlign="end">
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
        </Carousel.Viewport>
        <Carousel.NextTrigger>Next</Carousel.NextTrigger>
      </Carousel.Root>,
    );

    // A 400-wide slide at inline 400 in a 1000-wide viewport end-aligns at
    // 400 - (1000 - 400) = -200 (its trailing edge flush with the
    // viewport's).
    const viewport = screen.getByTestId("viewport");
    Object.defineProperty(viewport, "clientWidth", { value: 1000, configurable: true });
    const scrollToSpy = vi.spyOn(viewport, "scrollTo");
    vi.spyOn(screen.getByTestId("slide-1"), "getBoundingClientRect").mockReturnValue(
      { left: 400, top: 0, width: 400, height: 180 } as DOMRect,
    );

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(scrollToSpy).toHaveBeenCalledWith({ left: -200, behavior: "smooth" });
  });

  it("should let a slide's own snapAlign override the root default", async () => {
    const user = userEvent.setup();
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" snapAlign="start" />
        </Carousel.Viewport>
        <Carousel.NextTrigger>Next</Carousel.NextTrigger>
      </Carousel.Root>,
    );

    // Root default is "center", but slide-1 opts itself into "start":
    // 400 - 0 = 400 — the alignOffset-zero case, driven by the per-slide
    // prop instead of the root value.
    const viewport = screen.getByTestId("viewport");
    Object.defineProperty(viewport, "clientWidth", { value: 1000, configurable: true });
    const scrollToSpy = vi.spyOn(viewport, "scrollTo");
    vi.spyOn(screen.getByTestId("slide-1"), "getBoundingClientRect").mockReturnValue(
      { left: 400, top: 0, width: 400, height: 180 } as DOMRect,
    );

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(scrollToSpy).toHaveBeenCalledWith({ left: 400, behavior: "smooth" });
  });
});

describe("Carousel multi-slide page-span alignment", () => {
  it("should centre the whole multi-slide page, not just its leading slide", async () => {
    const user = userEvent.setup();
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        slidesPerPage={2}
        snapAlign="center"
      >
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
          <Carousel.Slide data-testid="slide-3" />
        </Carousel.Viewport>
        <Carousel.NextTrigger>Next</Carousel.NextTrigger>
      </Carousel.Root>,
    );

    // Page 1's window is [slide-2, slide-3]. The page spans 500 (slide-2's
    // left) to 980 (slide-3's right) = 480 wide, in a 1000-wide viewport:
    // 500 - (1000 - 480) / 2 = 500 - 260 = 240. Using only slide-2's own
    // 240px width (the pre-fix bug) would instead leftover-space against a
    // single slide and undershoot, leaving slide-3 clipped off the trailing
    // edge.
    const viewport = screen.getByTestId("viewport");
    Object.defineProperty(viewport, "clientWidth", {
      value: 1000,
      configurable: true,
    });
    const scrollToSpy = vi.spyOn(viewport, "scrollTo");
    vi.spyOn(
      screen.getByTestId("slide-2"),
      "getBoundingClientRect",
    ).mockReturnValue({ left: 500, top: 0, width: 240, height: 180 } as DOMRect);
    vi.spyOn(
      screen.getByTestId("slide-3"),
      "getBoundingClientRect",
    ).mockReturnValue({ left: 740, top: 0, width: 240, height: 180 } as DOMRect);

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(scrollToSpy).toHaveBeenCalledWith({ left: 240, behavior: "smooth" });
  });

  it("should align the whole multi-slide page's trailing edge when snapAlign is 'end'", async () => {
    const user = userEvent.setup();
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        slidesPerPage={2}
        snapAlign="end"
      >
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
          <Carousel.Slide data-testid="slide-3" />
        </Carousel.Viewport>
        <Carousel.NextTrigger>Next</Carousel.NextTrigger>
      </Carousel.Root>,
    );

    // Same 480-wide page as above; end-alignment uses the full leftover
    // space (520) rather than halving it: 500 - 520 = -20.
    const viewport = screen.getByTestId("viewport");
    Object.defineProperty(viewport, "clientWidth", {
      value: 1000,
      configurable: true,
    });
    const scrollToSpy = vi.spyOn(viewport, "scrollTo");
    vi.spyOn(
      screen.getByTestId("slide-2"),
      "getBoundingClientRect",
    ).mockReturnValue({ left: 500, top: 0, width: 240, height: 180 } as DOMRect);
    vi.spyOn(
      screen.getByTestId("slide-3"),
      "getBoundingClientRect",
    ).mockReturnValue({ left: 740, top: 0, width: 240, height: 180 } as DOMRect);

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(scrollToSpy).toHaveBeenCalledWith({ left: -20, behavior: "smooth" });
  });

  it("should clamp the page span to the actual last slide when slidesPerPage exceeds the slide count", () => {
    // This exercises the *initial-mount* scroll (there's only one page here,
    // so nothing else would trigger a second effect run) — the rect mocks
    // and the scrollTo spy both have to be in place before that first effect
    // fires, so they're attached to the shared prototypes rather than to
    // specific instances found only after render().
    const scrollToSpy = vi
      .spyOn(HTMLElement.prototype, "scrollTo")
      .mockImplementation(() => {});
    const rectsByTestId: Record<string, Partial<DOMRect>> = {
      "slide-0": { left: 0, top: 0, width: 400, height: 180 },
      "slide-1": { left: 400, top: 0, width: 400, height: 180 },
    };
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function (this: HTMLElement) {
        const rect = rectsByTestId[this.dataset.testid ?? ""];
        return { left: 0, top: 0, width: 0, height: 0, ...rect } as DOMRect;
      },
    );

    render(
      <Carousel.Root
        ariaLabel="Featured products"
        slidesPerPage={4}
        snapAlign="center"
      >
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    // Only 2 slides exist for a configured slidesPerPage=4 — the naive last-
    // member index (0 + 4 - 1 = 3) doesn't exist, so it must clamp to the
    // real last slide (index 1) instead of looking up a nonexistent one
    // (which would throw). Page span: slide-0's left (0) to slide-1's right
    // (800) = 800 wide; the viewport's own clientWidth is unmocked (jsdom
    // default 0): 0 - (0 - 800) / 2 = 400.
    expect(scrollToSpy).toHaveBeenCalledWith({ left: 400, behavior: "smooth" });
  });
});
