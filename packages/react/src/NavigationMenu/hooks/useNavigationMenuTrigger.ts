import { useCallback } from "react";
import type { MouseEvent } from "react";

import { composeEventHandlers } from "../../Slot/index.ts";
import { useNavigationMenuContext } from "../NavigationMenuContext";
import type { NavigationMenuTriggerProps } from "../types";

import { useNavigationMenuEntry } from "./useNavigationMenuEntry";

export function useNavigationMenuTrigger({
  onClick,
}: Pick<NavigationMenuTriggerProps, "onClick">): {
  triggerId: string;
  panelId: string;
  open: boolean;
  state: "open" | "closed";
  handleClick: (event: MouseEvent<HTMLButtonElement>) => void;
} {
  const { setOpenValue } = useNavigationMenuContext();
  const { value, triggerId, panelId, open, state } = useNavigationMenuEntry();

  const toggle = useCallback(() => {
    setOpenValue(open ? "" : value);
  }, [open, setOpenValue, value]);

  const handleClick = composeEventHandlers<MouseEvent<HTMLButtonElement>>(
    onClick,
    toggle,
  );

  return { triggerId, panelId, open, state, handleClick };
}
