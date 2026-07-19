/**
 * Minimal scoped polyfill for the native <dialog> element in jsdom 29.
 *
 * jsdom does not implement showModal() / close() on HTMLDialogElement, so
 * integration tests that render Drawer.Content (a native <dialog>, via
 * Modal.Content) need a shim that:
 *  - toggles the `open` attribute (which is what .open reflects)
 *  - dispatches the native `close` event on close()
 *
 * The Drawer suite drives open/close through the trigger, the Close button,
 * and the imperative API — the Esc/`cancel` and click-outside paths are
 * Modal's behaviour and are covered by Modal's own suite, so this shim stays
 * minimal. Mirrors Modal's scoped polyfill — imported explicitly where needed
 * rather than installed globally, so other components keep exercising the real
 * DOM.
 */

type DialogProto = HTMLDialogElement & { returnValue: string };

const proto = HTMLDialogElement.prototype as DialogProto;

if (typeof proto.showModal !== "function") {
  proto.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
}

if (typeof proto.close !== "function") {
  proto.close = function close(this: HTMLDialogElement, returnValue?: string) {
    if (!this.hasAttribute("open")) return;
    this.removeAttribute("open");
    if (returnValue !== undefined) {
      (this as DialogProto).returnValue = String(returnValue);
    }
    this.dispatchEvent(new Event("close"));
  };
}

export {};
