import { splitButtonOpensMenu } from "@primitiv-ui/core";

import { TriggerController, type Trigger } from "../internal/TriggerController.ts";

/**
 * What a {@link SplitButtonController} asks of whoever hosts it. The
 * controller owns behaviour and never owns state (RFC 0033 D28): the menu's
 * open state is the dropdown's, kept in `<primitiv-dropdown>`'s reflected
 * `open` attribute or in React, and the host opens it from wherever it is.
 */
export type SplitButtonControllerHost = {
  /** Open the menu, as a change the user asked for. */
  open(): void;
};

/**
 * The DOM behaviour of a split button's action half: ArrowDown opens the menu,
 * the standard affordance for reaching the alternatives without tabbing past
 * the action. Its one trigger is the action; registering it `disabled` turns
 * the key off. A click is the action's own — the consumer's handler, a link's
 * navigation — so the controller leaves it alone, and everything about the
 * menu itself is the dropdown's.
 */
export class SplitButtonController extends TriggerController {
  readonly #host: SplitButtonControllerHost;

  constructor(root: HTMLElement, host: SplitButtonControllerHost) {
    super(root);
    this.#host = host;
  }

  /** No click of its own: the action's click is the consumer's. */
  protected onTriggerClick(): void {}

  protected onTriggerKeydown(trigger: Trigger, event: KeyboardEvent): void {
    if (!splitButtonOpensMenu({ key: event.key, disabled: trigger.disabled })) return;
    event.preventDefault();
    this.#host.open();
  }
}
