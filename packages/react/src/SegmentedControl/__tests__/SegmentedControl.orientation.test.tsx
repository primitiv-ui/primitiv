import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SegmentedControl } from "../SegmentedControl";

describe("SegmentedControl orientation", () => {
  it("ignores vertical arrows when orientation is horizontal (default)", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <SegmentedControl.Root aria-label="Mode" defaultValue="a">
        <SegmentedControl.Item value="a">A</SegmentedControl.Item>
        <SegmentedControl.Item value="b">B</SegmentedControl.Item>
      </SegmentedControl.Root>,
    );
    const a = screen.getByRole("radio", { name: "A" });
    const b = screen.getByRole("radio", { name: "B" });
    a.focus();

    // Act
    await user.keyboard("{ArrowDown}");

    // Assert — vertical arrows are inert on a horizontal control
    expect(a).toHaveFocus();
    expect(a).toHaveAttribute("aria-checked", "true");
    expect(b).toHaveAttribute("aria-checked", "false");
  });

  it("ignores horizontal arrows when orientation is vertical", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <SegmentedControl.Root
        aria-label="Mode"
        orientation="vertical"
        defaultValue="a"
      >
        <SegmentedControl.Item value="a">A</SegmentedControl.Item>
        <SegmentedControl.Item value="b">B</SegmentedControl.Item>
      </SegmentedControl.Root>,
    );
    const a = screen.getByRole("radio", { name: "A" });
    const b = screen.getByRole("radio", { name: "B" });
    a.focus();

    // Act
    await user.keyboard("{ArrowRight}");

    // Assert — horizontal arrows are inert on a vertical control
    expect(a).toHaveFocus();
    expect(a).toHaveAttribute("aria-checked", "true");
    expect(b).toHaveAttribute("aria-checked", "false");
  });
});
