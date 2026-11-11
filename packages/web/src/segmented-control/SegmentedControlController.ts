import type { SegmentedControlOrientation, SegmentedControlReadingDirection } from "@primitiv-ui/core";

import { RadioGroupController } from "../internal/RadioGroupController.ts";

/**
 * What a {@link SegmentedControlController} asks of whoever hosts it. The
 * controller owns behaviour and never owns state (RFC 0033 D28): the custom
 * elements keep the selection in a reflected `value` attribute, the React
 * adapter keeps it in React, and each answers these two calls from wherever it
 * keeps it.
 */
export type SegmentedControlControllerHost = {
  /** The state the controller cannot see for itself. */
  state(): {
    /** The selected segment's value, or `undefined` while none is selected. */
    selected: string | undefined;
    /** Whether the whole control is disabled, every segment with it. */
    disabled: boolean;
    orientation: SegmentedControlOrientation;
    dir: SegmentedControlReadingDirection;
  };
  /** Apply a change the user asked for: `value` is the segment selected afterwards. */
  change(value: string): void;
};

/**
 * The DOM behaviour of a segmented control: the shared radio-group behaviour
 * (listening, focus, the ordered collection of segments), run under the custom
 * elements and the React adapter alike (RFC 0033 §3.4). A disabled segment —
 * every segment, while the whole control is disabled — is skipped by the arrow
 * keys and never selected.
 */
export class SegmentedControlController extends RadioGroupController {
  constructor(root: HTMLElement, host: SegmentedControlControllerHost) {
    super(root, host);
  }
}
