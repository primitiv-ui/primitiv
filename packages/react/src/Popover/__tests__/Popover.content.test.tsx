import { render, screen } from "@testing-library/react";

import { Popover } from "../Popover";

describe("Popover.Title and Popover.Description", () => {
  it("wires Content aria-labelledby to a Popover.Title", () => {
    // Arrange
    render(
      <Popover.Root defaultOpen>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content data-testid="content">
          <Popover.Title>Filters</Popover.Title>
        </Popover.Content>
      </Popover.Root>,
    );
    const content = screen.getByTestId("content");
    const title = screen.getByRole("heading", { name: "Filters", hidden: true });

    // Assert
    expect(title.tagName).toBe("H2");
    expect(content).toHaveAttribute("aria-labelledby", title.id);
    expect(title.id).not.toBe("");
  });

  it("wires Content aria-describedby to a Popover.Description", () => {
    // Arrange
    render(
      <Popover.Root defaultOpen>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content data-testid="content">
          <Popover.Description>Narrow the results below.</Popover.Description>
        </Popover.Content>
      </Popover.Root>,
    );
    const content = screen.getByTestId("content");
    const description = screen.getByText("Narrow the results below.");

    // Assert
    expect(description.tagName).toBe("P");
    expect(content).toHaveAttribute("aria-describedby", description.id);
    expect(description.id).not.toBe("");
  });

  it("omits aria-labelledby and aria-describedby when neither is present", () => {
    // Arrange
    render(
      <Popover.Root defaultOpen>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content data-testid="content">Content</Popover.Content>
      </Popover.Root>,
    );
    const content = screen.getByTestId("content");

    // Assert
    expect(content).not.toHaveAttribute("aria-labelledby");
    expect(content).not.toHaveAttribute("aria-describedby");
  });
});
