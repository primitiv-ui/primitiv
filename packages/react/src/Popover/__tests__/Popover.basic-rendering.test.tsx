import { render, screen } from "@testing-library/react";

import { Popover } from "../Popover";

describe("Popover basic rendering tests", () => {
  it("should render Popover.Trigger as a button with type='button'", () => {
    // Arrange
    render(
      <Popover.Root>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content>Content</Popover.Content>
      </Popover.Root>,
    );
    const trigger = screen.getByRole("button", { name: "Open" });

    // Assert
    expect(trigger.tagName).toBe("BUTTON");
    expect(trigger).toHaveAttribute("type", "button");
  });
});
