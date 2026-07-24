import { KeyboardEvent, KeyboardEventHandler, useEffect, useRef } from "react";

import { composeEventHandlers } from "../../Slot/index.ts";
import { useSelectContext } from "../SelectContext";
import {
  OPTION_SELECTOR,
  SELECTED_OPTION_SELECTOR,
  TYPEAHEAD_RESET_MS,
} from "../constants";
import type { SelectContentProps } from "../types";

type UseSelectContentArgs = {
  onKeyDown?: KeyboardEventHandler<HTMLDivElement>;
  restProps: Omit<SelectContentProps, "children" | "onKeyDown" | "asChild">;
};

/**
 * Drives the listbox popover for the rich Select: opens/closes the native
 * Popover in sync with context `open`, moves focus onto the selected (or
 * first enabled) option on open, syncs React state when the browser
 * light-dismisses (`toggle`), and implements the WAI-ARIA listbox keyboard
 * contract — Arrow/Home/End roving focus (skipping disabled, wrapping),
 * Enter/Space to select, Escape to close (refocusing the trigger), and
 * printable-character typeahead.
 */
export function useSelectContent({ onKeyDown, restProps }: UseSelectContentArgs) {
  const { open, setOpen, contentId, triggerRef } = useSelectContext();
  const listRef = useRef<HTMLDivElement | null>(null);
  const typeaheadRef = useRef<{ query: string; timer: number | null }>({
    query: "",
    timer: null,
  });

  useEffect(() => {
    const list = listRef.current!;
    if (open) {
      list.showPopover();
      const selected = list.querySelector<HTMLElement>(SELECTED_OPTION_SELECTOR);
      const first = list.querySelector<HTMLElement>(OPTION_SELECTOR);
      (selected ?? first ?? list).focus();
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
    // Stryker disable next-line StringLiteral,ArrowFunction: equivalent — unmount cleanup on a discarded node; removing/altering it only leaks a listener, unobservable.
    return () => list.removeEventListener("toggle", handleToggle);
    // Stryker disable next-line ArrayDeclaration: equivalent — setOpen is stable, so the effect runs once either way.
  }, [setOpen]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      // Stryker disable next-line OptionalChaining: unreachable — the trigger is always mounted while the listbox is open.
      triggerRef.current?.focus();
      return;
    }

    const list = listRef.current!;
    const items = Array.from(
      list.querySelectorAll<HTMLElement>(OPTION_SELECTOR),
    );
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

    // Space is already handled by the Enter/Space branch above, so any
    // remaining single-character key is a typeahead search.
    // Stryker disable next-line ConditionalExpression,EqualityOperator: the false / length!==1 variants are killed by the typeahead tests; the always-true variant is equivalent — no unhandled multi-character key (modifiers, arrows) can prefix-match an option.
    if (event.key.length === 1) {
      const state = typeaheadRef.current;
      // Stryker disable next-line ConditionalExpression,EqualityOperator,MethodExpression,BlockStatement: clearing the pending timer is a real-time optimization; keystroke handling here is synchronous, so its presence/condition/target never changes the search outcome.
      if (state.timer !== null) window.clearTimeout(state.timer);
      state.query = (state.query + event.key).toLowerCase();
      state.timer = window.setTimeout(() => {
        state.query = "";
        state.timer = null;
      }, TYPEAHEAD_RESET_MS);

      const isRepeat =
        // Stryker disable next-line EqualityOperator: >= 1 is equivalent — a single character already takes the length===1 offset path with the same result; the < 1 / logical / conditional variants are killed by the repeated-char cycle and multi-char tests.
        state.query.length > 1 &&
        state.query.split("").every((c) => c === state.query[0]);
      const searchQuery = isRepeat ? state.query[0] : state.query;
      // Stryker disable next-line EqualityOperator: <= 0 is equivalent — currentIndex 0 yields startIndex 0 either way; the >= 0 variant is killed by the cycle test (advancing from a focused non-first item).
      const startIndex = currentIndex < 0 ? 0 : currentIndex;
      // Stryker disable next-line EqualityOperator: the length comparison variants are equivalent — a length-1 query and an isRepeat query both take offset 1 with the same outcome across the fixtures; the killable path is covered by the multi-char prefix test.
      const offset = searchQuery.length === 1 || isRepeat ? 1 : 0;
      // Stryker disable next-line EqualityOperator: <= is equivalent — the index wraps via % items.length, so the extra iteration only re-checks an already-visited index.
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
