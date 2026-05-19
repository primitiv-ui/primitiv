import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { RadioGroup } from "../RadioGroup";

describe("RadioGroup orientation", () => {
  it("ignores horizontal arrows when orientation is vertical", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <RadioGroup.Root
        aria-label="Colour"
        orientation="vertical"
        defaultValue="red"
      >
        <RadioGroup.Item value="red">Red</RadioGroup.Item>
        <RadioGroup.Item value="green">Green</RadioGroup.Item>
      </RadioGroup.Root>,
    );
    const red = screen.getByRole("radio", { name: "Red" });
    const green = screen.getByRole("radio", { name: "Green" });
    red.focus();

    // Act
    await user.keyboard("{ArrowRight}");

    // Assert — horizontal arrows are inert on a vertical group
    expect(red).toHaveFocus();
    expect(red).toHaveAttribute("aria-checked", "true");
    expect(green).toHaveAttribute("aria-checked", "false");
  });

  it("ignores vertical arrows when orientation is horizontal", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <RadioGroup.Root
        aria-label="Colour"
        orientation="horizontal"
        defaultValue="red"
      >
        <RadioGroup.Item value="red">Red</RadioGroup.Item>
        <RadioGroup.Item value="green">Green</RadioGroup.Item>
      </RadioGroup.Root>,
    );
    const red = screen.getByRole("radio", { name: "Red" });
    const green = screen.getByRole("radio", { name: "Green" });
    red.focus();

    // Act
    await user.keyboard("{ArrowDown}");

    // Assert — vertical arrows are inert on a horizontal group
    expect(red).toHaveFocus();
    expect(red).toHaveAttribute("aria-checked", "true");
    expect(green).toHaveAttribute("aria-checked", "false");
  });

  it.each(["horizontal", "vertical"] as const)(
    "reflects orientation=%s via aria-orientation",
    (orientation) => {
      // Arrange
      render(
        <RadioGroup.Root aria-label="Colour" orientation={orientation}>
          <RadioGroup.Item value="red">Red</RadioGroup.Item>
        </RadioGroup.Root>,
      );

      // Assert
      expect(screen.getByRole("radiogroup")).toHaveAttribute(
        "aria-orientation",
        orientation,
      );
    },
  );

  it("omits aria-orientation for the default both orientation", () => {
    // Arrange
    render(
      <RadioGroup.Root aria-label="Colour">
        <RadioGroup.Item value="red">Red</RadioGroup.Item>
      </RadioGroup.Root>,
    );

    // Assert
    expect(screen.getByRole("radiogroup")).not.toHaveAttribute(
      "aria-orientation",
    );
  });
});
