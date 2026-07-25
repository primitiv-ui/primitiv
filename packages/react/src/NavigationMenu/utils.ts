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
