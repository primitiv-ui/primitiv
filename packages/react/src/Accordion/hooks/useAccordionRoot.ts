import { useRef, useMemo, useCallback, useId, useEffect } from "react";

import { useCollection, useControllableState } from "../../hooks/index.ts";

import type { AccordionReadingDirection } from "../types";

type TriggerMeta = {
  element: HTMLButtonElement;
  disabled: boolean;
};

export function useAccordionRoot(
  controlledValue: string[] | undefined,
  defaultValue: string | (readonly string[] & string) | undefined,
  multiple: boolean,
  onValueChange: ((values: string[]) => void) | undefined,
  orientation: "vertical" | "horizontal",
  dir: AccordionReadingDirection,
) {
  const accordionId = useId();
  // updateKeysOnCleanup is false so trigger unmounts don't fire setState
  // outside act() after a render-time validation throw.
  const {
    register: registerTriggerBase,
    itemsRef: triggersRef,
    keys: registeredTriggerItemIds,
  } = useCollection<string, TriggerMeta>({ updateKeysOnCleanup: false });
  const panelsRef = useRef<Set<string>>(new Set());

  const registerTrigger = useCallback(
    (
      itemId: string,
      element: HTMLButtonElement | null,
      disabled = false,
    ) => {
      registerTriggerBase(itemId, element ? { element, disabled } : null);
    },
    [registerTriggerBase],
  );

  const disabledItemIds = useMemo(
    () =>
      new Set(
        Array.from(triggersRef.current.entries())
          .filter(([, meta]) => meta.disabled)
          .map(([id]) => id),
      ),
    // registeredTriggerItemIds is a fresh array on every register call (new
    // identity even when the keys are the same), so the memo re-runs whenever
    // any trigger mounts, unmounts, or toggles disabled — which is exactly
    // the trigger we want for re-deriving disabledItemIds.
    [registeredTriggerItemIds, triggersRef],
  );

  const focusTrigger = useCallback(
    (itemId: string) => {
      triggersRef.current.get(itemId)?.element.focus();
    },
    [triggersRef],
  );

  // Like Tabs, Accordion's existing public contract is that uncontrolled
  // mode does NOT call onValueChange — only the controlled path notifies the
  // consumer. So we don't pass onValueChange to useControllableState; the
  // toggleItem branch below fires it directly in controlled mode.
  const [expandedItems, setExpandedItems, isControlled] = useControllableState<
    Set<string>
  >(
    controlledValue !== undefined ? new Set(controlledValue) : undefined,
    defaultValue !== undefined ? new Set([defaultValue]) : new Set(),
  );

  const computeNext = (prev: Set<string>, itemId: string): Set<string> => {
    const next = new Set(prev);
    if (next.has(itemId)) {
      next.delete(itemId);
    } else if (multiple) {
      next.add(itemId);
    } else {
      next.clear();
      next.add(itemId);
    }
    return next;
  };

  const toggleItem = useCallback(
    (itemId: string) => {
      const next = computeNext(expandedItems, itemId);
      if (isControlled) {
        onValueChange?.(Array.from(next));
      } else {
        setExpandedItems(next);
      }
    },
    [expandedItems, isControlled, multiple, setExpandedItems, onValueChange],
  );

  // Panels are tracked in a ref only. registerPanel does NOT call setState —
  // the validation effect reads panelsRef.current directly. Because React 18
  // runs all effects in a commit before flushing batched state updates, the
  // panel effect always executes (and updates panelsRef) before the re-render
  // triggered by trigger registration reaches the validation effect.
  const registerPanel = useCallback((itemId: string) => {
    panelsRef.current.add(itemId);
  }, []);

  const unregisterPanel = useCallback((itemId: string) => {
    panelsRef.current.delete(itemId);
  }, []);

  useEffect(() => {
    for (const triggerId of registeredTriggerItemIds) {
      if (!panelsRef.current.has(triggerId)) {
        throw new Error(
          `AccordionTrigger (item "${triggerId}") has no corresponding AccordionContent. Every AccordionItem with a Trigger must also contain an AccordionContent.`,
        );
      }
    }
  }, [registeredTriggerItemIds]);

  const contextValue = useMemo(
    () => ({
      accordionId,
      expandedItems,
      orientation,
      dir,
      toggleItem,
      registerTrigger,
      registeredTriggerItemIds,
      disabledItemIds,
      focusTrigger,
      registerPanel,
      unregisterPanel,
    }),
    [
      accordionId,
      expandedItems,
      orientation,
      dir,
      toggleItem,
      registerTrigger,
      registeredTriggerItemIds,
      disabledItemIds,
      focusTrigger,
      registerPanel,
      unregisterPanel,
    ],
  );

  return { contextValue };
}
