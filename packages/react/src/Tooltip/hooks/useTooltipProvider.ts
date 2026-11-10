import { useEffect, useRef } from "react";

import { TooltipGroup } from "@primitiv-ui/web";

import type { TooltipProviderContextValue } from "../types";

type UseTooltipProviderArgs = {
  delayDuration: number;
  skipDelayDuration: number;
};

export function useTooltipProvider({
  delayDuration,
  skipDelayDuration,
}: UseTooltipProviderArgs) {
  // ── The adapter (RFC 0033 §3.4, D28) ────────────────────────────────────
  // The skip-delay window is the web implementation's TooltipGroup, the same
  // one the <primitiv-tooltip> elements share. It reads the skip delay as each
  // tooltip closes, so a changed prop applies to the next close.
  const skipDelay = useRef(skipDelayDuration);
  skipDelay.current = skipDelayDuration;
  const groupRef = useRef<TooltipGroup | null>(null);
  groupRef.current ??= new TooltipGroup(() => skipDelay.current);
  const group = groupRef.current;

  // The skip-delay reset is a raw `setTimeout`, so it outlives the component
  // it was scheduled from unless explicitly cancelled — without this, an
  // in-flight timer fires after unmount and can throw once its surrounding
  // environment (e.g. a test's jsdom `window`) is gone.
  useEffect(
    () => () => group.dispose(),
    // Stryker disable next-line ArrayDeclaration: equivalent — the group is created once, so any constant dependency list runs this once per mount.
    [],
  );

  const contextValue: TooltipProviderContextValue = {
    delayDuration,
    skipDelayDuration,
    group,
    onCloseGlobally: () => group.closed(),
  };

  return { contextValue };
}
