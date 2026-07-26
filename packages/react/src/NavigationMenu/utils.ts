import { deriveId } from "../utils/index.ts";

/** Derives the paired trigger / panel ids for one entry, so `aria-controls`
 * and `aria-labelledby` line up without either side constructing the
 * template literal itself. */
export function getTriggerAndPanelIds(
  navigationMenuId: string,
  value: string,
): { triggerId: string; panelId: string } {
  return {
    triggerId: deriveId(navigationMenuId, "trigger", value),
    panelId: deriveId(navigationMenuId, "panel", value),
  };
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
 * Derives a panel's motion from the entry order and which entry was open before.
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
  entryKeys,
}: {
  value: string;
  openValue: string;
  previousValue: string;
  entryKeys: readonly string[];
}): NavigationMenuPanelMotion | undefined {
  const opening = value !== "" && value === openValue;
  const closing = value !== "" && value === previousValue;
  // A panel that is neither the current nor the outgoing one is a bystander.
  if (!opening && !closing) return undefined;

  const selfIndex = entryKeys.indexOf(value);
  if (selfIndex === -1) return undefined;

  if (opening) {
    const fromIndex = entryKeys.indexOf(previousValue);
    if (fromIndex === -1) return undefined;
    // Travelling toward the end means the new panel arrives from the end side.
    return fromIndex < selfIndex ? "from-end" : "from-start";
  }

  const toIndex = entryKeys.indexOf(openValue);
  if (toIndex === -1) return undefined;
  // The outgoing panel leaves opposite the direction of travel.
  return toIndex > selfIndex ? "to-start" : "to-end";
}
