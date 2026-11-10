import "./dialog-polyfill";

import { MODAL, runModalConformance } from "@primitiv-ui/conformance";
import { act, render } from "@testing-library/react";

import { Modal } from "..";

// The React reference surface runs the shared Modal suite (RFC 0033 §6.2). It
// is expected to pass here first: React is the implementation the suite
// describes, so a failure is a real React bug, fixed in its own cycle.
runModalConformance(async ({ open }) => {
  let unmount = () => {};
  await act(async () => {
    ({ unmount } = render(
      <Modal.Root defaultOpen={open}>
        <Modal.Trigger>{MODAL.open}</Modal.Trigger>
        <Modal.Content>
          <Modal.Title>{MODAL.title}</Modal.Title>
          <Modal.Description>{MODAL.description}</Modal.Description>
          <input aria-label={MODAL.field} />
          <Modal.Close>{MODAL.close}</Modal.Close>
        </Modal.Content>
      </Modal.Root>,
    ));
  });
  return unmount;
});
