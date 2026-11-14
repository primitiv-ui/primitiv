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

/**
 * Which way a panel is travelling as the open entry changes, so a stylesheet
 * can slide panels in the pointer's direction rather than cross-fading every
 * switch. `from-*` is an entering panel, `to-*` a leaving one, and the suffix
 * is the side it moves from or toward.
 */
export type NavigationMenuPanelMotion = "from-start" | "from-end" | "to-start" | "to-end";

/** What a panel's motion is derived from. */
export type NavigationMenuMotionState = {
  /** The panel's own entry value. */
  value: string;
  /** The entry open now, or `""`. */
  openValue: string;
  /** The entry open before the last change, or `""`. */
  previousValue: string;
  /** The disclosure entries' values, in DOM order. */
  values: readonly string[];
};

/**
 * A panel's motion, or `undefined` — "no direction, just fade" — for a panel
 * neither entering nor leaving, the first open (nothing to travel from), the
 * full close (nothing to travel to), and an entry missing from `values`, since
 * a direction derived from an unknown position would be a guess.
 */
export function navigationMenuPanelMotion({
  value,
  openValue,
  previousValue,
  values,
}: NavigationMenuMotionState): NavigationMenuPanelMotion | undefined {
  const opening = value === openValue;
  if (!opening && value !== previousValue) return undefined;
  // "" is never an entry, so it is rejected by the lookups like any unknown value.
  const self = values.indexOf(value);
  const other = values.indexOf(opening ? previousValue : openValue);
  if (self === -1 || other === -1) return undefined;
  // The two indices are never equal: a previous value is recorded only when the
  // open value changes, so `<` and `<=` agree on every reachable input.
  // Stryker disable next-line EqualityOperator: equivalent — see above.
  if (opening) return other < self ? "from-end" : "from-start";
  // Stryker disable next-line EqualityOperator: equivalent — see above.
  return other > self ? "to-start" : "to-end";
}

/** The offsets of the open trigger an indicator is measured from. */
export type NavigationMenuTriggerBox = {
  offsetLeft: number;
  offsetTop: number;
  offsetWidth: number;
  offsetHeight: number;
};

/**
 * Where the indicator sits along the bar, from the open trigger's offsets:
 * published as `--primitiv-navigation-menu-indicator-position` / `-size`, so
 * the stylesheet decides whether that means a translate, a border or nothing.
 */
export function navigationMenuIndicatorGeometry(
  orientation: NavigationMenuOrientation,
  box: NavigationMenuTriggerBox,
): { position: number; size: number } {
  return orientation === "horizontal"
    ? { position: box.offsetLeft, size: box.offsetWidth }
    : { position: box.offsetTop, size: box.offsetHeight };
}
