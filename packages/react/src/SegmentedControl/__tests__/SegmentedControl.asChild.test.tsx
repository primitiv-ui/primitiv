import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SegmentedControl } from "../SegmentedControl";

describe("SegmentedControl asChild composition", () => {
  it("Root asChild renders the consumer element with radiogroup role preserved", () => {
    // Arrange & Act
    render(
      <SegmentedControl.Root asChild aria-label="Mode">
        <section data-testid="wrap">
          <SegmentedControl.Item value="a">A</SegmentedControl.Item>
        </section>
      </SegmentedControl.Root>,
    );

    // Assert
    const root = screen.getByTestId("wrap");
    expect(root.tagName).toBe("SECTION");
    expect(root).toHaveAttribute("role", "radiogroup");
    expect(root).toHaveAttribute("aria-label", "Mode");
    expect(root).toHaveAttribute("data-orientation", "horizontal");
  });

  it("Item asChild delegates to the child element while keeping ARIA + selection wiring", async () => {
    // Arrange
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <SegmentedControl.Root aria-label="Mode" onValueChange={onValueChange}>
        <SegmentedControl.Item value="a" asChild>
          <li>A</li>
        </SegmentedControl.Item>
      </SegmentedControl.Root>,
    );
    const item = screen.getByRole("radio", { name: "A" });

    // Assert element is the consumer's <li>
    expect(item.tagName).toBe("LI");
    expect(item).toHaveAttribute("aria-checked", "false");
    expect(item).toHaveAttribute("data-state", "unchecked");

    // Act
    await user.click(item);

    // Assert selection wiring still fires via composed onClick
    expect(onValueChange).toHaveBeenCalledWith("a");
    expect(item).toHaveAttribute("aria-checked", "true");
  });
});
