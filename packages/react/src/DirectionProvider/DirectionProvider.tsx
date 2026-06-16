import type { ReactElement } from "react";

import { DirectionContext } from "./DirectionContext";
import { DirectionProviderProps } from "./types";

/**
 * Broadcasts a reading direction to every descendant so direction-aware
 * components can inherit it instead of each being passed an explicit
 * `dir` prop.
 *
 * Renders **no DOM** — only a context provider. Direction is never
 * inferred from the DOM; the consumer still owns setting `dir` on their
 * `<html>` (or another element) for CSS. A descendant component's own
 * `dir` prop always wins over the inherited value; components fall back
 * to {@link useDirection} only when their `dir` prop is omitted.
 *
 * @example Declare direction once near the app root
 * ```tsx
 * <DirectionProvider dir="rtl">
 *   <Tabs.Root>…</Tabs.Root>
 *   <Slider.Root>…</Slider.Root>
 * </DirectionProvider>
 * ```
 */
export function DirectionProvider({
  dir,
  children,
}: DirectionProviderProps): ReactElement {
  return (
    <DirectionContext.Provider value={dir}>
      {children}
    </DirectionContext.Provider>
  );
}

DirectionProvider.displayName = "DirectionProvider";
