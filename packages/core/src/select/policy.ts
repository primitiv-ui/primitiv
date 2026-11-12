import { menuKeydown, type MenuKeyOutcome, type MenuKeyState } from "../menu/policy.ts";

/** A select's enabled options, as the selector a host finds them with. */
export const SELECT_OPTION_SELECTOR: string = '[role="option"]:not([aria-disabled="true"])';

/**
 * The keyboard contract of an open select's listbox: a menu's
 * ({@link menuKeydown}) — the arrows move through the options and wrap, Home
 * and End jump to the ends, Enter and Space choose the focused option — except
 * that Escape closes even when there are no options to move through. Typeahead
 * is `menuTypeahead`'s. Returns `null` for a key the select leaves alone.
 */
export function selectKeydown(state: MenuKeyState): MenuKeyOutcome | null {
  if (state.key === "Escape") return { open: false };
  return menuKeydown(state);
}
