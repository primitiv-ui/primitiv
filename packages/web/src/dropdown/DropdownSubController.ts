import { MENU_ITEM_SELECTOR } from "@primitiv-ui/core";

import type { DropdownControllerHost } from "./DropdownController.ts";

/**
 * What a {@link DropdownSubController} asks of whoever hosts it: a dropdown
 * host's calls, for the submenu, plus the key that closes it.
 */
export type DropdownSubControllerHost = DropdownControllerHost & {
  /** The arrow that closes the submenu: the one pointing back at its parent, `ArrowLeft` in a left-to-right menu. */
  closeKey(): string;
};

/** A popover's `showPopover`, with the `source` option the DOM typings may not know yet. */
type Showable = HTMLElement & { showPopover(options?: { source: HTMLElement }): void };

/**
 * The DOM behaviour of a submenu over a `popover="auto"` panel nested inside
 * its parent menu. The parent's {@link DropdownController} moves focus through
 * the submenu's items, since their keys bubble to it; this adds what is the
 * submenu's own.
 *
 * - **Sync** — {@link DropdownSubController.sync | `sync()`} shows or hides the
 *   submenu to match the host's state, moving focus to its first enabled item
 *   as it opens.
 * - **Dismissal** — the browser hiding the submenu is reported, and its close
 *   key closes it and hands focus back to its trigger, without the parent menu
 *   seeing the key.
 *
 * Opening from the sub-trigger (a click, a hover or the open key) is the host's.
 */
export class DropdownSubController {
  readonly #menu: Showable;
  readonly #host: DropdownSubControllerHost;
  #connection: AbortController | null = null;
  /** Whether this controller showed the submenu and has not hidden it since. */
  #shown = false;

  constructor(menu: HTMLElement, host: DropdownSubControllerHost) {
    this.#menu = menu as Showable;
    this.#host = host;
  }

  /** Start listening. Connecting again while connected does nothing. */
  connect(): void {
    if (this.#connection) return;
    this.#connection = new AbortController();
    const { signal } = this.#connection;
    this.#menu.addEventListener("toggle", (event) => this.#toggle(event as ToggleEvent), { signal });
    this.#menu.addEventListener("keydown", (event) => this.#keydown(event), { signal });
  }

  /** Stop listening, and forget the submenu was showing, as {@link DropdownController.disconnect} does. */
  disconnect(): void {
    this.#connection?.abort();
    this.#connection = null;
    this.#shown = false;
  }

  /** Show or hide the submenu to match the host's state. */
  sync(): void {
    const { open } = this.#host.state();
    if (open && !this.#shown) {
      this.#shown = true;
      const source = this.#host.source?.();
      if (source) this.#menu.showPopover({ source });
      else this.#menu.showPopover();
      this.#menu.querySelector<HTMLElement>(MENU_ITEM_SELECTOR)?.focus();
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

  #keydown(event: KeyboardEvent): void {
    if (event.key !== this.#host.closeKey()) return;
    event.preventDefault();
    event.stopPropagation();
    this.#host.change(false);
    this.#host.trigger()?.focus();
  }
}
