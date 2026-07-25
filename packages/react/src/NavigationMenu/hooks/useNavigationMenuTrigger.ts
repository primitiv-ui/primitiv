import { useCallback, useEffect, useRef } from "react";
import type { KeyboardEvent, MouseEvent, PointerEvent, RefObject } from "react";

import { composeEventHandlers } from "../../Slot/index.ts";
import { PANEL_FOCUSABLE_SELECTOR } from "../constants";
import { useNavigationMenuContext } from "../NavigationMenuContext";
import type { NavigationMenuTriggerProps } from "../types";

import { useNavigationMenuEntry } from "./useNavigationMenuEntry";
import { useNavigationMenuTopLevelEntry } from "./useNavigationMenuTopLevelEntry";

export function useNavigationMenuTrigger({
  onClick,
  onPointerEnter,
  onPointerLeave,
  onKeyDown,
}: Pick<
  NavigationMenuTriggerProps,
  "onClick" | "onPointerEnter" | "onPointerLeave" | "onKeyDown"
>): {
  triggerRef: RefObject<HTMLButtonElement | null>;
  triggerId: string;
  panelId: string;
  open: boolean;
  state: "open" | "closed";
  handleClick: (event: MouseEvent<HTMLButtonElement>) => void;
  handlePointerEnter: (event: PointerEvent<HTMLButtonElement>) => void;
  handlePointerLeave: (event: PointerEvent<HTMLButtonElement>) => void;
  handleKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
} {
  const {
    orientation,
    dir,
    setOpenValue,
    openOnHover,
    openWithIntent,
    cancelOpen,
  } = useNavigationMenuContext();
  const { value, triggerId, panelId, open, state } = useNavigationMenuEntry();
  const { entryRef: triggerRef, handleKeyDown: handleArrowKeyDown } =
    useNavigationMenuTopLevelEntry<HTMLButtonElement>();

  // What `open` was when the pointer arrived, or `undefined` when no pointer
  // is over the trigger. A pointer that comes to click first fires
  // `pointerenter`, which — with hover-to-open — opens the panel *before* the
  // click lands. Toggling against the live `open` would then close it again on
  // that same click. Toggling against the pre-hover value is what makes a
  // click mean "toggle what I saw", not "undo my own hover".
  const openOnPointerEnterRef = useRef<boolean | undefined>(undefined);

  const toggle = useCallback(() => {
    // A click is a decision, so it bypasses hover intent entirely — including
    // any open timer already ticking from the pointer that arrived to click.
    cancelOpen();
    const wasOpen = openOnPointerEnterRef.current ?? open;
    // Cleared so a second click on a still-hovered trigger toggles against
    // live state rather than replaying the stale arrival value.
    openOnPointerEnterRef.current = undefined;
    setOpenValue(wasOpen ? "" : value);
  }, [cancelOpen, open, setOpenValue, value]);

  const hoverOpen = useCallback(() => {
    openOnPointerEnterRef.current = open;
    if (openOnHover) openWithIntent(value);
  }, [open, openOnHover, openWithIntent, value]);

  const pointerLeave = useCallback(() => {
    openOnPointerEnterRef.current = undefined;
    cancelOpen();
  }, [cancelOpen]);

  // The arrow that "goes into" the panel is the one pointing across the list's
  // axis: down out of a horizontal bar, sideways out of a vertical rail (and
  // that sideways key mirrors under RTL).
  const enterPanelKey =
    orientation === "horizontal"
      ? "ArrowDown"
      : dir === "rtl"
        ? "ArrowLeft"
        : "ArrowRight";

  // Focus can only land in the panel once it has actually rendered unhidden, so
  // the keypress records the intent and this effect spends it.
  const enterPanelPendingRef = useRef(false);
  useEffect(() => {
    if (!enterPanelPendingRef.current || !open) return;
    enterPanelPendingRef.current = false;
    document
      .getElementById(panelId)
      ?.querySelector<HTMLElement>(PANEL_FOCUSABLE_SELECTOR)
      ?.focus();
  }, [open, panelId]);

  const enterPanel = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key !== enterPanelKey) return;
      event.preventDefault();
      cancelOpen();
      enterPanelPendingRef.current = true;
      // Already-open panels never re-run the effect (`open` doesn't change), so
      // move focus straight away in that case.
      if (open) {
        enterPanelPendingRef.current = false;
        document
          .getElementById(panelId)
          ?.querySelector<HTMLElement>(PANEL_FOCUSABLE_SELECTOR)
          ?.focus();
        return;
      }
      setOpenValue(value);
    },
    [cancelOpen, enterPanelKey, open, panelId, setOpenValue, value],
  );

  const handleClick = composeEventHandlers<MouseEvent<HTMLButtonElement>>(
    onClick,
    toggle,
  );
  const handlePointerEnter = composeEventHandlers<
    PointerEvent<HTMLButtonElement>
  >(onPointerEnter, hoverOpen);
  const handlePointerLeave = composeEventHandlers<
    PointerEvent<HTMLButtonElement>
  >(onPointerLeave, pointerLeave);
  // enterPanel runs first and claims its arrow with preventDefault; the travel
  // keymap only sees keys it left alone.
  const handleKeyDown = composeEventHandlers<KeyboardEvent<HTMLButtonElement>>(
    onKeyDown,
    composeEventHandlers<KeyboardEvent<HTMLButtonElement>>(
      enterPanel,
      handleArrowKeyDown,
    ),
  );

  return {
    triggerRef,
    triggerId,
    panelId,
    open,
    state,
    handleClick,
    handlePointerEnter,
    handlePointerLeave,
    handleKeyDown,
  };
}
