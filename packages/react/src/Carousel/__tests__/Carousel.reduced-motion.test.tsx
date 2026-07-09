import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Carousel } from "../index.ts";

function mockReducedMotion(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes("prefers-reduced-motion") ? matches : false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

describe("Carousel scroll sync respects prefers-reduced-motion", () => {
  afterEach(() => {
    // @ts-expect-error: restore by deletion so other suites get jsdom default.
    delete window.matchMedia;
  });

  it("should scroll with behavior='instant' when prefers-reduced-motion is reduce", async () => {
    mockReducedMotion(true);
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

    expect(scrollToSpy).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: "instant" }),
    );
  });
});
