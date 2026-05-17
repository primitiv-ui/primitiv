import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Slider } from "../Slider";

describe("Slider uncontrolled state", () => {
  it("seeds the thumbs from defaultValue", () => {
    // Arrange & Act
    render(
      <Slider.Root defaultValue={[25, 60]}>
        <Slider.Thumb />
        <Slider.Thumb />
      </Slider.Root>,
    );

    // Assert
    const [lower, upper] = screen.getAllByRole("slider");
    expect(lower).toHaveAttribute("aria-valuenow", "25");
    expect(upper).toHaveAttribute("aria-valuenow", "60");
  });

  it("defaults to a single thumb at min when no value is given", () => {
    // Arrange & Act
    render(
      <Slider.Root min={5} max={50}>
        <Slider.Thumb />
      </Slider.Root>,
    );

    // Assert
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "5");
  });

  it("updates its own value on interaction", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Slider.Root defaultValue={[50]}>
        <Slider.Thumb />
      </Slider.Root>,
    );
    const thumb = screen.getByRole("slider");
    thumb.focus();

    // Act
    await user.keyboard("{ArrowRight}");

    // Assert
    expect(thumb).toHaveAttribute("aria-valuenow", "51");
  });

  it("notifies onValueChange with the updated array", async () => {
    // Arrange
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Slider.Root defaultValue={[50]} onValueChange={onValueChange}>
        <Slider.Thumb />
      </Slider.Root>,
    );
    screen.getByRole("slider").focus();

    // Act
    await user.keyboard("{ArrowRight}");

    // Assert
    expect(onValueChange).toHaveBeenCalledWith([51]);
  });
});
