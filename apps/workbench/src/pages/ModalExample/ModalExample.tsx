import { Modal } from "@primitiv/react";

import "./ModalExample.scss";

export function ModalExample() {
  return (
    <Modal.Root>
      <Modal.Trigger>Open modal</Modal.Trigger>
      <Modal.Portal>
        <Modal.Overlay className="modal-overlay" />
        <Modal.Content className="modal__content">
          <Modal.Title>Payment</Modal.Title>
          <Modal.Description>Enter your card details</Modal.Description>
          <Modal.Close>Cancel</Modal.Close>
        </Modal.Content>
      </Modal.Portal>
    </Modal.Root>
  );
}
