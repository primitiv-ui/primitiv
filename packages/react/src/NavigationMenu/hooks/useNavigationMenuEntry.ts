import {
  useNavigationMenuContext,
  useNavigationMenuItemContext,
} from "../NavigationMenuContext";
import { getTriggerAndPanelIds } from "../utils";

/**
 * Resolves everything a Trigger and its Content both need: the entry's value
 * (from the enclosing Item), the paired ids, and whether this entry is the
 * open one. Keeping it in one place is what guarantees the two sides agree on
 * the ids they cross-reference.
 */
export function useNavigationMenuEntry(): {
  value: string;
  triggerId: string;
  panelId: string;
  open: boolean;
  state: "open" | "closed";
} {
  const { navigationMenuId, openValue } = useNavigationMenuContext();
  const { value: itemValue } = useNavigationMenuItemContext();
  const value = itemValue ?? "";
  const { triggerId, panelId } = getTriggerAndPanelIds(navigationMenuId, value);
  const open = openValue !== "" && openValue === value;

  return { value, triggerId, panelId, open, state: open ? "open" : "closed" };
}
