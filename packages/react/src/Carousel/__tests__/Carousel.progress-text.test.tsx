import { act, fireEvent, render, screen } from "@testing-library/react";

import { Carousel } from "../index.ts";

// ProgressText: a rendered "N of M" progress announcement, closing the Ark
// UI parity gap between the imperative getProgress() data and an actual
// subcomponent a consumer can drop into the DOM without wiring it themselves.
describe("Carousel ProgressText", () => {
  it("should render the default '1 of 3' text for the first of three pages", () => {
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.Viewport>
          <Carousel.Slide />
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
        <Carousel.ProgressText data-testid="progress" />
      </Carousel.Root>,
    );

    expect(screen.getByTestId("progress")).toHaveTextContent("1 of 3");
  });

  it("should update as the active page advances", () => {
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.Viewport>
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
        <Carousel.NextTrigger>Next</Carousel.NextTrigger>
        <Carousel.ProgressText data-testid="progress" />
      </Carousel.Root>,
    );

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
    });

    expect(screen.getByTestId("progress")).toHaveTextContent("2 of 2");
  });

  it("should render custom children instead of the default text when provided", () => {
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.Viewport>
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
        <Carousel.ProgressText data-testid="progress">
          Custom progress
        </Carousel.ProgressText>
      </Carousel.Root>,
    );

    expect(screen.getByTestId("progress")).toHaveTextContent(
      "Custom progress",
    );
  });

  it("should forward native span props like className", () => {
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.Viewport>
          <Carousel.Slide />
        </Carousel.Viewport>
        <Carousel.ProgressText
          data-testid="progress"
          className="custom-class"
        />
      </Carousel.Root>,
    );

    expect(screen.getByTestId("progress")).toHaveClass("custom-class");
  });
});
