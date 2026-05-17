import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Slider } from "../Slider";

describe("Slider form integration", () => {
  it("renders a hidden input carrying the value when name is set", () => {
    // Arrange & Act
    const { container } = render(
      <Slider.Root defaultValue={[40]} name="volume">
        <Slider.Thumb />
      </Slider.Root>,
    );

    // Assert
    const input = container.querySelector('input[type="hidden"]');
    expect(input).toHaveAttribute("name", "volume");
    expect(input).toHaveValue("40");
  });

  it("renders no hidden inputs without a name", () => {
    // Arrange & Act
    const { container } = render(
      <Slider.Root defaultValue={[40]}>
        <Slider.Thumb />
      </Slider.Root>,
    );

    // Assert
    expect(container.querySelectorAll('input[type="hidden"]')).toHaveLength(0);
  });

  it("names hidden inputs with [] for a multi-thumb slider", () => {
    // Arrange & Act
    const { container } = render(
      <Slider.Root defaultValue={[20, 80]} name="range">
        <Slider.Thumb />
        <Slider.Thumb />
      </Slider.Root>,
    );

    // Assert
    const inputs = container.querySelectorAll('input[type="hidden"]');
    expect(inputs).toHaveLength(2);
    expect(inputs[0]).toHaveAttribute("name", "range[]");
    expect(inputs[1]).toHaveAttribute("name", "range[]");
    expect(inputs[0]).toHaveValue("20");
    expect(inputs[1]).toHaveValue("80");
  });

  it("keeps the hidden input in sync with the value", async () => {
    // Arrange
    const user = userEvent.setup();
    const { container } = render(
      <Slider.Root defaultValue={[50]} name="volume">
        <Slider.Thumb />
      </Slider.Root>,
    );
    screen.getByRole("slider").focus();

    // Act
    await user.keyboard("{ArrowRight}");

    // Assert
    expect(container.querySelector('input[type="hidden"]')).toHaveValue("51");
  });
});
