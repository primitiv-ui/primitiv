import { useEffect, useId, useMemo, useRef } from "react";

import { TooltipController } from "@primitiv-ui/web";

import { useControllableState } from "../../hooks/index.ts";
import { useTooltipProviderContext } from "../TooltipContext";
import type { TooltipContentProps, TooltipContextValue, TooltipRootProps } from "../types";

type UseTooltipRootArgs = Pick<
  TooltipRootProps,
  "defaultOpen" | "open" | "onOpenChange" | "delayDuration" | "disableHoverableContent"
>;

export function useTooltipRoot({
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  delayDuration: instanceDelayDuration,
  disableHoverableContent = false,
}: UseTooltipRootArgs) {
  const providerCtx = useTooltipProviderContext();
  const [open, setOpen] = useControllableState<boolean>(
    controlledOpen,
    defaultOpen,
    onOpenChange,
  );
  const contentId = useId();
  const effectiveDelayDuration = instanceDelayDuration ?? providerCtx.delayDuration;

  const contentRef = useRef<HTMLDivElement | null>(null);
  const contentCallbacksRef = useRef<
    Pick<TooltipContentProps, "onEscapeKeyDown" | "onPointerDownOutside">
  >({});
  const snapshot = { open, setOpen, delay: effectiveDelayDuration, group: providerCtx.group };
  const latest = useRef(snapshot);
  latest.current = snapshot;

  // ── The adapter (RFC 0033 §3.4, D28) ────────────────────────────────────
  // Hover intent — the open delay, the grace period, the group's skip-delay
  // window — and the document-wide Escape and outside press while open run in
  // the web implementation's TooltipController, the same code the
  // <primitiv-tooltip> elements run. React keeps wiring the trigger's and the
  // content's events, composed with its consumers' handlers as before; the
  // controller reads the state through `latest`.
  const controllerRef = useRef<TooltipController | null>(null);
  controllerRef.current ??= new TooltipController({
    state: () => ({ open: latest.current.open }),
    change: (next) => latest.current.setOpen(next),
    delay: () => latest.current.delay,
    tooltipGroup: () => latest.current.group,
    content: () => contentRef.current,
    escapeKeyDown: (event) => contentCallbacksRef.current.onEscapeKeyDown?.(event),
    pointerDownOutside: (event) => contentCallbacksRef.current.onPointerDownOutside?.(event),
  });
  const controller = controllerRef.current;

  // Its timers are raw `setTimeout`s: cancel them as the tooltip unmounts.
  useEffect(
    () => () => controller.disconnect(),
    // Stryker disable next-line ArrayDeclaration: equivalent — the controller is created once, so any constant dependency list runs this once per mount.
    [],
  );

  const contextValue = useMemo<TooltipContextValue>(
    () => ({
      open,
      contentId,
      disableHoverableContent,
      openWithDelay: () => controller.hoverStart(),
      openImmediate: () => controller.openNow(),
      closeImmediate: () => controller.closeNow(),
      closeWithGrace: () => controller.hoverEnd(),
      cancelGrace: () => controller.holdOpen(),
      controller,
      contentRef,
      contentCallbacksRef,
    }),
    [open, contentId, disableHoverableContent, controller],
  );

  return { contextValue };
}
