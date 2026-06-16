import { MouseEventHandler } from "react";
import { composeEventHandlers } from "../../Slot/index.ts";
import { DropdownTriggerProps } from "../types";
import { useDropdownContext } from "./useDropdownContext";

type UseDropdownTriggerArgs = {
  onClick?: MouseEventHandler;
  restProps: Omit<DropdownTriggerProps, "children" | "onClick" | "asChild">;
};

export function useDropdownTrigger({
  onClick,
  restProps,
}: UseDropdownTriggerArgs) {
  const { open, setOpen, contentId, triggerRef } = useDropdownContext();

  const toggle = () => setOpen(!open);

  const triggerProps = {
    ...restProps,
    ref: triggerRef,
    "aria-haspopup": "menu" as const,
    "aria-expanded": open,
    "aria-controls": contentId,
    onClick: composeEventHandlers(onClick, toggle),
  };

  return {
    triggerProps,
  };
}
