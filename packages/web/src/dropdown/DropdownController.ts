import { MENU_ITEM_SELECTOR } from "@primitiv-ui/core";

/**
 * What a {@link DropdownController} asks of whoever hosts it. The controller
 * owns behaviour and never owns state (RFC 0033 D28): the custom elements keep
 * the open state in a reflected `open` attribute, the React adapter keeps it in
 * React, and each answers these calls from wherever it keeps it.
 */
export type DropdownControllerHost = {
  /** The state the controller cannot see for itself. */
  state(): {
    /** Whether the menu is open. */
    open: boolean;
  };
  /**
   * Apply a change the user asked for: `open` is the state afterwards. A close
   * can be reported more than once for one dismissal (the browser's and the
   * press's), so the host decides what a repeat means.
   */
  change(open: boolean): void;
  /** The trigger: Escape hands focus back to it, and a press on it is not an outside press. */
  trigger(): HTMLElement | null;
  /**
   * The element to hand `showPopover({ source })`, which makes it the menu's
   * implicit anchor for CSS anchor positioning. Optional: without it the menu
   * is shown with no source, and positioning is the consumer's to wire.
   */
  source?(): HTMLElement | null;
};

/** A popover's `showPopover`, with the `source` option the DOM typings may not know yet. */
type Showable = HTMLElement & { showPopover(options?: { source: HTMLElement }): void };

/**
 * The DOM behaviour of a dropdown menu over a `popover="auto"` panel (WAI-ARIA
 * APG Menu Button): the browser owns the top layer and light dismiss, and this
 * adds the rest.
 *
 * - **Sync** — {@link DropdownController.sync | `sync()`} shows or hides the
 *   menu to match the host's state, moving focus to its first enabled item as
 *   it opens unless focus is already inside. A host calls it whenever that
 *   state may have changed.
 * - **Dismissal** — the browser hiding the menu is reported, and so is a press
 *   outside it (not on the trigger, and not inside any popover, so a submenu
 *   keeps its parent open).
 *
 * Opening from the trigger, and what an item does when chosen, are the host's.
 */
export class DropdownController {
  readonly #menu: Showable;
  readonly #host: DropdownControllerHost;
  #connection: AbortController | null = null;
  /** Whether this controller showed the menu and has not hidden it since. */
  #shown = false;

  constructor(menu: HTMLElement, host: DropdownControllerHost) {
    this.#menu = menu as Showable;
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
    this.#menu.addEventListener("toggle", (event) => this.#toggle(event as ToggleEvent), { signal });
    document.addEventListener("click", (event) => this.#press(event), { signal });
  }

  /**
   * Stop listening, and forget the menu was showing: a host disconnects when it
   * leaves the document, which hides a popover with no event, so the next sync
   * shows it again.
   */
  disconnect(): void {
    this.#connection?.abort();
    this.#connection = null;
    this.#shown = false;
  }

  /** Show or hide the menu to match the host's state. */
  sync(): void {
    const { open } = this.#host.state();
    if (open && !this.#shown) {
      this.#shown = true;
      const source = this.#host.source?.();
      if (source) this.#menu.showPopover({ source });
      else this.#menu.showPopover();
      if (!this.#menu.contains(document.activeElement)) this.#menu.querySelector<HTMLElement>(MENU_ITEM_SELECTOR)?.focus();
    } else if (!open && this.#shown) {
      this.#shown = false;
      try {
        this.#menu.hidePopover();
      } catch {
        // Already hidden, or no longer a popover.
      }
    }
  }

  #toggle(event: ToggleEvent): void {
    if (event.newState !== "closed") return;
    this.#shown = false;
    this.#host.change(false);
  }

  #press(event: MouseEvent): void {
    if (!this.#host.state().open) return;
    const target = event.target as Element;
    if (this.#host.trigger()?.contains(target) || target.closest("[popover]")) return;
    this.#host.change(false);
  }
}
