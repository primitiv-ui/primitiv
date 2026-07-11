import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Popover } from "../Popover";

describe("Popover keyboard interaction", () => {
  it("closes the popover when Escape is pressed", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Popover.Root defaultOpen>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content data-testid="content">
          <button type="button">Inside</button>
        </Popover.Content>
      </Popover.Root>,
    );
    const trigger = screen.getByRole("button", { name: "Open" });
    const content = screen.getByTestId("content");

    // Act
    await user.click(screen.getByRole("button", { name: "Inside", hidden: true }));
    await user.keyboard("{Escape}");

    // Assert
    expect(content).toHaveAttribute("data-state", "closed");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("returns focus to the trigger after Escape", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Popover.Root defaultOpen>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content>
          <button type="button">Inside</button>
        </Popover.Content>
      </Popover.Root>,
    );
    const trigger = screen.getByRole("button", { name: "Open" });

    // Act
    await user.click(screen.getByRole("button", { name: "Inside", hidden: true }));
    await user.keyboard("{Escape}");

    // Assert
    expect(trigger).toHaveFocus();
  });

  it("still fires a consumer onKeyDown on the content", async () => {
    // Arrange
    const user = userEvent.setup();
    const onKeyDown = vi.fn();
    render(
      <Popover.Root defaultOpen>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content onKeyDown={onKeyDown}>
          <button type="button">Inside</button>
        </Popover.Content>
      </Popover.Root>,
    );

    // Act
    await user.click(screen.getByRole("button", { name: "Inside", hidden: true }));
    await user.keyboard("a");

    // Assert
    expect(onKeyDown).toHaveBeenCalled();
  });
});
