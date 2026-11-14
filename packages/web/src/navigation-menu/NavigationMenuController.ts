import {
  navigationMenuOpenDelay,
  navigationMenuToggle,
  type NavigationMenuOrientation,
  type NavigationMenuReadingDirection,
} from "@primitiv-ui/core";

/**
 * What a {@link NavigationMenuController} asks of whoever hosts it. The
 * controller owns behaviour and never owns state (RFC 0033 D28): the custom
 * elements keep the open entry in a reflected `value` attribute, the React
 * adapter keeps it in React, and each answers these calls from wherever it
 * keeps it.
 */
export type NavigationMenuControllerHost = {
  /** The state the controller cannot see for itself. */
  state(): {
    /** The open entry's value, or `""` while nothing is open. */
    value: string;
    orientation: NavigationMenuOrientation;
    dir: NavigationMenuReadingDirection;
    /** Whether hovering a trigger opens its panel. */
    openOnHover: boolean;
    /** The hover-open delay for the first open, in milliseconds. */
    delay: number;
    /** The delay before closing once the pointer leaves the nav, in milliseconds. */
    closeDelay: number;
  };
  /**
   * Apply a change: `value` is the open entry afterwards. A change is reported
   * every time it is asked for, the same value or not, so the host decides what
   * a repeat means.
   */
  change(value: string): void;
  /** The trigger of the entry `value`: Escape hands focus back to it. */
  trigger(value: string): HTMLElement | null;
  /** The panel of the entry `value`: the enter-panel arrow moves focus into it. */
  panel(value: string): HTMLElement | null;
  /** Every top-level entry — triggers and plain links — in DOM order. */
  entries(): HTMLElement[];
};

/**
 * The behaviour of a disclosure navigation menu (the ARIA APG pattern, not a
 * menubar): click-to-toggle, hover intent, the top-level travel keys, the
 * enter-panel arrow, Escape and focus leaving. Its host wires the root's,
 * triggers' and links' own events to the intents below, so the React adapter
 * keeps composing them with its consumers' handlers; the controller owns the
 * timers and the pointer's arrival.
 */
export class NavigationMenuController {
  readonly #host: NavigationMenuControllerHost;
  #opening: ReturnType<typeof setTimeout> | undefined;
  #closing: ReturnType<typeof setTimeout> | undefined;
  /** The trigger the pointer is over, and whether its entry was open as it arrived. */
  #arrival: { value: string; open: boolean } | null = null;

  constructor(host: NavigationMenuControllerHost) {
    this.#host = host;
  }

  /** The pointer arrived on the trigger of `value`: remember what was open, and open with intent. */
  triggerPointerEnter(value: string): void {
    const state = this.#host.state();
    this.#arrival = { value, open: state.value === value };
    if (state.openOnHover) this.#openWithIntent(value);
  }

  /** The pointer left a trigger: forget its arrival and cancel a pending open. */
  triggerPointerLeave(): void {
    this.#arrival = null;
    this.#cancelOpen();
  }

  /** A click on the trigger of `value` — toggled against what was open when the pointer arrived. */
  triggerClick(value: string): void {
    this.#cancelOpen();
    const arrival = this.#arrival?.value === value ? this.#arrival.open : undefined;
    if (arrival !== undefined) this.#arrival = null;
    this.#host.change(navigationMenuToggle({ open: this.#host.state().value, arrival }, value));
  }

  /** The pointer is over the nav: it is not done with the menu. */
  rootPointerEnter(): void {
    this.#cancelClose();
  }

  /**
   * The pointer left the nav — the only leave that means the user is done
   * with the menu, since leaving a trigger for its own panel must not close it.
   */
  rootPointerLeave(): void {
    this.#cancelOpen();
    this.#cancelClose();
    this.#closing = setTimeout(() => {
      this.#closing = undefined;
      this.#host.change("");
    }, this.#host.state().closeDelay);
  }

  /** Cancel every timer, so nothing outlives the host. */
  disconnect(): void {
    this.#cancelOpen();
    this.#cancelClose();
  }

  #openWithIntent(value: string): void {
    this.#cancelClose();
    this.#cancelOpen();
    const { value: open, delay: wait } = this.#host.state();
    const delay = navigationMenuOpenDelay({ open, delay: wait });
    if (delay === 0) {
      this.#host.change(value);
      return;
    }
    this.#opening = setTimeout(() => {
      this.#opening = undefined;
      this.#host.change(value);
    }, delay);
  }

  #cancelOpen(): void {
    // clearTimeout(undefined) is a spec'd no-op, so cancelling needs no guard.
    clearTimeout(this.#opening);
    this.#opening = undefined;
  }

  #cancelClose(): void {
    clearTimeout(this.#closing);
    this.#closing = undefined;
  }
}
