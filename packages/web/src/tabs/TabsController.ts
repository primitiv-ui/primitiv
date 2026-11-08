import {
  tabsClick,
  tabsKeydown,
  type TabsActivationMode,
  type TabsOrientation,
  type TabsReadingDirection,
} from "@primitiv-ui/core";

/**
 * What a {@link TabsController} asks of whoever hosts it. The controller owns
 * behaviour and never owns state (RFC 0033 D28): the custom elements keep state
 * in reflected attributes, the React adapter keeps it in React, and each answers
 * these two calls from wherever it keeps it.
 */
export type TabsControllerHost = {
  /** The state the controller cannot see for itself. */
  state(): {
    active: string | undefined;
    orientation: TabsOrientation;
    dir: TabsReadingDirection;
    activationMode: TabsActivationMode;
  };
  /** Apply an activation the user asked for. `index` is the tab's DOM position. */
  activate(value: string, index: number): void;
};

type Trigger = { value: string; disabled: boolean };

/**
 * The DOM behaviour of a tab set: listening, focus, and the ordered collection
 * of triggers. It attaches to whatever elements register with it, so the same
 * code runs under the custom elements and under the React adapter, which renders
 * its own markup (RFC 0033 §3.4).
 */
export class TabsController {
  readonly #root: HTMLElement;
  readonly #host: TabsControllerHost;
  readonly #triggers = new Map<HTMLElement, Trigger>();
  #connection: AbortController | null = null;

  constructor(root: HTMLElement, host: TabsControllerHost) {
    this.#root = root;
    this.#host = host;
  }

  /**
   * Register `element` as the trigger for `value`. A disabled trigger is still
   * part of the collection — arrow keys land on it — but is never activated.
   * Registration order does not matter: the collection follows DOM order, so
   * parts that arrive in any order (a fragment swap, a framework render) line up.
   * Registering an element again updates it.
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

  #onClick(event: MouseEvent): void {
    const trigger = this.#triggerFor(event.target);
    if (!trigger) return;
    const { active } = this.#host.state();
    const target = tabsClick({ disabled: this.#disabled(), active }, trigger.value);
    if (target !== null) {
      const values = this.#ordered().map(([, t]) => t.value);
      this.#host.activate(target, values.indexOf(target));
    }
  }

  #onKeydown(event: KeyboardEvent): void {
    const trigger = this.#triggerFor(event.target);
    if (!trigger) return;
    const { active, orientation, dir, activationMode } = this.#host.state();
    const ordered = this.#ordered();
    const values = ordered.map(([, t]) => t.value);
    const outcome = tabsKeydown(
      { values, disabled: this.#disabled(), active, orientation, dir, activationMode },
      trigger.value,
      event.key,
    );
    if (!outcome) return;
    event.preventDefault();
    if (outcome.activate !== null) {
      this.#host.activate(outcome.activate, values.indexOf(outcome.activate));
    }
    // The focus target is always one of `values`, so its index is always valid.
    ordered[values.indexOf(outcome.focus)][0].focus();
  }

  #triggerFor(target: EventTarget | null): Trigger | undefined {
    for (const [element, trigger] of this.#triggers) {
      if (element.contains(target as Node)) return trigger;
    }
    return undefined;
  }
}
