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

  // What was open before the current value, so a panel can tell which way the
  // pointer travelled. Adjusted during render — the pattern React documents for
  // deriving state from a changed input — rather than in an effect: an effect
  // lands a frame late, by which time the panel has already begun animating with
  // no direction to animate in.
  const [trackedValue, setTrackedValue] = useState(openValue);
  // The seed is only ever fed to `itemValues.indexOf()`, which rejects "" and any
  // other unregistered string identically — so its value is unobservable. It has to
  // be "" rather than `openValue`, though: seeding it with the open value would give
  // a nav mounted with a `defaultValue` a spurious travel direction on first paint.
  // Stryker disable next-line StringLiteral: equivalent — see above.
  const [previousValue, setPreviousValue] = useState("");
  if (trackedValue !== openValue) {
    setPreviousValue(trackedValue);
    setTrackedValue(openValue);
  }

  const {
    register: registerEntry,
    itemsRef: entriesRef,
    keys: entryKeys,
  } = useCollection<string, HTMLElement>();

  // A second registry, keyed by the Item's own `value`. The entry registry above
  // can't serve this: it keys by a generated id because plain link entries join it
  // too and have no value. Registration order is mount order, which for siblings is
  // DOM order — so `itemValues` is the left-to-right order of the disclosure
  // entries, which is what a panel needs to know which way it is travelling.
  const {
    register: registerItem,
    itemsRef: itemElementsRef,
    keys: registeredValues,
  } = useCollection<string, HTMLLIElement>();

  // Sorted by document position, not registration order. `useCollection` keys are
  // insertion-ordered, which matches the DOM only while nothing changes: re-register
  // an entry (a `value` that changes) and its key is appended, so the order silently
  // stops describing the layout and panels slide the wrong way. Asking the DOM is the
  // only source that cannot drift.
  const itemValues = useMemo(
    () =>
      [...registeredValues].sort((a, b) => {
        // Non-null: `register` writes the element and the key in the same call, so a
        // key present in `registeredValues` always has a live element in the map —
        // the same invariant Tree's root relies on for its own registry reads.
        const first = itemElementsRef.current.get(a)!;
        const second = itemElementsRef.current.get(b)!;
        return first.compareDocumentPosition(second) &
          Node.DOCUMENT_POSITION_FOLLOWING
          ? -1
          : 1;
      }),
    [registeredValues, itemElementsRef],
  );

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
      previousValue,
      setOpenValue,
      openOnHover,
      openWithIntent,
      cancelOpen,
      registerEntry,
      entryKeys,
      registerItem,
      itemValues,
      focusEntry,
      viewport,
      registerViewport: setViewport,
    }),
    [
      orientation,
      dir,
      navigationMenuId,
      openValue,
      previousValue,
      setOpenValue,
      openOnHover,
      openWithIntent,
      cancelOpen,
      registerEntry,
      entryKeys,
      registerItem,
      itemValues,
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
