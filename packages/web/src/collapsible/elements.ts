import { defineElements, ElementBase, reportOnce, write, type ElementRegistry } from "../internal/element.ts";
import { PrimitivRootElement } from "../internal/RootElement.ts";
import { CollapsibleController, type CollapsibleControllerHost } from "./CollapsibleController.ts";

export type { ElementRegistry };

// Stryker disable StringLiteral: static — evaluated once at import, so runtime mutant switching never reaches them; the names are pinned by the defineCollapsible registry test instead.
const ROOT = "primitiv-collapsible";
const TRIGGER = "primitiv-collapsible-trigger";
const CONTENT = "primitiv-collapsible-content";
const ICON = "primitiv-collapsible-trigger-icon";
const HEIGHT = "--primitiv-collapsible-collapsed-height";
// Stryker restore StringLiteral

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

/** A `collapsed-height` as a CSS length: a bare number is pixels, anything else is used verbatim. */
function cssLength(value: string): string {
  return Number.isNaN(Number(value)) ? value : `${value}px`;
}

/** Set or remove (`""`) a custom property, only when it would change (D20). */
function writeProperty(element: HTMLElement, name: string, value: string): void {
  if (element.style.getPropertyValue(name) === value) return;
  // Setting the empty string removes the property (CSSOM).
  element.style.setProperty(name, value);
  // Removing the last property leaves `style=""` behind; drop it.
  if (element.getAttribute("style") === "") element.removeAttribute("style");
}

/**
 * `<primitiv-collapsible>` — the state owner of a single disclosure: a trigger
 * that shows and hides one panel.
 *
 * The root finds its own parts, so a collapsible nested in a panel keeps its
 * own, and reconciles their ARIA from its reflected state whenever a part
 * arrives, leaves, or changes an attribute the root reads (the lifecycle is
 * `PrimitivRootElement`'s).
 *
 * @customElement primitiv-collapsible
 * @summary The state owner of a single disclosure: a trigger that shows and hides one panel.
 * @attr {boolean} open - Whether the panel is open. Reflected: it changes as the user toggles, so a server re-render or a history snapshot sees the live state.
 * @attr {boolean} disabled - Disables the collapsible: the trigger's button stays focusable, is marked `aria-disabled`, and never toggles.
 * @fires {CustomEvent<{ open: boolean }>} primitiv-collapsible-change - Bubbles, cancelable, fired before a user-driven toggle is applied, with the open state afterwards. Call `preventDefault()` to veto it.
 */
export class PrimitivCollapsibleElement extends PrimitivRootElement {
  /**
   * Whether the panel was open at the last reconcile, so opening fires
   * primitiv-collapsible-show; `undefined` until the first render.
   */
  #shown: boolean | undefined;
  protected readonly controller: CollapsibleController = new CollapsibleController(this, this.#host());
  protected readonly reconcileOn: readonly string[] = ["open", "disabled", "force-mount", "collapsed-height"];

  /** Whether the panel is open, reflected as the boolean `open` attribute. */
  get open(): boolean {
    return this.hasAttribute("open");
  }

  set open(next: boolean) {
    this.toggleAttribute("open", next);
  }

  /** The controller's view of this element: state lives in reflected attributes. */
  #host(): CollapsibleControllerHost {
    return {
      state: () => ({ open: this.open }),
      change: (open) => {
        if (this.announce("primitiv-collapsible-change", { open })) this.open = open;
      },
    };
  }

  protected reconcile(): void {
    const open = this.open;
    const state = open ? "open" : "closed";
    const disabled = this.hasAttribute("disabled");
    const rootId = this.rootId();
    write(this, "data-state", state);
    write(this, "data-disabled", String(disabled));

    const [trigger] = this.parts(TRIGGER);
    const [panel] = this.parts(CONTENT);
    const button = trigger ? decoratable(trigger) : null;

    if (button) {
      if (!button.id) button.id = `${rootId}-trigger`;
      write(button, "aria-expanded", String(open));
      write(button, "aria-disabled", disabled ? "true" : null);
      write(button, "data-disabled", String(disabled));
      write(button, "data-state", state);
    }

    if (panel) {
      if (!panel.id) panel.id = `${rootId}-content`;
      const height = panel.getAttribute("collapsed-height");
      // A clamped preview is real, readable content while closed, so it is
      // never hidden; a force-mount panel stays rendered so styles can animate it.
      const clamped = height !== null;
      const mounted = clamped || panel.hasAttribute("force-mount");
      write(panel, "hidden", open || mounted ? null : "");
      // Every closed panel but a preview, not only a force-mount one: a
      // stylesheet that animates the panel gives it a display that wins over
      // `hidden` (the registry's does), which would leave it exposed.
      write(panel, "aria-hidden", open || clamped ? null : "true");
      write(panel, "data-state", state);
      write(panel, "data-disabled", String(disabled));
      write(panel, "data-clamped", clamped ? "true" : null);
      writeProperty(panel, HEIGHT, clamped ? cssLength(height) : "");
      // Opening announces it, so a lazy panel can fetch its content
      // (`hx-trigger="primitiv-collapsible-show once"`). The first render shows
      // what the server already rendered, so it announces nothing.
      if (open && this.#shown === false) {
        panel.dispatchEvent(new CustomEvent("primitiv-collapsible-show", { bubbles: true }));
      }
    }
    if (button) write(button, "aria-controls", panel ? panel.id : null);

    for (const icon of this.parts(ICON)) {
      write(icon, "aria-hidden", "true");
      write(icon, "data-state", state);
    }

    // Replace the registration wholesale: a trigger whose child was re-rendered
    // simply is not registered again.
    // Stryker disable next-line StringLiteral: equivalent — a collapsible has one trigger, so its value is never read.
    this.controller.setTriggers(button ? [{ value: "trigger", element: button, disabled }] : []);
    this.#shown = open;
  }
}

/**
 * `<primitiv-collapsible-trigger>` — an interactive part. It decorates exactly
 * one child the consumer writes, a `<button>`, which receives `aria-expanded`,
 * `aria-controls` and the state attributes, so the rendered DOM matches React's
 * `<button aria-expanded>` (RFC 0033 D24).
 *
 * @customElement primitiv-collapsible-trigger
 */
export class PrimitivCollapsibleTriggerElement extends ElementBase {}

/**
 * `<primitiv-collapsible-content>` — the panel. Structural: the root writes its
 * id and state and hides it while closed.
 *
 * @customElement primitiv-collapsible-content
 * @attr {boolean} force-mount - Never sets `hidden`, so styles can animate the panel open and closed. A closed panel always carries `aria-hidden`, so it stays out of the accessibility tree either way.
 * @attr {string} collapsed-height - Shows a clamped preview while closed instead of hiding the panel (the read-more pattern). A bare number is pixels; anything else is a CSS length, used verbatim. Published as the `--primitiv-collapsible-collapsed-height` custom property, with `data-clamped="true"`; the panel is never hidden, since the preview is real content.
 * @fires {CustomEvent} primitiv-collapsible-show - Bubbles from the panel as it opens (not on first render), so a lazy panel can fetch its content.
 */
export class PrimitivCollapsibleContentElement extends ElementBase {}

/**
 * `<primitiv-collapsible-trigger-icon>` — a decorative indicator, usually inside
 * the trigger's button. The root hides it from assistive technology and mirrors
 * the `data-state`, for a chevron that flips.
 *
 * @customElement primitiv-collapsible-trigger-icon
 */
export class PrimitivCollapsibleTriggerIconElement extends ElementBase {}

/**
 * Define the four Collapsible elements on `registry` (the global
 * `customElements` by default). Safe to call more than once, and a no-op where
 * there is no registry (a server render).
 */
export function defineCollapsible(registry: ElementRegistry | undefined = globalThis.customElements): void {
  defineElements(registry, [
    [ROOT, PrimitivCollapsibleElement],
    [TRIGGER, PrimitivCollapsibleTriggerElement],
    [CONTENT, PrimitivCollapsibleContentElement],
    [ICON, PrimitivCollapsibleTriggerIconElement],
  ]);
}
