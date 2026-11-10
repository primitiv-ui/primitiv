/**
 * Minimal scoped polyfill for the native <dialog> element in jsdom 29.
 *
 * jsdom does not implement showModal() / close() on HTMLDialogElement, so
 * the Modal tests need a shim that:
 *  - toggles the `open` attribute (which is what .open reflects)
 *  - dispatches the native `close` event on close()
 *
 * The `cancel` event (Esc) is not raised automatically by this polyfill —
 * tests dispatch it manually with `fireEvent.cancel(dialog)` when they
 * need to exercise the Esc path, so the polyfill stays small and the
 * tests stay honest about what they're simulating.
 *
 * Scoped to Modal tests only — imported explicitly where needed rather
 * than installed in vitest.setup.ts so other components keep exercising
 * the real DOM.
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
