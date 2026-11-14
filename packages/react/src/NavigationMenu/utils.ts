import { navigationMenuIds, navigationMenuPanelMotion } from "@primitiv-ui/core";

/** Derives the paired trigger / panel ids for one entry, so `aria-controls`
 * and `aria-labelledby` line up without either side constructing the
 * template literal itself. */
export function getTriggerAndPanelIds(
  navigationMenuId: string,
  value: string,
): { triggerId: string; panelId: string } {
  return navigationMenuIds(navigationMenuId, value);
}

/** Turns an id into a CSS `<custom-ident>`-safe fragment for use inside an
 * `anchor-name`. `deriveId`'s output carries React 18's colon-bracketed
 * `useId()` root (e.g. `:r0:-trigger-concepts`), and colons aren't valid
 * there — each character outside `[A-Za-z0-9_-]` becomes a hyphen instead. */
export function toAnchorIdentFragment(id: string): string {
  return id.replace(/[^A-Za-z0-9_-]/g, "-");
}

/** The `anchor-name` a disclosure trigger publishes, and the value the
 * shared Viewport's `position-anchor` targets once that trigger's panel is
 * open. Derived from the trigger's own id, so it stays unique per entry and
 * per `NavigationMenu.Root` instance without any extra bookkeeping. */
export function getTriggerAnchorName(triggerId: string): string {
  return `--primitiv-navigation-menu-trigger-${toAnchorIdentFragment(triggerId)}`;
}

/** Which way a panel is travelling as the open entry changes — the hook a
 * stylesheet needs to slide panels in the direction of the pointer rather than
 * cross-fading every switch. `from-*` is an entering panel, `to-*` a leaving
 * one, and the suffix is the side it moves from / toward. */
export type NavigationMenuPanelMotion =
  | "from-start"
  | "from-end"
  | "to-start"
  | "to-end";

/**
 * Derives a panel's motion from the disclosure-entry order (`itemValues`, in DOM
 * order) and which entry was open before.
 *
 * Returns `undefined` — meaning "no direction, just fade" — for the two cases
 * that genuinely have none: the first open (nothing to travel from) and the full
 * close (nothing to travel to). Also for an entry missing from the registry,
 * since a direction derived from an unknown position would be a guess.
 */
export function getPanelMotion({
  value,
  openValue,
  previousValue,
  itemValues,
}: {
  value: string;
  openValue: string;
  previousValue: string;
  itemValues: readonly string[];
}): NavigationMenuPanelMotion | undefined {
  return navigationMenuPanelMotion({ value, openValue, previousValue, values: itemValues });
}
