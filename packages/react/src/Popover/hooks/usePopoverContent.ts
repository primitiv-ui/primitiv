import { KeyboardEvent, KeyboardEventHandler, useEffect, useRef } from "react";

import { composeEventHandlers } from "../../Slot/index.ts";
import { usePopoverContext } from "../PopoverContext";

type UsePopoverContentArgs = {
  onKeyDown?: KeyboardEventHandler<HTMLDivElement>;
};

export function usePopoverContent({ onKeyDown }: UsePopoverContentArgs = {}) {
  const { open, setOpen, contentId, triggerRef } = usePopoverContext();
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

  // Sync React state when the browser closes the popover without our code
  // doing it (real-browser ToggleEvent on light-dismiss or native Escape).
  useEffect(() => {
    const content = contentRef.current!;
    const handleToggle = (event: Event) => {
      if ((event as ToggleEvent).newState === "closed") setOpen(false);
    };
    content.addEventListener("toggle", handleToggle);
    return () => content.removeEventListener("toggle", handleToggle);
  }, [setOpen]);

  // Close on clicks outside the popover (belt-and-suspenders for environments
  // where the native toggle event is not dispatched on light-dismiss, e.g.
  // jsdom). Attached only while open. Clicks on the trigger are ignored — the
  // trigger's own onClick already decides open/close, and handling it here too
  // would immediately re-close on the opening click. Clicks inside any
  // [popover] are ignored so the content itself doesn't dismiss.
  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Element;
      if (triggerRef.current?.contains(target)) return;
      if (target.closest?.("[popover]")) return;
      setOpen(false);
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [open, setOpen, triggerRef]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    }
  };

  const contentProps = {
    ref: contentRef,
    id: contentId,
    role: "dialog" as const,
    popover: "auto" as const,
    "data-state": (open ? "open" : "closed") as "open" | "closed",
    onKeyDown: composeEventHandlers(onKeyDown, handleKeyDown),
  };

  return { contentProps };
}
