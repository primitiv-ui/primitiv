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

  const onOpenGlobally = useCallback(() => {
    if (skipDelayTimerRef.current !== null) {
      clearTimeout(skipDelayTimerRef.current);
      skipDelayTimerRef.current = null;
    }
    setIsOpenGlobally(true);
  }, []);

  const onCloseGlobally = useCallback(() => {
    skipDelayTimerRef.current = setTimeout(() => {
      setIsOpenGlobally(false);
      skipDelayTimerRef.current = null;
    }, skipDelayDuration);
  }, [skipDelayDuration]);

  // The skip-delay reset is a raw `setTimeout`, so it outlives the
  // component it was scheduled from unless explicitly cancelled — without
  // this, an in-flight timer fires after unmount and can throw once its
  // surrounding environment (e.g. a test's jsdom `window`) is gone.
  useEffect(() => {
    return () => {
      if (skipDelayTimerRef.current !== null) {
        clearTimeout(skipDelayTimerRef.current);
      }
    };
  }, []);

  const contextValue: TooltipProviderContextValue = {
    delayDuration,
    skipDelayDuration,
    isOpenGlobally,
    onOpenGlobally,
    onCloseGlobally,
  };

  return { contextValue };
}
