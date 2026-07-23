import { useMemo, useRef, useEffect, MouseEvent, KeyboardEvent } from "react";

import { useRovingTabindex } from "../../hooks/index.ts";
import { composeRefs } from "../../Slot/index.ts";

import { AccordionTriggerProps } from "../types";

import { useAccordionContext } from "./useAccordionContext";
import { useAccordionItemContext } from "./useAccordionItemContext";

export function useAccordionTrigger({
  ref,
  onClick,
  disabled,
  // No default: the `AccordionTrigger` component always supplies a resolved
  // `asChild` boolean, so a default here would be unreachable (dead) code.
  asChild,
  ...rest
}: Omit<AccordionTriggerProps, "children">) {
  const { buttonId, panelId, itemId, isExpanded } = useAccordionItemContext();
  const {
    toggleItem,
    registerTrigger,
    registeredTriggerItemIds,
    disabledItemIds,
    focusTrigger,
    orientation,
    dir,
  } = useAccordionContext();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const composedRef = ref ? composeRefs(triggerRef, ref) : triggerRef;

  // Register/unregister this trigger with the context. The disabled flag
  // is now tracked in registration metadata (via useCollection's value
  // type) instead of being read from the rendered aria-disabled attribute,
  // which keeps Accordion consistent with RadioGroup and is the model
  // useRovingTabindex expects.
  useEffect(() => {
    registerTrigger(itemId, triggerRef.current, disabled);
    // Because the collection uses `updateKeysOnCleanup: false`, an unmount
    // clears only this trigger's ref entry without a keys change, and focusing
    // a removed trigger is a no-op whether the entry is absent or detached —
    // so this cleanup has no observable effect the contract exposes. (On a dep
    // change the effect body re-registers first, overwriting it.)
    // Stryker disable next-line ArrowFunction: equivalent — no observable effect.
    return () => registerTrigger(itemId, null);
  }, [itemId, disabled, registerTrigger]);

  function handleClick(e: MouseEvent<HTMLButtonElement>) {
    if (disabled) return;
    toggleItem(itemId);
    onClick?.(e);
  }

  // Pre-filter disabled triggers out of the navigable list — Accordion's
  // ARIA contract is that arrow keys skip past disabled triggers (unlike
  // Tabs, which lands on disabled triggers without activating them).
  const enabledItemIds = useMemo(
    () => registeredTriggerItemIds.filter((id) => !disabledItemIds.has(id)),
    [registeredTriggerItemIds, disabledItemIds],
  );
  const { handleKeyDown: rovingKeyDown } = useRovingTabindex<string>({
    orientation,
    dir,
    navigable: enabledItemIds,
    currentKey: itemId,
    onNavigate: focusTrigger,
    includeHomeEnd: true,
  });

  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    // Accordion-specific: Enter / Space toggle the focused item rather than
    // activate something else, so they're handled here before delegating
    // arrow / Home / End to the shared hook.
    if ((e.key === "Enter" || e.key === " ") && !disabled) {
      e.preventDefault();
      toggleItem(itemId);
      return;
    }
    rovingKeyDown(e);
  }

  const triggerProps = {
    ref: composedRef,
    "aria-expanded": isExpanded,
    id: buttonId,
    "aria-controls": panelId,
    "aria-disabled": disabled,
    "data-disabled": disabled,
    ...(asChild && disabled ? { role: "button" } : {}),
    onClick: handleClick,
    onKeyDown: handleKeyDown,
    "data-state": isExpanded ? "open" : "closed",
    ...rest,
  };

  return { triggerProps };
}
