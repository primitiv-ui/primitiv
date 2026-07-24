import { KeyboardEvent, KeyboardEventHandler, useEffect, useRef } from "react";

import { composeEventHandlers } from "../../Slot/index.ts";
import { useSelectContext } from "../SelectContext";
import type { SelectContentProps } from "../types";

type UseSelectContentArgs = {
  onKeyDown?: KeyboardEventHandler<HTMLDivElement>;
  restProps: Omit<SelectContentProps, "children" | "onKeyDown" | "asChild">;
};

/**
 * Drives the listbox popover for the rich Select. Opens/closes the native
 * Popover in sync with context `open`, moves focus into the listbox on
 * open, syncs React state when the browser light-dismisses (the `toggle`
 * event), and closes on Escape — returning focus to the trigger.
 */
export function useSelectContent({ onKeyDown, restProps }: UseSelectContentArgs) {
  const { open, setOpen, contentId, triggerRef } = useSelectContext();
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const list = listRef.current!;
    if (open) {
      list.showPopover();
      list.focus();
    } else {
      try {
        list.hidePopover();
      } catch {
        /* already hidden — no-op (e.g. browser already light-dismissed) */
      }
    }
  }, [open]);

  useEffect(() => {
    const list = listRef.current!;
    const handleToggle = (event: Event) => {
      if ((event as ToggleEvent).newState === "closed") setOpen(false);
    };
    list.addEventListener("toggle", handleToggle);
    return () => list.removeEventListener("toggle", handleToggle);
  }, [setOpen]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    }
  };

  const contentProps = {
    ...restProps,
    ref: listRef,
    id: contentId,
    role: "listbox" as const,
    tabIndex: -1,
    popover: "auto" as const,
    onKeyDown: composeEventHandlers(onKeyDown, handleKeyDown),
  };

  return { contentProps };
}
