import { useCallback, useEffect, useId, useMemo, useRef } from "react";

import { useControllableState } from "../../hooks/index.ts";

import type {
  NavigationMenuContextValue,
  NavigationMenuRootProps,
} from "../types";

type UseNavigationMenuRootArgs = Pick<
  NavigationMenuRootProps,
  | "orientation"
  | "openOnHover"
  | "delayDuration"
  | "closeDelay"
  | "defaultValue"
  | "value"
  | "onValueChange"
>;

export function useNavigationMenuRoot({
  orientation = "horizontal",
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
} {
  const navigationMenuId = useId();
  const [openValue, setOpenValue] = useControllableState<string>(
    value,
    defaultValue ?? "",
    onValueChange,
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
      navigationMenuId,
      openValue,
      setOpenValue,
      openOnHover,
      openWithIntent,
      cancelOpen,
    }),
    [
      orientation,
      navigationMenuId,
      openValue,
      setOpenValue,
      openOnHover,
      openWithIntent,
      cancelOpen,
    ],
  );

  return { contextValue, cancelClose, closeWithDelay };
}
