import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SegmentedControl } from "../SegmentedControl";

describe("SegmentedControl roving tabindex", () => {
  it("puts only the first segment in the tab sequence when nothing is selected", () => {
    // Arrange & Act
    render(
      <SegmentedControl.Root aria-label="Mode">
        <SegmentedControl.Item value="a">A</SegmentedControl.Item>
        <SegmentedControl.Item value="b">B</SegmentedControl.Item>
        <SegmentedControl.Item value="c">C</SegmentedControl.Item>
      </SegmentedControl.Root>,
    );

    // Assert
    expect(screen.getByRole("radio", { name: "A" })).toHaveAttribute(
      "tabindex",
      "0",
    );
    expect(screen.getByRole("radio", { name: "B" })).toHaveAttribute(
      "tabindex",
      "-1",
    );
    expect(screen.getByRole("radio", { name: "C" })).toHaveAttribute(
      "tabindex",
      "-1",
    );
  });

  it("puts only the selected segment in the tab sequence when one is selected", () => {
    // Arrange & Act
    render(
      <SegmentedControl.Root aria-label="Mode" defaultValue="b">
        <SegmentedControl.Item value="a">A</SegmentedControl.Item>
        <SegmentedControl.Item value="b">B</SegmentedControl.Item>
        <SegmentedControl.Item value="c">C</SegmentedControl.Item>
      </SegmentedControl.Root>,
    );

    // Assert
    expect(screen.getByRole("radio", { name: "A" })).toHaveAttribute(
      "tabindex",
      "-1",
    );
    expect(screen.getByRole("radio", { name: "B" })).toHaveAttribute(
      "tabindex",
      "0",
    );
    expect(screen.getByRole("radio", { name: "C" })).toHaveAttribute(
      "tabindex",
      "-1",
    );
  });

  it("moves the tab stop to a newly selected segment", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <SegmentedControl.Root aria-label="Mode">
        <SegmentedControl.Item value="a">A</SegmentedControl.Item>
        <SegmentedControl.Item value="b">B</SegmentedControl.Item>
      </SegmentedControl.Root>,
    );
    const a = screen.getByRole("radio", { name: "A" });
    const b = screen.getByRole("radio", { name: "B" });
    expect(a).toHaveAttribute("tabindex", "0");

    // Act
    await user.click(b);

    // Assert
    expect(a).toHaveAttribute("tabindex", "-1");
    expect(b).toHaveAttribute("tabindex", "0");
  });

  it("tabs into the single home-base segment and not the others", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <>
        <button type="button">Before</button>
        <SegmentedControl.Root aria-label="Mode">
          <SegmentedControl.Item value="a">A</SegmentedControl.Item>
          <SegmentedControl.Item value="b">B</SegmentedControl.Item>
          <SegmentedControl.Item value="c">C</SegmentedControl.Item>
        </SegmentedControl.Root>
        <button type="button">After</button>
      </>,
    );
    screen.getByRole("button", { name: "Before" }).focus();

    // Act
    await user.tab();

    // Assert: focus lands on the first segment (the home base)
    expect(screen.getByRole("radio", { name: "A" })).toHaveFocus();

    // Tabbing again escapes the group entirely — the others are tabindex -1.
    await user.tab();
    expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
  });
});
