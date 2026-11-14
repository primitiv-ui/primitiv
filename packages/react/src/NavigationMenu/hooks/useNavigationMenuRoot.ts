import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { CSSProperties, FocusEvent, KeyboardEvent } from "react";

import { NavigationMenuController } from "@primitiv-ui/web";

import { useCollection, useControllableState } from "../../hooks/index.ts";

import type {
  NavigationMenuContextValue,
  NavigationMenuOrientation,
  NavigationMenuReadingDirection,
  NavigationMenuRootProps,
} from "../types";
import { getTriggerAnchorName, getTriggerAndPanelIds } from "../utils";

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
  closeOnFocusOutside: (event: FocusEvent<HTMLElement>) => void;
  handleKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  /** Publishes the open entry's trigger `anchor-name` as
   * `--primitiv-navigation-menu-active-trigger-anchor`, so the shared
   * Viewport's `position-anchor` can target whichever trigger is open. Unset
   * (dropped by React) while nothing is open. */
  style: CSSProperties;
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

  const { register: registerEntry, itemsRef: entriesRef } = useCollection<
    string,
    HTMLElement
  >();

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

  // Held as state, not a ref, because Content has to re-render once the
  // viewport exists in order to portal into it. The Viewport hands its element
  // over in a ref callback, which React runs before paint — so the one commit
  // where Content still renders in place never reaches the screen. `setViewport`
  // *is* the registrar: it already has the ref-callback signature and a stable
  // identity, so wrapping it would only add indirection.
  const [viewport, setViewport] = useState<HTMLDivElement | null>(null);

  // ── The adapter (RFC 0033 §3.4, D28) ────────────────────────────────────
  // Click-to-toggle, hover intent, the travel and enter-panel keys, Escape and
  // focus leaving run in the web implementation's NavigationMenuController,
  // the same code the <primitiv-navigation-menu> elements run. React keeps
  // wiring each part's events, composed with its consumers' handlers as
  // before, and keeps the state; the controller reads it through `latest`.
  const snapshot = {
    openValue,
    orientation,
    dir,
    openOnHover,
    delayDuration,
    closeDelay,
    setOpenValue,
  };
  const latest = useRef(snapshot);
  latest.current = snapshot;
  const controllerRef = useRef<NavigationMenuController | null>(null);
  controllerRef.current ??= new NavigationMenuController({
    state: () => ({
      value: latest.current.openValue,
      orientation: latest.current.orientation,
      dir: latest.current.dir,
      openOnHover: latest.current.openOnHover,
      delay: latest.current.delayDuration,
      closeDelay: latest.current.closeDelay,
    }),
    change: (next) => latest.current.setOpenValue(next),
    trigger: (entry) =>
      document.getElementById(getTriggerAndPanelIds(navigationMenuId, entry).triggerId),
    panel: (entry) =>
      document.getElementById(getTriggerAndPanelIds(navigationMenuId, entry).panelId),
    // `useCollection` keys follow registration, not the layout, so ask the DOM.
    entries: () =>
      [...entriesRef.current.values()].sort((a, b) =>
        a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
      ),
  });
  const controller = controllerRef.current;

  // The enter-panel arrow can only focus into a panel once it has rendered
  // unhidden, so the controller spends that intent here, after the commit.
  useEffect(() => {
    controller.sync();
  }, [controller, openValue]);

  // Its timers are raw `setTimeout`s: cancel them as the nav unmounts.
  useEffect(
    () => () => controller.disconnect(),
    // Stryker disable next-line ArrayDeclaration: equivalent — the controller is created once, so any constant dependency list runs this once per mount.
    [],
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
      controller,
      registerEntry,
      registerItem,
      itemValues,
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
      controller,
      registerEntry,
      registerItem,
      itemValues,
      viewport,
    ],
  );

  const style = {
    "--primitiv-navigation-menu-active-trigger-anchor":
      openValue === ""
        ? undefined
        : getTriggerAnchorName(
            getTriggerAndPanelIds(navigationMenuId, openValue).triggerId,
          ),
  } as CSSProperties;

  return {
    contextValue,
    cancelClose: () => controller.holdOpen(),
    closeWithDelay: () => controller.leave(),
    closeOnFocusOutside: (event) =>
      controller.focusOut(event.currentTarget, event.relatedTarget),
    handleKeyDown: (event) => controller.escape(event.nativeEvent),
    style,
  };
}
