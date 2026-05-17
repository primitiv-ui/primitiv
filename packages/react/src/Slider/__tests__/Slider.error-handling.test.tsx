import { render } from "@testing-library/react";

import { Slider } from "../Slider";

describe("Slider error handling", () => {
  it("throws when min is not less than max", () => {
    // Arrange & Assert
    expect(() =>
      render(
        <Slider.Root min={50} max={10}>
          <Slider.Thumb />
        </Slider.Root>,
      ),
    ).toThrow("Slider: `min` (50) must be less than `max` (10).");
  });

  it("throws when min equals max", () => {
    // Arrange & Assert
    expect(() =>
      render(
        <Slider.Root min={20} max={20}>
          <Slider.Thumb />
        </Slider.Root>,
      ),
    ).toThrow("must be less than");
  });

  it("throws when step is not greater than zero", () => {
    // Arrange & Assert
    expect(() =>
      render(
        <Slider.Root step={0}>
          <Slider.Thumb />
        </Slider.Root>,
      ),
    ).toThrow("Slider: `step` (0) must be greater than 0.");
  });

  it("throws when a sub-component is rendered outside Slider.Root", () => {
    // Arrange & Assert
    expect(() => render(<Slider.Thumb />)).toThrow(
      "Slider sub-components must be rendered inside a <Slider.Root>.",
    );
  });
});
