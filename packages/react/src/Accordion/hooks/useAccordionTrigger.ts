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
  asChild = false,
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
