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
