// A controllable ResizeObserver stand-in for the picker's vitest harness — jsdom
// ships no ResizeObserver and no layout, so `useElementSize` can only be exercised
// by installing this mock (in vitest.setup) and driving sizes with `triggerResize`.
// Not a test file; lives under __tests__ so it is excluded from coverage.

type ResizeCallback = (
  entries: { contentRect: { width: number; height: number } }[],
) => void;

const callbacks = new Set<ResizeCallback>();
let disconnects = 0;

class MockResizeObserver {
  private cb: ResizeCallback;
  constructor(cb: ResizeCallback) {
    this.cb = cb;
  }
  observe(): void {
    callbacks.add(this.cb);
  }
  unobserve(): void {
    callbacks.delete(this.cb);
  }
  disconnect(): void {
    callbacks.delete(this.cb);
    disconnects += 1;
  }
}

/** Installs the mock as the global `ResizeObserver` (called from vitest.setup). */
export function installResizeObserverMock(): void {
  globalThis.ResizeObserver =
    MockResizeObserver as unknown as typeof ResizeObserver;
}

/** Fires every live observer with the given content size. */
export function triggerResize(width: number, height: number): void {
  for (const cb of callbacks) {
    cb([{ contentRect: { width, height } }]);
  }
}

/** Running count of `disconnect()` calls, for asserting cleanup. */
export function resizeDisconnects(): number {
  return disconnects;
}
