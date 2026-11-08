/** A registered trigger: its value, and whether it is disabled. */
export type Trigger = { value: string; disabled: boolean };

/**
 * What every component controller shares (RFC 0033 §3.4, D28): an ordered
 * collection of triggers, and click and keydown listeners on the root that
 * find the trigger an event belongs to. A subclass supplies only what a click
 * and a key press on a trigger mean for its component; it owns no state, which
 * stays with its host. Internal — the public face is each subclass.
 */
export abstract class TriggerController {
  readonly #root: HTMLElement;
  readonly #triggers = new Map<HTMLElement, Trigger>();
  #connection: AbortController | null = null;

  constructor(root: HTMLElement) {
    this.#root = root;
  }

  /**
   * Register `element` as the trigger for `value`. Registration order does not
   * matter: the collection follows DOM order, so parts that arrive in any order
   * (a fragment swap, a framework render) line up. Registering an element again
   * updates it.
   */
  registerTrigger(value: string, element: HTMLElement, options: { disabled?: boolean } = {}): void {
    this.#triggers.set(element, { value, disabled: options.disabled ?? false });
  }

  /**
   * Replace the whole collection in one call. A host that re-reads its parts on
   * every change (the custom elements, the React adapter) hands over what it
   * has now; a trigger missing from the list is simply no longer registered.
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
    this.#root.addEventListener("click", (event) => this.#dispatch(event, this.onTriggerClick), { signal });
    this.#root.addEventListener("keydown", (event) => this.#dispatch(event, this.onTriggerKeydown), { signal });
  }

  /** Stop listening. The collection is kept, so a later `connect` resumes. */
  disconnect(): void {
    this.#connection?.abort();
    this.#connection = null;
  }

  /** A click on `trigger`, or on something inside it. */
  protected abstract onTriggerClick(trigger: Trigger, event: MouseEvent): void;

  /** A key press on `trigger`, or on something inside it. */
  protected abstract onTriggerKeydown(trigger: Trigger, event: KeyboardEvent): void;

  /** Every registered trigger, in DOM order. */
  protected ordered(): Array<[HTMLElement, Trigger]> {
    return [...this.#triggers].sort(([a], [b]) =>
      a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
    );
  }

  /** The values of the disabled triggers. */
  protected disabled(): Set<string> {
    const disabled = new Set<string>();
    for (const trigger of this.#triggers.values()) {
      if (trigger.disabled) disabled.add(trigger.value);
    }
    return disabled;
  }

  /** Hand `event` to `handler` with the trigger it happened in, if any. */
  #dispatch<E extends Event>(event: E, handler: (trigger: Trigger, event: E) => void): void {
    for (const [element, trigger] of this.#triggers) {
      if (element.contains(event.target as Node)) return handler.call(this, trigger, event);
    }
  }
}
