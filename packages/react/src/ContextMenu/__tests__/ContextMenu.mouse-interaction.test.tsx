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
