/** A menu's enabled items, as the selector a host finds them with: every item role, bar the disabled. */
// `^=` matches exactly the three item roles: menuitem, menuitemcheckbox and menuitemradio.
export const MENU_ITEM_SELECTOR: string = '[role^="menuitem"]:not([aria-disabled="true"])';

/** A key press inside an open menu, with where focus is among its enabled items. */
export type MenuKeyState = {
  /** The key pressed. */
  key: string;
  /** The index of the focused item, or `-1` when focus is on none of them. */
  active: number;
  /** How many enabled items the menu holds. */
  count: number;
};

/** What a key press inside a menu asks for. */
export type MenuKeyOutcome =
  /** Move focus to the item at this index. */
  | { focus: number }
  /** Activate (click) the item at this index. */
  | { activate: number }
  /** Close the menu (and the caller hands focus back to the trigger). */
  | { open: false };

/**
 * The menu's keyboard contract (WAI-ARIA APG Menu Button): the arrows move
 * through the items and wrap, Home and End jump to the ends, Enter and Space
 * activate the focused item, and Escape closes. Returns `null` for any other
 * key, and for every key in a menu with no enabled items, which tells the
 * caller to leave the event alone. Typeahead is {@link menuTypeahead}'s.
 */
export function menuKeydown({ key, active, count }: MenuKeyState): MenuKeyOutcome | null {
  if (count === 0) return null;
  switch (key) {
    case "ArrowDown":
      return { focus: (active + 1) % count };
    case "ArrowUp":
      return { focus: active <= 0 ? count - 1 : active - 1 };
    case "Home":
      return { focus: 0 };
    case "End":
      return { focus: count - 1 };
    case "Enter":
    case " ":
      return active < 0 ? null : { activate: active };
    case "Escape":
      return { open: false };
    default:
      return null;
  }
}

/** How long, in milliseconds, a typeahead query lasts after the last key before it starts afresh. */
export const MENU_TYPEAHEAD_RESET_MS: number = 500;

/** A key press to search a menu's items by, with the query typed so far. */
export type MenuTypeaheadState = {
  /** The query typed so far, lower-cased; empty once it has lapsed. */
  query: string;
  /** The key pressed. */
  key: string;
  /** Each enabled item's text, in order. */
  labels: readonly string[];
  /** The index of the focused item, or `-1` when focus is on none of them. */
  active: number;
};

/** The query after a typeahead key, and the item to focus (`null` when none matches). */
export type MenuTypeaheadOutcome = { query: string; focus: number | null };

/**
 * Typeahead: a printable key extends the query and focuses the first item
 * whose text starts with it. A single letter, or one letter repeated, starts
 * after the focused item so repeating it cycles through the matches; a longer
 * query may match the focused item itself. Returns `null` for a key that is
 * not a printable character (Space activates), which tells the caller to leave
 * the event alone. The caller lapses the query after
 * {@link MENU_TYPEAHEAD_RESET_MS}.
 */
export function menuTypeahead({ query, key, labels, active }: MenuTypeaheadState): MenuTypeaheadOutcome | null {
  if (key.length !== 1 || key === " ") return null;
  const next = (query + key).toLowerCase();
  const repeated = [...next].every((char) => char === next[0]);
  const search = repeated ? next[0] : next;
  const start = Math.max(active, 0) + (search.length === 1 ? 1 : 0);
  for (let i = 0; i < labels.length; i++) {
    const index = (start + i) % labels.length;
    if (labels[index].trim().toLowerCase().startsWith(search)) return { query: next, focus: index };
  }
  return { query: next, focus: null };
}
