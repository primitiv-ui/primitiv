import { getKeyToActionMap } from "../keyboard/getKeyToActionMap.ts";
import { resolveRovingTarget } from "../keyboard/resolveRovingTarget.ts";

/** Which arrow pairs move between items: one axis, or `"both"` for all four
 * arrows (a grid of cards that wraps). */
export type RadioGroupOrientation = "horizontal" | "vertical" | "both";

/** Reading direction. Under `"rtl"` the horizontal arrows are mirrored. */
export type RadioGroupReadingDirection = "ltr" | "rtl";

/**
 * Everything a radio group's selection and keyboard rules depend on, as plain
 * data — shared by every single-select radio-group component (SegmentedControl,
 * RadioCard). Each surface builds it from wherever it keeps state and applies
 * the outcome back the same way. A whole-group disable is every value in
 * `disabled`.
 */
export type RadioGroupState = {
  /** Every item's value, in DOM order, disabled ones included. */
  values: readonly string[];
  /** The values of the disabled items. */
  disabled: ReadonlySet<string>;
  /** The selected item's value, or `undefined` while none is selected. */
  selected: string | undefined;
  orientation: RadioGroupOrientation;
  dir: RadioGroupReadingDirection;
};

/** What a key press on an item asks for: an item to focus, and the item to
 * select — `null` when it is already selected, so no change is reported. */
export type RadioGroupKeyOutcome = { focus: string; select: string | null };

/**
 * The item a click on `value` selects: `null` when it is disabled or already
 * selected. A selected item never lets go, so the selection cannot be cleared
 * to nothing.
 */
export function radioGroupSelect(
  state: Pick<RadioGroupState, "disabled" | "selected">,
  value: string,
): string | null {
  return state.disabled.has(value) || state.selected === value ? null : value;
}

/**
 * The WAI-ARIA radio group's keyboard contract for a key press on the item
 * `focused`: the arrows follow `orientation` (all four under `"both"`), the
 * horizontal pair mirrored under RTL, wrap at the ends and skip disabled items,
 * and each one moves focus **and** selection. While focus sits on a disabled
 * item they do nothing. There is no Home / End, and Enter / Space are the
 * native button's click.
 *
 * Returns `null` for a key the group does not handle, which tells the caller to
 * leave the event alone (no `preventDefault`).
 */
export function radioGroupKeydown(
  state: RadioGroupState,
  focused: string,
  key: string,
): RadioGroupKeyOutcome | null {
  const action = getKeyToActionMap({ orientation: state.orientation, dir: state.dir })[key];
  const navigable = state.values.filter((value) => !state.disabled.has(value));
  const result = resolveRovingTarget({ action, navigable, currentKey: focused });
  return result && { focus: result.target, select: radioGroupSelect(state, result.target) };
}

/**
 * The item that takes part in the page's Tab order (the roving tab stop): the
 * selected item, else the first enabled one so the group is still reachable by
 * keyboard — or none, while nothing is selected and every item is disabled.
 */
export function radioGroupTabStop(
  state: Pick<RadioGroupState, "values" | "disabled" | "selected">,
): string | undefined {
  return state.selected ?? state.values.find((value) => !state.disabled.has(value));
}
