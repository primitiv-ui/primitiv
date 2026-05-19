import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DirectionProvider } from "../../DirectionProvider";
import { RadioGroup } from "../RadioGroup";

describe("RadioGroup reading direction", () => {
  it("inverts horizontal arrows when dir is rtl", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <RadioGroup.Root
        aria-label="Colour"
        orientation="horizontal"
        dir="rtl"
        defaultValue="red"
      >
        <RadioGroup.Item value="red">Red</RadioGroup.Item>
        <RadioGroup.Item value="green">Green</RadioGroup.Item>
        <RadioGroup.Item value="blue">Blue</RadioGroup.Item>
      </RadioGroup.Root>,
    );
    const green = screen.getByRole("radio", { name: "Green" });
    screen.getByRole("radio", { name: "Red" }).focus();

    // Assert — dir reaches the DOM
    expect(screen.getByRole("radiogroup")).toHaveAttribute("dir", "rtl");

    // Act — in RTL, Arrow Left moves forward
    await user.keyboard("{ArrowLeft}");

    // Assert
    expect(green).toHaveFocus();
    expect(green).toHaveAttribute("aria-checked", "true");
  });

  it("inherits reading direction from a DirectionProvider", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <DirectionProvider dir="rtl">
        <RadioGroup.Root
          aria-label="Colour"
          orientation="horizontal"
          defaultValue="red"
        >
          <RadioGroup.Item value="red">Red</RadioGroup.Item>
          <RadioGroup.Item value="green">Green</RadioGroup.Item>
          <RadioGroup.Item value="blue">Blue</RadioGroup.Item>
        </RadioGroup.Root>
      </DirectionProvider>,
    );
    const green = screen.getByRole("radio", { name: "Green" });
    screen.getByRole("radio", { name: "Red" }).focus();

    // Assert — provider direction reaches the DOM
    expect(screen.getByRole("radiogroup")).toHaveAttribute("dir", "rtl");

    // Act — in RTL, Arrow Left moves forward
    await user.keyboard("{ArrowLeft}");

    // Assert
    expect(green).toHaveFocus();
  });
});
