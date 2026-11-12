import {
  LISTBOX_TYPEAHEAD_RESET_MS,
  listboxKeydown,
  listboxSeed,
  listboxSelect,
  listboxTypeahead,
  type ListboxOrientation,
  type ListboxReadingDirection,
} from "@primitiv-ui/core";

/**
 * What a {@link ListboxController} asks of whoever hosts it. The controller
 * owns behaviour and never owns state (RFC 0033 D28): the custom elements keep
 * the selection in a reflected `value` attribute and the cursor in
 * `aria-activedescendant`, the React adapter keeps both in React, and each
 * answers these calls from wherever it keeps them.
 */
export type ListboxControllerHost = {
  /** The state the controller cannot see for itself. */
  state(): {
    /** The selected values. */
    selected: readonly string[];
    /** The option under the cursor, if any. */
    active: string | undefined;
    /** Whether more than one option may be selected. */
    multiple: boolean;
    /** Whether moving the cursor also selects the option it lands on. */
    selectionFollowsFocus: boolean;
    orientation: ListboxOrientation;
    dir: ListboxReadingDirection;
  };
  /** Apply a selection change the user asked for: `selected` is every value selected afterwards. */
  change(selected: string[]): void;
  /** Point the cursor at `value`, or clear it (`undefined`). */
  moveCursor(value: string | undefined): void;
};

/** A registered option: its value, its element, and whether it is disabled. */
export type ListboxOption = { value: string; element: HTMLElement; disabled?: boolean };

/**
 * The DOM behaviour of a listbox (RFC 0033 §3.4): the virtual-focus cursor,
 * the keymap and typeahead, and choosing by click. Real focus stays on the root
 * — options are never focused — so every listener sits on the root, and the
 * cursor is seeded when it takes focus and cleared when it loses it. It reads
 * the options in DOM order on every event, so a reorder in place is picked up.
 * A disabled option is skipped by the cursor and never chosen.
 *
 * Unlike the trigger-based components it does not extend `TriggerController`:
 * that dispatches only events inside a trigger, and a listbox's keys arrive on
 * the root itself.
 */
export class ListboxController {
  readonly #root: HTMLElement;
  readonly #host: ListboxControllerHost;
  #options: ListboxOption[] = [];
  #connection: AbortController | null = null;
  #query = "";
  #lapse: ReturnType<typeof setTimeout> | undefined;

  constructor(root: HTMLElement, host: ListboxControllerHost) {
    this.#root = root;
    this.#host = host;
  }

  /** Replace the registered options with what the host has now. */
  setOptions(options: readonly ListboxOption[]): void {
    this.#options = [...options];
  }

  /**
   * Start listening on the root. Connecting again while connected does nothing,
   * so a host whose lifecycle runs twice never stacks a second set of handlers.
   */
  connect(): void {
    if (this.#connection) return;
    this.#connection = new AbortController();
    const { signal } = this.#connection;
    this.#root.addEventListener("focusin", () => this.#seed(), { signal });
    this.#root.addEventListener("focusout", () => this.#host.moveCursor(undefined), { signal });
    this.#root.addEventListener("click", (event) => this.#click(event), { signal });
    this.#root.addEventListener("keydown", (event) => this.#keydown(event), { signal });
  }

  /** Stop listening. The options are kept, so a later `connect` resumes. */
  disconnect(): void {
    this.#connection?.abort();
    this.#connection = null;
  }

  /** The enabled options, in DOM order. */
  #navigable(): ListboxOption[] {
    return this.#options
      .filter((option) => !option.disabled)
      .sort((a, b) => (a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
  }

  #seed(): void {
    const { active, selected } = this.#host.state();
    if (active !== undefined) return;
    this.#host.moveCursor(listboxSeed({ values: this.#navigable().map(({ value }) => value), selected }));
  }

  #moveCursor(option: ListboxOption): void {
    this.#host.moveCursor(option.value);
    option.element.scrollIntoView({ block: "nearest" });
  }

  #click(event: MouseEvent): void {
    const option = this.#navigable().find(({ element }) => element.contains(event.target as Node));
    if (!option) return;
    // A click is a deliberate choice, so it never re-applies selection-follows-focus.
    this.#host.change(listboxSelect(this.#host.state(), option.value));
    this.#moveCursor(option);
  }

  #keydown(event: KeyboardEvent): void {
    const state = this.#host.state();
    const navigable = this.#navigable();
    const values = navigable.map(({ value }) => value);
    const outcome = listboxKeydown({ ...state, values }, event);
    if (outcome) {
      event.preventDefault();
      if (outcome.cursor !== null) this.#moveCursor(navigable[values.indexOf(outcome.cursor)]);
      if (outcome.selected !== null) this.#host.change(outcome.selected);
      return;
    }

    const match = listboxTypeahead({
      query: this.#query,
      key: event.key,
      labels: navigable.map(({ element }) => element.textContent as string),
      active: values.indexOf(state.active as string),
    });
    if (!match) return;
    this.#query = match.query;
    clearTimeout(this.#lapse);
    this.#lapse = setTimeout(() => (this.#query = ""), LISTBOX_TYPEAHEAD_RESET_MS);
    if (match.focus === null) return;
    event.preventDefault();
    const option = navigable[match.focus];
    this.#moveCursor(option);
    if (state.selectionFollowsFocus) this.#host.change(listboxSelect(state, option.value));
  }
}
