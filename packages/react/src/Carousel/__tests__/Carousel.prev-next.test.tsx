import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Carousel } from "..";

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
