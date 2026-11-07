import {
  deriveId,
  tabsTabStop,
  type TabsActivationMode,
  type TabsOrientation,
} from "@primitiv-ui/core";

import { TabsController, type TabsControllerHost } from "./TabsController.ts";

/**
 * The base class every element extends. It falls back to an empty class where
 * the DOM does not exist, so a server renderer (Next.js, Nuxt, Angular SSR,
 * Astro) can import this module without `HTMLElement` throwing at load time
 * (RFC 0033 D21).
 */
const ElementBase: typeof HTMLElement =
  globalThis.HTMLElement ?? (class {} as unknown as typeof HTMLElement);

// Stryker disable StringLiteral: static — evaluated once at import, so runtime mutant switching never reaches them; the names are pinned by the defineTabs registry test instead.
const ROOT = "primitiv-tabs";
const LIST = "primitiv-tabs-list";
const TRIGGER = "primitiv-tabs-trigger";
const CONTENT = "primitiv-tabs-content";
// Stryker restore StringLiteral

let generatedIds = 0;

/** Triggers already reported as misused, so each is reported once, not per reconcile. */
const reported = new WeakSet<Element>();

/**
 * An interactive part decorates exactly one element child and needs a `value`.
 * Anything else is reported once and left undecorated rather than thrown: a
 * server-rendered page has no error boundary to catch a throw (RFC 0033 D24).
 */
function decoratable(trigger: HTMLElement): { tab: HTMLElement; value: string } | null {
  const value = trigger.getAttribute("value");
  if (trigger.childElementCount === 1 && value !== null) {
    return { tab: trigger.firstElementChild as HTMLElement, value };
  }
  if (!reported.has(trigger)) {
    reported.add(trigger);
    console.error(
      `<${TRIGGER}> needs a value and exactly one element child (a <button>, an <a href> or a router link) to decorate.`,
      trigger,
    );
  }
  return null;
}

/**
 * Write an attribute only when it would change: `null` removes it. The elements
 * write only the attributes in their contract (RFC 0033 §5.3), and comparing
 * first means a value a framework or the server already rendered is never
 * rewritten (D20).
 */
function write(element: Element, name: string, value: string | null): void {
  if (element.getAttribute(name) === value) return;
  if (value === null) element.removeAttribute(name);
  else element.setAttribute(name, value);
}

/**
 * `<primitiv-tabs>` — the state owner of a WAI-ARIA tab set.
 *
 * The root finds its own parts, scoped with `closest()` so a tab set nested in a
 * panel keeps its own, and reconciles their ARIA from its reflected state. It
 * never caches the parts, so markup that arrives later is picked up on the next
 * reconcile. One `MutationObserver` is the only trigger after connect: it sees
 * parts arriving and leaving, and every attribute the root reads, including the
 * root's own `value` and `orientation`, and it already delivers a task's changes
 * as one callback, so no further batching is needed. `activation-mode` is read
 * live at each key press, so a change to it needs no reconcile.
 */
export class PrimitivTabsElement extends ElementBase {
  #generatedId: string | undefined;
  /** The value of the panel last shown, so a change fires primitiv-tabs-show. */
  #shown: string | undefined;
  #rendered = false;
  readonly #controller = new TabsController(this, this.#host());
  /** The tab elements currently registered with the controller. */
  #registered = new Set<HTMLElement>();

  /**
   * Watches the subtree for parts arriving, leaving, or changing the attributes
   * the root reads. The root's own writes (role, aria-*, ids, data-*) are not in
   * the filter, so reconciling never re-triggers itself.
   */
  readonly #observer = new MutationObserver(() => this.#reconcile());

  connectedCallback(): void {
    this.#controller.connect();
    this.#observer.observe(this, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["value", "disabled", "label", "orientation"],
    });
    this.#reconcile();
  }

  /**
   * Leaving the document stops all listening. A move (an `hx-preserve`, a
   * framework reparenting) is a disconnect followed by a connect, so handlers
   * never stack.
   */
  disconnectedCallback(): void {
    this.#controller.disconnect();
    this.#observer.disconnect();
  }

  /** The active tab's value, reflected as the `value` attribute. */
  get value(): string | undefined {
    return this.getAttribute("value") ?? undefined;
  }

  set value(next: string) {
    this.setAttribute("value", next);
  }

  /**
   * The controller's view of this element. State lives in reflected attributes;
   * an activation is announced first, as a cancelable event, so a listener can
   * veto it — the elements' equivalent of React's controlled mode (D7).
   */
  #host(): TabsControllerHost {
    return {
      state: () => ({
        active: this.value,
        orientation: this.#orientation(),
        // Stryker disable next-line StringLiteral: equivalent — core tests only for "rtl", so any other string reads as left-to-right.
        dir: this.matches(":dir(rtl)") ? "rtl" : "ltr",
        activationMode: this.#activationMode(),
      }),
      activate: (value, index) => {
        const change = new CustomEvent("primitiv-tabs-change", {
          bubbles: true,
          cancelable: true,
          detail: { value, index },
        });
        if (this.dispatchEvent(change)) this.value = value;
      },
    };
  }

  #activationMode(): TabsActivationMode {
    const mode = this.getAttribute("activation-mode");
    return mode === "manual" ? mode : "automatic";
  }

  #orientation(): TabsOrientation {
    return this.getAttribute("orientation") === "vertical" ? "vertical" : "horizontal";
  }

  /** Parts of this tab set only, never those of a nested one. */
  #parts(selector: string): HTMLElement[] {
    return [...this.querySelectorAll<HTMLElement>(selector)].filter(
      (part) => part.closest(ROOT) === this,
    );
  }

  #rootId(): string {
    // Stryker disable next-line UpdateOperator: equivalent — counting down yields ids just as unique.
    return this.id || (this.#generatedId ??= `${ROOT}-${++generatedIds}`);
  }

  #reconcile(): void {
    const orientation = this.#orientation();
    const active = this.value;
    const rootId = this.#rootId();
    write(this, "data-orientation", orientation);

    for (const list of this.#parts(LIST)) {
      write(list, "role", "tablist");
      write(list, "aria-orientation", orientation);
      write(list, "data-orientation", orientation);
      const label = list.getAttribute("label");
      if (label !== null) write(list, "aria-label", label);
    }

    const panels = new Map<string, HTMLElement>();
    for (const panel of this.#parts(CONTENT)) {
      const value = panel.getAttribute("value");
      if (value !== null) panels.set(value, panel);
    }

    const triggers = this.#parts(TRIGGER).flatMap((trigger) => {
      const part = decoratable(trigger);
      return part ? [{ trigger, ...part }] : [];
    });
    const stop = tabsTabStop({ values: triggers.map((t) => t.value), active });

    // Replace the registration wholesale: a removed part, or a trigger whose child
    // a framework re-rendered, simply is not registered again.
    for (const tab of this.#registered) this.#controller.unregisterTrigger(tab);
    for (const { trigger, tab, value } of triggers) {
      this.#controller.registerTrigger(value, tab, { disabled: trigger.hasAttribute("disabled") });
    }
    this.#registered = new Set(triggers.map((t) => t.tab));

    for (const { trigger, tab, value } of triggers) {
      const panel = panels.get(value);
      const selected = value === active;
      const disabled = trigger.hasAttribute("disabled");
      if (!tab.id) tab.id = deriveId(rootId, "trigger", value);
      if (panel && !panel.id) panel.id = deriveId(rootId, "panel", value);
      write(tab, "role", "tab");
      write(tab, "aria-selected", String(selected));
      write(tab, "aria-controls", panel ? panel.id : null);
      write(tab, "tabindex", value === stop ? "0" : "-1");
      write(tab, "aria-disabled", disabled ? "true" : null);
      write(tab, "data-disabled", disabled ? "" : null);
      write(tab, "data-state", selected ? "active" : "inactive");
      write(tab, "data-orientation", orientation);
      if (panel) write(panel, "aria-labelledby", tab.id);
    }

    for (const [value, panel] of panels) {
      const selected = value === active;
      write(panel, "role", "tabpanel");
      write(panel, "tabindex", "0");
      write(panel, "hidden", selected ? null : "");
      write(panel, "data-state", selected ? "active" : "inactive");
      write(panel, "data-orientation", orientation);
    }

    // A panel that becomes active announces it, so a lazy panel can fetch its
    // content (`hx-trigger="primitiv-tabs-show once"`, RFC 0033 D9). The first
    // render shows what the server already rendered, so it announces nothing.
    // `Map.get(undefined)` is simply undefined, so no tab active means no panel.
    const shownPanel = panels.get(active as string);
    if (this.#rendered && active !== this.#shown && shownPanel) {
      shownPanel.dispatchEvent(new CustomEvent("primitiv-tabs-show", { bubbles: true }));
    }
    this.#shown = active;
    this.#rendered = true;
  }
}

/** `<primitiv-tabs-list>` — the tablist. Structural: the root writes its ARIA. */
export class PrimitivTabsListElement extends ElementBase {}

/**
 * `<primitiv-tabs-trigger>` — an interactive part. It decorates exactly one
 * child the consumer writes (a `<button>`, an `<a href>`, a router link), which
 * receives the tab role, so the rendered DOM matches React's `<button role="tab">`
 * (RFC 0033 D24).
 */
export class PrimitivTabsTriggerElement extends ElementBase {}

/** `<primitiv-tabs-content>` — a tab panel. Structural: the root writes its ARIA. */
export class PrimitivTabsContentElement extends ElementBase {}

/** The two calls `defineTabs` makes on a custom-element registry. */
export type ElementRegistry = Pick<CustomElementRegistry, "get" | "define">;

/**
 * Define the four Tabs elements on `registry` (the global `customElements` by
 * default, so a scoped registry can be passed when browsers support one). Safe
 * to call more than once, and a no-op where there is no registry (a server
 * render).
 */
export function defineTabs(registry: ElementRegistry | undefined = globalThis.customElements): void {
  if (!registry) return;
  const elements: Array<[string, CustomElementConstructor]> = [
    [ROOT, PrimitivTabsElement],
    [LIST, PrimitivTabsListElement],
    [TRIGGER, PrimitivTabsTriggerElement],
    [CONTENT, PrimitivTabsContentElement],
  ];
  for (const [name, element] of elements) {
    if (!registry.get(name)) registry.define(name, element);
  }
}
