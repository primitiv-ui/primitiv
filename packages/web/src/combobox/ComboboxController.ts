import { comboboxKeydown, comboboxQuery } from "@primitiv-ui/core";

/**
 * What a {@link ComboboxController} asks of whoever hosts it. The controller
 * owns behaviour and never owns state (RFC 0033 D28): the custom elements keep
 * the value and the open state in reflected attributes and the cursor beside
 * them, the React adapter keeps all three in React, and each answers these
 * calls from wherever it keeps them.
 */
export type ComboboxControllerHost = {
  /** The state the controller cannot see for itself. */
  state(): {
    /** Whether the popup is open. */
    open: boolean;
    /** The committed value, `""` when nothing is chosen. */
    value: string;
    /** The option under the cursor (`aria-activedescendant`), if any. */
    active: string | undefined;
  };
  /** The text field, which keeps real focus throughout. */
  input(): HTMLInputElement | null;
  /** The popup listbox, while it is in the document. */
  content(): HTMLElement | null;
  /** Apply an open-state change the user asked for: `open` is the state afterwards. */
  change(open: boolean): void;
  /** Report the field's text after a keystroke. */
  query(text: string): void;
  /** Commit `value`: take it, show `label` in the field, and close. */
  select(value: string, label: string): void;
  /** Clear the value, because the user emptied the field. */
  clear(): void;
  /** Close, and put the committed value's text back in the field. */
  dismiss(): void;
  /** Point the cursor at `value`, or clear it (`undefined`). */
  moveCursor(value: string | undefined): void;
};

/**
 * A registered option: its value, its element, whether it is disabled, and the
 * text the field shows once it is committed (its value when it has none).
 */
export type ComboboxOption = { value: string; element: HTMLElement; disabled?: boolean; label?: string };

/** A popover's `showPopover`, with the `source` option the DOM typings may not know yet. */
type Showable = HTMLElement & { showPopover(options?: { source: HTMLElement }): void };

/**
 * The DOM behaviour of a combobox (WAI-ARIA APG): a text field that keeps real
 * focus, and a `popover="auto"` listbox whose cursor is virtual. It listens on
 * the root, so the field and the popup can come and go beneath it.
 *
 * - **Sync** — {@link ComboboxController.sync | `sync()`} shows or hides the
 *   popup to match the host's state. It is shown with the root's child that
 *   holds the field as its `source`, which makes that box the popup's implicit
 *   anchor for CSS anchor positioning — or with the field itself when that
 *   child is `display: contents` and so has no box.
 * - **Typing** — core's `comboboxQuery`: every keystroke is reported and opens
 *   the popup, and emptying the field clears the value. Filtering is the
 *   consumer's: hide or remove the options that do not match.
 * - **Keyboard** — core's `comboboxKeydown`: ArrowDown and ArrowUp open, then
 *   move the cursor over the shown, enabled options; Home and End jump, Enter
 *   commits, Escape dismisses.
 * - **Choosing** — a click on an enabled option commits it and hands focus
 *   back to the field. A light dismiss is the same dismissal as Escape.
 *
 * Options are handed over with `setTriggers`, the name every hosted controller
 * shares, and walked in document order on every key.
 */
export class ComboboxController {
  readonly #root: HTMLElement;
  readonly #host: ComboboxControllerHost;
  #options: ComboboxOption[] = [];
  #connection: AbortController | null = null;
  /** The popup this controller showed and has not hidden since. */
  #shown: HTMLElement | null = null;

  constructor(root: HTMLElement, host: ComboboxControllerHost) {
    this.#root = root;
    this.#host = host;
  }

  /** Replace the registered options with what the host has now. */
  setTriggers(options: readonly ComboboxOption[]): void {
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
    this.#root.addEventListener("input", (event) => this.#input(event), { signal });
    this.#root.addEventListener("keydown", (event) => this.#keydown(event), { signal });
    this.#root.addEventListener("click", (event) => this.#click(event), { signal });
    // `toggle` does not bubble, so it is heard on the way down.
    this.#root.addEventListener("toggle", (event) => this.#toggle(event as ToggleEvent), { signal, capture: true });
  }

  /**
   * Stop listening, and forget the popup was showing: a host disconnects when
   * it leaves the document, which hides a popover with no event, so the next
   * sync shows it again.
   */
  disconnect(): void {
    this.#connection?.abort();
    this.#connection = null;
    this.#shown = null;
  }

  /** Show or hide the popup to match the host's state. */
  sync(): void {
    const { open } = this.#host.state();
    const content = this.#host.content() as Showable | null;
    if (open && content && content !== this.#shown) {
      this.#shown = content;
      const source = this.#source();
      if (source) content.showPopover({ source });
      else content.showPopover();
    } else if (!open && this.#shown) {
      const shown = this.#shown;
      this.#shown = null;
      try {
        shown.hidePopover();
      } catch {
        // Already hidden, or no longer a popover.
      }
    }
  }

  /**
   * The root's child that holds the field: the box the popup anchors to. A
   * child with no box of its own (`display: contents`) cannot anchor anything,
   * so the field itself does instead.
   */
  #source(): HTMLElement | null {
    const input = this.#host.input();
    let box: HTMLElement | null = input;
    while (box && box.parentElement !== this.#root) box = box.parentElement;
    return box && getComputedStyle(box).display === "contents" ? input : box;
  }

  /** The options the cursor can land on, in document order: enabled and shown. */
  #navigable(): ComboboxOption[] {
    return this.#options
      .filter(({ disabled, element }) => !disabled && !element.hidden)
      .sort((a, b) => (a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
  }

  #fromField(event: Event): boolean {
    return event.target === this.#host.input();
  }

  #input(event: Event): void {
    if (!this.#fromField(event)) return;
    const text = (event.target as HTMLInputElement).value;
    const { open, value } = this.#host.state();
    const outcome = comboboxQuery({ query: text, value });
    this.#host.query(text);
    if (!open) this.#host.change(outcome.open);
    if (outcome.clear) this.#host.clear();
  }

  #keydown(event: KeyboardEvent): void {
    if (!this.#fromField(event)) return;
    const { open, active } = this.#host.state();
    const navigable = this.#navigable();
    const values = navigable.map(({ value }) => value);
    const outcome = comboboxKeydown({ key: event.key, open, values, active });
    if (!outcome) return;
    event.preventDefault();
    if ("open" in outcome) this.#host.change(true);
    else if ("dismiss" in outcome) this.#host.dismiss();
    else if ("commit" in outcome) this.#commit(navigable[values.indexOf(outcome.commit)]);
    else {
      const option = navigable[values.indexOf(outcome.cursor)];
      this.#host.moveCursor(option.value);
      option.element.scrollIntoView({ block: "nearest" });
    }
  }

  #commit(option: ComboboxOption): void {
    this.#host.select(option.value, option.label ?? option.value);
    this.#host.moveCursor(undefined);
  }

  #click(event: MouseEvent): void {
    const option = this.#options.find(({ element, disabled }) => !disabled && element.contains(event.target as Node));
    if (!option) return;
    this.#commit(option);
    this.#host.input()?.focus();
  }

  #toggle(event: ToggleEvent): void {
    if (event.newState !== "closed" || event.target !== this.#shown) return;
    this.#shown = null;
    this.#host.dismiss();
  }
}
