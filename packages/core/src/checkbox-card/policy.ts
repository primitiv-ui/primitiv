/** A checkbox's state: checked, unchecked, or `"indeterminate"` (mixed). */
export type CheckboxCardCheckedState = boolean | "indeterminate";

/** Everything a checkbox card's toggle depends on, as plain data. */
export type CheckboxCardState = {
  checked: CheckboxCardCheckedState;
  disabled: boolean;
};

/**
 * The state a press on a checkbox card asks for: the opposite of checked, with
 * a mixed card becoming checked — a press always resolves the mix. `null` while
 * the card is disabled, so no change is reported.
 */
export function checkboxCardToggle(state: CheckboxCardState): boolean | null {
  if (state.disabled) return null;
  return state.checked === "indeterminate" ? true : !state.checked;
}
