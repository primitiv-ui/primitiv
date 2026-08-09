import { useCallback, useId, useMemo, useRef } from "react";

import { useControllableState } from "../../hooks/index.ts";
import { useTooltipProviderContext } from "../TooltipContext";
import type { TooltipContextValue, TooltipRootProps } from "../types";

const GRACE_PERIOD_MS = 100;

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

  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gracePeriodTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openImmediate = useCallback(() => {
    // Stryker disable next-line ConditionalExpression: equivalent —
    // clearTimeout(null) is a spec'd no-op, so forcing this guard true is
    // harmless when no open timer is pending; the false / never-clear variant
    // is killed by the "cancels a pending hover-delay open timer when the
    // trigger is focused before it elapses" test.
    if (openTimerRef.current !== null) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    setOpen(true);
    providerCtx.onOpenGlobally();
  }, [setOpen, providerCtx]);

  const openWithDelay = useCallback(() => {
    const delay = providerCtx.isOpenGlobally ? 0 : effectiveDelayDuration;
    if (delay === 0) {
      openImmediate();
    } else {
      openTimerRef.current = setTimeout(() => {
        openImmediate();
        openTimerRef.current = null;
      }, delay);
    }
  }, [openImmediate, effectiveDelayDuration, providerCtx.isOpenGlobally]);

  const closeImmediate = useCallback(() => {
    // Stryker disable next-line ConditionalExpression: equivalent —
    // clearTimeout(null) is a spec'd no-op, so forcing this guard true is
    // harmless when no grace timer is pending; the false / never-clear variant
    // is killed by the "cancels a pending grace-period timer when the tooltip
    // closes immediately during the grace window" test.
    if (gracePeriodTimerRef.current !== null) {
      clearTimeout(gracePeriodTimerRef.current);
      gracePeriodTimerRef.current = null;
    }
    setOpen(false);
    providerCtx.onCloseGlobally();
  }, [setOpen, providerCtx]);

  const cancelGrace = useCallback(
    () => {
      // Stryker disable next-line ConditionalExpression: equivalent —
      // clearTimeout(null) is a spec'd no-op, so forcing this guard true is
      // harmless when no grace timer is pending; the false / never-clear
      // variant is killed by the "cancels the grace-period close timer when
      // the pointer moves into the content" test.
      if (gracePeriodTimerRef.current !== null) {
        clearTimeout(gracePeriodTimerRef.current);
        gracePeriodTimerRef.current = null;
      }
    },
    // Stryker disable next-line ArrayDeclaration: equivalent — no dependency to freeze.
    [],
  );

  const closeWithGrace = useCallback(() => {
    // Stryker disable next-line ConditionalExpression: equivalent —
    // clearTimeout(null) is a spec'd no-op, so forcing this guard true is
    // harmless when no open timer is pending; the false / never-clear variant
    // is killed by the "cancels a pending hover-delay open timer when the
    // pointer leaves before it elapses" test.
    if (openTimerRef.current !== null) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    gracePeriodTimerRef.current = setTimeout(() => {
      setOpen(false);
      providerCtx.onCloseGlobally();
      gracePeriodTimerRef.current = null;
    }, GRACE_PERIOD_MS);
  }, [setOpen, providerCtx]);

  const contextValue = useMemo<TooltipContextValue>(
    () => ({
      open,
      contentId,
      disableHoverableContent,
      openWithDelay,
      openImmediate,
      closeImmediate,
      closeWithGrace,
      cancelGrace,
    }),
    [
      open,
      contentId,
      disableHoverableContent,
      openWithDelay,
      openImmediate,
      closeImmediate,
      closeWithGrace,
      cancelGrace,
    ],
  );

  return { contextValue };
}
