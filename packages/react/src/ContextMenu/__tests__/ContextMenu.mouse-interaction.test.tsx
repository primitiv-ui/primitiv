import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ContextMenu } from "../ContextMenu";

describe("ContextMenu mouse interaction", () => {
  it("adds data-highlighted to an Item when the pointer enters it", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <ContextMenu.Root defaultOpen>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Item>Rename</ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    );
    const item = screen.getByRole("menuitem", { name: "Rename", hidden: true });

    // Act
    await user.hover(item);

    // Assert
    expect(item).toHaveAttribute("data-highlighted");
  });

  it("removes data-highlighted from an Item when the pointer leaves", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <ContextMenu.Root defaultOpen>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Item>Rename</ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    );
    const item = screen.getByRole("menuitem", { name: "Rename", hidden: true });

    // Act
    await user.hover(item);
    await user.unhover(item);

    // Assert
    expect(item).not.toHaveAttribute("data-highlighted");
  });

  it("closes the menu when the user clicks outside both the trigger and the content", async () => {
    // Arrange
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <div>
        <ContextMenu.Root defaultOpen onOpenChange={onOpenChange}>
          <ContextMenu.Trigger>Area</ContextMenu.Trigger>
          <ContextMenu.Content>
            <ContextMenu.Item>Rename</ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu.Root>
        <button type="button">Outside</button>
      </div>,
    );

    // Act
    await user.click(screen.getByText("Outside"));

    // Assert
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
