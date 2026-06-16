import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Carousel } from "../index.ts";

describe("Carousel uncontrolled page state", () => {
  it("should mark the slide at index 0 as active by default when no defaultPage is provided", () => {
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    expect(screen.getByTestId("slide-0")).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("should accept a defaultPage prop to seed the initial active slide", () => {
    render(
      <Carousel.Root ariaLabel="Featured products" defaultPage={1}>
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
        </Carousel.Viewport>
      </Carousel.Root>,
    );

    expect(screen.getByTestId("slide-0")).toHaveAttribute(
      "data-state",
      "inactive",
    );
    expect(screen.getByTestId("slide-1")).toHaveAttribute(
      "data-state",
      "active",
    );
    expect(screen.getByTestId("slide-2")).toHaveAttribute(
      "data-state",
      "inactive",
    );
  });

  it("should advance the active slide by one when Carousel.NextTrigger is clicked", async () => {
    const user = userEvent.setup();
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
        </Carousel.Viewport>
        <Carousel.NextTrigger>Next</Carousel.NextTrigger>
      </Carousel.Root>,
    );

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByTestId("slide-0")).toHaveAttribute(
      "data-state",
      "inactive",
    );
    expect(screen.getByTestId("slide-1")).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("should advance multiple times when Carousel.NextTrigger is clicked repeatedly", async () => {
    const user = userEvent.setup();
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
        </Carousel.Viewport>
        <Carousel.NextTrigger>Next</Carousel.NextTrigger>
      </Carousel.Root>,
    );

    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByTestId("slide-2")).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  it("should retreat the active slide by one when Carousel.PreviousTrigger is clicked", async () => {
    const user = userEvent.setup();
    render(
      <Carousel.Root ariaLabel="Featured products" defaultPage={1}>
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
        </Carousel.Viewport>
        <Carousel.PreviousTrigger>Previous</Carousel.PreviousTrigger>
      </Carousel.Root>,
    );

    await user.click(screen.getByRole("button", { name: "Previous" }));

    expect(screen.getByTestId("slide-0")).toHaveAttribute(
      "data-state",
      "active",
    );
    expect(screen.getByTestId("slide-1")).toHaveAttribute(
      "data-state",
      "inactive",
    );
  });

  it("should still invoke the consumer's onClick handler when a trigger is clicked", async () => {
    const user = userEvent.setup();
    const onNextClick = vi.fn();
    const onPrevClick = vi.fn();

    render(
      <Carousel.Root ariaLabel="Featured products" defaultPage={1}>
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
        </Carousel.Viewport>
        <Carousel.PreviousTrigger onClick={onPrevClick}>
          Previous
        </Carousel.PreviousTrigger>
        <Carousel.NextTrigger onClick={onNextClick}>Next</Carousel.NextTrigger>
      </Carousel.Root>,
    );

    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Previous" }));

    expect(onNextClick).toHaveBeenCalledTimes(1);
    expect(onPrevClick).toHaveBeenCalledTimes(1);
  });
});
