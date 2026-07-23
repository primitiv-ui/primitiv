import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SegmentedControl } from "../SegmentedControl";

describe("SegmentedControl uncontrolled state", () => {
  it("reflects defaultValue on mount", () => {
    // Arrange & Act
    render(
      <SegmentedControl.Root aria-label="Mode" defaultValue="styled">
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
    expect(screen.getByRole("radio", { name: "Styled" })).toHaveAttribute(
      "data-state",
      "checked",
    );
  });

  it("selects an item on click and un-selects the previous one", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <SegmentedControl.Root aria-label="Mode" defaultValue="headless">
        <SegmentedControl.Item value="headless">Headless</SegmentedControl.Item>
        <SegmentedControl.Item value="styled">Styled</SegmentedControl.Item>
      </SegmentedControl.Root>,
    );
    const headless = screen.getByRole("radio", { name: "Headless" });
    const styled = screen.getByRole("radio", { name: "Styled" });
    expect(headless).toHaveAttribute("aria-checked", "true");

    // Act
    await user.click(styled);

    // Assert
    expect(headless).toHaveAttribute("aria-checked", "false");
    expect(styled).toHaveAttribute("aria-checked", "true");
  });

  it("fires onValueChange with the new value on every distinct selection", async () => {
    // Arrange
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <SegmentedControl.Root aria-label="Mode" onValueChange={onValueChange}>
        <SegmentedControl.Item value="headless">Headless</SegmentedControl.Item>
        <SegmentedControl.Item value="styled">Styled</SegmentedControl.Item>
      </SegmentedControl.Root>,
    );

    // Act
    await user.click(screen.getByRole("radio", { name: "Headless" }));
    await user.click(screen.getByRole("radio", { name: "Styled" }));

    // Assert
    expect(onValueChange).toHaveBeenNthCalledWith(1, "headless");
    expect(onValueChange).toHaveBeenNthCalledWith(2, "styled");
  });

  it("does not re-fire onValueChange when the already-selected item is clicked again", async () => {
    // Arrange
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <SegmentedControl.Root
        aria-label="Mode"
        defaultValue="headless"
        onValueChange={onValueChange}
      >
        <SegmentedControl.Item value="headless">Headless</SegmentedControl.Item>
        <SegmentedControl.Item value="styled">Styled</SegmentedControl.Item>
      </SegmentedControl.Root>,
    );

    // Act
    await user.click(screen.getByRole("radio", { name: "Headless" }));
    await user.click(screen.getByRole("radio", { name: "Headless" }));

    // Assert
    expect(onValueChange).not.toHaveBeenCalled();
  });
});
