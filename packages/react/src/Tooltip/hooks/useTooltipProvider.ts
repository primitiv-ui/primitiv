import { useCallback, useEffect, useRef, useState } from "react";

import type { TooltipProviderContextValue } from "../types";

type UseTooltipProviderArgs = {
  delayDuration: number;
  skipDelayDuration: number;
};

export function useTooltipProvider({
  delayDuration,
  skipDelayDuration,
}: UseTooltipProviderArgs) {
  const [isOpenGlobally, setIsOpenGlobally] = useState(false);
  const skipDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onOpenGlobally = useCallback(
    () => {
      // Stryker disable next-line ConditionalExpression: equivalent —
      // clearTimeout(null) is a spec'd no-op, so forcing this guard true is
      // harmless when no skip-delay timer is pending; the false / never-clear
      // variant is killed by the "clears a pending skip-delay timer when a
      // tooltip opens again within the skip window" test.
      if (skipDelayTimerRef.current !== null) {
        clearTimeout(skipDelayTimerRef.current);
        skipDelayTimerRef.current = null;
      }
      setIsOpenGlobally(true);
    },
    // Stryker disable next-line ArrayDeclaration: equivalent — no dependency to freeze.
    [],
  );

  const onCloseGlobally = useCallback(() => {
    // Cancel before re-scheduling. The ref tracks only the newest timer, so
    // overwriting it without cancelling orphans the previous one: it survives,
    // fires unobserved, and can no longer be cancelled by a later open. Two
    // closes in a row is not hypothetical — `closeImmediate` is unguarded and
    // both Escape and blur are wired straight to it, so pressing Escape and then
    // tabbing away leaks a timer. `clearTimeout(undefined)` is a spec'd no-op, so
    // this needs no guard for the first close.
    clearTimeout(skipDelayTimerRef.current ?? undefined);
    skipDelayTimerRef.current = setTimeout(() => {
      setIsOpenGlobally(false);
      skipDelayTimerRef.current = null;
    }, skipDelayDuration);
  }, [skipDelayDuration]);

  // The skip-delay reset is a raw `setTimeout`, so it outlives the
  // component it was scheduled from unless explicitly cancelled — without
  // this, an in-flight timer fires after unmount and can throw once its
  // surrounding environment (e.g. a test's jsdom `window`) is gone.
  useEffect(
    () => {
      return () => {
        // Stryker disable next-line ConditionalExpression: equivalent —
        // clearTimeout(null) is a spec'd no-op, so forcing this guard true is
        // harmless when no skip-delay timer is pending; the false / never-clear
        // variant is killed by the "clears the pending skip-delay timeout on
        // unmount" test.
        if (skipDelayTimerRef.current !== null) {
          clearTimeout(skipDelayTimerRef.current);
        }
      };
    },
    // Stryker disable next-line ArrayDeclaration: equivalent — no dependency to freeze (mount/unmount only).
    [],
  );

  const contextValue: TooltipProviderContextValue = {
    delayDuration,
    skipDelayDuration,
    isOpenGlobally,
    onOpenGlobally,
    onCloseGlobally,
  };

  return { contextValue };
}
