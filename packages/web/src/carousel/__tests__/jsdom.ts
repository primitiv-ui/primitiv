/**
 * What jsdom lacks and a carousel uses: IntersectionObserver, ResizeObserver
 * and `Element.scrollTo`. Each stub records what it was asked so a test can
 * fire it by hand. Imported for its side effect.
 */

/** An IntersectionObserver a test fires by hand. */
export class TestIntersectionObserver {
  static instances: TestIntersectionObserver[] = [];
  static get latest(): TestIntersectionObserver {
    return TestIntersectionObserver.instances.at(-1) as TestIntersectionObserver;
  }
  readonly observed = new Set<Element>();
  constructor(
    readonly callback: IntersectionObserverCallback,
    readonly options?: IntersectionObserverInit,
  ) {
    TestIntersectionObserver.instances.push(this);
  }
  observe(target: Element): void {
    this.observed.add(target);
  }
  unobserve(target: Element): void {
    this.observed.delete(target);
  }
  disconnect(): void {
    this.observed.clear();
  }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
  /** Report `entries` for the targets still observed. */
  fire(entries: Array<{ target: Element; ratio: number }>): void {
    const reported = entries
      .filter(({ target }) => this.observed.has(target))
      .map(({ target, ratio }) => ({ target, isIntersecting: ratio > 0, intersectionRatio: ratio }) as IntersectionObserverEntry);
    if (reported.length) this.callback(reported, this as unknown as IntersectionObserver);
  }
}

/** A ResizeObserver a test fires by hand. */
export class TestResizeObserver {
  static instances: TestResizeObserver[] = [];
  /** Fire every observer still observing something. */
  static fireAll(): void {
    for (const observer of TestResizeObserver.instances) observer.fire();
  }
  readonly observed = new Set<Element>();
  constructor(readonly callback: ResizeObserverCallback) {
    TestResizeObserver.instances.push(this);
  }
  observe(target: Element): void {
    this.observed.add(target);
  }
  unobserve(target: Element): void {
    this.observed.delete(target);
  }
  disconnect(): void {
    this.observed.clear();
  }
  fire(): void {
    if (!this.observed.size) return;
    this.callback([...this.observed].map((target) => ({ target }) as ResizeObserverEntry), this as unknown as ResizeObserver);
  }
}

Object.assign(globalThis, { IntersectionObserver: TestIntersectionObserver, ResizeObserver: TestResizeObserver });
Element.prototype.scrollTo ??= function scrollTo(): void {};

afterEach(() => {
  TestIntersectionObserver.instances = [];
  TestResizeObserver.instances = [];
});

/** A layout box, for stubbing `getBoundingClientRect`. */
export function box(left: number, width: number, top = 0, height = 100): DOMRect {
  return { left, width, top, height, right: left + width, bottom: top + height, x: left, y: top } as DOMRect;
}

/** Give `element` a fixed layout box. */
export function place(element: Element, rect: DOMRect): void {
  element.getBoundingClientRect = () => rect;
}
