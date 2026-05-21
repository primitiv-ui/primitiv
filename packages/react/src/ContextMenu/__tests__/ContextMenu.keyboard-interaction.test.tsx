import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ContextMenu } from "../ContextMenu";

function renderMenu() {
  return render(
    <ContextMenu.Root defaultOpen>
      <ContextMenu.Trigger>Area</ContextMenu.Trigger>
      <ContextMenu.Content>
        <ContextMenu.Item>Rename</ContextMenu.Item>
        <ContextMenu.Item>Duplicate</ContextMenu.Item>
        <ContextMenu.Item>Delete</ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>,
  );
}

describe("ContextMenu keyboard interaction", () => {
  it("moves focus to the first item when the menu opens", () => {
    // Arrange & Act
    renderMenu();

    // Assert
    expect(
      screen.getByRole("menuitem", { name: "Rename", hidden: true }),
    ).toHaveFocus();
  });

  it("ArrowDown moves focus to the next item", async () => {
    // Arrange
    const user = userEvent.setup();
    renderMenu();

    // Act
    await user.keyboard("{ArrowDown}");

    // Assert
    expect(
      screen.getByRole("menuitem", { name: "Duplicate", hidden: true }),
    ).toHaveFocus();
  });

  it("ArrowDown wraps from the last item back to the first", async () => {
    // Arrange
    const user = userEvent.setup();
    renderMenu();

    // Act
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");

    // Assert
    expect(
      screen.getByRole("menuitem", { name: "Rename", hidden: true }),
    ).toHaveFocus();
  });

  it("ArrowUp moves focus to the previous item and wraps to the last", async () => {
    // Arrange
    const user = userEvent.setup();
    renderMenu();

    // Act
    await user.keyboard("{ArrowUp}");

    // Assert
    expect(
      screen.getByRole("menuitem", { name: "Delete", hidden: true }),
    ).toHaveFocus();
  });

  it("Home jumps to the first item and End jumps to the last", async () => {
    // Arrange
    const user = userEvent.setup();
    renderMenu();

    // Act
    await user.keyboard("{End}");
    expect(
      screen.getByRole("menuitem", { name: "Delete", hidden: true }),
    ).toHaveFocus();
    await user.keyboard("{Home}");

    // Assert
    expect(
      screen.getByRole("menuitem", { name: "Rename", hidden: true }),
    ).toHaveFocus();
  });

  it("Enter activates the focused item", async () => {
    // Arrange
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <ContextMenu.Root defaultOpen>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Item onSelect={onSelect}>Rename</ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    );

    // Act
    await user.keyboard("{Enter}");

    // Assert
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it("Space activates the focused item", async () => {
    // Arrange
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <ContextMenu.Root defaultOpen>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Item onSelect={onSelect}>Rename</ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    );

    // Act
    await user.keyboard(" ");

    // Assert
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it("Escape closes the menu", async () => {
    // Arrange
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <ContextMenu.Root defaultOpen onOpenChange={onOpenChange}>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Item>Rename</ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    );

    // Act
    await user.keyboard("{Escape}");

    // Assert
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("skips disabled items during arrow navigation", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <ContextMenu.Root defaultOpen>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Item>Rename</ContextMenu.Item>
          <ContextMenu.Item disabled>Duplicate</ContextMenu.Item>
          <ContextMenu.Item>Delete</ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    );

    // Act
    await user.keyboard("{ArrowDown}");

    // Assert — Duplicate is disabled, so focus lands on Delete
    expect(
      screen.getByRole("menuitem", { name: "Delete", hidden: true }),
    ).toHaveFocus();
  });
});
