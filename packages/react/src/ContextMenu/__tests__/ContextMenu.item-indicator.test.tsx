import { render, screen } from "@testing-library/react";

import { ContextMenu } from "../ContextMenu";

describe("ContextMenu.ItemIndicator", () => {
  it("renders inside a checked CheckboxItem with data-state=checked", () => {
    // Arrange & Act
    render(
      <ContextMenu.Root defaultOpen>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.CheckboxItem defaultChecked>
            <ContextMenu.ItemIndicator>
              <span data-testid="indicator">✓</span>
            </ContextMenu.ItemIndicator>
            Show grid
          </ContextMenu.CheckboxItem>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    );

    // Assert
    const indicator = screen.getByTestId("indicator").parentElement!;
    expect(indicator).toHaveAttribute("data-state", "checked");
  });

  it("unmounts when the parent CheckboxItem is unchecked", () => {
    // Arrange & Act
    render(
      <ContextMenu.Root defaultOpen>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.CheckboxItem>
            <ContextMenu.ItemIndicator>
              <span data-testid="indicator">✓</span>
            </ContextMenu.ItemIndicator>
            Show grid
          </ContextMenu.CheckboxItem>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    );

    // Assert
    expect(screen.queryByTestId("indicator")).not.toBeInTheDocument();
  });

  it("stays mounted when unchecked if forceMount is set, reflecting state via data-state", () => {
    // Arrange & Act
    render(
      <ContextMenu.Root defaultOpen>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.CheckboxItem>
            <ContextMenu.ItemIndicator forceMount>
              <span data-testid="indicator">✓</span>
            </ContextMenu.ItemIndicator>
            Show grid
          </ContextMenu.CheckboxItem>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    );

    // Assert
    const indicator = screen.getByTestId("indicator").parentElement!;
    expect(indicator).toHaveAttribute("data-state", "unchecked");
  });

  it("renders with data-state=indeterminate inside a tri-state CheckboxItem", () => {
    // Arrange & Act
    render(
      <ContextMenu.Root defaultOpen>
        <ContextMenu.Trigger>Area</ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.CheckboxItem defaultChecked="indeterminate">
            <ContextMenu.ItemIndicator>
              <span data-testid="indicator">~</span>
            </ContextMenu.ItemIndicator>
            Show grid
          </ContextMenu.CheckboxItem>
        </ContextMenu.Content>
      </ContextMenu.Root>,
    );

    // Assert
    const indicator = screen.getByTestId("indicator").parentElement!;
    expect(indicator).toHaveAttribute("data-state", "indeterminate");
  });
});
