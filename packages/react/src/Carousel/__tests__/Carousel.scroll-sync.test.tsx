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

  it("should align the target slide's leading edge to the viewport on the inline axis by default (start)", async () => {
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

    // The viewport sits at the origin; the target slide is 640px to its right.
    // Start alignment scrolls the viewport by exactly that inline delta.
    const viewport = screen.getByTestId("viewport");
    const scrollToSpy = vi.spyOn(viewport, "scrollTo");
    vi.spyOn(screen.getByTestId("slide-2"), "getBoundingClientRect").mockReturnValue(
      { left: 640, top: 0, width: 320, height: 180 } as DOMRect,
    );

    await user.click(screen.getByRole("button", { name: "Slide 3" }));

    expect(scrollToSpy).toHaveBeenCalledWith({ left: 640, behavior: "smooth" });
  });

  it("should target the first slide of a multi-slide page", async () => {
    const user = userEvent.setup();
    render(
      <Carousel.Root ariaLabel="Featured products" slidesPerPage={2}>
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
          <Carousel.Slide data-testid="slide-1" snapAlign="center" />
        </Carousel.Viewport>
        <Carousel.NextTrigger>Next</Carousel.NextTrigger>
      </Carousel.Root>,
    );

    // Root default is "start", but slide-1 opts itself into "center":
    // 400 - (1000 - 400) / 2 = 100 — the same maths as the root-level
    // "center" test above, just driven by the per-slide prop instead.
    const viewport = screen.getByTestId("viewport");
    Object.defineProperty(viewport, "clientWidth", { value: 1000, configurable: true });
    const scrollToSpy = vi.spyOn(viewport, "scrollTo");
    vi.spyOn(screen.getByTestId("slide-1"), "getBoundingClientRect").mockReturnValue(
      { left: 400, top: 0, width: 400, height: 180 } as DOMRect,
    );

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(scrollToSpy).toHaveBeenCalledWith({ left: 100, behavior: "smooth" });
  });
});
