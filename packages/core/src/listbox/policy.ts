import { getKeyToActionMap } from "../keyboard/getKeyToActionMap.ts";

/** Layout axis of the list: which arrow pair moves the cursor. */
export type ListboxOrientation = "horizontal" | "vertical";

/** Reading direction. Under `"rtl"` the horizontal arrows are mirrored. */
export type ListboxReadingDirection = "ltr" | "rtl";

/**
 * Everything Listbox's selection and keyboard rules depend on, as plain data.
 * Each surface builds it from wherever it keeps state — React state, or a
 * custom element's attributes — and applies the outcome back the same way.
 */
export type ListboxState = {
  /** The enabled options' values, in DOM order. Disabled options are not navigable. */
  values: readonly string[];
  /** The selected values, in the order they were selected. */
  selected: readonly string[];
  /** The option under the cursor (`aria-activedescendant`), if any. */
  active: string | undefined;
  /** Whether more than one option may be selected (`type="multiple"`). */
  multiple: boolean;
  /** Whether moving the cursor also selects the option it lands on. */
  selectionFollowsFocus: boolean;
  orientation: ListboxOrientation;
  dir: ListboxReadingDirection;
};

/** A key press, with the modifiers the keymap reads. */
export type ListboxKey = {
  key: string;
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
};

/**
 * What a handled key asks for: where the cursor moves (`null` to leave it) and
 * the selection after it (`null` to leave it). Both `null` is a key the list
 * takes — the caller still prevents its default — that changes nothing, such
 * as Shift+ArrowDown on the last option.
 */
export type ListboxKeyOutcome = { cursor: string | null; selected: string[] | null };

/**
 * The selection after choosing `value`. Single mode replaces the selection —
 * choosing the selected option again keeps it, since a listbox is not a toggle.
 * Multiple mode toggles `value` in place and keeps the rest.
 */
export function listboxSelect(state: Pick<ListboxState, "selected" | "multiple">, value: string): string[] {
  if (!state.multiple) return [value];
  return state.selected.includes(value)
    ? state.selected.filter((selected) => selected !== value)
    : [...state.selected, value];
}

/**
 * Where the cursor lands when the list takes focus (APG): the first selected
 * option in list order, else the first option. `undefined` in an empty list.
 */
export function listboxSeed(state: Pick<ListboxState, "values" | "selected">): string | undefined {
  return state.values.find((value) => state.selected.includes(value)) ?? state.values[0];
}

/**
 * Listbox's keyboard contract. The arrows follow `orientation`, mirrored under
 * RTL, and wrap; Home / End jump to the ends; Enter / Space choose the option
 * under the cursor. In multiple mode Shift+Arrow moves and adds without
 * wrapping, Ctrl/Cmd+A selects every option (or none once all are), and
 * Ctrl/Cmd+Shift+Home/End selects from the cursor to that end. Every other
 * chord, and Alt, belongs to the browser and the page. Returns `null` for a key
 * the list leaves alone (no `preventDefault`), including printable characters,
 * which go on to {@link listboxTypeahead}.
 */
export function listboxKeydown(state: ListboxState, press: ListboxKey): ListboxKeyOutcome | null {
  const chord = press.ctrlKey || press.metaKey;

  if (chord && !press.altKey && press.key.toLowerCase() === "a") {
    if (!state.multiple) return null;
    // An empty list counts as all selected, which selects the same nothing.
    const all = state.values.every((value) => state.selected.includes(value));
    return { cursor: null, selected: all ? [] : [...state.values] };
  }

  if (chord && press.shiftKey && (press.key === "Home" || press.key === "End")) {
    if (!state.multiple) return null;
    return extendToEdge(state, press.key === "Home");
  }

  if (chord || press.altKey) return null;

  const action = getKeyToActionMap({
    orientation: state.orientation,
    dir: state.dir,
    homeEnd: true,
    activate: true,
  })[press.key];

  if (press.shiftKey && state.multiple && (action === "next" || action === "prev")) {
    return extendSelection(state, action === "next" ? 1 : -1);
  }

  if (!action || state.values.length === 0) return null;

  if (action === "activate") {
    if (state.active === undefined) return null;
    return { cursor: null, selected: listboxSelect(state, state.active) };
  }

  const last = state.values.length - 1;
  const current = state.values.indexOf(state.active as string);
  let target: number;
  if (action === "first") target = 0;
  else if (action === "last") target = last;
  // No cursor yet (or it sits on an option that has gone): enter from the near end.
  else if (current === -1) target = action === "next" ? 0 : last;
  else target = action === "next" ? (current + 1) % state.values.length : (current + last) % state.values.length;

  const cursor = state.values[target];
  return { cursor, selected: state.selectionFollowsFocus ? listboxSelect(state, cursor) : null };
}

/** Shift+Arrow: move one option and add it, never wrapping past either end. */
function extendSelection(state: ListboxState, step: 1 | -1): ListboxKeyOutcome {
  const current = state.values.indexOf(state.active as string);
  const cursor = current === -1 ? undefined : state.values[current + step];
  if (cursor === undefined) return { cursor: null, selected: null };
  return { cursor, selected: state.selected.includes(cursor) ? null : [...state.selected, cursor] };
}

/** Ctrl+Shift+Home/End: add every option from the cursor to that end, and move there. */
function extendToEdge(state: ListboxState, toStart: boolean): ListboxKeyOutcome {
  const current = state.values.indexOf(state.active as string);
  if (current === -1) return { cursor: null, selected: null };
  const range = toStart ? state.values.slice(0, current + 1) : state.values.slice(current);
  return {
    cursor: toStart ? state.values[0] : state.values[state.values.length - 1],
    selected: [...state.selected, ...range.filter((value) => !state.selected.includes(value))],
  };
}

/** How long, in milliseconds, a typeahead query lasts after the last key before it starts afresh. */
export const LISTBOX_TYPEAHEAD_RESET_MS: number = 500;

/** A key press to search the options by, with the query typed so far. */
export type ListboxTypeaheadState = {
  /** The query typed so far, lower-cased; empty once it has lapsed. */
  query: string;
  /** The key pressed. */
  key: string;
  /** Each enabled option's text, in order. */
  labels: readonly string[];
  /** The index of the option under the cursor, or `-1` when there is none. */
  active: number;
};

/** The query after a typeahead key, and the option to move to (`null` when none matches). */
export type ListboxTypeaheadOutcome = { query: string; focus: number | null };

/**
 * Typeahead (APG): a one-character key extends the query and moves to the
 * first option whose text starts with it, ignoring case and surrounding space.
 * A single character, or one character repeated, searches after the cursor so
 * repeating it cycles through the matches; a longer query may match the option
 * under the cursor. With no cursor the search starts at the top. The search
 * wraps. Returns `null` for a key longer than one character, or when there are
 * no options, which tells the caller to leave the event alone; the caller
 * prevents the default only when an option matched, and lapses the query after
 * {@link LISTBOX_TYPEAHEAD_RESET_MS}.
 */
export function listboxTypeahead({ query, key, labels, active }: ListboxTypeaheadState): ListboxTypeaheadOutcome | null {
  if (key.length !== 1 || labels.length === 0) return null;
  const next = (query + key).toLowerCase();
  const repeated = [...next].every((char) => char === next[0]);
  const search = repeated ? next[0] : next;
  const start = active === -1 ? 0 : active + (search.length === 1 ? 1 : 0);
  const order = [...labels.keys()].map((i) => (start + i) % labels.length);
  const focus = order.find((index) => labels[index].trim().toLowerCase().startsWith(search));
  return { query: next, focus: focus ?? null };
}
