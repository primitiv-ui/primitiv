import { fireEvent, render, screen } from "@testing-library/react";

import { ContextMenu } from "../ContextMenu";

describe("ContextMenu.Item", () => {
  it("renders as <li role=menuitem>", () => {
    // Arrange & Act
    render(
      <ContextMenu.Root defaultOpen>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Item>Rename</ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    );

    // Assert
    const item = screen.getByRole("menuitem", { name: "Rename", hidden: true });
    expect(item.tagName).toBe("LI");
  });

  it("fires onSelect when the item is clicked", () => {
    // Arrange
    const onSelect = vi.fn();
    render(
      <ContextMenu.Root defaultOpen>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Item onSelect={onSelect}>Rename</ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    );
    const item = screen.getByRole("menuitem", { name: "Rename", hidden: true });

    // Act
    fireEvent.click(item);

    // Assert
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it("closes the menu after a click selection", () => {
    // Arrange
    const onOpenChange = vi.fn();
    render(
      <ContextMenu.Root defaultOpen onOpenChange={onOpenChange}>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Item>Rename</ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    );
    const item = screen.getByRole("menuitem", { name: "Rename", hidden: true });

    // Act
    fireEvent.click(item);

    // Assert
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("keeps the menu open when onSelect calls preventDefault", () => {
    // Arrange
    const onOpenChange = vi.fn();
    render(
      <ContextMenu.Root defaultOpen onOpenChange={onOpenChange}>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Item onSelect={(event) => event.preventDefault()}>
            Rename
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    );
    const item = screen.getByRole("menuitem", { name: "Rename", hidden: true });

    // Act
    fireEvent.click(item);

    // Assert
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it("does not select when the item is disabled", () => {
    // Arrange
    const onSelect = vi.fn();
    render(
      <ContextMenu.Root defaultOpen>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Item disabled onSelect={onSelect}>
            Rename
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    );
    const item = screen.getByRole("menuitem", { name: "Rename", hidden: true });

    // Act
    fireEvent.click(item);

    // Assert
    expect(onSelect).not.toHaveBeenCalled();
    expect(item).toHaveAttribute("aria-disabled", "true");
  });
});
