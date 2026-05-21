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

  it("renders Content as a native-popover <menu role=menu> when the menu is open", () => {
    // Arrange & Act
    render(
      <ContextMenu.Root defaultOpen>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Content>Items go here</ContextMenu.Content>
      </ContextMenu.Root>,
    );

    // Assert — `hidden: true` because a closed `popover` element is hidden
    // from the accessibility tree by the browser; jsdom does not transition.
    const menu = screen.getByRole("menu", { hidden: true });
    expect(menu.tagName).toBe("MENU");
    expect(menu).toHaveAttribute("popover", "auto");
    expect(menu.id).toBeTruthy();
  });
});
