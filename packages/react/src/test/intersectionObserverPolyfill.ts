/**
 * Minimal jsdom polyfill for IntersectionObserver.
 *
 * jsdom does not implement IntersectionObserver. The component relies
 * on it as the user-driven scroll → state fallback for browsers
 * without `scrollsnapchange`, and as the source of truth for
 * `isInView(slideIndex)` on the imperative API. Tests can grab the
 * most-recently-constructed instance via `MockIntersectionObserver
 * .latest` and call `.fire(entries)` to simulate visibility changes
 * on observed elements.
 */

type MockEntry = {
  target: Element;
  isIntersecting: boolean;
  intersectionRatio: number;
};

export class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  static get latest(): MockIntersectionObserver | undefined {
    return MockIntersectionObserver.instances[
      MockIntersectionObserver.instances.length - 1
    ];
  }
  static reset() {
    MockIntersectionObserver.instances = [];
  }

  callback: IntersectionObserverCallback;
  options?: IntersectionObserverInit;
  observed = new Set<Element>();
  root: Element | Document | null = null;
  rootMargin = "";
  thresholds: ReadonlyArray<number> = [];

  constructor(cb: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.callback = cb;
    this.options = options;
    MockIntersectionObserver.instances.push(this);
  }

  observe(target: Element) {
    // Mirror the browser: `observe` throws a TypeError when handed anything
    // that is not an Element (e.g. `undefined` from a stale slide lookup).
    if (!(target instanceof Element)) {
      throw new TypeError(
        "Failed to execute 'observe' on 'IntersectionObserver': parameter 1 is not of type 'Element'.",
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
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  /** Test-only: invoke the callback with synthesised entries for any
   * targets that are currently being observed. */
  fire(entries: MockEntry[]) {
    const matching = entries
      .filter((e) => this.observed.has(e.target))
      .map(
        (e) =>
          ({
            target: e.target,
            isIntersecting: e.isIntersecting,
            intersectionRatio: e.intersectionRatio,
            boundingClientRect: e.target.getBoundingClientRect(),
            intersectionRect: e.target.getBoundingClientRect(),
            rootBounds: null,
            time: 0,
          }) as IntersectionObserverEntry,
      );
    if (matching.length > 0) {
      this.callback(matching, this as unknown as IntersectionObserver);
    }
  }
}

export function installIntersectionObserverPolyfill() {
  if (typeof window === "undefined") return;
  (window as unknown as { IntersectionObserver: typeof MockIntersectionObserver })
    .IntersectionObserver = MockIntersectionObserver;
}
