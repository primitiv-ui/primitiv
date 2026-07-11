import { Ref } from "react";

import { composeRefs } from "../../Slot/index.ts";
import { PopoverTriggerProps } from "../types";
import { usePopoverContext } from "../PopoverContext";

export function usePopoverTrigger({
  ref,
  asChild = false,
  ...rest
}: Omit<PopoverTriggerProps, "children">) {
  const { open, triggerRef, contentId } = usePopoverContext();
  const composedRef = ref
    ? composeRefs(triggerRef, ref as Ref<HTMLButtonElement>)
    : triggerRef;

  const triggerProps = {
    ref: composedRef,
    "aria-haspopup": "dialog" as const,
    "aria-expanded": open,
    "aria-controls": contentId,
    ...rest,
  };

  return { triggerProps };
}
