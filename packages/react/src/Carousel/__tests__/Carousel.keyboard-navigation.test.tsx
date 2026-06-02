import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Carousel } from "..";

describe("Carousel keyboard navigation", () => {
  it("should advance the active page when ArrowRight is pressed with the viewport focused", async () => {
    const user = userEvent.setup();
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    // Tab into the carousel — the Viewport must be in the tab order so
    // keyboard users can reach the rotation control without first
    // tabbing through every slide's interactive content.
    await user.tab();
    expect(screen.getByTestId("viewport")).toHaveFocus();

    await user.keyboard("{ArrowRight}");

    expect(screen.getByTestId("slide-1")).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("should retreat the active page when ArrowLeft is pressed with the viewport focused", async () => {
    const user = userEvent.setup();
    render(
      <Carousel.Root ariaLabel="Featured products" defaultPage={2}>
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    await user.tab();
    await user.keyboard("{ArrowLeft}");

    expect(screen.getByTestId("slide-1")).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("should jump to the first page when Home is pressed with the viewport focused", async () => {
    const user = userEvent.setup();
    render(
      <Carousel.Root ariaLabel="Featured products" defaultPage={2}>
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    await user.tab();
    await user.keyboard("{Home}");

    expect(screen.getByTestId("slide-0")).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("should jump to the last page when End is pressed with the viewport focused", async () => {
    const user = userEvent.setup();
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    await user.tab();
    await user.keyboard("{End}");

    expect(screen.getByTestId("slide-2")).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("should clamp at the boundaries when arrow keys are pressed", async () => {
    function Fixture({ start }: { start: number }) {
      return (
        <Carousel.Root ariaLabel="Featured products" defaultPage={start}>
          <Carousel.Viewport data-testid="viewport">
            <Carousel.Slide data-testid="slide-0" />
            <Carousel.Slide data-testid="slide-1" />
            <Carousel.Slide data-testid="slide-2" />
          </Carousel.Viewport>
        </Carousel.Root>
      );
    }

    const user = userEvent.setup();

    const { unmount } = render(<Fixture start={2} />);
    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByTestId("slide-2")).toHaveAttribute(
      "data-state",
      "active",
    );
    unmount();

    render(<Fixture start={0} />);
    await user.tab();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByTestId("slide-0")).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("should leave focus inside a slide alone — arrow keys don't navigate when a child element is the focus target", async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        page={0}
        onPageChange={onPageChange}
      >
        <Carousel.Viewport data-testid="viewport">
          <Carousel.Slide>
            <button data-testid="slide-link">Open</button>
          </Carousel.Slide>
          <Carousel.Slide data-testid="slide-1" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    // Tab past the Viewport onto the link inside slide-0.
    await user.tab();
    await user.tab();
    expect(screen.getByTestId("slide-link")).toHaveFocus();

    // ArrowRight while a slide-internal control has focus must keep its
    // native semantics rather than steal the keypress for navigation.
    await user.keyboard("{ArrowRight}");

    expect(onPageChange).not.toHaveBeenCalled();
  });
});
