import {
  KeyboardEvent,
  KeyboardEventHandler,
  Ref,
  useEffect,
  useRef,
} from "react";

import { composeEventHandlers, composeRefs } from "../../Slot/index.ts";
import { FOCUSABLE_SELECTOR } from "../constants";
import { usePopoverContext } from "../PopoverContext";

type UsePopoverContentArgs = {
  onKeyDown?: KeyboardEventHandler<HTMLDivElement>;
  ref?: Ref<HTMLDivElement>;
};

export function usePopoverContent({
  onKeyDown,
  ref,
}: UsePopoverContentArgs = {}) {
  const { open, setOpen, contentId, triggerRef, titleId, descriptionId } =
    usePopoverContext();
  const contentRef = useRef<HTMLDivElement | null>(null);
  const composedRef = ref ? composeRefs(contentRef, ref) : contentRef;

  useEffect(() => {
    const content = contentRef.current!;
    if (open) {
      content.showPopover();
      // Move focus into the popover (WAI-ARIA non-modal dialog): the first
      // focusable descendant, or the content itself (it carries tabIndex=-1).
      const focusable = content.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      (focusable ?? content).focus();
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

  // Close on clicks outside the popover. This is only a fallback for
  // environments WITHOUT the native Popover API (e.g. jsdom): a real browser
  // already light-dismisses an `auto` popover on an outside click and fires the
  // `toggle` event we sync above. Running this listener in a real browser is
  // not just redundant — React 19 can flush this effect synchronously inside
  // the very click that opened the popover from an external control, so the
  // listener would catch that click and immediately re-close it. Gate it to
  // non-native environments; `"popover" in HTMLElement.prototype` is true only
  // where the native API (and its own light-dismiss) exists.
  useEffect(() => {
    if (!open) return;
    if ("popover" in HTMLElement.prototype) return;
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
    ref: composedRef,
    id: contentId,
    role: "dialog" as const,
    popover: "auto" as const,
    tabIndex: -1,
    "aria-labelledby": titleId,
    "aria-describedby": descriptionId,
    "data-state": (open ? "open" : "closed") as "open" | "closed",
    onKeyDown: composeEventHandlers(onKeyDown, handleKeyDown),
  };

  return { contentProps };
}
