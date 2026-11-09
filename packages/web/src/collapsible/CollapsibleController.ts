import { collapsibleKeydown, collapsibleToggle } from "@primitiv-ui/core";

import { TriggerController, type Trigger } from "../internal/TriggerController.ts";

/**
 * What a {@link CollapsibleController} asks of whoever hosts it. The controller
 * owns behaviour and never owns state (RFC 0033 D28): the custom elements keep
 * the open state in a reflected `open` attribute, the React adapter keeps it in
 * React, and each answers these two calls from wherever it keeps it.
 */
export type CollapsibleControllerHost = {
  /** The state the controller cannot see for itself. */
  state(): {
    /** Whether the panel is open. */
    open: boolean;
  };
  /** Apply a change the user asked for: `open` is the state afterwards. */
  change(open: boolean): void;
};

/**
 * The DOM behaviour of a collapsible: a click, Enter or Space on its trigger
 * toggles it. It attaches to whatever trigger registers with it, so the same
 * code runs under the custom elements and under the React adapter, which renders
 * its own markup (RFC 0033 §3.4). There is one trigger; registering it
 * `disabled` disables the collapsible — it stays focusable and never toggles.
 * Enter and Space are handled here, not left to native activation, so a
 * trigger that is not a `<button>` (an `<a>`, a `<div role="button">`)
 * toggles too.
 */
export class CollapsibleController extends TriggerController {
  readonly #host: CollapsibleControllerHost;

  constructor(root: HTMLElement, host: CollapsibleControllerHost) {
    super(root);
    this.#host = host;
  }

  protected onTriggerClick(trigger: Trigger): void {
    const open = collapsibleToggle({ open: this.#host.state().open, disabled: trigger.disabled });
    if (open !== null) this.#host.change(open);
  }

  protected onTriggerKeydown(trigger: Trigger, event: KeyboardEvent): void {
    const outcome = collapsibleKeydown({ open: this.#host.state().open, disabled: trigger.disabled }, event.key);
    if (!outcome) return;
    // Enter and Space would also click a button; the toggle happens here once.
    event.preventDefault();
    this.#host.change(outcome.open);
  }
}
