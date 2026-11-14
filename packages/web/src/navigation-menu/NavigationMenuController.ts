import {
  NAVIGATION_MENU_PANEL_FOCUSABLE,
  navigationMenuEntersPanel,
  navigationMenuKeydown,
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
  /** The entry the enter-panel arrow opened, whose panel takes focus once it shows. */
  #entering: string | null = null;
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

  /**
   * A key press on the top-level `entry`: the arrows travel the bar (wrapping,
   * mirrored under RTL) and Home / End jump to its ends. Focus only — no tab
   * stop is roved, so every entry stays in the Tab order.
   */
  travel(entry: HTMLElement, event: KeyboardEvent): void {
    const { orientation, dir } = this.#host.state();
    const outcome = navigationMenuKeydown({ entries: this.#host.entries(), orientation, dir }, entry, event.key);
    if (!outcome) return;
    event.preventDefault();
    outcome.focus.focus();
  }

  /**
   * A key press on the trigger of `value`: the arrow across the bar opens its
   * panel and moves focus into it — at once if it is open, else on the
   * {@link sync} after the host shows it — and every other key travels.
   */
  triggerKeydown(value: string, entry: HTMLElement, event: KeyboardEvent): void {
    const state = this.#host.state();
    if (!navigationMenuEntersPanel(state, event.key)) {
      this.travel(entry, event);
      return;
    }
    event.preventDefault();
    this.#cancelOpen();
    this.#entering = value;
    if (state.value === value) this.sync();
    else this.#host.change(value);
  }

  /**
   * Escape from anywhere in the nav closes the open panel and hands focus back
   * to its trigger, so the user is not stranded on an element that just hid.
   */
  rootKeydown(event: KeyboardEvent): void {
    const { value } = this.#host.state();
    if (event.key !== "Escape" || value === "") return;
    this.#host.trigger(value)?.focus();
    this.#host.change("");
  }

  /**
   * Focus left `root` for `next` (or for nowhere): close, leaving focus where
   * it went, since fighting it would break the Tab order.
   */
  focusOut(root: Node, next: Node | null): void {
    if (this.#host.state().value === "" || (next && root.contains(next))) return;
    this.#host.change("");
  }

  /** Spend a pending enter-panel focus once its entry is open. A host calls this after showing a change. */
  sync(): void {
    const value = this.#entering;
    if (value === null || this.#host.state().value !== value) return;
    this.#entering = null;
    this.#host.panel(value)?.querySelector<HTMLElement>(NAVIGATION_MENU_PANEL_FOCUSABLE)?.focus();
  }

  /**
   * A link was followed: the interaction is over, so the menu closes — never
   * leaving a panel open over the page the user just went to.
   */
  linkClick(): void {
    this.#cancelOpen();
    this.#host.change("");
  }

  /**
   * The pointer reached a **top-level** link (a host never calls this for a
   * link inside a panel, whose hover must not close its own panel): travelling
   * along the bar past a plain entry closes what is open, as reaching another
   * trigger would. A click-only menu stays click-only.
   */
  linkPointerEnter(): void {
    if (!this.#host.state().openOnHover) return;
    this.linkClick();
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
