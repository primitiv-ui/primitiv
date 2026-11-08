import {
  accordionKeydown,
  accordionToggle,
  type AccordionOrientation,
  type AccordionReadingDirection,
} from "@primitiv-ui/core";

/**
 * What an {@link AccordionController} asks of whoever hosts it. The controller
 * owns behaviour and never owns state (RFC 0033 D28): the custom elements keep
 * the open items in a reflected `value` attribute, the React adapter keeps them
 * in React, and each answers these two calls from wherever it keeps them.
 */
export type AccordionControllerHost = {
  /** The state the controller cannot see for itself. */
  state(): {
    /** The values of the open items. */
    expanded: readonly string[];
    multiple: boolean;
    orientation: AccordionOrientation;
    dir: AccordionReadingDirection;
  };
  /** Apply a change the user asked for: `value` is every item open afterwards. */
  change(value: string[]): void;
};

type Trigger = { value: string; disabled: boolean };

/**
 * The DOM behaviour of an accordion: listening, focus, and the ordered
 * collection of triggers. It attaches to whatever elements register with it, so
 * the same code runs under the custom elements and under the React adapter,
 * which renders its own markup (RFC 0033 §3.4).
 */
export class AccordionController {
  readonly #root: HTMLElement;
  readonly #host: AccordionControllerHost;
  readonly #triggers = new Map<HTMLElement, Trigger>();
  #connection: AbortController | null = null;

  constructor(root: HTMLElement, host: AccordionControllerHost) {
    this.#root = root;
    this.#host = host;
  }

  /**
   * Register `element` as the trigger for the item `value`. A disabled trigger
   * is skipped by the arrow keys and never toggles. Registration order does not
   * matter: the collection follows DOM order. Registering an element again
   * updates it.
   */
  registerTrigger(value: string, element: HTMLElement, options: { disabled?: boolean } = {}): void {
    this.#triggers.set(element, { value, disabled: options.disabled ?? false });
  }

  /**
   * Replace the whole collection in one call. A trigger missing from the list is
   * simply no longer registered.
   */
  setTriggers(triggers: ReadonlyArray<{ value: string; element: HTMLElement; disabled?: boolean }>): void {
    this.#triggers.clear();
    for (const { value, element, disabled } of triggers) {
      this.registerTrigger(value, element, { disabled });
    }
  }

  /** Remove `element` from the collection. */
  unregisterTrigger(element: HTMLElement): void {
    this.#triggers.delete(element);
  }

  /**
   * Start listening on the root. Connecting again while connected does nothing,
   * so a host whose lifecycle runs twice never stacks a second set of handlers.
   */
  connect(): void {
    if (this.#connection) return;
    this.#connection = new AbortController();
    const { signal } = this.#connection;
    this.#root.addEventListener("click", (event) => this.#onClick(event), { signal });
    this.#root.addEventListener("keydown", (event) => this.#onKeydown(event), { signal });
  }

  /** Stop listening. The collection is kept, so a later `connect` resumes. */
  disconnect(): void {
    this.#connection?.abort();
    this.#connection = null;
  }

  /** Every registered trigger, in DOM order. */
  #ordered(): Array<[HTMLElement, Trigger]> {
    return [...this.#triggers].sort(([a], [b]) =>
      a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
    );
  }

  #disabled(): Set<string> {
    const disabled = new Set<string>();
    for (const trigger of this.#triggers.values()) {
      if (trigger.disabled) disabled.add(trigger.value);
    }
    return disabled;
  }

  /** Ask the host to toggle `value`, unless the toggle is a no-op. */
  #toggle(value: string): void {
    const { expanded, multiple } = this.#host.state();
    const next = accordionToggle({ disabled: this.#disabled(), expanded, multiple }, value);
    if (next !== null) this.#host.change(next);
  }

  #onClick(event: MouseEvent): void {
    const trigger = this.#triggerFor(event.target);
    if (trigger) this.#toggle(trigger.value);
  }

  #onKeydown(event: KeyboardEvent): void {
    const trigger = this.#triggerFor(event.target);
    if (!trigger) return;
    const { expanded, multiple, orientation, dir } = this.#host.state();
    const ordered = this.#ordered();
    const values = ordered.map(([, t]) => t.value);
    const outcome = accordionKeydown(
      { values, disabled: this.#disabled(), expanded, multiple, orientation, dir },
      trigger.value,
      event.key,
    );
    if (!outcome) return;
    // Enter and Space would also click the button; the toggle happens here once.
    event.preventDefault();
    if (outcome.toggle !== null) this.#toggle(outcome.toggle);
    // A focus target is always one of `values`, so its index is always valid.
    if (outcome.focus !== null) ordered[values.indexOf(outcome.focus)][0].focus();
  }

  #triggerFor(target: EventTarget | null): Trigger | undefined {
    for (const [element, trigger] of this.#triggers) {
      if (element.contains(target as Node)) return trigger;
    }
    return undefined;
  }
}
