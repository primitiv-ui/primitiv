import {
  segmentedControlKeydown,
  segmentedControlSelect,
  type SegmentedControlOrientation,
  type SegmentedControlReadingDirection,
} from "@primitiv-ui/core";

import { TriggerController, type Trigger } from "../internal/TriggerController.ts";

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
 * The DOM behaviour of a segmented control: listening, focus, and the ordered
 * collection of segments. It attaches to whatever elements register with it,
 * so the same code runs under the custom elements and under the React adapter,
 * which renders its own markup (RFC 0033 §3.4). A disabled segment — every
 * segment, while the whole control is disabled — is skipped by the arrow keys
 * and never selected.
 */
export class SegmentedControlController extends TriggerController {
  readonly #host: SegmentedControlControllerHost;

  constructor(root: HTMLElement, host: SegmentedControlControllerHost) {
    super(root);
    this.#host = host;
  }

  /** The segments in DOM order, and which of them are disabled. */
  #segments() {
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
    const { disabled } = this.#segments();
    this.#select(segmentedControlSelect({ disabled, selected: this.#host.state().selected }, trigger.value));
  }

  protected onTriggerKeydown(trigger: Trigger, event: KeyboardEvent): void {
    const { selected, orientation, dir } = this.#host.state();
    const { ordered, values, disabled } = this.#segments();
    const outcome = segmentedControlKeydown({ values, disabled, selected, orientation, dir }, trigger.value, event.key);
    if (!outcome) return;
    event.preventDefault();
    ordered[values.indexOf(outcome.focus)][0].focus();
    this.#select(outcome.select);
  }
}
