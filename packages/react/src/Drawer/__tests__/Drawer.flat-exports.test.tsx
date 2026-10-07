import "./dialog-polyfill";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerOverlay,
  DrawerPortal,
  DrawerRoot,
  DrawerTitle,
  DrawerTrigger,
} from "../../index";

// A Server Component can't dot into a client reference (`Drawer.Root`), so the
// package entry exposes every part under its own name, like the other compounds.
describe("Drawer — flat exports", () => {
  it("composes a working dialog from the package entry's flat exports", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <DrawerRoot>
        <DrawerTrigger>Open</DrawerTrigger>
        <DrawerPortal>
          <DrawerOverlay />
          <DrawerContent>
            <DrawerTitle>Title</DrawerTitle>
            <DrawerDescription>Description</DrawerDescription>
            <DrawerClose>Done</DrawerClose>
          </DrawerContent>
        </DrawerPortal>
      </DrawerRoot>,
    );

    // Act
    await user.click(screen.getByRole("button", { name: "Open" }));

    // Assert
    expect(screen.getByRole("dialog", { name: "Title" })).toHaveAccessibleDescription("Description");
  });
});
