import { useRef, useEffect } from "react";

import { tabsTabStop } from "@primitiv-ui/core";

import { TabsTriggerProps } from "../types";
import { getTriggerAndPanelIds } from "../utils";

import { useTabsContext } from "./useTabsContext";

/**
 * The render half of a trigger: its ids, state and roving tab stop, and its
 * registration in the root's collection. Clicks and key presses are not handled
 * here — the root's TabsController (from `@primitiv-ui/web`) owns Tabs' DOM
 * behaviour for every surface (RFC 0033 §3.4). A consumer `onClick` or
 * `onKeyDown` is therefore just a prop on the rendered element, and runs after
 * the controller's native listener on the root.
 */
export function useTabsTrigger({
  value,
  disabled,
}: Pick<TabsTriggerProps, "value" | "disabled">) {
  const { orientation, activeValue, tabsId, registerTrigger, triggerValues } = useTabsContext();
  const isActive = activeValue === value;
  const { triggerId, panelId } = getTriggerAndPanelIds(tabsId, value);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const state = isActive ? "active" : "inactive";
  // The roving tab stop is Tabs policy, shared with every surface through
  // @primitiv-ui/core (RFC 0033 §3.1): the active tab, or the first registered
  // trigger while none is active, so the tablist stays reachable by keyboard.
  const tabIndex = tabsTabStop({ values: triggerValues, active: activeValue }) === value ? 0 : -1;

  useEffect(() => {
    registerTrigger(value, buttonRef.current, disabled);
    return () => registerTrigger(value, null);
  }, [value, disabled, registerTrigger]);

  return {
    buttonRef,
    triggerId,
    panelId,
    isActive,
    orientation,
    state,
    tabIndex,
  };
}
