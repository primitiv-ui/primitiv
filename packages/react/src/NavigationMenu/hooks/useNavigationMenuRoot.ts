import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

import { useCollection, useControllableState } from "../../hooks/index.ts";

import type {
  NavigationMenuContextValue,
  NavigationMenuRootProps,
} from "../types";
import { getTriggerAndPanelIds } from "../utils";

type UseNavigationMenuRootArgs = Pick<
  NavigationMenuRootProps,
  | "orientation"
  | "dir"
  | "openOnHover"
  | "delayDuration"
  | "closeDelay"
  | "defaultValue"
  | "value"
  | "onValueChange"
>;

export function useNavigationMenuRoot({
  orientation = "horizontal",
  dir = "ltr",
  openOnHover = true,
  delayDuration = 200,
  closeDelay = 150,
  defaultValue,
  value,
  onValueChange,
}: UseNavigationMenuRootArgs): {
  contextValue: NavigationMenuContextValue;
  cancelClose: () => void;
  closeWithDelay: () => void;
  handleKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
} {
  const navigationMenuId = useId();
  const [openValue, setOpenValue] = useControllableState<string>(
    value,
    defaultValue ?? "",
    onValueChange,
  );

  const {
    register: registerEntry,
    itemsRef: entriesRef,
    keys: entryKeys,
  } = useCollection<string, HTMLElement>();

  const focusEntry = useCallback(
    (key: string) => {
      entriesRef.current.get(key)?.focus();
    },
    [entriesRef],
  );

  // Held as state, not a ref, because Content has to re-render once the
  // viewport exists in order to portal into it. The Viewport hands its element
  // over in a ref callback, which React runs before paint — so the one commit
  // where Content still renders in place never reaches the screen.
  const [viewport, setViewport] = useState<HTMLDivElement | null>(null);
  const registerViewport = useCallback(
    (element: HTMLDivElement | null) => setViewport(element),
    [],
  );

  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // `openValue` is read inside callbacks that must not be re-created on every
  // open/close — a fresh `openWithIntent` identity would re-run the Trigger's
  // handlers. A ref keeps the reads current without widening the deps.
  const openValueRef = useRef(openValue);
  openValueRef.current = openValue;

  const cancelOpen = useCallback(() => {
    if (openTimerRef.current !== null) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const openWithIntent = useCallback(
    (next: string) => {
      cancelClose();
      cancelOpen();
      // Once one panel is open the nav is already "active", so crossing to a
      // sibling trigger swaps panels instantly — waiting again would feel
      // broken. The delay only guards the first open.
      if (openValueRef.current !== "" || delayDuration === 0) {
        setOpenValue(next);
        return;
      }
      openTimerRef.current = setTimeout(() => {
        openTimerRef.current = null;
        setOpenValue(next);
      }, delayDuration);
    },
    [cancelClose, cancelOpen, delayDuration, setOpenValue],
  );

  // Escape is handled once, at the `<nav>`, because it must work from anywhere
  // inside the menu — including from a link deep in an open panel — and
  // returning focus to the trigger is what stops the user being stranded on an
  // element that just went `hidden`.
  const closeAndRefocusTrigger = useCallback(() => {
    const value = openValueRef.current;
    if (value === "") return;
    cancelOpen();
    const { triggerId } = getTriggerAndPanelIds(navigationMenuId, value);
    document.getElementById(triggerId)?.focus();
    setOpenValue("");
  }, [cancelOpen, navigationMenuId, setOpenValue]);

  const closeWithDelay = useCallback(() => {
    cancelOpen();
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      setOpenValue("");
    }, closeDelay);
  }, [cancelOpen, closeDelay, setOpenValue]);

  useEffect(
    () => () => {
      cancelOpen();
      cancelClose();
    },
    [cancelOpen, cancelClose],
  );

  const contextValue = useMemo<NavigationMenuContextValue>(
    () => ({
      orientation,
      dir,
      navigationMenuId,
      openValue,
      setOpenValue,
      openOnHover,
      openWithIntent,
      cancelOpen,
      registerEntry,
      entryKeys,
      focusEntry,
      viewport,
      registerViewport,
    }),
    [
      orientation,
      dir,
      navigationMenuId,
      openValue,
      setOpenValue,
      openOnHover,
      openWithIntent,
      cancelOpen,
      registerEntry,
      entryKeys,
      focusEntry,
      viewport,
      registerViewport,
    ],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (event.key !== "Escape") return;
      closeAndRefocusTrigger();
    },
    [closeAndRefocusTrigger],
  );

  return { contextValue, cancelClose, closeWithDelay, handleKeyDown };
}
