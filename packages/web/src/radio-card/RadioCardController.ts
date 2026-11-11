import type { RadioGroupOrientation, RadioGroupReadingDirection } from "@primitiv-ui/core";

import { RadioGroupController } from "../internal/RadioGroupController.ts";

/**
 * What a {@link RadioCardController} asks of whoever hosts it. The controller
 * owns behaviour and never owns state (RFC 0033 D28): the custom elements keep
 * the selection in a reflected `value` attribute, the React adapter keeps it in
 * React, and each answers these two calls from wherever it keeps it.
 */
export type RadioCardControllerHost = {
  /** The state the controller cannot see for itself. */
  state(): {
    /** The selected card's value, or `undefined` while none is selected. */
    selected: string | undefined;
    /** Which arrows move between cards: one axis, or `"both"` for a grid. */
    orientation: RadioGroupOrientation;
    dir: RadioGroupReadingDirection;
  };
  /** Apply a change the user asked for: `value` is the card selected afterwards. */
  change(value: string): void;
};

/**
 * The DOM behaviour of a group of radio cards: the shared radio-group
 * behaviour (listening, focus, the ordered collection of cards), run under the
 * custom elements and the React adapter alike (RFC 0033 §3.4). The arrows move
 * focus and selection together — all four under `"both"`, the default, since
 * cards usually wrap into a grid — skipping disabled cards.
 */
export class RadioCardController extends RadioGroupController {
  constructor(root: HTMLElement, host: RadioCardControllerHost) {
    super(root, host);
  }
}
