import type { ReactElement } from "react";

import { DirectionContext } from "./DirectionContext";
import { DirectionProviderProps } from "./types";

/**
 * Broadcasts a reading direction to every descendant so direction-aware
 * components can inherit it through context instead of each being passed
 * an explicit `dir` prop.
 *
 * Renders **no DOM host element** — only a React context provider.
 * Direction is never inferred from the DOM; the consumer still owns
 * setting `dir` on their `<html>` (or another ancestor element) for
 * CSS purposes. This component only propagates the {@link Direction}
 * value to `@primitiv-ui/react` components.
 *
 * **Override precedence.** A descendant component's own `dir` prop
 * always wins over the inherited value; components fall back to
 * {@link useDirection} only when their `dir` prop is omitted:
 *
 * ```tsx
 * <DirectionProvider dir="rtl">
 *   {/* inherits rtl *\/}
 *   <Tabs.Root defaultValue="a">…</Tabs.Root>
 *   {/* explicit ltr overrides the provider *\/}
 *   <Tabs.Root dir="ltr" defaultValue="a">…</Tabs.Root>
 * </DirectionProvider>
 * ```
 *
 * **Nesting.** Providers nest — an inner `DirectionProvider` overrides an
 * outer one for its subtree.
 *
 * **`useDirection` hook.** Direction-aware sub-components read the
 * inherited value via {@link useDirection}, which falls back to `"ltr"`
 * when no provider is present.
 *
 * @example Declare direction once near the app root
 * ```tsx
 * import { DirectionProvider } from "@primitiv-ui/react";
 *
 * <DirectionProvider dir="rtl">
 *   <Tabs.Root defaultValue="overview">…</Tabs.Root>
 *   <Slider.Root defaultValue={[50]} aria-label="Volume" />
 * </DirectionProvider>
 * ```
 *
 * @example Nested providers — inner overrides outer for its subtree
 * ```tsx
 * <DirectionProvider dir="rtl">
 *   <Tabs.Root defaultValue="a">…</Tabs.Root>
 *   <DirectionProvider dir="ltr">
 *     <Tabs.Root defaultValue="b">…</Tabs.Root>
 *   </DirectionProvider>
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

/** @internal */
DirectionProvider.displayName = "DirectionProvider";
