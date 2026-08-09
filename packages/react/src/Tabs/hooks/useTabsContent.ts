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
  // The mount effect below sets `activated` for the active panel within the
  // same commit, so the initialiser's value is only ever observable as a
  // pre-effect first-paint flash (not reproducible in jsdom); for inactive
  // panels the initialiser's `false` and a mutated `undefined` are both falsy.
  // Stryker disable next-line ArrowFunction: equivalent under the test env — see above.
  const [activated, setActivated] = useState(() => isActive);
  useEffect(() => {
    if (isActive) setActivated(true);
  }, [isActive]);

  // When lazyMount is off children always render; when on they render only
  // after the tab has been activated for the first time.
  const shouldRender = !lazyMount || activated;

  return { panelId, triggerId, orientation, isActive, state, tabIndex, shouldRender };
}
