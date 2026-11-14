import { deriveId } from "../ids/deriveId.ts";
import { getKeyToActionMap } from "../keyboard/getKeyToActionMap.ts";
import { resolveRovingTarget } from "../keyboard/resolveRovingTarget.ts";

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

/**
 * How long a hovered trigger waits before opening its panel: the delay for the
 * first open only. Once a panel is open the menu is already "active", so
 * crossing to a sibling trigger swaps panels at once — waiting again would feel
 * broken.
 */
export function navigationMenuOpenDelay(state: { open: string; delay: number }): number {
  return state.open === "" ? state.delay : 0;
}

/** Layout axis of the bar of top-level entries. */
export type NavigationMenuOrientation = "horizontal" | "vertical";

/** Reading direction. Under `"rtl"` the horizontal arrows are mirrored. */
export type NavigationMenuReadingDirection = "ltr" | "rtl";

/** What the top-level arrow keys travel over. */
export type NavigationMenuTravelState<K> = {
  /** Every top-level entry — triggers and plain links — in DOM order. */
  entries: readonly K[];
  orientation: NavigationMenuOrientation;
  dir: NavigationMenuReadingDirection;
};

/**
 * The top-level travel keys for a key press on the entry `focused`: arrows
 * along the bar's axis (mirrored under RTL) wrap, Home and End jump to the
 * ends. This is **not** a roving tab stop — every entry stays tabbable, as the
 * Disclosure Navigation Menu pattern has it — so the outcome is only where focus
 * goes. Enter and Space are left alone, so a button's click and a link's
 * navigation stay native; `null` means leave the event alone.
 */
export function navigationMenuKeydown<K>(
  state: NavigationMenuTravelState<K>,
  focused: K,
  key: string,
): { focus: K } | null {
  const action = getKeyToActionMap({ orientation: state.orientation, dir: state.dir, homeEnd: true })[key];
  const result = resolveRovingTarget({ action, navigable: state.entries, currentKey: focused });
  return result && { focus: result.target };
}

/**
 * Whether `key` on a trigger opens its panel and moves focus into it: the arrow
 * pointing across the bar's axis — down out of a horizontal bar, sideways out of
 * a vertical rail, that sideways key mirrored under RTL.
 */
export function navigationMenuEntersPanel(
  state: Pick<NavigationMenuTravelState<unknown>, "orientation" | "dir">,
  key: string,
): boolean {
  const enter = state.orientation === "horizontal" ? "ArrowDown" : state.dir === "rtl" ? "ArrowLeft" : "ArrowRight";
  return key === enter;
}

/**
 * The paired ids for one entry's trigger and panel, so `aria-controls` and
 * `aria-labelledby` line up without either side building the id itself.
 */
export function navigationMenuIds(rootId: string, value: string): { triggerId: string; panelId: string } {
  return { triggerId: deriveId(rootId, "trigger", value), panelId: deriveId(rootId, "panel", value) };
}
