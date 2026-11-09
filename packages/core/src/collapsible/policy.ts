/**
 * Everything Collapsible's toggle and keyboard rules depend on, as plain data.
 * Each surface builds it from wherever it keeps state — React state, or a
 * custom element's attributes — and applies the outcome back the same way.
 */
export type CollapsibleState = {
  /** Whether the panel is open. */
  open: boolean;
  /** Whether the collapsible is disabled: it never toggles. */
  disabled: boolean;
};

/**
 * The open state after a toggle: the opposite of the current one, or `null`
 * while disabled, when nothing toggles and no change is reported.
 */
export function collapsibleToggle(state: CollapsibleState): boolean | null {
  return state.disabled ? null : !state.open;
}

/** What a key press on the trigger asks for: the open state to move to. */
export type CollapsibleKeyOutcome = { open: boolean };

/**
 * Collapsible's keyboard contract for a key press on its trigger: Enter and
 * Space toggle it. A trigger may be a non-button element (an `<a>`, a
 * `<div role="button">`), so the keys are handled explicitly rather than left
 * to native activation.
 *
 * Returns `null` for any other key, and for every key while disabled, which
 * tells the caller to leave the event alone (no `preventDefault`).
 */
export function collapsibleKeydown(state: CollapsibleState, key: string): CollapsibleKeyOutcome | null {
  if (key !== "Enter" && key !== " ") return null;
  const open = collapsibleToggle(state);
  return open === null ? null : { open };
}
