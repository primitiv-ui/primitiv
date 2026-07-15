import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Carousel } from "../index.ts";

function renderWithSlides(
  rootProps: {
    loop?: boolean | "wrap" | "seamless";
    defaultPage?: number;
  } = {},
  count = 3,
) {
  return render(
    <Carousel.Root ariaLabel="Featured products" {...rootProps}>
      <Carousel.Viewport>
        {Array.from({ length: count }).map((_, i) => (
          <Carousel.Slide key={i} data-testid={`slide-${i}`} />
        ))}
      </Carousel.Viewport>
      <Carousel.PreviousTrigger>Previous</Carousel.PreviousTrigger>
      <Carousel.NextTrigger>Next</Carousel.NextTrigger>
    </Carousel.Root>,
  );
}

describe("Carousel loop (semantic wrap)", () => {
  it('should resolve the bare loop flag to data-loop="wrap" on the Root', () => {
    renderWithSlides({ loop: true });

    expect(
      screen.getByRole("region", { name: "Featured products" }),
    ).toHaveAttribute("data-loop", "wrap");
  });

  it('should publish data-loop="none" on the Root when loop is left off', () => {
    renderWithSlides();

    expect(
      screen.getByRole("region", { name: "Featured products" }),
    ).toHaveAttribute("data-loop", "none");
  });

  it('should resolve loop="wrap" to data-loop="wrap"', () => {
    renderWithSlides({ loop: "wrap" });

    expect(
      screen.getByRole("region", { name: "Featured products" }),
    ).toHaveAttribute("data-loop", "wrap");
  });

  it('should resolve loop="seamless" to data-loop="seamless"', () => {
    renderWithSlides({ loop: "seamless" });

    expect(
      screen.getByRole("region", { name: "Featured products" }),
    ).toHaveAttribute("data-loop", "seamless");
  });

  it("should share the wrap page model with seamless — Next stays enabled and wraps on the last page", async () => {
    const user = userEvent.setup();
    const { container } = renderWithSlides({
      loop: "seamless",
      defaultPage: 2,
    });

    const next = screen.getByRole("button", { name: "Next" });
    expect(next).not.toBeDisabled();

    await user.click(next);

    // Seamless renders clones sharing the test id, so scope to the real
    // slide (clones carry no data-state).
    const realSlide0 = container.querySelector(
      '[data-testid="slide-0"]:not([data-carousel-clone])',
    );
    expect(realSlide0).toHaveAttribute("data-state", "active");
  });

  it("should keep Carousel.NextTrigger enabled on the last page when looping", () => {
    renderWithSlides({ loop: true, defaultPage: 2 });

    expect(screen.getByRole("button", { name: "Next" })).not.toBeDisabled();
  });

  it("should keep Carousel.PreviousTrigger enabled on the first page when looping", () => {
    renderWithSlides({ loop: true });

    expect(
      screen.getByRole("button", { name: "Previous" }),
    ).not.toBeDisabled();
  });

  it("should wrap Next from the last page back to the first when looping", async () => {
    const user = userEvent.setup();
    renderWithSlides({ loop: true, defaultPage: 2 });

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByTestId("slide-0")).toHaveAttribute(
      "data-state",
      "active",
    );
    expect(screen.getByTestId("slide-2")).toHaveAttribute(
      "data-state",
      "inactive",
    );
  });

  it("should wrap Previous from the first page back to the last when looping", async () => {
    const user = userEvent.setup();
    renderWithSlides({ loop: true });

    await user.click(screen.getByRole("button", { name: "Previous" }));

    expect(screen.getByTestId("slide-2")).toHaveAttribute(
      "data-state",
      "active",
    );
    expect(screen.getByTestId("slide-0")).toHaveAttribute(
      "data-state",
      "inactive",
    );
  });

  it("should still disable both triggers when only one page exists, even with loop", () => {
    renderWithSlides({ loop: true }, 1);

    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("should let autoplay wrap past the last page back to the first when looping", () => {
    vi.useFakeTimers();
    try {
      render(
        <Carousel.Root
          ariaLabel="Featured products"
          loop
          autoplay
          defaultPlaying
          defaultPage={1}
        >
          <Carousel.Viewport>
            <Carousel.Slide data-testid="slide-0" />
            <Carousel.Slide data-testid="slide-1" />
          </Carousel.Viewport>
        </Carousel.Root>,
      );

      // Start on the last page; without loop autoplay would stop here.
      act(() => {
        vi.advanceTimersByTime(4000);
      });

      expect(screen.getByTestId("slide-0")).toHaveAttribute(
        "data-state",
        "active",
      );
    } finally {
      vi.useRealTimers();
    }
  });
});
