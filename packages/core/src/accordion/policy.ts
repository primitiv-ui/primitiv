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
