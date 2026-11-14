/**
 * Navigation Menu's rules — the ARIA APG *Disclosure Navigation Menu*, not a
 * menubar — as pure functions. The open entry is a single string where `""`
 * means nothing is open; each surface keeps it wherever it keeps state.
 */

/** What a click on a trigger is toggled against. */
export type NavigationMenuToggleState = {
  /** The open entry's value, or `""` while nothing is open. */
  open: string;
  /**
   * Whether this trigger's entry was open when the pointer arrived on it, or
   * `undefined` when no pointer is over it. A pointer that comes to click
   * fires `pointerenter` first, which — with hover-to-open — opens the panel
   * before the click lands; toggling against the live state would then close
   * it again on that same click.
   */
  arrival: boolean | undefined;
};

/**
 * The open value a click on the trigger for `value` asks for: closed when the
 * entry was open (as the pointer arrived, else now), else that entry.
 */
export function navigationMenuToggle(state: NavigationMenuToggleState, value: string): string {
  const wasOpen = state.arrival ?? state.open === value;
  return wasOpen ? "" : value;
}
