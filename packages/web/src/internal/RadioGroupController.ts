import {
  radioGroupKeydown,
  radioGroupSelect,
  type RadioGroupOrientation,
  type RadioGroupReadingDirection,
} from "@primitiv-ui/core";

import { TriggerController, type Trigger } from "./TriggerController.ts";

/**
 * What a radio-group controller asks of whoever hosts it. The controller owns
 * behaviour and never owns state (RFC 0033 D28): the custom elements keep the
 * selection in a reflected `value` attribute, the React adapter keeps it in
 * React, and each answers these two calls from wherever it keeps it.
 */
export type RadioGroupControllerHost = {
  /** The state the controller cannot see for itself. */
  state(): {
    /** The selected item's value, or `undefined` while none is selected. */
    selected: string | undefined;
    /** Whether the whole group is disabled, every item with it. */
    disabled?: boolean;
    orientation: RadioGroupOrientation;
    dir: RadioGroupReadingDirection;
  };
  /** Apply a change the user asked for: `value` is the item selected afterwards. */
  change(value: string): void;
};

/**
 * The DOM behaviour every single-select radio group shares (SegmentedControl,
 * RadioCard): listening, focus, and the ordered collection of items, over
 * core's radio-group policy. A disabled item — every item, while the whole
 * group is disabled — is skipped by the arrow keys and never selected.
 * Internal — the public face is each component's subclass.
 */
export class RadioGroupController extends TriggerController {
  readonly #host: RadioGroupControllerHost;

  constructor(root: HTMLElement, host: RadioGroupControllerHost) {
    super(root);
    this.#host = host;
  }

  /** The items in DOM order, and which of them are disabled. */
  #items() {
    const ordered = this.ordered();
    const values = ordered.map(([, trigger]) => trigger.value);
    const disabled = this.#host.state().disabled ? new Set(values) : this.disabled();
    return { ordered, values, disabled };
  }

  /** Ask the host to select `value`, unless the selection is a no-op. */
  #select(value: string | null): void {
    if (value !== null) this.#host.change(value);
  }

  protected onTriggerClick(trigger: Trigger): void {
    const { disabled } = this.#items();
    this.#select(radioGroupSelect({ disabled, selected: this.#host.state().selected }, trigger.value));
  }

  protected onTriggerKeydown(trigger: Trigger, event: KeyboardEvent): void {
    const { selected, orientation, dir } = this.#host.state();
    const { ordered, values, disabled } = this.#items();
    const outcome = radioGroupKeydown({ values, disabled, selected, orientation, dir }, trigger.value, event.key);
    if (!outcome) return;
    event.preventDefault();
    ordered[values.indexOf(outcome.focus)][0].focus();
    this.#select(outcome.select);
  }
}
