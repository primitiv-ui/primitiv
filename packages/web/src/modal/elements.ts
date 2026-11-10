import { defineElements, ElementBase, reportOnce, write, type ElementRegistry } from "../internal/element.ts";
import { PrimitivRootElement } from "../internal/RootElement.ts";
import { ModalController, type ModalControllerHost } from "./ModalController.ts";

export type { ElementRegistry };

// Stryker disable StringLiteral: static — evaluated once at import, so runtime mutant switching never reaches them; the names are pinned by the defineModal registry test instead.
const ROOT = "primitiv-modal";
const TRIGGER = "primitiv-modal-trigger";
const CONTENT = "primitiv-modal-content";
const TITLE = "primitiv-modal-title";
const DESCRIPTION = "primitiv-modal-description";
const CLOSE = "primitiv-modal-close";
// Stryker restore StringLiteral

/**
 * The one element child `part` decorates — the `<button>`, `<dialog>` or
 * heading the consumer writes — or `null`, reported once, when it has anything
 * but exactly one (RFC 0033 D24). `what` names the child in the report.
 */
function decoratable(part: HTMLElement, what: string): HTMLElement | null {
  if (part.childElementCount === 1) return part.firstElementChild as HTMLElement;
  reportOnce(part, `<${part.localName}> needs exactly one element child (${what}) to decorate.`);
  return null;
}

/** The `<dialog>` a content part decorates, or `null`, reported once, without exactly one. */
function decoratableDialog(content: HTMLElement): HTMLDialogElement | null {
  const child = content.firstElementChild;
  if (content.childElementCount === 1 && child instanceof HTMLDialogElement) return child;
  reportOnce(content, `<${CONTENT}> needs exactly one <dialog> child to decorate.`);
  return null;
}

/**
 * `<primitiv-modal>` — the state owner of a modal dialog, built on the native
 * `<dialog>` and its `showModal()`: the browser makes the page behind it inert,
 * paints the `::backdrop` and owns the top layer, and the element adds the
 * rest of the WAI-ARIA Modal Dialog pattern — Tab wraps inside the dialog,
 * Escape and a press on the backdrop close it, and closing hands focus back to
 * the button that opened it.
 *
 * The root finds its own parts, so a modal nested in a dialog keeps its own,
 * and reconciles their ARIA from its reflected state whenever a part arrives,
 * leaves, or changes an attribute the root reads (the lifecycle is
 * `PrimitivRootElement`'s). Leave `open` off the `<dialog>` itself: the root
 * opens it, modally.
 *
 * @customElement primitiv-modal
 * @summary The state owner of a modal dialog on the native `<dialog>`.
 * @attr {boolean} open - Whether the dialog is open. Reflected: it changes as the user opens and dismisses the dialog, so a server re-render or a history snapshot sees the live state. Set it (or the `open` property) to open or close the dialog from script.
 * @fires {CustomEvent<{ open: boolean }>} primitiv-modal-change - Bubbles, cancelable, fired before a user-driven change is applied — a trigger or close click, Escape, a press on the backdrop, or the dialog closing natively — with the open state afterwards. Call `preventDefault()` to veto it, e.g. to keep a form with unsaved changes open.
 */
export class PrimitivModalElement extends PrimitivRootElement {
  /** The dialog the root currently decorates, and the controller over it. */
  #dialog: HTMLDialogElement | null = null;
  #modal: ModalController | null = null;
  /** The decorated trigger and close buttons, as of the last reconcile. */
  // Stryker disable next-line ArrayDeclaration: equivalent — the first reconcile runs as the root connects, before any click can reach it, and replaces both.
  #openers: HTMLElement[] = [];
  // Stryker disable next-line ArrayDeclaration: equivalent — as above.
  #closers: HTMLElement[] = [];
  /** The root's own click listener, while connected. */
  #listening: AbortController | null = null;
  protected readonly controller = {
    connect: () => this.#connect(),
    disconnect: () => this.#disconnect(),
  };
  protected readonly reconcileOn: readonly string[] = ["open"];

  /** Whether the dialog is open, reflected as the boolean `open` attribute. */
  get open(): boolean {
    return this.hasAttribute("open");
  }

  set open(next: boolean) {
    this.toggleAttribute("open", next);
  }

  /** The controller's view of this element: state lives in the reflected attribute. */
  #host(): ModalControllerHost {
    return {
      state: () => ({ open: this.open }),
      change: (open) => this.#change(open),
    };
  }

  /** A change the user asked for: announced first, so a listener can veto it. */
  #change(open: boolean): void {
    if (open === this.open) return;
    if (this.announce("primitiv-modal-change", { open })) this.open = open;
    // A veto can leave the dialog out of step — it already closed natively —
    // so put it back where the state says.
    else this.#modal?.sync();
  }

  #connect(): void {
    this.#listening = new AbortController();
    this.addEventListener("click", (event) => this.#click(event), {
      signal: this.#listening.signal,
    });
    this.#modal?.connect();
  }

  #disconnect(): void {
    // A root disconnects only after it connected, so it is listening.
    (this.#listening as AbortController).abort();
    this.#listening = null;
    this.#modal?.disconnect();
    // Leaving the document drops the dialog from the top layer but leaves it
    // `open`, so a move would bring it back non-modally. Drop the attribute
    // rather than calling close(): close() queues a close event that a move's
    // reconnect would hear as the user dismissing it. The state is kept, and
    // the next connect reopens the dialog modally.
    if (this.#dialog) write(this.#dialog, "open", null);
  }

  #click(event: MouseEvent): void {
    const target = event.target as Node;
    if (this.#openers.some((button) => button.contains(target))) this.#change(true);
    else if (this.#closers.some((button) => button.contains(target))) this.#change(false);
  }

  /**
   * Decorate `dialog` from now on: the controller follows it. Only a reconcile
   * calls this, and a root reconciles only while connected, so the new
   * controller listens at once.
   */
  #use(dialog: HTMLDialogElement | null): void {
    // Stryker disable next-line ConditionalExpression: equivalent — rebuilding the controller over the same dialog swaps one listener set for an identical one.
    if (dialog === this.#dialog) return;
    this.#modal?.disconnect();
    // A dialog that arrives already `open` — a history snapshot, taken while it
    // was showing — is open non-modally, and `showModal()` would leave it so.
    // Drop the attribute (that fires no close event), and the sync below
    // reopens it modally if the root says it is open.
    if (dialog) write(dialog, "open", null);
    this.#dialog = dialog;
    this.#modal = dialog ? new ModalController(dialog, this.#host()) : null;
    this.#modal?.connect();
  }

  protected reconcile(): void {
    const open = this.open;
    const state = open ? "open" : "closed";
    const rootId = this.rootId();
    write(this, "data-state", state);

    const [content] = this.parts(CONTENT);
    const dialog = content ? decoratableDialog(content) : null;
    const [titlePart] = this.parts(TITLE);
    const title = titlePart ? decoratable(titlePart, "a heading") : null;
    const [descriptionPart] = this.parts(DESCRIPTION);
    const description = descriptionPart ? decoratable(descriptionPart, "a <p>") : null;

    if (title && !title.id) title.id = `${rootId}-title`;
    if (description && !description.id) description.id = `${rootId}-description`;
    if (dialog) {
      if (!dialog.id) dialog.id = `${rootId}-content`;
      write(dialog, "data-state", state);
      write(dialog, "aria-labelledby", title ? title.id : null);
      write(dialog, "aria-describedby", description ? description.id : null);
    }

    this.#openers = this.#buttons(TRIGGER);
    for (const button of this.#openers) {
      write(button, "aria-haspopup", "dialog");
      write(button, "aria-expanded", String(open));
      write(button, "aria-controls", dialog ? dialog.id : null);
    }
    this.#closers = this.#buttons(CLOSE);

    this.#use(dialog);
    this.#modal?.sync();
  }

  /** The buttons this root's `selector` parts decorate. */
  #buttons(selector: string): HTMLElement[] {
    return this.parts(selector).flatMap((part) => decoratable(part, "a <button>") ?? []);
  }
}

/**
 * `<primitiv-modal-trigger>` — an interactive part. It decorates exactly one
 * child the consumer writes, a `<button>`, which opens the dialog and receives
 * `aria-haspopup="dialog"`, `aria-expanded` and `aria-controls`, so the
 * rendered DOM matches React's (RFC 0033 D24). A modal may have several.
 *
 * @customElement primitiv-modal-trigger
 */
export class PrimitivModalTriggerElement extends ElementBase {}

/**
 * `<primitiv-modal-content>` — decorates exactly one native `<dialog>` the
 * consumer writes, which the root opens with `showModal()`, closes, and gives
 * an id, `data-state`, and `aria-labelledby` / `aria-describedby` pointing at
 * the title and description. The dialog keeps its implicit `dialog` role.
 *
 * @customElement primitiv-modal-content
 */
export class PrimitivModalContentElement extends ElementBase {}

/**
 * `<primitiv-modal-title>` — decorates exactly one heading the consumer writes
 * (an `<h2>`, usually), whose id becomes the dialog's `aria-labelledby`, so it
 * is the name a screen reader announces as the dialog opens.
 *
 * @customElement primitiv-modal-title
 */
export class PrimitivModalTitleElement extends ElementBase {}

/**
 * `<primitiv-modal-description>` — decorates exactly one element the consumer
 * writes (a `<p>`, usually), whose id becomes the dialog's `aria-describedby`.
 *
 * @customElement primitiv-modal-description
 */
export class PrimitivModalDescriptionElement extends ElementBase {}

/**
 * `<primitiv-modal-close>` — an interactive part. It decorates exactly one
 * `<button>` the consumer writes, which closes the dialog. A modal may have
 * several: the header's icon button and the footer's Cancel.
 *
 * @customElement primitiv-modal-close
 */
export class PrimitivModalCloseElement extends ElementBase {}

/**
 * Define the six Modal elements on `registry` (the global `customElements` by
 * default). Safe to call more than once, and a no-op where there is no
 * registry (a server render).
 */
export function defineModal(registry: ElementRegistry | undefined = globalThis.customElements): void {
  defineElements(registry, [
    [ROOT, PrimitivModalElement],
    [TRIGGER, PrimitivModalTriggerElement],
    [CONTENT, PrimitivModalContentElement],
    [TITLE, PrimitivModalTitleElement],
    [DESCRIPTION, PrimitivModalDescriptionElement],
    [CLOSE, PrimitivModalCloseElement],
  ]);
}
