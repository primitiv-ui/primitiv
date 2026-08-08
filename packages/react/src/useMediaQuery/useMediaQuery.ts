function getSnapshot(query: string) {
  return () => window.matchMedia(query).matches;
}

/**
 * Tracks whether a CSS media query currently matches, re-rendering the
 * consumer whenever it changes.
 *
 * @param query - A media query string, e.g. `"(min-width: 40rem)"`.
 * @returns Whether `query` currently matches.
 */
export function useMediaQuery(query: string): boolean {
  return getSnapshot(query)();
}
