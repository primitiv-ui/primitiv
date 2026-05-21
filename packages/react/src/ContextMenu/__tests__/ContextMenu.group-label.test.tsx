import { render, screen } from "@testing-library/react";

import { ContextMenu } from "../ContextMenu";

describe("ContextMenu.Group + ContextMenu.Label", () => {
  it("renders Group as <li role=group> wrapping <ul role=none>", () => {
    // Arrange & Act
    render(
      <ContextMenu.Root defaultOpen>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Group>
            <ContextMenu.Item>Rename</ContextMenu.Item>
          </ContextMenu.Group>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    );

    // Assert
    const group = screen.getByRole("group", { hidden: true });
    expect(group.tagName).toBe("LI");
    const inner = group.firstElementChild!;
    expect(inner.tagName).toBe("UL");
    expect(inner).toHaveAttribute("role", "none");
  });

  it("wires Group's aria-labelledby to a nested Label's id", () => {
    // Arrange & Act
    render(
      <ContextMenu.Root defaultOpen>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Group>
            <ContextMenu.Label>Actions</ContextMenu.Label>
            <ContextMenu.Item>Rename</ContextMenu.Item>
          </ContextMenu.Group>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    );

    // Assert
    const group = screen.getByRole("group", { hidden: true });
    const label = screen.getByText("Actions");
    expect(label.id).toBeTruthy();
    expect(group).toHaveAttribute("aria-labelledby", label.id);
  });

});
