import { useRef, useMemo, useCallback, useId, useEffect } from "react";

import { AccordionController } from "@primitiv-ui/web";

import {
  useCollection,
  useControllableState,
  useHostedController,
} from "../../hooks/index.ts";

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
  // `updateKeysOnCleanup: false` avoids a setState-outside-act warning when a
  // trigger unmounts after a render-time validation throw (see below). Flipping
  // it to the default (true) changes only the timing of internal keys-state on
  // unmount; it has no user-facing behavioural difference the contract exposes,
  // so no test can distinguish it.
  // Stryker disable next-line all
  const triggerCollectionOptions = { updateKeysOnCleanup: false };
  const {
    register: registerTriggerBase,
    itemsRef: triggersRef,
    keys: registeredTriggerItemIds,
  } = useCollection<string, TriggerMeta>(triggerCollectionOptions);
  const panelsRef = useRef<Set<string>>(new Set());

  const registerTrigger = useCallback(
    (
      itemId: string,
      element: HTMLButtonElement | null,
      // The default is only reached by the cleanup call `registerTrigger(id,
      // null)`, where `element` is null and `disabled` is discarded — so its
      // value is never observable.
      // Stryker disable next-line BooleanLiteral
      disabled = false,
    ) => {
      registerTriggerBase(itemId, element ? { element, disabled } : null);
    },
    // `registerTriggerBase` is a stable useCollection callback, so emptying this
    // array yields the identical memoised function.
    // Stryker disable next-line ArrayDeclaration: equivalent — stable dependency.
    [registerTriggerBase],
  );

  // Like Tabs, Accordion's existing public contract is that uncontrolled
  // mode does NOT call onValueChange — only the controlled path notifies the
  // consumer. So we don't pass onValueChange to useControllableState; the
  // controller's `change` below fires it directly in controlled mode.
  const [expandedItems, setExpandedItems, isControlled] = useControllableState<
    Set<string>
  >(
    controlledValue !== undefined ? new Set(controlledValue) : undefined,
    // Forcing this condition true yields `new Set([undefined])` when no
    // defaultValue is given; `undefined` can never equal an item id (ids are
    // `value ?? useId()`), so it is observationally identical to the empty set.
    // Stryker disable next-line ConditionalExpression
    defaultValue !== undefined ? new Set([defaultValue]) : new Set(),
  );

  // Panels are tracked in a ref only. registerPanel does NOT call setState —
  // the validation effect reads panelsRef.current directly. Because React 18
  // runs all effects in a commit before flushing batched state updates, the
  // panel effect always executes (and updates panelsRef) before the re-render
  // triggered by trigger registration reaches the validation effect.
  const registerPanel = useCallback(
    (itemId: string) => {
      panelsRef.current.add(itemId);
    },
    // Empty, stable deps — filling the array yields the identical callback.
    // Stryker disable next-line ArrayDeclaration: equivalent — stable dependencies.
    [],
  );

  const unregisterPanel = useCallback(
    (itemId: string) => {
      panelsRef.current.delete(itemId);
    },
    // Empty, stable deps — filling the array yields the identical callback.
    // Stryker disable next-line ArrayDeclaration: equivalent — stable dependencies.
    [],
  );

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
      registerTrigger,
      registeredTriggerItemIds,
      registerPanel,
      unregisterPanel,
    }),
    [
      accordionId,
      expandedItems,
      orientation,
      dir,
      registerTrigger,
      registeredTriggerItemIds,
      registerPanel,
      unregisterPanel,
    ],
  );

  // ── The adapter (RFC 0033 §3.4, D28) ────────────────────────────────────
  // Accordion's DOM behaviour — clicks, the keyboard contract, focus — runs in
  // the web implementation's AccordionController, the same code the
  // <primitiv-accordion> element runs. React keeps rendering exactly the markup
  // it always has and keeps the state; the controller reads it through
  // `latest()` and asks for changes through `change`.
  const rootRef = useHostedController(
    {
      expandedItems,
      multiple,
      orientation,
      dir,
      isControlled,
      setExpandedItems,
      onValueChange,
    },
    (root, latest) =>
      new AccordionController(root, {
        state: () => ({
          expanded: [...latest().expandedItems],
          multiple: latest().multiple,
          orientation: latest().orientation,
          dir: latest().dir,
        }),
        change: (next) => {
          const current = latest();
          if (current.isControlled) {
            // Controlled mode requires `onValueChange` (discriminated-union prop
            // type), so the optional call can never no-op in valid usage.
            // Stryker disable next-line OptionalChaining: unreachable — controlled requires onValueChange.
            current.onValueChange?.(next);
          } else {
            current.setExpandedItems(new Set(next));
          }
        },
      }),
    { itemsRef: triggersRef, keys: registeredTriggerItemIds },
  );

  return { contextValue, rootRef };
}
