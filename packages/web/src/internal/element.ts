/**
 * What every element module shares: the SSR-safe base class, the write-only-on-
 * change helper, report-once misuse logging, and the define loop. Internal —
 * not an entry point.
 */

/**
 * The base class every element extends. It falls back to an empty class where
 * the DOM does not exist, so a server renderer (Next.js, Nuxt, Angular SSR,
 * Astro) can import an element module without `HTMLElement` throwing at load
 * time (RFC 0033 D21).
 */
export const ElementBase: typeof HTMLElement =
  globalThis.HTMLElement ?? (class {} as unknown as typeof HTMLElement);

/**
 * Write an attribute only when it would change: `null` removes it. The elements
 * write only the attributes in their contract (RFC 0033 §5.3), and comparing
 * first means a value a framework or the server already rendered is never
 * rewritten (D20).
 */
export function write(element: Element, name: string, value: string | null): void {
  if (element.getAttribute(name) === value) return;
  if (value === null) element.removeAttribute(name);
  else element.setAttribute(name, value);
}

/** Parts already reported as misused, so each is reported once, not per reconcile. */
const reported = new WeakSet<Element>();

/**
 * Report a misused part once, with the element attached so devtools can jump to
 * it. Misuse is logged rather than thrown: a server-rendered page has no error
 * boundary to catch a throw (RFC 0033 D24).
 */
export function reportOnce(element: Element, message: string): void {
  if (reported.has(element)) return;
  reported.add(element);
  console.error(message, element);
}

/** The two calls a `define<Component>` makes on a custom-element registry. */
export type ElementRegistry = Pick<CustomElementRegistry, "get" | "define">;

/**
 * Define `elements` on `registry`, skipping any name already defined, so a
 * define is safe to call more than once. A no-op where there is no registry (a
 * server render).
 */
export function defineElements(
  registry: ElementRegistry | undefined,
  elements: ReadonlyArray<[string, CustomElementConstructor]>,
): void {
  if (!registry) return;
  for (const [name, element] of elements) {
    if (!registry.get(name)) registry.define(name, element);
  }
}

/**
 * The `selector` parts inside `scope` that belong to it, not to a nested
 * `owner` — so a component nested in another's panel keeps its own parts.
 */
export function owned(scope: Element, selector: string, owner: string): HTMLElement[] {
  return [...scope.querySelectorAll<HTMLElement>(selector)].filter((part) => part.closest(owner) === scope);
}
