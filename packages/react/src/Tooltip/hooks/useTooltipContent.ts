import { useEffect, useRef } from "react";

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
  const { open, contentId, cancelGrace, closeImmediate } = useTooltipContext();
  const internalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      onEscapeKeyDown?.(event);
      if (event.defaultPrevented) return;
      closeImmediate();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onEscapeKeyDown, closeImmediate]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (internalRef.current?.contains(event.target as Node)) return;
      onPointerDownOutside?.(event);
      if (event.defaultPrevented) return;
      closeImmediate();
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open, onPointerDownOutside, closeImmediate]);

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

  return { getContentProps, internalRef };
}
