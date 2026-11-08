import { getKeyToActionMap } from "../keyboard/getKeyToActionMap.ts";
import { resolveRovingTarget } from "../keyboard/resolveRovingTarget.ts";

/** Layout axis of the tab list: which arrow pair moves between tabs. */
export type TabsOrientation = "horizontal" | "vertical";

/** Reading direction. Under `"rtl"` the horizontal arrows are mirrored. */
export type TabsReadingDirection = "ltr" | "rtl";

/** When a focused tab becomes active: on arrival (`"automatic"`), or only on
 * Enter / Space (`"manual"`). */
export type TabsActivationMode = "automatic" | "manual";

/**
 * Everything Tabs' keyboard and activation rules depend on, as plain data. Each
 * surface builds it from wherever it keeps state — React state, or a custom
 * element's attributes — and applies the outcome back the same way.
 */
export type TabsState = {
  /** Every tab's value, in DOM order, disabled ones included. */
  values: readonly string[];
  /** The values of the disabled tabs. */
  disabled: ReadonlySet<string>;
  /** The active tab's value, or `undefined` when no tab is active. */
  active: string | undefined;
  orientation: TabsOrientation;
  dir: TabsReadingDirection;
  activationMode: TabsActivationMode;
};

/** What a key press on a tab asks for: always a tab to focus, and a tab to
 * activate when the press should change the selection. */
export type TabsKeyOutcome = {
  focus: string;
  activate: string | null;
};

/**
 * The tab that takes part in the page's Tab order (the roving tab stop): the
 * active tab, or the first tab while none is active so the tablist is still
 * reachable by keyboard. An active value that matches no tab is returned as it
 * is, which leaves no tab as the stop — the behaviour Tabs has always had.
 */
export function tabsTabStop(state: Pick<TabsState, "values" | "active">): string | undefined {
  return state.active ?? state.values[0];
}

/** The tab a click on `value` activates: `null` when it is disabled or already
 * active. */
export function tabsClick(
  state: Pick<TabsState, "disabled" | "active">,
  value: string,
): string | null {
  return state.disabled.has(value) || state.active === value ? null : value;
}

/**
 * Tabs' keyboard contract for a key press on the tab `focused`:
 *
 * - arrows follow `orientation`, mirrored under RTL; Home / End jump to the ends;
 *   Enter / Space confirm;
 * - arrows **land** on a disabled tab but never activate it — unlike RadioGroup
 *   and Accordion, which skip disabled items;
 * - in `"automatic"` mode arriving at a tab activates it; in `"manual"` mode only
 *   Enter / Space do;
 * - the already-active tab is never re-activated, so no change is reported.
 *
 * Returns `null` for a key Tabs does not handle, which tells the caller to leave
 * the event alone (no `preventDefault`).
 */
export function tabsKeydown(state: TabsState, focused: string, key: string): TabsKeyOutcome | null {
  const action = getKeyToActionMap({
    orientation: state.orientation,
    dir: state.dir,
    homeEnd: true,
    activate: true,
  })[key];

  const result = resolveRovingTarget({ action, navigable: state.values, currentKey: focused });
  if (!result) return null;

  const target = result.target;
  const requested = state.activationMode === "automatic" || action === "activate";
  return { focus: target, activate: requested ? tabsClick(state, target) : null };
}
