import { useCallback, useSyncExternalStore } from "react";

function getServerSnapshot(): boolean {
  return false;
}

/**
 * Tracks whether a CSS media query currently matches, re-rendering the
 * consumer whenever it changes.
 *
 * Built on {@link https://react.dev/reference/react/useSyncExternalStore |
 * `useSyncExternalStore`}, so it subscribes to the query's real
 * `MediaQueryList` (`change` events, cleaned up on unmount and resubscribed
 * whenever `query` itself changes) rather than polling, and renders a static
 * `false` during server rendering — there is no `window`/`matchMedia` on the
 * server, so `false` is the safest default until the client mounts and can
 * read the real value. This is a generic primitive: it does not know about
 * Primitiv's own breakpoint scale or any other token values — pass whatever
 * query string the consumer needs.
 *
 * @example Responding to a breakpoint
 * ```tsx
 * const isDesktop = useMediaQuery("(min-width: 64rem)");
 * return isDesktop ? <DesktopNav /> : <MobileMenu />;
 * ```
 *
 * @example Any media feature, not just width
 * ```tsx
 * const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
 * ```
 *
 * @param query - A media query string, e.g. `"(min-width: 40rem)"`.
 * @returns Whether `query` currently matches. `false` on the server and on
 * the client's very first paint before hydration confirms the real value.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const mediaQueryList = window.matchMedia(query);
      mediaQueryList.addEventListener("change", onStoreChange);
      return () => mediaQueryList.removeEventListener("change", onStoreChange);
    },
    [query],
  );

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
