/**
 * Minimal scoped polyfill for the native <dialog> element in jsdom 29.
 *
 * jsdom does not implement showModal() / close() on HTMLDialogElement, so
 * integration tests that render Modal.Content need a shim that:
 *  - toggles the `open` attribute (which is what .open reflects)
 *  - dispatches the native `close` event on close()
 *
 *  - raises `cancel` on Escape, as a browser does for the topmost modal
 *    dialog, and closes it unless the event is cancelled, so a test can
 *    press a real Escape key rather than dispatch `cancel` by hand
 *
 * Scoped to Modal tests only — imported explicitly where needed rather
 * than installed in vitest.setup.ts so other components keep exercising
 * the real DOM.
 */

type DialogProto = HTMLDialogElement & { returnValue: string };

const proto = HTMLDialogElement.prototype as DialogProto;

/** The modal dialogs open now, topmost last. */
const modals: HTMLDialogElement[] = [];

if (typeof proto.showModal !== "function") {
  proto.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
    modals.push(this);
  };

  // The browser's own Escape step runs after the keydown, unless it was cancelled.
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || event.defaultPrevented) return;
    const top = modals.findLast((dialog) => dialog.isConnected && dialog.hasAttribute("open"));
    if (!top) return;
    const cancel = new Event("cancel", { cancelable: true });
    if (top.dispatchEvent(cancel)) top.close();
  });
}

if (typeof proto.close !== "function") {
  proto.close = function close(this: HTMLDialogElement, returnValue?: string) {
    if (!this.hasAttribute("open")) return;
    this.removeAttribute("open");
    const index = modals.indexOf(this);
    if (index !== -1) modals.splice(index, 1);
    if (returnValue !== undefined) {
      (this as DialogProto).returnValue = String(returnValue);
    }
    this.dispatchEvent(new Event("close"));
  };
}

export {};
