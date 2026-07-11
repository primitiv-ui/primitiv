import { render, screen } from "@testing-library/react";

import { Popover } from "../Popover";

describe("Popover.Anchor", () => {
  it("renders a div wrapping its children as the positioning reference", () => {
    // Arrange
    render(
      <Popover.Root>
        <Popover.Anchor data-testid="anchor">
          <span>Reference</span>
        </Popover.Anchor>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content>Content</Popover.Content>
      </Popover.Root>,
    );
    const anchor = screen.getByTestId("anchor");

    // Assert
    expect(anchor.tagName).toBe("DIV");
    expect(anchor).toContainElement(screen.getByText("Reference"));
  });

  it("forwards arbitrary props to the rendered div", () => {
    // Arrange
    render(
      <Popover.Root>
        <Popover.Anchor data-testid="anchor" className="anchor-name" />
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content>Content</Popover.Content>
      </Popover.Root>,
    );
    const anchor = screen.getByTestId("anchor");

    // Assert
    expect(anchor).toHaveClass("anchor-name");
  });
});
