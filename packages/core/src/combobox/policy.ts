import { getKeyToActionMap } from "../keyboard/getKeyToActionMap.ts";

/**
 * A key press in a combobox's text field, with what the rules read. Each
 * surface builds it from wherever it keeps state — React state, or a custom
 * element's attributes — and applies the outcome back the same way.
 */
export type ComboboxKeyState = {
  /** The key pressed. */
  key: string;
  /** Whether the popup is open. */
  open: boolean;
  /** The options the cursor can land on, in order: shown and enabled. */
  values: readonly string[];
  /** The option under the cursor (`aria-activedescendant`), if any. */
  active: string | undefined;
};

/**
 * What a handled key asks for: open the popup, move the cursor, commit the
 * option under it, or dismiss — close and put the committed text back.
 */
export type ComboboxKeyOutcome = { open: true } | { cursor: string } | { commit: string } | { dismiss: true };

/**
 * The keyboard contract of a combobox's text field (WAI-ARIA APG combobox).
 * Real focus never leaves the field; the cursor is virtual.
 *
 * - **Closed** — ArrowDown and ArrowUp open the popup without placing a
 *   cursor. Every other key, Escape and Enter included, is left to the field
 *   and the page, so an enclosing dialog or form still hears them.
 * - **Open** — ArrowDown and ArrowUp move the cursor and wrap; with no cursor
 *   (or one on an option that has gone) they enter from the near end. Home and
 *   End jump to the ends. Enter commits the option under the cursor, and
 *   Escape dismisses.
 *
 * Returns `null` for a key the combobox leaves alone (no `preventDefault`):
 * text keys and the horizontal arrows belong to the field.
 */
export function comboboxKeydown(state: ComboboxKeyState): ComboboxKeyOutcome | null {
  const { key, open, values, active } = state;
  const action = getKeyToActionMap({ orientation: "vertical", homeEnd: true })[key];

  if (!open) return action === "next" || action === "prev" ? { open: true } : null;
  if (key === "Escape") return { dismiss: true };

  const current = values.indexOf(active as string);
  if (key === "Enter") return current === -1 ? null : { commit: values[current] };
  if (!action || values.length === 0) return null;

  const last = values.length - 1;
  let target: number;
  if (action === "first") target = 0;
  else if (action === "last") target = last;
  else if (current === -1) target = action === "next" ? 0 : last;
  else target = action === "next" ? (current + 1) % values.length : (current + last) % values.length;
  return { cursor: values[target] };
}

/** The text the user has typed, and the value committed before it. */
export type ComboboxQueryState = {
  /** The field's text after the keystroke. */
  query: string;
  /** The committed value, `""` when nothing is chosen. */
  value: string;
};

/**
 * What a keystroke in the field does. Typing always opens the popup: the user
 * is narrowing a list, so the list has to be on screen to be narrowed. And
 * emptying the field is a deselect, so `clear` asks for the value to be cleared
 * too — only when there is one, so an already-empty field never reports a
 * change the user did not make.
 */
export function comboboxQuery(state: ComboboxQueryState): { open: true; clear: boolean } {
  return { open: true, clear: state.query === "" && state.value !== "" };
}
