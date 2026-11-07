import {
  tabsClick,
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

  constructor(root: HTMLElement, host: TabsControllerHost) {
    this.#root = root;
    this.#host = host;
  }

  /** Register `element` as the trigger for `value`. */
  registerTrigger(value: string, element: HTMLElement): void {
    this.#triggers.set(element, { value, disabled: false });
  }

  /** Start listening on the root. */
  connect(): void {
    this.#root.addEventListener("click", (event) => this.#onClick(event));
  }

  #values(): string[] {
    return [...this.#triggers.values()].map((trigger) => trigger.value);
  }

  #onClick(event: MouseEvent): void {
    const trigger = this.#triggerFor(event.target);
    if (!trigger) return;
    const { active } = this.#host.state();
    const target = tabsClick({ disabled: new Set(), active }, trigger.value);
    if (target !== null) this.#host.activate(target, this.#values().indexOf(target));
  }

  #triggerFor(target: EventTarget | null): Trigger | undefined {
    for (const [element, trigger] of this.#triggers) {
      if (element.contains(target as Node)) return trigger;
    }
    return undefined;
  }
}
