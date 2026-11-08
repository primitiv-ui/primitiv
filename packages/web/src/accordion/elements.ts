import { deriveId, type AccordionOrientation } from "@primitiv-ui/core";

import { defineElements, ElementBase, reportOnce, write, type ElementRegistry } from "../internal/element.ts";
import { AccordionController, type AccordionControllerHost } from "./AccordionController.ts";

export type { ElementRegistry };

// Stryker disable StringLiteral: static — evaluated once at import, so runtime mutant switching never reaches them; the names are pinned by the defineAccordion registry test instead.
const ROOT = "primitiv-accordion";
const ITEM = "primitiv-accordion-item";
const TRIGGER = "primitiv-accordion-trigger";
const CONTENT = "primitiv-accordion-content";
const ICON = "primitiv-accordion-trigger-icon";
// Stryker restore StringLiteral

let generatedIds = 0;

/** Split a space-separated `value` into item values. */
function tokens(value: string | null): string[] {
  // Stryker disable next-line Regex: equivalent — splitting on single whitespace leaves empty tokens, which the filter drops.
  return (value ?? "").split(/\s+/).filter(Boolean);
}

/**
 * A trigger decorates exactly one element child — the `<button>` the consumer
 * writes. Anything else is reported once and left undecorated rather than
 * thrown (RFC 0033 D24).
 */
function decoratable(trigger: HTMLElement): HTMLElement | null {
  if (trigger.childElementCount === 1) return trigger.firstElementChild as HTMLElement;
  reportOnce(trigger, `<${TRIGGER}> needs exactly one element child (a <button>) to decorate.`);
  return null;
}

/**
 * `<primitiv-accordion>` — the state owner of a WAI-ARIA accordion.
 *
 * The root finds its own items, scoped with `closest()` so an accordion nested
 * in a panel keeps its own, and reconciles every part's ARIA from its reflected
 * state. It never caches the parts. One `MutationObserver` is the only trigger
 * after connect: it sees parts arriving and leaving and every attribute the root
 * reads. `multiple` is read live at each toggle, so a change to it needs no
 * reconcile.
 *
 * Each trigger sits in a heading you write (`<h3>`, at the level the page's
 * outline needs): a real heading element is the header, so there is no element
 * for it.
 *
 * @customElement primitiv-accordion
 * @summary The state owner of a WAI-ARIA accordion.
 * @attr {string} value - The open items' values, separated by spaces. Reflected: it changes as the user toggles items, so a server re-render or a history snapshot sees what is open. Item values therefore cannot contain whitespace.
 * @attr {boolean} multiple - Lets more than one item be open at once. Without it, opening an item closes the open one.
 * @attr {"vertical" | "horizontal"} orientation - Layout axis, which picks the arrow-key pair. Defaults to `vertical`.
 * @fires {CustomEvent<{ value: string[] }>} primitiv-accordion-change - Bubbles, cancelable, fired before a user-driven toggle is applied, with every item open afterwards. Call `preventDefault()` to veto it.
 */
export class PrimitivAccordionElement extends ElementBase {
  #generatedId: string | undefined;
  /** The items open at the last reconcile, so an item opening fires primitiv-accordion-show. */
  #shown = new Set<string>();
  #rendered = false;
  readonly #controller = new AccordionController(this, this.#host());

  /**
   * Watches the subtree for parts arriving, leaving, or changing the attributes
   * the root reads. The root's own writes (role, aria-*, ids, data-*, hidden)
   * are not in the filter, so reconciling never re-triggers itself.
   */
  readonly #observer = new MutationObserver(() => this.#reconcile());

  connectedCallback(): void {
    this.#controller.connect();
    this.#observer.observe(this, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["value", "disabled", "orientation", "force-mount"],
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

  /** The open items' values, reflected as the space-separated `value` attribute. */
  get value(): string[] {
    return tokens(this.getAttribute("value"));
  }

  /** Set the open items, as an array or a space-separated string. */
  set value(next: string | readonly string[]) {
    this.setAttribute("value", typeof next === "string" ? next : next.join(" "));
  }

  /**
   * The controller's view of this element. State lives in reflected attributes;
   * a toggle is announced first, as a cancelable event, so a listener can veto
   * it — the elements' equivalent of React's controlled mode (D7).
   */
  #host(): AccordionControllerHost {
    return {
      state: () => ({
        expanded: this.value,
        multiple: this.hasAttribute("multiple"),
        orientation: this.#orientation(),
        // Stryker disable next-line StringLiteral: equivalent — core tests only for "rtl", so any other string reads as left-to-right.
        dir: this.matches(":dir(rtl)") ? "rtl" : "ltr",
      }),
      change: (value) => {
        const change = new CustomEvent("primitiv-accordion-change", {
          bubbles: true,
          cancelable: true,
          detail: { value },
        });
        if (this.dispatchEvent(change)) this.value = value;
      },
    };
  }

  #orientation(): AccordionOrientation {
    return this.getAttribute("orientation") === "horizontal" ? "horizontal" : "vertical";
  }

  #rootId(): string {
    // Stryker disable next-line UpdateOperator: equivalent — counting down yields ids just as unique.
    return this.id || (this.#generatedId ??= `${ROOT}-${++generatedIds}`);
  }

  #reconcile(): void {
    const expanded = new Set(this.value);
    const rootId = this.#rootId();
    write(this, "data-orientation", this.#orientation());

    const triggers: Array<{ value: string; element: HTMLElement; disabled: boolean }> = [];
    for (const item of owned(this, ITEM, ROOT)) {
      const value = item.getAttribute("value");
      if (value === null) {
        reportOnce(item, `<${ITEM}> needs a value, which pairs it with the root's value.`);
        continue;
      }
      const open = expanded.has(value);
      const state = open ? "open" : "closed";
      const [trigger] = owned(item, TRIGGER, ITEM);
      const [panel] = owned(item, CONTENT, ITEM);
      const button = trigger ? decoratable(trigger) : null;

      if (button) {
        const disabled = trigger.hasAttribute("disabled");
        triggers.push({ value, element: button, disabled });
        if (!button.id) button.id = deriveId(rootId, "heading", value);
        write(button, "aria-expanded", String(open));
        write(button, "aria-disabled", String(disabled));
        write(button, "data-disabled", String(disabled));
        write(button, "data-state", state);
      }

      if (panel) {
        if (!panel.id) panel.id = deriveId(rootId, "panel", value);
        const forced = panel.hasAttribute("force-mount");
        // A role the markup already has is kept: `role="none"` opts a panel
        // out of being a region landmark.
        if (!panel.hasAttribute("role")) panel.setAttribute("role", "region");
        write(panel, "aria-labelledby", button ? button.id : null);
        write(panel, "hidden", open || forced ? null : "");
        write(panel, "aria-hidden", forced && !open ? "true" : null);
        write(panel, "data-state", state);
        // An item that opens announces it, so a lazy panel can fetch its
        // content (`hx-trigger="primitiv-accordion-show once"`). The first
        // render shows what the server already rendered, so it announces nothing.
        if (this.#rendered && open && !this.#shown.has(value)) {
          panel.dispatchEvent(new CustomEvent("primitiv-accordion-show", { bubbles: true }));
        }
      }
      if (button) write(button, "aria-controls", panel ? panel.id : null);

      for (const icon of owned(item, ICON, ITEM)) {
        write(icon, "aria-hidden", "true");
        write(icon, "data-state", state);
      }
    }

    // Replace the registration wholesale: a removed item, or a trigger whose
    // child a framework re-rendered, simply is not registered again.
    this.#controller.setTriggers(triggers);
    this.#shown = expanded;
    this.#rendered = true;
  }
}

/** The `selector` parts inside `scope` that belong to it, not to a nested `owner`. */
function owned(scope: HTMLElement, selector: string, owner: string): HTMLElement[] {
  return [...scope.querySelectorAll<HTMLElement>(selector)].filter((part) => part.closest(owner) === scope);
}

/**
 * `<primitiv-accordion-item>` — one collapsible section. Structural: it pairs a
 * trigger and a panel and carries the value the root's `value` lists.
 *
 * @customElement primitiv-accordion-item
 * @attr {string} value - The item's value, listed in the root's `value` while it is open. No whitespace.
 */
export class PrimitivAccordionItemElement extends ElementBase {}

/**
 * `<primitiv-accordion-trigger>` — an interactive part. It decorates exactly one
 * child the consumer writes, a `<button>`, which receives `aria-expanded`,
 * `aria-controls` and the state attributes, so the rendered DOM matches React's
 * `<button aria-expanded>` (RFC 0033 D24). Put it inside a heading.
 *
 * @customElement primitiv-accordion-trigger
 * @attr {boolean} disabled - Marks the item disabled: the button stays focusable but never toggles, and the arrow keys skip it.
 */
export class PrimitivAccordionTriggerElement extends ElementBase {}

/**
 * `<primitiv-accordion-content>` — an item's panel. Structural: the root writes
 * its ARIA and hides it while the item is closed.
 *
 * @customElement primitiv-accordion-content
 * @attr {boolean} force-mount - Never sets `hidden`, so styles can animate the panel open and closed; `aria-hidden` hides it from assistive technology while closed instead.
 * @fires {CustomEvent} primitiv-accordion-show - Bubbles from the panel as its item opens (not on first render), so a lazy panel can fetch its content.
 */
export class PrimitivAccordionContentElement extends ElementBase {}

/**
 * `<primitiv-accordion-trigger-icon>` — a decorative indicator inside the
 * trigger's button. The root hides it from assistive technology and mirrors its
 * item's `data-state`, for a chevron that flips.
 *
 * @customElement primitiv-accordion-trigger-icon
 */
export class PrimitivAccordionTriggerIconElement extends ElementBase {}

/**
 * Define the five Accordion elements on `registry` (the global `customElements`
 * by default). Safe to call more than once, and a no-op where there is no
 * registry (a server render).
 */
export function defineAccordion(registry: ElementRegistry | undefined = globalThis.customElements): void {
  defineElements(registry, [
    [ROOT, PrimitivAccordionElement],
    [ITEM, PrimitivAccordionItemElement],
    [TRIGGER, PrimitivAccordionTriggerElement],
    [CONTENT, PrimitivAccordionContentElement],
    [ICON, PrimitivAccordionTriggerIconElement],
  ]);
}
