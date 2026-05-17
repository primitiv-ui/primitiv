import { render, screen } from "@testing-library/react";

import { Slider } from "../Slider";

describe("Slider basic rendering", () => {
  it("renders a thumb with role=slider", () => {
    // Arrange & Act
    render(
      <Slider.Root defaultValue={[50]}>
        <Slider.Track>
          <Slider.Range />
        </Slider.Track>
        <Slider.Thumb />
      </Slider.Root>,
    );

    // Assert
    expect(screen.getByRole("slider")).toBeInTheDocument();
  });
});
