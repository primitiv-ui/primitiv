import { useId, useMemo } from "react";

import type {
  NavigationMenuContextValue,
  NavigationMenuRootProps,
} from "../types";

export function useNavigationMenuRoot({
  orientation = "horizontal",
}: Pick<NavigationMenuRootProps, "orientation">): {
  contextValue: NavigationMenuContextValue;
} {
  const navigationMenuId = useId();

  const contextValue = useMemo<NavigationMenuContextValue>(
    () => ({ orientation, navigationMenuId, openValue: "" }),
    [orientation, navigationMenuId],
  );

  return { contextValue };
}
