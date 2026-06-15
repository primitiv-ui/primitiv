import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DirectionProvider } from "../../DirectionProvider/index.ts";
import { ToggleGroup } from "../ToggleGroup";

describe("ToggleGroup reading direction", () => {
  it("should inherit reading direction from a DirectionProvider", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <DirectionProvider dir="rtl">
        <ToggleGroup.Root type="single" aria-label="Alignment">
          <ToggleGroup.Item value="left">Left</ToggleGroup.Item>
          <ToggleGroup.Item value="center">Center</ToggleGroup.Item>
          <ToggleGroup.Item value="right">Right</ToggleGroup.Item>
        </ToggleGroup.Root>
      </DirectionProvider>,
    );
    screen.getByRole("button", { name: "Left" }).focus();

    // Act — in RTL, Arrow Left moves forward
    await user.keyboard("{ArrowLeft}");

    // Assert
    expect(screen.getByRole("button", { name: "Center" })).toHaveFocus();
  });
});
