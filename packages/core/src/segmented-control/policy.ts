import { radioGroupKeydown, radioGroupSelect, radioGroupTabStop } from "../radio-group/policy.ts";

/** Layout axis of the control: which arrow pair moves between segments. */
export type SegmentedControlOrientation = "horizontal" | "vertical";

/** Reading direction. Under `"rtl"` the horizontal arrows are mirrored. */
export type SegmentedControlReadingDirection = "ltr" | "rtl";

/**
 * Everything SegmentedControl's selection and keyboard rules depend on, as
 * plain data. Each surface builds it from wherever it keeps state — React
 * state, or a custom element's attributes — and applies the outcome back the
 * same way. A whole-control disable is every value in `disabled`.
 */
export type SegmentedControlState = {
  /** Every segment's value, in DOM order, disabled ones included. */
  values: readonly string[];
  /** The values of the disabled segments. */
  disabled: ReadonlySet<string>;
  /** The selected segment's value, or `undefined` while none is selected. */
  selected: string | undefined;
  orientation: SegmentedControlOrientation;
  dir: SegmentedControlReadingDirection;
};

/** What a key press on a segment asks for: a segment to focus, and the segment
 * to select — `null` when it is already selected, so no change is reported. */
export type SegmentedControlKeyOutcome = { focus: string; select: string | null };

/**
 * The segment a click on `value` selects: `null` when it is disabled or
 * already selected. A selected segment never lets go, so — unlike a toggle
 * group — the selection cannot be cleared to nothing. The radio group's rule.
 */
export function segmentedControlSelect(
  state: Pick<SegmentedControlState, "disabled" | "selected">,
  value: string,
): string | null {
  return radioGroupSelect(state, value);
}

/**
 * SegmentedControl's keyboard contract — the WAI-ARIA radio group's — for a key
 * press on the segment `focused`: the arrows follow `orientation`, mirrored
 * under RTL, wrap at the ends and skip disabled segments, and each one moves
 * focus **and** selection. While focus sits on a disabled segment they do
 * nothing. There is no Home / End, and Enter / Space are the native button's
 * click.
 *
 * Returns `null` for a key the control does not handle, which tells the caller
 * to leave the event alone (no `preventDefault`).
 */
export function segmentedControlKeydown(
  state: SegmentedControlState,
  focused: string,
  key: string,
): SegmentedControlKeyOutcome | null {
  return radioGroupKeydown(state, focused, key);
}

/**
 * The segment that takes part in the page's Tab order (the roving tab stop):
 * the selected segment, else the first enabled one so the control is still
 * reachable by keyboard — or none, while nothing is selected and every segment
 * is disabled.
 */
export function segmentedControlTabStop(
  state: Pick<SegmentedControlState, "values" | "disabled" | "selected">,
): string | undefined {
  return radioGroupTabStop(state);
}
