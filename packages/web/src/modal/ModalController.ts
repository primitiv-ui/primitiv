import { FOCUSABLE_SELECTOR, modalPointerOutside, modalTabKeydown } from "@primitiv-ui/core";

/**
 * What a {@link ModalController} asks of whoever hosts it. The controller owns
 * behaviour and never owns state (RFC 0033 D28): the custom elements keep the
 * open state in a reflected `open` attribute, the React adapter keeps it in
 * React, and each answers these calls from wherever it keeps it.
 */
export type ModalControllerHost = {
  /** The state the controller cannot see for itself. */
  state(): {
    /** Whether the modal is open. */
    open: boolean;
  };
  /** Apply a change the user asked for: `open` is the state afterwards. */
  change(open: boolean): void;
  /**
   * Escape was pressed (the dialog's native `cancel` event). Call
   * `preventDefault()` on `event` to keep the modal open. Optional.
   */
  escapeKeyDown?(event: Event): void;
  /**
   * A pointer went down outside the dialog's box — on the `::backdrop`. Call
   * `preventDefault()` on `event` to keep the modal open. Optional.
   */
  pointerDownOutside?(event: PointerEvent): void;
};

/**
 * The DOM behaviour of a modal dialog, over a native `<dialog>` and its
 * `showModal()`: the browser owns the inert background, the top layer and
 * Escape, and this adds what it leaves out (WAI-ARIA APG Modal Dialog):
 *
 * - **Sync** — {@link ModalController.sync | `sync()`} shows the dialog
 *   modally or closes it to match the host's state. A host calls it whenever
 *   that state may have changed.
 * - **Dismissal** — Escape and a press on the backdrop ask the host to close,
 *   each vetoable through its optional hook, and Escape never lets the browser
 *   close the dialog itself, so the host's state stays the only source of
 *   truth. A dialog that closes natively anyway (a `<form method="dialog">`)
 *   reports the close.
 * - **Focus trap** — Tab wraps from the last focusable to the first and
 *   Shift+Tab back, since a native modal dialog lets focus escape to the
 *   browser chrome.
 *
 * Opening and closing from a trigger or a close button are the host's, as
 * plain clicks: the React adapter renders those buttons apart from the dialog.
 */
export class ModalController {
  readonly #dialog: HTMLDialogElement;
  readonly #host: ModalControllerHost;
  #connection: AbortController | null = null;

  constructor(dialog: HTMLDialogElement, host: ModalControllerHost) {
    this.#dialog = dialog;
    this.#host = host;
  }

  /**
   * Start listening on the dialog. Connecting again while connected does
   * nothing, so a host whose lifecycle runs twice never stacks handlers.
   */
  connect(): void {
    if (this.#connection) return;
    this.#connection = new AbortController();
    const { signal } = this.#connection;
    const dialog = this.#dialog;
    dialog.addEventListener("close", () => this.#host.change(false), { signal });
    dialog.addEventListener("cancel", (event) => this.#cancel(event), { signal });
    dialog.addEventListener("pointerdown", (event) => this.#pointerdown(event), { signal });
    dialog.addEventListener("keydown", (event) => this.#keydown(event), { signal });
  }

  /** Stop listening. A later `connect` resumes. */
  disconnect(): void {
    this.#connection?.abort();
    this.#connection = null;
  }

  /** Show the dialog modally, or close it, to match the host's state. */
  sync(): void {
    const { open } = this.#host.state();
    if (open && !this.#dialog.open) this.#dialog.showModal();
    else if (!open && this.#dialog.open) this.#dialog.close();
  }

  #cancel(event: Event): void {
    this.#host.escapeKeyDown?.(event);
    const vetoed = event.defaultPrevented;
    // Never let the browser close the dialog itself: the host's state decides,
    // and `sync()` closes it.
    event.preventDefault();
    if (!vetoed) this.#host.change(false);
  }

  #pointerdown(event: PointerEvent): void {
    const point = { x: event.clientX, y: event.clientY };
    if (!modalPointerOutside(this.#dialog.getBoundingClientRect(), point)) return;
    this.#host.pointerDownOutside?.(event);
    if (!event.defaultPrevented) this.#host.change(false);
  }

  #keydown(event: KeyboardEvent): void {
    if (!this.#dialog.open) return;
    const focusables = [...this.#dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)];
    const outcome = modalTabKeydown({
      key: event.key,
      shiftKey: event.shiftKey,
      active: focusables.indexOf(document.activeElement as HTMLElement),
      count: focusables.length,
    });
    if (!outcome) return;
    event.preventDefault();
    if (outcome.focus !== null) focusables[outcome.focus].focus();
  }
}
