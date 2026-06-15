import { useRef, useEffect, useMemo, KeyboardEventHandler } from "react";
import { composeEventHandlers } from "../../Slot/index.ts";
import { MENUITEM_SELECTOR, TYPEAHEAD_RESET_MS } from "../constants";
import { useDropdownContext } from "./useDropdownContext";
import { DropdownContentProps } from "../types";

type UseDropdownContentArgs = {
  onKeyDown?: KeyboardEventHandler;
  restProps: Omit<DropdownContentProps, "children" | "onKeyDown" | "asChild">;
};

export function useDropdownContent({
  onKeyDown,
  restProps,
}: UseDropdownContentArgs) {
  const { open, setOpen, contentId, triggerRef } = useDropdownContext();
  const menuRef = useRef<HTMLMenuElement | null>(null);
  const typeaheadRef = useRef<{ query: string; timer: number | null }>({
    query: "",
    timer: null,
  });

  useEffect(() => {
    const menu = menuRef.current!;
    if (open) {
      menu.showPopover();
      if (!menu.contains(document.activeElement)) {
        const firstItem = menu.querySelector<HTMLElement>(MENUITEM_SELECTOR);
        firstItem?.focus();
      }
    } else {
      try {
        menu.hidePopover();
      } catch {
        // already hidden — no-op (e.g. browser already light-dismissed it)
      }
    }
  }, [open]);

  // Sync React state when the browser closes the popover without our code
  // doing it (real-browser ToggleEvent on light-dismiss or native Escape).
  useEffect(() => {
    const menu = menuRef.current!;
    const handleToggle = (event: Event) => {
      if ((event as ToggleEvent).newState === "closed") setOpen(false);
    };
    menu.addEventListener("toggle", handleToggle);
    return () => menu.removeEventListener("toggle", handleToggle);
  }, [setOpen]);

  // Close on clicks outside the popover (belt-and-suspenders for environments
  // where the native toggle event is not dispatched on light-dismiss, e.g.
  // jsdom). Attached only while open. Clicks on the trigger are ignored —
  // the trigger's own onClick already decides whether to open or close, and
  // if this listener handled the trigger too it would immediately close the
  // popover on the opening click (React 19 can flush the opening commit's
  // effects synchronously, so the listener is already attached by the time
  // the click bubbles up to the document). Clicks inside any [popover] are
  // ignored so nested sub-menus don't close their parent.
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

  const handleKeyDown = (event: React.KeyboardEvent<HTMLMenuElement>) => {
    const menu = menuRef.current!;
    // Sub-menus mount their own [popover] inside this menu's subtree, so a
    // naive querySelectorAll would also pick up items in nested
    // SubContents — items the user can't focus while the sub is closed
    // (display:none) and shouldn't reach by arrow key while it's open. Scope
    // to the popover holding focus, then drop anything that lives in a
    // deeper popover (a closed sub at this same level).
    const focused = document.activeElement as HTMLElement | null;
    const scope = (focused?.closest("[popover]") as HTMLElement | null) ?? menu;
    const items = Array.from(
      scope.querySelectorAll<HTMLElement>(MENUITEM_SELECTOR),
    ).filter((el) => el.closest("[popover]") === scope);
    if (items.length === 0) return;
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);

    let nextIndex: number | null = null;
    if (event.key === "ArrowDown") {
      nextIndex = (currentIndex + 1) % items.length;
    } else if (event.key === "ArrowUp") {
      nextIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = items.length - 1;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      items[nextIndex].focus();
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      if (currentIndex < 0) return;
      event.preventDefault();
      items[currentIndex].click();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }

    if (event.key.length === 1 && event.key !== " ") {
      const state = typeaheadRef.current;
      if (state.timer !== null) window.clearTimeout(state.timer);
      state.query = (state.query + event.key).toLowerCase();
      state.timer = window.setTimeout(() => {
        state.query = "";
        state.timer = null;
      }, TYPEAHEAD_RESET_MS);

      const isRepeat =
        state.query.length > 1 &&
        state.query.split("").every((c) => c === state.query[0]);
      const searchQuery = isRepeat ? state.query[0] : state.query;
      const startIndex = currentIndex < 0 ? 0 : currentIndex;
      const offset = searchQuery.length === 1 || isRepeat ? 1 : 0;
      for (let i = 0; i < items.length; i++) {
        const index = (startIndex + offset + i) % items.length;
        const text = items[index].textContent!.trim().toLowerCase();
        if (text.startsWith(searchQuery)) {
          event.preventDefault();
          items[index].focus();
          return;
        }
      }
    }
  };

  const closeOpenSubRef = useRef<(() => void) | null>(null);
  const contentContextValue = useMemo(() => ({ closeOpenSubRef }), []);

  const contentProps = {
    ...restProps,
    ref: menuRef,
    id: contentId,
    role: "menu" as const,
    popover: "auto" as const,
    onKeyDown: composeEventHandlers(onKeyDown, handleKeyDown),
  };

  return {
    contentContextValue,
    contentProps,
  };
}
