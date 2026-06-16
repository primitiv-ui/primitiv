import type { Context } from "react";
import { createStrictContext } from "../utils/index.ts";

import { TabsContextValue } from "./types";

const tabsContextPair = createStrictContext<TabsContextValue>(
  "Component must be rendered as a child of Tabs.Root",
  "TabsContext",
);

export const TabsContext: Context<TabsContextValue | null> = tabsContextPair[0];
export const useTabsContext: () => TabsContextValue = tabsContextPair[1];

const TabsProvider = TabsContext.Provider;

export { TabsProvider };
