import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ContextMenu } from "../ContextMenu";

describe("ContextMenu mouse interaction", () => {
  it("opens the menu and reports onOpenChange(true) when the Trigger receives a contextmenu event", () => {
    // Arrange
    const onOpenChange = vi.fn();
    render(
      <ContextMenu.Root onOpenChange={onOpenChange}>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Item>Rename</ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    );
    const trigger = screen.getByText("Area");

    // Act
    fireEvent.contextMenu(trigger, { clientX: 40, clientY: 80 });

    // Assert
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it("suppresses the native browser menu by calling preventDefault on the contextmenu event", () => {
    // Arrange
    render(
      <ContextMenu.Root>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Item>Rename</ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    );
    const trigger = screen.getByText("Area");

    // Act — fireEvent returns false when the dispatched event was default-prevented.
    const result = fireEvent.contextMenu(trigger, { clientX: 0, clientY: 0 });

    // Assert
    expect(result).toBe(false);
  });

  it("positions Content via fixed coordinates matching the cursor", () => {
    // Arrange
    render(
      <ContextMenu.Root>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Item>Rename</ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    );
    const trigger = screen.getByText("Area");

    // Act
    fireEvent.contextMenu(trigger, { clientX: 123, clientY: 456 });

    // Assert
    const menu = screen.getByRole("menu", { hidden: true });
    expect(menu).toHaveStyle({
      position: "fixed",
      left: "123px",
      top: "456px",
    });
  });

  it("does not open and does not call onOpenChange when the Trigger is disabled", () => {
    // Arrange
    const onOpenChange = vi.fn();
    render(
      <ContextMenu.Root onOpenChange={onOpenChange}>
        <ContextMenu.Trigger disabled>Area</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Item>Rename</ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    );
    const trigger = screen.getByText("Area");

    // Act
    fireEvent.contextMenu(trigger, { clientX: 10, clientY: 10 });

    // Assert
    expect(onOpenChange).not.toHaveBeenCalled();
  });

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

  it("keeps the menu open when the click lands on the trigger itself", async () => {
    // The outside-click dismissal must exempt the trigger so a click within it
    // does not immediately re-close a just-opened menu.
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
    await user.click(screen.getByText("Area"));

    // Assert — the trigger-contained click did not request a close.
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it("keeps the menu open when the click lands inside the content popover", async () => {
    // A click on the menu surface (but not an item) must not dismiss it.
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
    await user.click(screen.getByRole("menu", { hidden: true }));

    // Assert
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
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

  it("closes an open sub-menu when the pointer moves onto a sibling item in the parent menu", async () => {
    // Mirrors the keyboard contract: focus returning to the parent menu
    // dismisses the sub. With the mouse, moving off the sub-trigger and onto
    // another item in the same parent menu must likewise close the sub.
    const user = userEvent.setup();
    render(
      <ContextMenu.Root defaultOpen>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Item>New</ContextMenu.Item>
          <ContextMenu.Sub>
            <ContextMenu.SubTrigger>Share</ContextMenu.SubTrigger>
            <ContextMenu.SubContent>
              <ContextMenu.Item>Email</ContextMenu.Item>
            </ContextMenu.SubContent>
          </ContextMenu.Sub>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    );
    const subTrigger = screen.getByRole("menuitem", {
      name: "Share",
      hidden: true,
    });
    const sibling = screen.getByRole("menuitem", {
      name: "New",
      hidden: true,
    });

    // Act — hover sub-trigger to open it, then move onto the sibling
    await user.hover(subTrigger);
    expect(subTrigger).toHaveAttribute("aria-expanded", "true");

    await user.hover(sibling);

    // Assert — sub has closed and its trigger is no longer highlighted
    expect(subTrigger).toHaveAttribute("aria-expanded", "false");
    expect(subTrigger).not.toHaveAttribute("data-highlighted");
  });

  it("supplants an open sibling sub when the pointer hovers a second SubTrigger", async () => {
    // Two sibling subs. Hovering A opens A; hovering B must close A and open B.
    const user = userEvent.setup();
    render(
      <ContextMenu.Root defaultOpen>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Sub>
            <ContextMenu.SubTrigger>Share</ContextMenu.SubTrigger>
            <ContextMenu.SubContent>
              <ContextMenu.Item>Email</ContextMenu.Item>
            </ContextMenu.SubContent>
          </ContextMenu.Sub>
          <ContextMenu.Sub>
            <ContextMenu.SubTrigger>Move to</ContextMenu.SubTrigger>
            <ContextMenu.SubContent>
              <ContextMenu.Item>Trash</ContextMenu.Item>
            </ContextMenu.SubContent>
          </ContextMenu.Sub>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    );
    const a = screen.getByRole("menuitem", { name: "Share", hidden: true });
    const b = screen.getByRole("menuitem", { name: "Move to", hidden: true });

    // Act
    await user.hover(a);
    expect(a).toHaveAttribute("aria-expanded", "true");
    await user.hover(b);

    // Assert
    expect(a).toHaveAttribute("aria-expanded", "false");
    expect(b).toHaveAttribute("aria-expanded", "true");
  });
});
