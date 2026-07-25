import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

import { useCollection, useControllableState } from "../../hooks/index.ts";

import type {
  NavigationMenuContextValue,
  NavigationMenuOrientation,
  NavigationMenuReadingDirection,
  NavigationMenuRootProps,
} from "../types";
import { getTriggerAndPanelIds } from "../utils";

/** The presentation props arrive **resolved**: `NavigationMenu.Root` applies
 * its own documented defaults (and inherits `dir` from `DirectionProvider`)
 * before calling the hook, so they are required here rather than defaulted a
 * second time — one set of defaults, in the place consumers read them from. */
type UseNavigationMenuRootArgs = {
  orientation: NavigationMenuOrientation;
  dir: NavigationMenuReadingDirection;
  openOnHover: boolean;
  delayDuration: number;
  closeDelay: number;
} & Pick<
  NavigationMenuRootProps,
  "defaultValue" | "value" | "onValueChange"
>;

export function useNavigationMenuRoot({
  orientation,
  dir,
  openOnHover,
  delayDuration,
  closeDelay,
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
      // `key` only ever arrives from `entryKeys`, and `useCollection`'s
      // register() writes `entriesRef` and the `keys` state in the same call —
      // so a key that reaches here always has a live element in the map.
      // Stryker disable next-line OptionalChaining: unreachable given that invariant.
      entriesRef.current.get(key)?.focus();
    },
    // `entriesRef` is a stable RefObject, so emptying this array yields the
    // identical memoised function.
    // Stryker disable next-line ArrayDeclaration: equivalent — stable dependency.
    [entriesRef],
  );

  // Held as state, not a ref, because Content has to re-render once the
  // viewport exists in order to portal into it. The Viewport hands its element
  // over in a ref callback, which React runs before paint — so the one commit
  // where Content still renders in place never reaches the screen. `setViewport`
  // *is* the registrar: it already has the ref-callback signature and a stable
  // identity, so wrapping it would only add indirection.
  const [viewport, setViewport] = useState<HTMLDivElement | null>(null);

  // `undefined` rather than `null` for "no timer pending", because
  // `clearTimeout(undefined)` is a spec'd no-op — cancelling is then one
  // unconditional clear instead of a guarded one, with nothing to get wrong.
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  // `openValue` is read inside callbacks that must not be re-created on every
  // open/close — a fresh `openWithIntent` identity would re-run the Trigger's
  // handlers. A ref keeps the reads current without widening the deps.
  const openValueRef = useRef(openValue);
  openValueRef.current = openValue;

  const cancelOpen = useCallback(
    () => {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = undefined;
    },
    // Stryker's only mutation of an empty dependency array is
    // `["Stryker was here"]` — a string literal React compares `===`-equal on
    // every render, so the memoised identity is unchanged either way.
    // Stryker disable next-line ArrayDeclaration: equivalent — no dependency to freeze.
    [],
  );

  const cancelClose = useCallback(
    () => {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = undefined;
    },
    // Stryker disable next-line ArrayDeclaration: equivalent — no dependency to freeze (see cancelOpen).
    [],
  );

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
        openTimerRef.current = undefined;
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
      closeTimerRef.current = undefined;
      setOpenValue("");
    }, closeDelay);
  }, [cancelOpen, closeDelay, setOpenValue]);

  useEffect(
    () => () => {
      cancelOpen();
      cancelClose();
    },
    // Both are `useCallback(…, [])`, so their identities are fixed for the
    // component's lifetime: emptying this array subscribes the cleanup exactly
    // once either way.
    // Stryker disable next-line ArrayDeclaration: equivalent — stable dependencies.
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
      registerViewport: setViewport,
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
