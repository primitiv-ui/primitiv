import {
  tabsClick,
  tabsKeydown,
  type TabsActivationMode,
  type TabsOrientation,
  type TabsReadingDirection,
} from "@primitiv-ui/core";

import { TriggerController, type Trigger } from "../internal/TriggerController.ts";

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

/**
 * The DOM behaviour of a tab set: listening, focus, and the ordered collection
 * of triggers. It attaches to whatever elements register with it, so the same
 * code runs under the custom elements and under the React adapter, which renders
 * its own markup (RFC 0033 §3.4). A disabled trigger stays in the collection —
 * arrow keys land on it — but is never activated.
 */
export class TabsController extends TriggerController {
  readonly #host: TabsControllerHost;

  constructor(root: HTMLElement, host: TabsControllerHost) {
    super(root);
    this.#host = host;
  }

  protected onTriggerClick(trigger: Trigger): void {
    const { active } = this.#host.state();
    const target = tabsClick({ disabled: this.disabled(), active }, trigger.value);
    if (target !== null) {
      const values = this.ordered().map(([, t]) => t.value);
      this.#host.activate(target, values.indexOf(target));
    }
  }

  protected onTriggerKeydown(trigger: Trigger, event: KeyboardEvent): void {
    const { active, orientation, dir, activationMode } = this.#host.state();
    const ordered = this.ordered();
    const values = ordered.map(([, t]) => t.value);
    const outcome = tabsKeydown(
      { values, disabled: this.disabled(), active, orientation, dir, activationMode },
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
}
