import "./dialog-polyfill";

import { render, screen } from "@testing-library/react";

import { Drawer } from "../Drawer";

describe("Drawer — rendering & structure", () => {
  it("Trigger renders a <button> with dialog ARIA", () => {
    // Arrange / Act
    render(
      <Drawer.Root>
        <Drawer.Trigger>Open</Drawer.Trigger>
      </Drawer.Root>,
    );

    // Assert
    const trigger = screen.getByRole("button", { name: "Open" });
    expect(trigger).toHaveAttribute("type", "button");
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("Content renders a native <dialog> when open", () => {
    // Arrange / Act
    render(
      <Drawer.Root defaultOpen>
        <Drawer.Content data-testid="drawer">body</Drawer.Content>
      </Drawer.Root>,
    );

    // Assert
    const dialog = screen.getByTestId("drawer");
    expect(dialog).toBeInTheDocument();
    expect(dialog.tagName).toBe("DIALOG");
  });

  it("Title and Description render and auto-wire the dialog's ARIA", () => {
    // Arrange / Act
    render(
      <Drawer.Root defaultOpen>
        <Drawer.Content data-testid="drawer">
          <Drawer.Title>Filters</Drawer.Title>
          <Drawer.Description>Narrow the results.</Drawer.Description>
        </Drawer.Content>
      </Drawer.Root>,
    );

    // Assert
    const title = screen.getByRole("heading", { name: "Filters", level: 2 });
    const description = screen.getByText("Narrow the results.");
    const dialog = screen.getByTestId("drawer");
    expect(dialog).toHaveAttribute("aria-labelledby", title.id);
    expect(dialog).toHaveAttribute("aria-describedby", description.id);
    expect(description.tagName).toBe("P");
  });

  it("Portal escapes to document.body and Overlay is a decorative sibling", () => {
    // Arrange / Act
    render(
      <div data-testid="host">
        <Drawer.Root defaultOpen>
          <Drawer.Portal>
            <Drawer.Overlay data-testid="overlay" />
            <Drawer.Content data-testid="drawer">body</Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      </div>,
    );

    // Assert
    const overlay = screen.getByTestId("overlay");
    expect(overlay).toHaveAttribute("aria-hidden", "true");
    expect(overlay).toHaveAttribute("data-state", "open");
    // portalled out of the host wrapper, onto document.body
    expect(screen.getByTestId("host")).not.toContainElement(
      screen.getByTestId("drawer"),
    );
  });

  it("Close renders a <button>", () => {
    // Arrange / Act
    render(
      <Drawer.Root defaultOpen>
        <Drawer.Content>
          <Drawer.Close>Done</Drawer.Close>
        </Drawer.Content>
      </Drawer.Root>,
    );

    // Assert
    expect(screen.getByRole("button", { name: "Done" })).toHaveAttribute(
      "type",
      "button",
    );
  });

  it("forwards asChild on the Trigger to the consumer element", () => {
    // Arrange / Act
    render(
      <Drawer.Root>
        <Drawer.Trigger asChild>
          <a href="/cart">Cart</a>
        </Drawer.Trigger>
      </Drawer.Root>,
    );

    // Assert
    const link = screen.getByRole("link", { name: "Cart" });
    expect(link).toHaveAttribute("aria-haspopup", "dialog");
  });
});
