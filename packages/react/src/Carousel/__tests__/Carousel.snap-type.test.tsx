import { render, screen } from "@testing-library/react";

import { Carousel } from "../index.ts";

// scroll-snap-type strictness ("mandatory" forces a rest at a snap point;
// "proximity" only nudges toward one) is a Root-level prop, published as
// data-snap-type on the Viewport so the registry stylesheet can key off it —
// mirrors Ark UI's snapType.
describe("Carousel snapType", () => {
  it('should default to data-snap-type="mandatory" on the viewport', () => {
    render(
      <Carousel.Root ariaLabel="Featured products">
        <Carousel.Viewport data-testid="viewport" />
      </Carousel.Root>,
    );

    expect(screen.getByTestId("viewport")).toHaveAttribute(
      "data-snap-type",
      "mandatory",
    );
  });

  it('should reflect snapType="proximity" as data-snap-type on the viewport', () => {
    render(
      <Carousel.Root ariaLabel="Featured products" snapType="proximity">
        <Carousel.Viewport data-testid="viewport" />
      </Carousel.Root>,
    );

    expect(screen.getByTestId("viewport")).toHaveAttribute(
      "data-snap-type",
      "proximity",
    );
  });
});
