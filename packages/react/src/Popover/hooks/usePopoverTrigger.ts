import { MouseEventHandler, Ref } from "react";

import { composeEventHandlers, composeRefs } from "../../Slot/index.ts";
import { PopoverTriggerProps } from "../types";
import { usePopoverContext } from "../PopoverContext";

export function usePopoverTrigger({
  ref,
  onClick,
  asChild = false,
  ...rest
}: Omit<PopoverTriggerProps, "children">) {
  const { open, setOpen, triggerRef, contentId } = usePopoverContext();
  const composedRef = ref
    ? composeRefs(triggerRef, ref as Ref<HTMLButtonElement>)
    : triggerRef;

  const toggle = () => setOpen(!open);

  const triggerProps = {
    ref: composedRef,
    "aria-haspopup": "dialog" as const,
    "aria-expanded": open,
    "aria-controls": contentId,
    onClick: composeEventHandlers(
      onClick as MouseEventHandler | undefined,
      toggle,
    ),
    ...rest,
  };

  return { triggerProps };
}
