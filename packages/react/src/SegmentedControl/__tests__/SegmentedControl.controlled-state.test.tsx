import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

import { SegmentedControl } from "../SegmentedControl";

describe("SegmentedControl controlled state", () => {
  it("reflects the controlled `value` prop", () => {
    // Arrange & Act
    const { rerender } = render(
      <SegmentedControl.Root
        aria-label="Mode"
        value="headless"
        onValueChange={() => {}}
      >
        <SegmentedControl.Item value="headless">Headless</SegmentedControl.Item>
        <SegmentedControl.Item value="styled">Styled</SegmentedControl.Item>
      </SegmentedControl.Root>,
    );
    expect(screen.getByRole("radio", { name: "Headless" })).toHaveAttribute(
      "aria-checked",
      "true",
    );

    rerender(
      <SegmentedControl.Root
        aria-label="Mode"
        value="styled"
        onValueChange={() => {}}
      >
        <SegmentedControl.Item value="headless">Headless</SegmentedControl.Item>
        <SegmentedControl.Item value="styled">Styled</SegmentedControl.Item>
      </SegmentedControl.Root>,
    );

    // Assert
    expect(screen.getByRole("radio", { name: "Headless" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
    expect(screen.getByRole("radio", { name: "Styled" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("does not update rendered state when the parent refuses to update `value`", async () => {
    // Arrange
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <SegmentedControl.Root
        aria-label="Mode"
        value="headless"
        onValueChange={onValueChange}
      >
        <SegmentedControl.Item value="headless">Headless</SegmentedControl.Item>
        <SegmentedControl.Item value="styled">Styled</SegmentedControl.Item>
      </SegmentedControl.Root>,
    );
    const styled = screen.getByRole("radio", { name: "Styled" });

    // Act
    await user.click(styled);

    // Assert: callback fires but the pinned `value` keeps state on "headless".
    expect(onValueChange).toHaveBeenCalledWith("styled");
    expect(screen.getByRole("radio", { name: "Headless" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(styled).toHaveAttribute("aria-checked", "false");
  });

  it("lets a parent drive the value end to end", async () => {
    // Arrange
    const user = userEvent.setup();
    function Harness() {
      const [value, setValue] = useState("styled");
      return (
        <SegmentedControl.Root
          aria-label="Mode"
          value={value}
          onValueChange={setValue}
        >
          <SegmentedControl.Item value="headless">
            Headless
          </SegmentedControl.Item>
          <SegmentedControl.Item value="styled">Styled</SegmentedControl.Item>
        </SegmentedControl.Root>
      );
    }
    render(<Harness />);
    const headless = screen.getByRole("radio", { name: "Headless" });
    const styled = screen.getByRole("radio", { name: "Styled" });
    expect(styled).toHaveAttribute("aria-checked", "true");

    // Act & Assert
    await user.click(headless);
    expect(headless).toHaveAttribute("aria-checked", "true");
    expect(styled).toHaveAttribute("aria-checked", "false");

    await user.click(styled);
    expect(styled).toHaveAttribute("aria-checked", "true");
    expect(headless).toHaveAttribute("aria-checked", "false");
  });
});
