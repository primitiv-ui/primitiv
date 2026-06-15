import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Carousel } from "../index.ts";

describe("Carousel slidesPerPage", () => {
  it("should mark every slide on the active page as active when slidesPerPage > 1", () => {
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

    expect(screen.getByTestId("slide-0")).toHaveAttribute(
      "data-state",
      "active",
    );
    expect(screen.getByTestId("slide-1")).toHaveAttribute(
      "data-state",
      "active",
    );
    expect(screen.getByTestId("slide-2")).toHaveAttribute(
      "data-state",
      "inactive",
    );
    expect(screen.getByTestId("slide-3")).toHaveAttribute(
      "data-state",
      "inactive",
    );
  });

  it("should render ceil(slides / slidesPerPage) indicators in Carousel.Indicators", () => {
    const { rerender } = render(
      <Carousel.Root ariaLabel="Featured products" slidesPerPage={2}>
        <Carousel.Viewport>
          <Carousel.Slide />
          <Carousel.Slide />
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
        <Carousel.Indicators label="Choose page" />
      </Carousel.Root>,
    );

    expect(
      screen.getAllByRole("button", { name: /^Slide \d+$/ }),
    ).toHaveLength(2);

    // Non-multiple total: ceil(5 / 2) === 3.
    rerender(
      <Carousel.Root ariaLabel="Featured products" slidesPerPage={2}>
        <Carousel.Viewport>
          <Carousel.Slide />
          <Carousel.Slide />
          <Carousel.Slide />
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
        <Carousel.Indicators label="Choose page" />
      </Carousel.Root>,
    );

    expect(
      screen.getAllByRole("button", { name: /^Slide \d+$/ }),
    ).toHaveLength(3);
  });

  it("should disable Carousel.NextTrigger at the last page (not the last slide)", () => {
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        slidesPerPage={2}
        defaultPage={1}
      >
        <Carousel.Viewport>
          <Carousel.Slide />
          <Carousel.Slide />
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
        <Carousel.NextTrigger>Next</Carousel.NextTrigger>
      </Carousel.Root>,
    );

    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("should advance by one page when Carousel.NextTrigger is clicked", async () => {
    const user = userEvent.setup();
    render(
      <Carousel.Root ariaLabel="Featured products" slidesPerPage={2}>
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
          <Carousel.Slide data-testid="slide-3" />
        </Carousel.Viewport>
        <Carousel.NextTrigger>Next</Carousel.NextTrigger>
      </Carousel.Root>,
    );

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByTestId("slide-2")).toHaveAttribute(
      "data-state",
      "active",
    );
    expect(screen.getByTestId("slide-3")).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("should jump to the targeted page when an auto-rendered Indicator is clicked", async () => {
    const user = userEvent.setup();
    render(
      <Carousel.Root ariaLabel="Featured products" slidesPerPage={2}>
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
          <Carousel.Slide data-testid="slide-3" />
        </Carousel.Viewport>
        <Carousel.Indicators label="Choose page" />
      </Carousel.Root>,
    );

    await user.click(screen.getByRole("button", { name: "Slide 2" }));

    expect(screen.getByTestId("slide-2")).toHaveAttribute(
      "data-state",
      "active",
    );
    expect(screen.getByTestId("slide-3")).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("should activate only the remaining slides on a partial last page", () => {
    render(
      <Carousel.Root
        ariaLabel="Featured products"
        slidesPerPage={2}
        defaultPage={2}
      >
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
          <Carousel.Slide data-testid="slide-3" />
          <Carousel.Slide data-testid="slide-4" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    expect(screen.getByTestId("slide-0")).toHaveAttribute(
      "data-state",
      "inactive",
    );
    expect(screen.getByTestId("slide-1")).toHaveAttribute(
      "data-state",
      "inactive",
    );
    expect(screen.getByTestId("slide-2")).toHaveAttribute(
      "data-state",
      "inactive",
    );
    expect(screen.getByTestId("slide-3")).toHaveAttribute(
      "data-state",
      "inactive",
    );
    expect(screen.getByTestId("slide-4")).toHaveAttribute(
      "data-state",
      "active",
    );
  });
});
