import { useCallback, useMemo, useSyncExternalStore } from "react";

/**
 * In-document subscribers, keyed by storage key.
 *
 * The browser's own `storage` event only fires in OTHER documents, never the one
 * that performed the write — so a second consumer of the same key in this
 * document would keep rendering a stale value. These listeners cover that case;
 * the `storage` event covers other tabs.
 */
const listeners = new Map<string, Set<() => void>>();

/**
 * The listener set for a key, created on first use.
 *
 * Empty sets are deliberately never pruned. Pruning them would mean `notify`
 * had to guard against a missing set — a branch nothing can reach, since the
 * only way to obtain the setter is from a mounted hook that has already
 * subscribed. One empty `Set` per key, for a handful of static keys, is a
 * better trade than an untestable defensive branch.
 */
function listenersFor(key: string): Set<() => void> {
  let forKey = listeners.get(key);
  if (!forKey) {
    forKey = new Set();
    listeners.set(key, forKey);
  }
  return forKey;
}

function notify(key: string): void {
  for (const listener of listenersFor(key)) listener();
}

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    // Storage can throw rather than merely be empty — Safari private mode and
    // "block all cookies" both do. Treat it as "nothing stored".
    return null;
  }
}

/** The server has no storage, so nothing is stored. */
function getServerSnapshot(): null {
  return null;
}

/**
 * Reads and writes a JSON-serialisable value in `localStorage`, re-rendering
 * the consumer whenever it changes — including when another component, or
 * another browser tab, changes the same key.
 *
 * Built on {@link https://react.dev/reference/react/useSyncExternalStore |
 * `useSyncExternalStore`}, mirroring {@link useMediaQuery}: `localStorage` is
 * external mutable state, so subscribing to it is more correct than copying it
 * into component state and hoping the copies stay in step.
 *
 * **The snapshot is the raw string, not the parsed value.** `getSnapshot` must
 * return a referentially stable result or React re-renders forever, and
 * `JSON.parse` yields a fresh object every call. Returning the raw string — a
 * primitive — is stable by definition, and the parse happens in a `useMemo`
 * keyed on it.
 *
 * **Server rendering.** There is no `localStorage` on the server, so the server
 * snapshot is `null` and the hook returns `fallback`. The client then reads the
 * real value after hydration, which means a persisted choice can flash to its
 * stored state on first paint — unavoidable without a cookie or a blocking
 * inline script, and the same trade-off `useMediaQuery` makes.
 *
 * **Malformed data falls back.** Anything that fails to parse is treated as
 * absent rather than thrown: storage is shared, long-lived and editable by
 * hand, so a bad value must not break the page.
 *
 * @example Persisting a theme choice
 * ```tsx
 * const [theme, setTheme] = useLocalStorage<"light" | "dark">(
 *   "primitiv-theme",
 *   "light",
 * );
 * return (
 *   <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
 *     Switch theme
 *   </button>
 * );
 * ```
 *
 * @param key - The `localStorage` key to read and write.
 * @param fallback - Returned when the key is absent, unreadable, or holds
 * malformed JSON.
 * @returns A `[value, setValue]` tuple. `setValue` writes JSON to storage and
 * notifies every consumer of the same key.
 */
export function useLocalStorage<T>(
  key: string,
  fallback: T,
): [T, (next: T) => void] {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const forKey = listenersFor(key);
      forKey.add(onStoreChange);
      window.addEventListener("storage", onStoreChange);

      return () => {
        forKey.delete(onStoreChange);
        window.removeEventListener("storage", onStoreChange);
      };
    },
    [key],
  );

  const getSnapshot = useCallback(() => read(key), [key]);

  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const value = useMemo<T>(() => {
    if (raw === null) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }, [raw, fallback]);

  const setValue = useCallback(
    (next: T) => {
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // Writing can fail on a full or blocked store. Still notify, so the
        // in-memory read path stays consistent with whatever storage now holds.
      }
      notify(key);
    },
    [key],
  );

  return [value, setValue];
}
