/**
 * Minimal jsdom polyfill for ResizeObserver.
 *
 * jsdom does not implement ResizeObserver. The component relies on it
 * to keep a multi-slide page's `scroll-margin` extension (the
 * center/end alignment fix for slidesPerPage > 1) correct across
 * viewport resizes, since equal-share slide widths derive from the
 * viewport's own size. Tests can grab the most-recently-constructed
 * instance via `MockResizeObserver.latest` and call `.fire()` to
 * simulate a resize on observed elements. When a component attaches
 * more than one observer to the same element (e.g. the scroll-margin
 * fix and the scroll-progress signal both observe the Viewport),
 * `.latest` only reaches whichever was constructed last — use
 * `MockResizeObserver.fireAll()` instead to simulate "a resize
 * happened" without depending on construction order.
 */

export class MockResizeObserver {
  static instances: MockResizeObserver[] = [];
  static get latest(): MockResizeObserver | undefined {
    return MockResizeObserver.instances[MockResizeObserver.instances.length - 1];
  }
  static reset() {
    MockResizeObserver.instances = [];
  }
  /** Test-only: fire every constructed observer, regardless of which
   * element(s) it's watching or when it was created. */
  static fireAll() {
    MockResizeObserver.instances.forEach((observer) => observer.fire());
  }

  callback: ResizeObserverCallback;
  observed = new Set<Element>();

  constructor(cb: ResizeObserverCallback) {
    this.callback = cb;
    MockResizeObserver.instances.push(this);
  }

  observe(target: Element) {
    // Mirror the browser: `observe` throws a TypeError when handed anything
    // that is not an Element.
    if (!(target instanceof Element)) {
      throw new TypeError(
        "Failed to execute 'observe' on 'ResizeObserver': parameter 1 is not of type 'Element'.",
      );
    }
    this.observed.add(target);
  }
  unobserve(target: Element) {
    this.observed.delete(target);
  }
  disconnect() {
    this.observed.clear();
  }

  /** Test-only: invoke the callback for every currently-observed target. */
  fire() {
    const entries = [...this.observed].map(
      (target) =>
        ({
          target,
          contentRect: target.getBoundingClientRect(),
          borderBoxSize: [],
          contentBoxSize: [],
          devicePixelContentBoxSize: [],
        }) as ResizeObserverEntry,
    );
    if (entries.length > 0) {
      this.callback(entries, this as unknown as ResizeObserver);
    }
  }
}

export function installResizeObserverPolyfill() {
  if (typeof window === "undefined") return;
  (
    window as unknown as { ResizeObserver: typeof MockResizeObserver }
  ).ResizeObserver = MockResizeObserver;
}
