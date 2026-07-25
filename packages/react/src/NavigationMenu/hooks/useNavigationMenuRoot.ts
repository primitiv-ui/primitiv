import { useId, useMemo } from "react";

import { useControllableState } from "../../hooks/index.ts";

import type {
  NavigationMenuContextValue,
  NavigationMenuRootProps,
} from "../types";

type UseNavigationMenuRootArgs = Pick<
  NavigationMenuRootProps,
  "orientation" | "defaultValue" | "value" | "onValueChange"
>;

export function useNavigationMenuRoot({
  orientation = "horizontal",
  defaultValue,
  value,
  onValueChange,
}: UseNavigationMenuRootArgs): {
  contextValue: NavigationMenuContextValue;
} {
  const navigationMenuId = useId();
  const [openValue, setOpenValue] = useControllableState<string>(
    value,
    defaultValue ?? "",
    onValueChange,
  );

  const contextValue = useMemo<NavigationMenuContextValue>(
    () => ({ orientation, navigationMenuId, openValue, setOpenValue }),
    [orientation, navigationMenuId, openValue, setOpenValue],
  );

  return { contextValue };
}
