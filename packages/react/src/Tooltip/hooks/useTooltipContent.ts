import { useEffect } from "react";

import { composeEventHandlers } from "../../Slot/index.ts";
import { useTooltipContext } from "../TooltipContext";
import type { TooltipContentProps } from "../types";

export function useTooltipContent({
  onEscapeKeyDown,
  onPointerDownOutside,
  onPointerEnter,
  onPointerLeave,
  ...rest
}: Omit<TooltipContentProps, "forceMount"> = {}) {
  const {
    open,
    contentId,
    cancelGrace,
    closeImmediate,
    controller,
    contentRef,
    contentCallbacksRef,
  } = useTooltipContext();
  // The controller reads the dismissal callbacks through this ref, so it
  // always sees the current render's.
  contentCallbacksRef.current = { onEscapeKeyDown, onPointerDownOutside };

  // Escape and a press outside dismiss it while the content is open, through
  // the shared controller: it listens once open and stops as it closes, and
  // the root's unmount stops it too.
  useEffect(() => {
    controller.sync();
  }, [open, controller]);

  function getContentProps() {
    return {
      ...rest,
      id: contentId,
      role: "tooltip" as const,
      "data-state": (open ? "open" : "closed") as "open" | "closed",
      onPointerEnter: composeEventHandlers(onPointerEnter, cancelGrace),
      onPointerLeave: composeEventHandlers(onPointerLeave, closeImmediate),
    };
  }

  return { getContentProps, internalRef: contentRef };
}
