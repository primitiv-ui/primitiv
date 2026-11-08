import {
  accordionKeydown,
  accordionToggle,
  type AccordionOrientation,
  type AccordionReadingDirection,
} from "@primitiv-ui/core";

import { TriggerController, type Trigger } from "../internal/TriggerController.ts";

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

/**
 * The DOM behaviour of an accordion: listening, focus, and the ordered
 * collection of triggers. It attaches to whatever elements register with it, so
 * the same code runs under the custom elements and under the React adapter,
 * which renders its own markup (RFC 0033 §3.4). A disabled trigger is skipped by
 * the arrow keys and never toggles.
 */
export class AccordionController extends TriggerController {
  readonly #host: AccordionControllerHost;

  constructor(root: HTMLElement, host: AccordionControllerHost) {
    super(root);
    this.#host = host;
  }

  /** Ask the host to toggle `value`, unless the toggle is a no-op. */
  #toggle(value: string): void {
    const { expanded, multiple } = this.#host.state();
    const next = accordionToggle({ disabled: this.disabled(), expanded, multiple }, value);
    if (next !== null) this.#host.change(next);
  }

  protected onTriggerClick(trigger: Trigger): void {
    this.#toggle(trigger.value);
  }

  protected onTriggerKeydown(trigger: Trigger, event: KeyboardEvent): void {
    const { expanded, multiple, orientation, dir } = this.#host.state();
    const ordered = this.ordered();
    const values = ordered.map(([, t]) => t.value);
    const outcome = accordionKeydown(
      { values, disabled: this.disabled(), expanded, multiple, orientation, dir },
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
}
