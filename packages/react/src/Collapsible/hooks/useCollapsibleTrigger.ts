import { useEffect, useRef, MouseEvent } from "react";

import { composeRefs } from "../../Slot/index.ts";

import { CollapsibleTriggerProps } from "../types";
import { useCollapsibleContext } from "../CollapsibleContext";

export function useCollapsibleTrigger({
  ref,
  onClick,
  // No default: the `CollapsibleTrigger` component always supplies a resolved
  // `asChild` boolean, so a default here would be unreachable (dead) code.
  asChild,
  ...rest
}: Omit<CollapsibleTriggerProps, "children">) {
  const { open, disabled, registerTrigger, triggerId, contentId } =
    useCollapsibleContext();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const composedRef = ref ? composeRefs(triggerRef, ref) : triggerRef;

  // Register with the root's controller; `registerTrigger` changes with
  // `disabled`, so the controller always knows whether the trigger may toggle.
  useEffect(() => {
    registerTrigger(triggerRef.current);
    // A trigger that unmounts leaves the document, so a stale entry can never
    // receive an event, and a dependency change re-registers over it first —
    // the cleanup has no effect the contract exposes.
    // Stryker disable next-line ArrowFunction: equivalent — no observable effect.
    return () => registerTrigger(null);
  }, [registerTrigger]);

  // Toggling — on click, Enter and Space — is not handled here: the root's
  // CollapsibleController (from `@primitiv-ui/web`) owns Collapsible's DOM
  // behaviour for every surface (RFC 0033 §3.4). Its native listener on the
  // root runs first, so a consumer `onClick` still runs after the toggle — and,
  // as it always has, not at all while disabled. A consumer `onKeyDown` is just
  // a prop on the rendered element.
  function handleClick(e: MouseEvent<HTMLButtonElement>) {
    if (disabled) return;
    onClick?.(e);
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
    ...rest,
  };

  return { triggerProps };
}
