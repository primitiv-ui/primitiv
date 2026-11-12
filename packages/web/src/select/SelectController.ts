import { MENU_TYPEAHEAD_RESET_MS, menuTypeahead, SELECT_OPTION_SELECTOR, selectKeydown } from "@primitiv-ui/core";

/**
 * What a {@link SelectController} asks of whoever hosts it. The controller owns
 * behaviour and never owns state (RFC 0033 D28): the custom elements keep the
 * open state and the value in reflected attributes, the React adapter keeps
 * them in React, and each answers these calls from wherever it keeps them.
 */
export type SelectControllerHost = {
  /** The state the controller cannot see for itself. */
  state(): {
    /** Whether the list is open. */
    open: boolean;
  };
  /** Apply an open-state change the user asked for: `open` is the state afterwards. */
  change(open: boolean): void;
  /** Apply the option the user chose. The controller closes the list after. */
  select(value: string): void;
  /** The trigger: choosing an option or pressing Escape hands focus back to it. */
  trigger(): HTMLElement | null;
  /**
   * The element to hand `showPopover({ source })`, which makes it the list's
   * implicit anchor for CSS anchor positioning. Optional: without it the list
   * is shown with no source, and positioning is the consumer's to wire.
   */
  source?(): HTMLElement | null;
};

/** A registered option: its value, its element, and whether it is disabled. */
export type SelectOption = { value: string; element: HTMLElement; disabled?: boolean };

/** A popover's `showPopover`, with the `source` option the DOM typings may not know yet. */
type Showable = HTMLElement & { showPopover(options?: { source: HTMLElement }): void };

/**
 * The DOM behaviour of a select's listbox over a `popover="auto"` panel: the
 * browser owns the top layer and light dismiss, and this adds the rest.
 *
 * - **Sync** — {@link SelectController.sync | `sync()`} shows or hides the
 *   list to match the host's state, focusing the selected option as it opens
 *   (else the first enabled one, else the list itself).
 * - **Keyboard** — core's `selectKeydown`: the arrows, Home and End move focus
 *   through the enabled options, Enter and Space choose the focused one, typing
 *   focuses the option it starts, and Escape closes and hands focus back to
 *   the trigger.
 * - **Choosing** — a click on an enabled option asks the host to select it,
 *   then closes the list and hands focus back to the trigger. A light dismiss
 *   closes without moving focus.
 *
 * Opening from the trigger is the host's. Options are handed over with
 * `setTriggers`, the name every hosted controller shares, because React's
 * options carry no value attribute to read one from.
 */
export class SelectController {
  readonly #list: Showable;
  readonly #host: SelectControllerHost;
  #options: SelectOption[] = [];
  #connection: AbortController | null = null;
  /** Whether this controller showed the list and has not hidden it since. */
  #shown = false;
  /** The typeahead query so far, and the timer that lapses it. */
  #query = "";
  #lapse: ReturnType<typeof setTimeout> | undefined;

  constructor(list: HTMLElement, host: SelectControllerHost) {
    this.#list = list as Showable;
    this.#host = host;
  }

  /** Replace the registered options with what the host has now. */
  setTriggers(options: readonly SelectOption[]): void {
    this.#options = [...options];
  }

  /**
   * Start listening. Connecting again while connected does nothing, so a host
   * whose lifecycle runs twice never stacks handlers.
   */
  connect(): void {
    if (this.#connection) return;
    this.#connection = new AbortController();
    const { signal } = this.#connection;
    this.#list.addEventListener("toggle", (event) => this.#toggle(event as ToggleEvent), { signal });
    this.#list.addEventListener("keydown", (event) => this.#keydown(event), { signal });
    this.#list.addEventListener("click", (event) => this.#click(event), { signal });
  }

  /**
   * Stop listening, and forget the list was showing: a host disconnects when it
   * leaves the document, which hides a popover with no event, so the next sync
   * shows it again.
   */
  disconnect(): void {
    this.#connection?.abort();
    this.#connection = null;
    this.#shown = false;
  }

  /** Show or hide the list to match the host's state. */
  sync(): void {
    const { open } = this.#host.state();
    if (open && !this.#shown) {
      this.#shown = true;
      const source = this.#host.source?.();
      if (source) this.#list.showPopover({ source });
      else this.#list.showPopover();
      const selected = this.#list.querySelector<HTMLElement>('[role="option"][aria-selected="true"]');
      (selected ?? this.#list.querySelector<HTMLElement>(SELECT_OPTION_SELECTOR) ?? this.#list).focus();
    } else if (!open && this.#shown) {
      this.#shown = false;
      try {
        this.#list.hidePopover();
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

  /** Close, and hand focus back to the trigger. */
  #close(): void {
    this.#host.change(false);
    this.#host.trigger()?.focus();
  }

  #keydown(event: KeyboardEvent): void {
    const options = [...this.#list.querySelectorAll<HTMLElement>(SELECT_OPTION_SELECTOR)];
    const active = options.indexOf(document.activeElement as HTMLElement);
    const outcome = selectKeydown({ key: event.key, active, count: options.length });
    if (outcome) {
      event.preventDefault();
      if ("focus" in outcome) options[outcome.focus].focus();
      else if ("activate" in outcome) options[outcome.activate].click();
      else this.#close();
      return;
    }
    const typed = menuTypeahead({
      query: this.#query,
      key: event.key,
      labels: options.map((option) => option.textContent as string),
      active,
    });
    if (!typed) return;
    this.#query = typed.query;
    clearTimeout(this.#lapse);
    this.#lapse = setTimeout(() => (this.#query = ""), MENU_TYPEAHEAD_RESET_MS);
    if (typed.focus === null) return;
    event.preventDefault();
    options[typed.focus].focus();
  }

  #click(event: MouseEvent): void {
    const option = this.#options.find(({ element, disabled }) => !disabled && element.contains(event.target as Node));
    if (!option) return;
    this.#host.select(option.value);
    this.#close();
  }
}
