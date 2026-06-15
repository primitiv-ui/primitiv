import { useEffect, useState } from "react";

import { TabsContentProps } from "../types";
import { getTriggerAndPanelIds } from "../utils";

import { useTabsContext } from "./index.ts";

export function useTabsContent({ value }: Pick<TabsContentProps, "value">) {
  const { orientation, activeValue, tabsId, lazyMount } = useTabsContext();
  const isActive = activeValue === value;
  const { triggerId, panelId } = getTriggerAndPanelIds(tabsId, value);
  const state = isActive ? "active" : "inactive";
  const tabIndex = isActive ? 0 : -1;

  // Track whether this panel has ever been active. Starts true for the
  // default active panel; flips once on first activation for all others.
  const [activated, setActivated] = useState(() => isActive);
  useEffect(() => {
    if (isActive) setActivated(true);
  }, [isActive]);

  // When lazyMount is off children always render; when on they render only
  // after the tab has been activated for the first time.
  const shouldRender = !lazyMount || activated;

  return { panelId, triggerId, orientation, isActive, state, tabIndex, shouldRender };
}
