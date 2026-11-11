import { checkboxCardToggle, type CheckboxCardCheckedState } from "@primitiv-ui/core";

import { TriggerController, type Trigger } from "../internal/TriggerController.ts";

/**
 * What a {@link CheckboxCardController} asks of whoever hosts it. The
 * controller owns behaviour and never owns state (RFC 0033 D28): the custom
 * element keeps the state in a reflected `checked` attribute, the React adapter
 * keeps it in React, and each answers these two calls from wherever it keeps it.
 */
export type CheckboxCardControllerHost = {
  /** The state the controller cannot see for itself. */
  state(): {
    /** Checked, unchecked, or `"indeterminate"` (mixed). */
    checked: CheckboxCardCheckedState;
  };
  /** Apply a change the user asked for: `checked` is the state afterwards. */
  change(checked: boolean): void;
};

/**
 * The DOM behaviour of a checkbox card: a click on the card toggles it, a mixed
 * card becoming checked. It attaches to whatever card registers with it, so the
 * same code runs under the custom element and under the React adapter, which
 * renders its own markup (RFC 0033 §3.4). There is one card; registering it
 * `disabled` disables it. Space and Enter are the card `<button>`'s own click,
 * so the keys need nothing here.
 */
export class CheckboxCardController extends TriggerController {
  readonly #host: CheckboxCardControllerHost;

  constructor(root: HTMLElement, host: CheckboxCardControllerHost) {
    super(root);
    this.#host = host;
  }

  protected onTriggerClick(trigger: Trigger): void {
    const checked = checkboxCardToggle({ checked: this.#host.state().checked, disabled: trigger.disabled });
    if (checked !== null) this.#host.change(checked);
  }

  /** No keys of its own: Space and Enter reach the card as the button's click. */
  protected onTriggerKeydown(): void {}
}
