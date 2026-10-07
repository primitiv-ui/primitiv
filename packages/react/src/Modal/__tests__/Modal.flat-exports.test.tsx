import "./dialog-polyfill";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalOverlay,
  ModalPortal,
  ModalRoot,
  ModalTitle,
  ModalTrigger,
} from "../../index";

// A Server Component can't dot into a client reference (`Modal.Root`), so the
// package entry exposes every part under its own name, like the other compounds.
describe("Modal — flat exports", () => {
  it("composes a working dialog from the package entry's flat exports", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <ModalRoot>
        <ModalTrigger>Open</ModalTrigger>
        <ModalPortal>
          <ModalOverlay />
          <ModalContent>
            <ModalTitle>Title</ModalTitle>
            <ModalDescription>Description</ModalDescription>
            <ModalClose>Done</ModalClose>
          </ModalContent>
        </ModalPortal>
      </ModalRoot>,
    );

    // Act
    await user.click(screen.getByRole("button", { name: "Open" }));

    // Assert
    expect(screen.getByRole("dialog", { name: "Title" })).toHaveAccessibleDescription("Description");
  });
});
