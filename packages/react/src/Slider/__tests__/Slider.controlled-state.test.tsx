import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Slider } from "../Slider";

describe("Slider controlled state", () => {
  it("renders thumbs from the value prop", () => {
    // Arrange & Act
    render(
      <Slider.Root value={[30, 70]} onValueChange={() => {}}>
        <Slider.Thumb />
        <Slider.Thumb />
      </Slider.Root>,
    );

    // Assert
    const [lower, upper] = screen.getAllByRole("slider");
    expect(lower).toHaveAttribute("aria-valuenow", "30");
    expect(upper).toHaveAttribute("aria-valuenow", "70");
  });

  it("does not self-update — the parent owns the value", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Slider.Root value={[40]} onValueChange={() => {}}>
        <Slider.Thumb />
      </Slider.Root>,
    );
    const thumb = screen.getByRole("slider");
    thumb.focus();

    // Act
    await user.keyboard("{ArrowRight}");

    // Assert
    expect(thumb).toHaveAttribute("aria-valuenow", "40");
  });

  it("reports the next value array through onValueChange", async () => {
    // Arrange
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Slider.Root value={[40, 70]} onValueChange={onValueChange}>
        <Slider.Thumb />
        <Slider.Thumb />
      </Slider.Root>,
    );
    screen.getAllByRole("slider")[0].focus();

    // Act
    await user.keyboard("{ArrowRight}");

    // Assert
    expect(onValueChange).toHaveBeenCalledWith([41, 70]);
  });

  it("follows the value prop when the parent updates it", () => {
    // Arrange
    const { rerender } = render(
      <Slider.Root value={[40]} onValueChange={() => {}}>
        <Slider.Thumb />
      </Slider.Root>,
    );
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "40");

    // Act
    rerender(
      <Slider.Root value={[75]} onValueChange={() => {}}>
        <Slider.Thumb />
      </Slider.Root>,
    );

    // Assert
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "75");
  });
});
