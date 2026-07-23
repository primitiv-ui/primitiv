import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DirectionProvider } from "../../DirectionProvider/index.ts";
import { SegmentedControl } from "../SegmentedControl";

describe("SegmentedControl reading direction", () => {
  it("inverts horizontal arrows when dir is rtl", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <SegmentedControl.Root aria-label="Mode" dir="rtl" defaultValue="a">
        <SegmentedControl.Item value="a">A</SegmentedControl.Item>
        <SegmentedControl.Item value="b">B</SegmentedControl.Item>
        <SegmentedControl.Item value="c">C</SegmentedControl.Item>
      </SegmentedControl.Root>,
    );
    const b = screen.getByRole("radio", { name: "B" });
    screen.getByRole("radio", { name: "A" }).focus();

    // Assert — dir reaches the DOM
    expect(screen.getByRole("radiogroup")).toHaveAttribute("dir", "rtl");

    // Act — in RTL, Arrow Left moves forward
    await user.keyboard("{ArrowLeft}");

    // Assert
    expect(b).toHaveFocus();
    expect(b).toHaveAttribute("aria-checked", "true");
  });

  it("inherits reading direction from a DirectionProvider", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <DirectionProvider dir="rtl">
        <SegmentedControl.Root aria-label="Mode" defaultValue="a">
          <SegmentedControl.Item value="a">A</SegmentedControl.Item>
          <SegmentedControl.Item value="b">B</SegmentedControl.Item>
          <SegmentedControl.Item value="c">C</SegmentedControl.Item>
        </SegmentedControl.Root>
      </DirectionProvider>,
    );
    const b = screen.getByRole("radio", { name: "B" });
    screen.getByRole("radio", { name: "A" }).focus();

    // Assert — provider direction reaches the DOM
    expect(screen.getByRole("radiogroup")).toHaveAttribute("dir", "rtl");

    // Act — in RTL, Arrow Left moves forward
    await user.keyboard("{ArrowLeft}");

    // Assert
    expect(b).toHaveFocus();
  });
});
