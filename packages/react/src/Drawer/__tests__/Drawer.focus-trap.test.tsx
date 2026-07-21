import "./dialog-polyfill";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Drawer } from "../Drawer";

// Drawer.Content delegates wholesale to Modal.Content, so it inherits the
// boundary Tab-wrap focus trap. These two tests are the conformance guard that
// the inheritance holds — the exhaustive branch coverage lives in
// Modal.focus-trap.test.tsx. The Trigger sits outside the dialog so a native
// wrap (without the trap) would land there, not on the asserted element.
describe("Drawer focus trap — inherited from Modal.Content", () => {
  it("wraps focus from the last element back to the first on Tab", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Drawer.Root defaultOpen>
        <Drawer.Trigger>Open</Drawer.Trigger>
        <Drawer.Content>
          <button type="button">First</button>
          <button type="button">Second</button>
        </Drawer.Content>
      </Drawer.Root>,
    );
    screen.getByRole("button", { name: "Second" }).focus();

    // Act
    await user.tab();

    // Assert
    expect(screen.getByRole("button", { name: "First" })).toHaveFocus();
  });

  it("wraps focus from the first element to the last on Shift+Tab", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Drawer.Root defaultOpen>
        <Drawer.Trigger>Open</Drawer.Trigger>
        <Drawer.Content>
          <button type="button">First</button>
          <button type="button">Second</button>
        </Drawer.Content>
      </Drawer.Root>,
    );
    screen.getByRole("button", { name: "First" }).focus();

    // Act
    await user.tab({ shift: true });

    // Assert
    expect(screen.getByRole("button", { name: "Second" })).toHaveFocus();
  });
});
