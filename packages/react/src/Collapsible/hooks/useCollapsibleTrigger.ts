import { useRef, MouseEvent, KeyboardEvent } from "react";

import { composeRefs } from "../../Slot/index.ts";

import { CollapsibleTriggerProps } from "../types";
import { useCollapsibleContext } from "../CollapsibleContext";

export function useCollapsibleTrigger({
  ref,
  onClick,
  onKeyDown,
  // No default: the `CollapsibleTrigger` component always supplies a resolved
  // `asChild` boolean, so a default here would be unreachable (dead) code.
  asChild,
  ...rest
}: Omit<CollapsibleTriggerProps, "children">) {
  const { open, disabled, toggle, triggerId, contentId } =
    useCollapsibleContext();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const composedRef = ref ? composeRefs(triggerRef, ref) : triggerRef;

  function handleClick(e: MouseEvent<HTMLButtonElement>) {
    if (disabled) return;
    toggle();
    onClick?.(e);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    onKeyDown?.(e);
    if ((e.key === "Enter" || e.key === " ") && !disabled) {
      e.preventDefault();
      toggle();
    }
  }

  const triggerProps = {
    ref: composedRef,
    id: triggerId,
    "aria-expanded": open,
    "aria-controls": contentId,
    "aria-disabled": disabled || undefined,
    "data-disabled": disabled,
    "data-state": open ? "open" : "closed",
    ...(asChild && disabled ? { role: "button" } : {}),
    onClick: handleClick,
    onKeyDown: handleKeyDown,
    ...rest,
  };

  return { triggerProps };
}
