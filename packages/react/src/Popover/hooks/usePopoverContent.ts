import { useEffect, useRef } from "react";

import { usePopoverContext } from "../PopoverContext";

export function usePopoverContent() {
  const { open, contentId } = usePopoverContext();
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const content = contentRef.current!;
    if (open) {
      content.showPopover();
    } else {
      try {
        content.hidePopover();
      } catch {
        // already hidden — no-op (e.g. browser already light-dismissed it)
      }
    }
  }, [open]);

  const contentProps = {
    ref: contentRef,
    id: contentId,
    role: "dialog" as const,
    popover: "auto" as const,
    "data-state": (open ? "open" : "closed") as "open" | "closed",
  };

  return { contentProps };
}
