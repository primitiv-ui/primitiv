import "./dialog-polyfill";

import { render, screen } from "@testing-library/react";

import { Drawer } from "../Drawer";
import type { DrawerSide } from "../types";

const SIDES: DrawerSide[] = ["top", "right", "bottom", "left"];

describe("Drawer.Content — side axis", () => {
  it("defaults data-side to 'right' when side is omitted", () => {
    // Arrange / Act
    render(
      <Drawer.Root defaultOpen>
        <Drawer.Content data-testid="drawer">body</Drawer.Content>
      </Drawer.Root>,
    );

    // Assert
    expect(screen.getByTestId("drawer")).toHaveAttribute("data-side", "right");
  });

  it.each(SIDES)(
    "emits data-side='%s' on the dialog",
    (side) => {
      // Arrange / Act
      render(
        <Drawer.Root defaultOpen>
          <Drawer.Content data-testid="drawer" side={side}>
            body
          </Drawer.Content>
        </Drawer.Root>,
      );

      // Assert
      expect(screen.getByTestId("drawer")).toHaveAttribute("data-side", side);
    },
  );

  it("does not leak the `side` prop as a raw attribute on the dialog", () => {
    // Arrange / Act
    render(
      <Drawer.Root defaultOpen>
        <Drawer.Content data-testid="drawer" side="left">
          body
        </Drawer.Content>
      </Drawer.Root>,
    );

    // Assert
    expect(screen.getByTestId("drawer")).not.toHaveAttribute("side");
  });

  it("keeps data-state alongside data-side", () => {
    // Arrange / Act
    render(
      <Drawer.Root defaultOpen>
        <Drawer.Content data-testid="drawer" side="bottom">
          body
        </Drawer.Content>
      </Drawer.Root>,
    );

    // Assert
    const dialog = screen.getByTestId("drawer");
    expect(dialog).toHaveAttribute("data-side", "bottom");
    expect(dialog).toHaveAttribute("data-state", "open");
  });
});
