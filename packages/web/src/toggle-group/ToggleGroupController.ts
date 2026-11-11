import {
  toggleGroupKeydown,
  toggleGroupToggle,
  type ToggleGroupOrientation,
  type ToggleGroupReadingDirection,
} from "@primitiv-ui/core";

import { TriggerController, type Trigger } from "../internal/TriggerController.ts";

/**
 * What a {@link ToggleGroupController} asks of whoever hosts it. The controller
 * owns behaviour and never owns state (RFC 0033 D28): the custom elements keep
 * the pressed items in a reflected `value` attribute, the React adapter keeps
 * them in React, and each answers these two calls from wherever it keeps them.
 */
export type ToggleGroupControllerHost = {
  /** The state the controller cannot see for itself. */
  state(): {
    /** The values of the pressed items. */
    pressed: readonly string[];
    /** Whether more than one item may be pressed at once. */
    multiple: boolean;
    orientation: ToggleGroupOrientation;
    dir: ToggleGroupReadingDirection;
  };
  /** Apply a change the user asked for: `value` is every item pressed afterwards. */
  change(value: string[]): void;
};

/**
 * The DOM behaviour of a toggle group: listening, focus, and the ordered
 * collection of items. It attaches to whatever elements register with it, so
 * the same code runs under the custom elements and under the React adapter,
 * which renders its own markup (RFC 0033 §3.4). A disabled item is skipped by
 * the arrow keys and never toggles.
 */
export class ToggleGroupController extends TriggerController {
  readonly #host: ToggleGroupControllerHost;

  constructor(root: HTMLElement, host: ToggleGroupControllerHost) {
    super(root);
    this.#host = host;
  }

  /** Ask the host to toggle `value`, unless the toggle is a no-op. */
  #toggle(value: string): void {
    const { pressed, multiple } = this.#host.state();
    const next = toggleGroupToggle({ disabled: this.disabled(), pressed, multiple }, value);
    if (next !== null) this.#host.change(next);
  }

  protected onTriggerClick(trigger: Trigger): void {
    this.#toggle(trigger.value);
  }

  protected onTriggerKeydown(trigger: Trigger, event: KeyboardEvent): void {
    const { pressed, multiple, orientation, dir } = this.#host.state();
    const ordered = this.ordered();
    const values = ordered.map(([, t]) => t.value);
    const outcome = toggleGroupKeydown(
      { values, disabled: this.disabled(), pressed, multiple, orientation, dir },
      trigger.value,
      event.key,
    );
    if (!outcome) return;
    event.preventDefault();
    if (outcome.toggle !== null) this.#toggle(outcome.toggle);
    if (outcome.focus !== null) ordered[values.indexOf(outcome.focus)][0].focus();
  }
}
