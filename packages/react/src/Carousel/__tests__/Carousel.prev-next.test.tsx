import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Carousel } from "../index.ts";

function renderWithSlides(
  rootProps: { defaultPage?: number } = {},
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

describe("Carousel boundary behaviour", () => {
  it("should disable Carousel.PreviousTrigger when the active page is the first slide", () => {
    renderWithSlides();

    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
  });

  it("should disable Carousel.NextTrigger when the active page is the last slide", () => {
    renderWithSlides({ defaultPage: 2 });

    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("should leave triggers enabled in the middle of the range, then disable Next once the user reaches the last slide", async () => {
    const user = userEvent.setup();
    renderWithSlides({ defaultPage: 1 });

    // Middle: neither trigger disabled.
    expect(screen.getByRole("button", { name: "Previous" })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).not.toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Next" }));

    // After advancing to the last slide, Next must clamp.
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("should disable both triggers when there are no slides registered", () => {
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.PreviousTrigger>Previous</Carousel.PreviousTrigger>
        <Carousel.NextTrigger>Next</Carousel.NextTrigger>
      </Carousel.Root>,
    );

    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("should disable both triggers when only one slide is registered", () => {
    renderWithSlides({}, 1);

    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });
});

describe("Carousel triggers disabled by their own prop", () => {
  it("disables a trigger whose page could still move", () => {
    // Arrange & Act
    render(
      <Carousel.Root ariaLabel="Featured products" defaultPage={1}>
        <Carousel.Viewport>
          <Carousel.Slide />
          <Carousel.Slide />
          <Carousel.Slide />
        </Carousel.Viewport>
        <Carousel.PreviousTrigger disabled>Previous</Carousel.PreviousTrigger>
        <Carousel.NextTrigger disabled>Next</Carousel.NextTrigger>
      </Carousel.Root>,
    );

    // Assert
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("keeps a disabled asChild trigger from paging, with no native disabled to stop the click", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Carousel.Root ariaLabel="Featured products" defaultPage={1}>
        <Carousel.Viewport>
          <Carousel.Slide data-testid="slide-0" />
          <Carousel.Slide data-testid="slide-1" />
          <Carousel.Slide data-testid="slide-2" />
        </Carousel.Viewport>
        <Carousel.PreviousTrigger asChild disabled>
          <span>Previous</span>
        </Carousel.PreviousTrigger>
        <Carousel.NextTrigger asChild disabled>
          <span>Next</span>
        </Carousel.NextTrigger>
      </Carousel.Root>,
    );

    // Act
    await user.click(screen.getByText("Next"));
    await user.click(screen.getByText("Previous"));

    // Assert
    expect(screen.getByTestId("slide-1")).toHaveAttribute("data-state", "active");
  });
});
