import { accordionKeydown, accordionToggle } from "../accordion/policy.ts";

/** Layout axis of the group: which arrow pair moves between items. */
export type ToggleGroupOrientation = "horizontal" | "vertical";

/** Reading direction. Under `"rtl"` the horizontal arrows are mirrored. */
export type ToggleGroupReadingDirection = "ltr" | "rtl";

/**
 * Everything ToggleGroup's toggle and keyboard rules depend on, as plain data.
 * Each surface builds it from wherever it keeps state — React state, or a
 * custom element's attributes — and applies the outcome back the same way.
 */
export type ToggleGroupState = {
  /** Every item's value, in DOM order, disabled ones included. */
  values: readonly string[];
  /** The values of the disabled items. */
  disabled: ReadonlySet<string>;
  /** The values of the pressed items. */
  pressed: readonly string[];
  /** Whether more than one item may be pressed at once (`type="multiple"`). */
  multiple: boolean;
  orientation: ToggleGroupOrientation;
  dir: ToggleGroupReadingDirection;
};

/** What a key press on an item asks for: an item to move focus to, or an item
 * to toggle — never both. */
export type ToggleGroupKeyOutcome = { focus: string | null; toggle: string | null };

/**
 * The pressed items after toggling `value`: a pressed item lets go — in single
 * mode that leaves nothing pressed; one that is off is pressed and, unless
 * `multiple`, replaces the pressed one. `null` for a disabled item, which never
 * toggles, so no change is reported. The same rule as an accordion's open items.
 */
export function toggleGroupToggle(
  state: Pick<ToggleGroupState, "disabled" | "pressed" | "multiple">,
  value: string,
): string[] | null {
  return accordionToggle({ disabled: state.disabled, expanded: state.pressed, multiple: state.multiple }, value);
}

/**
 * ToggleGroup's keyboard contract for a key press on the item `focused`: arrows
 * follow `orientation`, mirrored under RTL, wrap at the ends and skip disabled
 * items; Home / End jump to the ends. They move focus only — Enter / Space
 * toggle the focused item. Returns `null` for a key the group does not handle,
 * which tells the caller to leave the event alone (no `preventDefault`).
 */
export function toggleGroupKeydown(
  state: ToggleGroupState,
  focused: string,
  key: string,
): ToggleGroupKeyOutcome | null {
  return accordionKeydown({ ...state, expanded: state.pressed }, focused, key);
}

/**
 * The item that takes part in the page's Tab order (the roving tab stop): the
 * item focus last moved to, else the first pressed item, else the first item —
 * always an enabled one that is still there, so Tab reaches the group.
 */
export function toggleGroupTabStop(
  state: Pick<ToggleGroupState, "values" | "disabled" | "pressed"> & { focused: string | undefined },
): string | undefined {
  const enabled = state.values.filter((value) => !state.disabled.has(value));
  // `undefined` is never an enabled value, so a missing focus or first item drops out.
  return [state.focused, ...state.pressed, enabled[0]].find((value) => enabled.includes(value as string));
}
