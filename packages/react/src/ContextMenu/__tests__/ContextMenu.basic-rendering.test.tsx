import { render, screen } from "@testing-library/react";

import { ContextMenu } from "../ContextMenu";

describe("ContextMenu basic rendering", () => {
  it("renders the Trigger's children so the area that should respond to right-click is in the DOM", () => {
    // Arrange & Act
    render(
      <ContextMenu.Root>
        <ContextMenu.Trigger>
          <div>Right-click area</div>
        </ContextMenu.Trigger>
      </ContextMenu.Root>,
    );

    // Assert
    expect(screen.getByText("Right-click area")).toBeInTheDocument();
  });

  it("renders Content as a native popover with popover=manual so the browser does not light-dismiss the menu on the right-click's mouseup", () => {
    // Arrange & Act
    render(
      <ContextMenu.Root defaultOpen>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Content>Items go here</ContextMenu.Content>
      </ContextMenu.Root>,
    );

    // Assert — popover=manual is critical: with "auto" the browser treats
    // the right-click's pointerdown (which fires before the popover opened)
    // and the subsequent pointerup as an outside-dismiss gesture, closing
    // the menu the instant the user releases the button. We close on
    // outside click and Escape ourselves instead.
    const menu = screen.getByRole("menu", { hidden: true });
    expect(menu.tagName).toBe("MENU");
    expect(menu).toHaveAttribute("popover", "manual");
    expect(menu.id).toBeTruthy();
  });
});
