import { KeyboardEvent } from "react";

import { composeEventHandlers } from "../../Slot/index.ts";
import { useTooltipContext } from "../TooltipContext";
import type { TooltipTriggerProps } from "../types";

export function useTooltipTrigger({
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
  onKeyDown,
  ...rest
}: Omit<TooltipTriggerProps, "asChild"> = {}) {
  const {
    open,
    contentId,
    disableHoverableContent,
    openWithDelay,
    openImmediate,
    closeImmediate,
    closeWithGrace,
  } = useTooltipContext();

  function getTriggerProps() {
    return {
      ...rest,
      "aria-describedby": contentId,
      "data-state": (open ? "open" : "closed") as "open" | "closed",
      onPointerEnter: composeEventHandlers(onPointerEnter, openWithDelay),
      onPointerLeave: composeEventHandlers(
        onPointerLeave,
        disableHoverableContent ? closeImmediate : closeWithGrace,
      ),
      onFocus: composeEventHandlers(onFocus, openImmediate),
      onBlur: composeEventHandlers(onBlur, closeImmediate),
      onKeyDown: composeEventHandlers(onKeyDown, (e: KeyboardEvent<HTMLButtonElement>) => {
        if (e.key === "Escape") closeImmediate();
      }),
    };
  }

  return { getTriggerProps };
}
