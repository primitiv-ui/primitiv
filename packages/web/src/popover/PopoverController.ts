import { FOCUSABLE_SELECTOR, popoverKeydown, popoverPressDismisses } from "@primitiv-ui/core";

/**
 * What a {@link PopoverController} asks of whoever hosts it. The controller
 * owns behaviour and never owns state (RFC 0033 D28): the custom elements keep
 * the open state in a reflected `open` attribute, the React adapter keeps it in
 * React, and each answers these calls from wherever it keeps it.
 */
export type PopoverControllerHost = {
  /** The state the controller cannot see for itself. */
  state(): {
    /** Whether the popover is open. */
    open: boolean;
  };
  /** Apply a change the user asked for: `open` is the state afterwards. */
  change(open: boolean): void;
  /** The trigger: Escape hands focus back to it, and a press on it is not an outside press. */
  trigger(): HTMLElement | null;
  /**
   * The element to hand `showPopover({ source })`, which makes it the panel's
   * implicit anchor for CSS anchor positioning. Optional: without it the panel
   * is shown with no source, and positioning is the consumer's to wire.
   */
  source?(): HTMLElement | null;
};

/** A popover panel's `showPopover`, with the `source` option the DOM typings may not know yet. */
type Showable = HTMLElement & { showPopover(options?: { source: HTMLElement }): void };

/**
 * The DOM behaviour of a popover, over a `popover="auto"` panel: the browser
 * owns the top layer and light dismiss, and this adds the rest of the WAI-ARIA
 * non-modal dialog pattern:
 *
 * - **Sync** — {@link PopoverController.sync | `sync()`} shows or hides the
 *   panel to match the host's state, moving focus into it as it opens (its
 *   first focusable, or the panel itself). A host calls it whenever that state
 *   may have changed.
 * - **Dismissal** — the browser light-dismissing the panel is reported, Escape
 *   inside it closes it and hands focus back to the trigger, and where the
 *   browser has no Popover API a press outside closes it.
 *
 * Opening from the trigger is the host's, as a plain click.
 */
export class PopoverController {
  readonly #content: Showable;
  readonly #host: PopoverControllerHost;
  #connection: AbortController | null = null;
  /** Whether this controller showed the panel and has not hidden it since. */
  #shown = false;

  constructor(content: HTMLElement, host: PopoverControllerHost) {
    this.#content = content as Showable;
    this.#host = host;
  }

  /**
   * Start listening. Connecting again while connected does nothing, so a host
   * whose lifecycle runs twice never stacks handlers.
   */
  connect(): void {
    if (this.#connection) return;
    this.#connection = new AbortController();
    const { signal } = this.#connection;
    this.#content.addEventListener("toggle", (event) => this.#toggle(event as ToggleEvent), { signal });
    this.#content.addEventListener("keydown", (event) => this.#keydown(event), { signal });
    document.addEventListener("click", (event) => this.#press(event), { signal });
  }

  /**
   * Stop listening, and forget the panel was showing: a host disconnects when
   * it leaves the document, which hides a popover with no event, so the next
   * sync shows it again.
   */
  disconnect(): void {
    this.#connection?.abort();
    this.#connection = null;
    this.#shown = false;
  }

  /** Show or hide the panel to match the host's state. */
  sync(): void {
    const { open } = this.#host.state();
    if (open && !this.#shown) {
      this.#shown = true;
      const source = this.#host.source?.();
      if (source) this.#content.showPopover({ source });
      else this.#content.showPopover();
      // Move focus into the panel (WAI-ARIA non-modal dialog): the first
      // focusable, or the panel itself, which carries tabindex="-1".
      (this.#content.querySelector<HTMLElement>(FOCUSABLE_SELECTOR) ?? this.#content).focus();
    } else if (!open && this.#shown) {
      this.#shown = false;
      try {
        this.#content.hidePopover();
      } catch {
        // Already hidden: the browser light-dismissed it first.
      }
    }
  }

  #toggle(event: ToggleEvent): void {
    if (event.newState !== "closed") return;
    this.#shown = false;
    this.#host.change(false);
  }

  #keydown(event: KeyboardEvent): void {
    if (!popoverKeydown(event.key)) return;
    event.preventDefault();
    this.#host.change(false);
    this.#host.trigger()?.focus();
  }

  #press(event: MouseEvent): void {
    const target = event.target as Element;
    const dismisses = popoverPressDismisses({
      open: this.#host.state().open,
      nativeLightDismiss: "popover" in HTMLElement.prototype,
      inTrigger: this.#host.trigger()?.contains(target) ?? false,
      inPopover: target.closest("[popover]") !== null,
    });
    if (dismisses) this.#host.change(false);
  }
}
