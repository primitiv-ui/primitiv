import "./dialog-polyfill";

import { fireEvent, render, screen } from "@testing-library/react";
import { StrictMode } from "react";

import { Modal } from "../Modal";

// The dialog's DOM behaviour runs in the shared ModalController from
// @primitiv-ui/web (RFC 0033 §3.4). This covers what hosting it adds: one
// controller per dialog under StrictMode, whose effects run twice.

describe("Modal on the shared controller", () => {
  it("reports a press on the backdrop once under StrictMode", () => {
    // Arrange
    const onOpenChange = vi.fn();
    render(
      <StrictMode>
        <Modal.Root open onOpenChange={onOpenChange}>
          <Modal.Content>
            <Modal.Title>Payment</Modal.Title>
          </Modal.Content>
        </Modal.Root>
      </StrictMode>,
    );

    // Act
    fireEvent.pointerDown(screen.getByRole("dialog"), { clientX: 10, clientY: 10 });

    // Assert
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
