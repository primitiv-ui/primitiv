import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Popover } from "../Popover";

describe("Popover controlled state", () => {
  it("reflects the controlled open prop", () => {
    // Arrange & Act
    render(
      <Popover.Root open onOpenChange={() => {}}>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content data-testid="content">Content</Popover.Content>
      </Popover.Root>,
    );
    const trigger = screen.getByRole("button", { name: "Open" });
    const content = screen.getByTestId("content");

    // Assert
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(content).toHaveAttribute("data-state", "open");
    expect(content).toHaveAttribute("data-popover-open");
  });

  it("defers state changes to the parent — clicking calls onOpenChange but does not self-open", async () => {
    // Arrange
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Popover.Root open={false} onOpenChange={onOpenChange}>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content data-testid="content">Content</Popover.Content>
      </Popover.Root>,
    );
    const trigger = screen.getByRole("button", { name: "Open" });
    const content = screen.getByTestId("content");

    // Act
    await user.click(trigger);

    // Assert
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(content).toHaveAttribute("data-state", "closed");
  });
});
