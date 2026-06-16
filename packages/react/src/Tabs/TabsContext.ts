import type { Context, Provider } from "react";
import { createStrictContext } from "../utils/index.ts";

import { TabsContextValue } from "./types";

const tabsContextPair = createStrictContext<TabsContextValue>(
  "Component must be rendered as a child of Tabs.Root",
  "TabsContext",
);

/** Strict React context carrying the {@link TabsContextValue} from `Tabs.Root`
 * to its descendants. `null` when read outside a `Tabs.Root`. */
export const TabsContext: Context<TabsContextValue | null> = tabsContextPair[0];
/** Reads the {@link TabsContextValue}; throws when used outside a `Tabs.Root`. */
export const useTabsContext: () => TabsContextValue = tabsContextPair[1];

/** Provider component for {@link TabsContext}, used by `Tabs.Root` to supply the
 * {@link TabsContextValue} to its descendants. */
const TabsProvider: Provider<TabsContextValue | null> = TabsContext.Provider;

export { TabsProvider };
