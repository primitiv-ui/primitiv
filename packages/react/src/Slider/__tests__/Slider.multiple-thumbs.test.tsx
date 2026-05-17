import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Slider } from "../Slider";

describe("Slider multiple thumbs", () => {
  it("stops a thumb at its higher neighbour", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Slider.Root defaultValue={[20, 80]}>
        <Slider.Thumb />
        <Slider.Thumb />
      </Slider.Root>,
    );
    const [lower, upper] = screen.getAllByRole("slider");
    lower.focus();

    // Act
    await user.keyboard("{End}");

    // Assert
    expect(lower).toHaveAttribute("aria-valuenow", "80");
    expect(upper).toHaveAttribute("aria-valuenow", "80");
  });

  it("stops a thumb at its lower neighbour", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Slider.Root defaultValue={[20, 80]}>
        <Slider.Thumb />
        <Slider.Thumb />
      </Slider.Root>,
    );
    const [lower, upper] = screen.getAllByRole("slider");
    upper.focus();

    // Act
    await user.keyboard("{Home}");

    // Assert
    expect(lower).toHaveAttribute("aria-valuenow", "20");
    expect(upper).toHaveAttribute("aria-valuenow", "20");
  });

  it("stretches the range between the two thumbs", () => {
    // Arrange & Act
    render(
      <Slider.Root defaultValue={[20, 80]}>
        <Slider.Track>
          <Slider.Range data-testid="range" />
        </Slider.Track>
        <Slider.Thumb />
        <Slider.Thumb />
      </Slider.Root>,
    );

    // Assert
    expect(screen.getByTestId("range")).toHaveStyle({
      left: "20%",
      right: "20%",
    });
  });

  it("keeps a minimum gap between thumbs", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Slider.Root defaultValue={[20, 80]} minStepsBetweenThumbs={10}>
        <Slider.Thumb />
        <Slider.Thumb />
      </Slider.Root>,
    );
    const [lower] = screen.getAllByRole("slider");
    lower.focus();

    // Act
    await user.keyboard("{End}");

    // Assert
    expect(lower).toHaveAttribute("aria-valuenow", "70");
  });
});
