import { useRef, useEffect, MouseEvent } from "react";

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
  const { registerTrigger } = useAccordionContext();
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

  // Toggling — on click, Enter and Space — and arrow-key focus movement are not
  // handled here: the root's AccordionController (from `@primitiv-ui/web`) owns
  // Accordion's DOM behaviour for every surface (RFC 0033 §3.4). Its native
  // listener on the root runs first, so a consumer `onClick` still runs after
  // the toggle — and, as it always has, not at all on a disabled trigger. A
  // consumer `onKeyDown` is just a prop on the rendered element.
  function handleClick(e: MouseEvent<HTMLButtonElement>) {
    if (disabled) return;
    onClick?.(e);
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
    "data-state": isExpanded ? "open" : "closed",
    ...rest,
  };

  return { triggerProps };
}
