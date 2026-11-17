import { StrictMode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Carousel } from "../index.ts";

// StrictMode mounts, unmounts and remounts every effect. The shared
// CarouselController listens on the root and the viewport, so a remount that
// failed to drop the first set of listeners would handle every event twice.
describe("Carousel under StrictMode", () => {
  it("advances one page per trigger click and per arrow key", async () => {
    // Arrange
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(
      <StrictMode>
        <Carousel.Root ariaLabel="Featured products" onPageChange={onPageChange} page={0}>
          <Carousel.Viewport data-testid="viewport">
            <Carousel.Slide>One</Carousel.Slide>
            <Carousel.Slide>Two</Carousel.Slide>
            <Carousel.Slide>Three</Carousel.Slide>
          </Carousel.Viewport>
          <Carousel.NextTrigger>Next</Carousel.NextTrigger>
        </Carousel.Root>
      </StrictMode>,
    );

    // Act
    await user.click(screen.getByRole("button", { name: "Next" }));
    screen.getByTestId("viewport").focus();
    await user.keyboard("{ArrowRight}");

    // Assert
    expect(onPageChange.mock.calls).toEqual([[1], [1]]);
  });
});
