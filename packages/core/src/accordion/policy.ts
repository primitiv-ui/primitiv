import { getKeyToActionMap } from "../keyboard/getKeyToActionMap.ts";
import { resolveRovingTarget } from "../keyboard/resolveRovingTarget.ts";

/** Layout axis of the accordion: which arrow pair moves between triggers. */
export type AccordionOrientation = "vertical" | "horizontal";

/** Reading direction. Under `"rtl"` the horizontal arrows are mirrored. */
export type AccordionReadingDirection = "ltr" | "rtl";

/**
 * Everything Accordion's toggle and keyboard rules depend on, as plain data.
 * Each surface builds it from wherever it keeps state — React state, or a
 * custom element's attributes — and applies the outcome back the same way.
 */
export type AccordionState = {
  /** Every item's value, in DOM order, disabled ones included. */
  values: readonly string[];
  /** The values of the disabled items. */
  disabled: ReadonlySet<string>;
  /** The values of the open items. */
  expanded: readonly string[];
  /** Whether more than one item may be open at once. */
  multiple: boolean;
  orientation: AccordionOrientation;
  dir: AccordionReadingDirection;
};

/**
 * The open items after toggling `value`: an open item closes; a closed one
 * opens and, unless `multiple`, closes every other. `null` for a disabled item,
 * which never toggles, so no change is reported.
 */
export function accordionToggle(
  state: Pick<AccordionState, "disabled" | "expanded" | "multiple">,
  value: string,
): string[] | null {
  if (state.disabled.has(value)) return null;
  if (state.expanded.includes(value)) return state.expanded.filter((open) => open !== value);
  return state.multiple ? [...state.expanded, value] : [value];
}

/** What a key press on a trigger asks for: a trigger to move focus to, or an
 * item to toggle — never both. */
export type AccordionKeyOutcome = { focus: string | null; toggle: string | null };

/**
 * Accordion's keyboard contract for a key press on the trigger of `focused`:
 *
 * - arrows follow `orientation`, mirrored under RTL, and wrap at the ends; Home
 *   / End jump to the first and last enabled trigger. They move focus only;
 * - Enter / Space toggle the focused item;
 * - disabled items are **skipped**, unlike Tabs, which lands on them. While focus
 *   sits on a disabled trigger the arrows and Enter / Space do nothing, though
 *   Home / End still jump.
 *
 * Returns `null` for a key Accordion does not handle, which tells the caller to
 * leave the event alone (no `preventDefault`).
 */
export function accordionKeydown(
  state: AccordionState,
  focused: string,
  key: string,
): AccordionKeyOutcome | null {
  const action = getKeyToActionMap({
    orientation: state.orientation,
    dir: state.dir,
    homeEnd: true,
    activate: true,
  })[key];

  if (action === "activate") {
    return state.disabled.has(focused) ? null : { focus: null, toggle: focused };
  }

  const navigable = state.values.filter((value) => !state.disabled.has(value));
  const result = resolveRovingTarget({ action, navigable, currentKey: focused });
  return result && { focus: result.target, toggle: null };
}
