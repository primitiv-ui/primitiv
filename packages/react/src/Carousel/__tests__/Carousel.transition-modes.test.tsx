import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Carousel } from "../index.ts";

function fireScrollSnapChange(
  viewport: HTMLElement,
  snapTarget: HTMLElement,
) {
  const event = new Event("scrollsnapchange", { bubbles: false });
  Object.defineProperty(event, "snapTargetInline", {
    value: snapTarget,
    writable: false,
  });
  act(() => {
    viewport.dispatchEvent(event);
  });
}

describe("Carousel transition modes", () => {
  it('should publish data-transition="slide" on the root by default (the CSS styling hook)', () => {
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.Viewport>
          <Carousel.Slide />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    expect(
      screen.getByRole("region", { name: "Featured products" }),
    ).toHaveAttribute("data-transition", "slide");
  });

  it('should publish data-transition="fade" when transition="fade" so CSS can crossfade off the hook', () => {
    render(
      <Carousel.Root ariaLabel="Featured products" transition="fade">
        <Carousel.Viewport>
          <Carousel.Slide />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    expect(
      screen.getByRole("region", { name: "Featured products" }),
    ).toHaveAttribute("data-transition", "fade");
  });

  it('should skip the programmatic scroll on page change when transition="none"', async () => {
    const user = userEvent.setup();
    render(
      <Carousel.Root ariaLabel="Featured products" transition="none">
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
        </Carousel.Viewport>
        <Carousel.NextTrigger>Next</Carousel.NextTrigger>
      </Carousel.Root>,
    );

    const scrollToSpy = vi.spyOn(screen.getByTestId("viewport"), "scrollTo");

    await user.click(screen.getByRole("button", { name: "Next" }));

    // Page advanced (data-state still flips so CSS-driven transitions
    // can react), but no scroll was issued.
    expect(screen.getByTestId("slide-1")).toHaveAttribute(
      "data-state",
      "active",
    );
    expect(scrollToSpy).not.toHaveBeenCalled();
  });

  it('should ignore scrollsnapchange events on the viewport when transition="none"', () => {
    render(
      <Carousel.Root ariaLabel="Featured products" transition="none">
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    fireScrollSnapChange(
      screen.getByTestId("viewport"),
      screen.getByTestId("slide-1"),
    );

    // Listener was never attached; the page didn't change.
    expect(screen.getByTestId("slide-0")).toHaveAttribute(
      "data-state",
      "active",
    );
  });
});
