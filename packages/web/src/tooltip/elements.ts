import { defineElements, ElementBase, reportOnce, write, type ElementRegistry } from "../internal/element.ts";
import { PrimitivRootElement } from "../internal/RootElement.ts";
import { TooltipController, type TooltipControllerHost } from "./TooltipController.ts";
import { TooltipGroup } from "./TooltipGroup.ts";

export type { ElementRegistry };

// Stryker disable StringLiteral: static — evaluated once at import, so runtime mutant switching never reaches them; the names are pinned by the defineTooltip registry test instead.
const ROOT = "primitiv-tooltip";
const PROVIDER = "primitiv-tooltip-provider";
const TRIGGER = "primitiv-tooltip-trigger";
const CONTENT = "primitiv-tooltip-content";
const ARROW = "primitiv-tooltip-arrow";
// Stryker restore StringLiteral

/** React's `Tooltip.Provider` defaults, for a tooltip and a provider that set none. */
const DEFAULT_DELAY = 700;
const DEFAULT_SKIP_DELAY = 300;

/** A numeric attribute in milliseconds, or `fallback` when it is absent or not a number. */
function milliseconds(element: Element, name: string, fallback: number): number {
  const value = Number(element.getAttribute(name) ?? Number.NaN);
  return Number.isNaN(value) ? fallback : value;
}

/** The skip-delay window every tooltip outside a provider shares. */
// Stryker disable next-line ArrowFunction: static — created once at import, so runtime mutant switching never reaches it; the 300ms window is pinned by the skip-delay interaction tests.
const documentGroup = new TooltipGroup(() => DEFAULT_SKIP_DELAY);

/** A popover panel's `showPopover`, with the `source` option the DOM typings may not know yet. */
type Showable = HTMLElement & { showPopover(options?: { source: HTMLElement }): void };

/**
 * `<primitiv-tooltip-provider>` — optional. The tooltips inside it share one
 * skip-delay window and its default delay, as inside React's
 * `Tooltip.Provider`; tooltips outside any provider share a document-wide one.
 *
 * @customElement primitiv-tooltip-provider
 * @attr {number} delay-duration - How long, in milliseconds, a pointer rests on a trigger before its tooltip opens. Default 700. A tooltip's own `delay-duration` overrides it.
 * @attr {number} skip-delay-duration - How long, in milliseconds, after one tooltip closes that hovering another opens it at once. Default 300.
 */
export class PrimitivTooltipProviderElement extends ElementBase {
  #group: TooltipGroup | undefined;

  /** The skip-delay window this provider's tooltips share, created on first use. */
  get group(): TooltipGroup {
    return (this.#group ??= new TooltipGroup(() => milliseconds(this, "skip-delay-duration", DEFAULT_SKIP_DELAY)));
  }
}

/**
 * `<primitiv-tooltip>` — the state owner of a tooltip: a short description of
 * its trigger that appears on hover after a delay, and at once on focus. It
 * closes when the pointer leaves (after a moment, so it can be reached),
 * on blur, on Escape and on a press outside. Moving from one trigger to the
 * next opens each next tooltip at once (the skip delay). The tooltip is shown
 * as a `popover="manual"` in the top layer, with the trigger as its source,
 * which makes the trigger its implicit anchor for CSS anchor positioning.
 *
 * The root finds its own parts and reconciles their ARIA from its reflected
 * state whenever a part arrives, leaves, or changes an attribute the root
 * reads (the lifecycle is `PrimitivRootElement`'s).
 *
 * @customElement primitiv-tooltip
 * @summary The state owner of a tooltip, shown on hover and focus.
 * @attr {boolean} open - Whether the tooltip is showing. Reflected: it changes as the user hovers, focuses and dismisses it. Set it (or the `open` property) to show or hide it from script.
 * @attr {number} delay-duration - How long, in milliseconds, a pointer rests on the trigger before the tooltip opens. Defaults to the provider's, or 700. Focus always opens it at once.
 * @attr {boolean} disable-hoverable-content - Close as soon as the pointer leaves the trigger, rather than giving it a moment to reach the tooltip.
 * @fires {CustomEvent<{ open: boolean }>} primitiv-tooltip-change - Bubbles, cancelable, fired before a user-driven change is applied — hover, focus, blur, Escape or a press outside — with the open state afterwards. Call `preventDefault()` to veto it.
 */
export class PrimitivTooltipElement extends PrimitivRootElement {
  /** The decorated trigger button and the tooltip, as of the last reconcile. */
  #trigger: HTMLElement | null = null;
  #content: HTMLElement | null = null;
  /** The tooltip this root has shown, while it shows. */
  #shown: HTMLElement | null = null;
  /** The listeners on the trigger and the tooltip, rebuilt when either changes. */
  #bindings: AbortController | null = null;
  readonly #tooltip = new TooltipController(this.#host());
  protected readonly controller: { connect(): void; disconnect(): void } = {
    connect: (): void => {},
    disconnect: (): void => this.#disconnect(),
  };
  protected readonly reconcileOn: readonly string[] = ["open"];

  /** Whether the tooltip is showing, reflected as the boolean `open` attribute. */
  get open(): boolean {
    return this.hasAttribute("open");
  }

  set open(next: boolean) {
    this.toggleAttribute("open", next);
  }

  /** The controller's view of this element: state lives in the reflected attribute. */
  #host(): TooltipControllerHost {
    const provider = () => this.closest<PrimitivTooltipProviderElement>(PROVIDER);
    return {
      state: () => ({ open: this.open }),
      change: (open) => {
        // The controller reports every close it is asked for; announce a real change only.
        if (open !== this.open && this.announce("primitiv-tooltip-change", { open })) this.open = open;
      },
      delay: () => {
        const fallback = provider();
        return milliseconds(this, "delay-duration", fallback ? milliseconds(fallback, "delay-duration", DEFAULT_DELAY) : DEFAULT_DELAY);
      },
      tooltipGroup: () => provider()?.group ?? documentGroup,
      content: () => this.#content,
      anchor: () => this.#trigger,
    };
  }

  #disconnect(): void {
    // An open tooltip that leaves would hold its group's skip window open for
    // good, opening every later tooltip at once: close the window instead.
    if (this.open) this.#host().tooltipGroup().closed();
    this.#bindings?.abort();
    this.#bindings = null;
    this.#trigger = null;
    this.#content = null;
    // Leaving the document hides a popover with no event: show it again on the next connect.
    this.#shown = null;
    this.#tooltip.disconnect();
  }

  /** Listen on `trigger` and `content`, rebinding only when either changed. */
  #bind(trigger: HTMLElement | null, content: HTMLElement | null): void {
    // Stryker disable next-line ConditionalExpression: equivalent — rebinding the same elements swaps one listener set for an identical one.
    if (trigger === this.#trigger && content === this.#content) return;
    this.#bindings?.abort();
    this.#bindings = new AbortController();
    this.#trigger = trigger;
    this.#content = content;
    const options = { signal: this.#bindings.signal };
    const tooltip = this.#tooltip;
    trigger?.addEventListener("pointerenter", () => tooltip.hoverStart(), options);
    trigger?.addEventListener(
      "pointerleave",
      () => (this.hasAttribute("disable-hoverable-content") ? tooltip.closeNow() : tooltip.hoverEnd()),
      options,
    );
    trigger?.addEventListener("focus", () => tooltip.openNow(), options);
    trigger?.addEventListener("blur", () => tooltip.closeNow(), options);
    content?.addEventListener("pointerenter", () => tooltip.holdOpen(), options);
    content?.addEventListener("pointerleave", () => tooltip.closeNow(), options);
  }

  protected reconcile(): void {
    const open = this.open;
    const state = open ? "open" : "closed";
    write(this, "data-state", state);

    const [triggerPart] = this.parts(TRIGGER);
    const [content = null] = this.parts(CONTENT);
    const trigger = triggerPart ? decoratable(triggerPart) : null;

    if (content) {
      if (!content.id) content.id = `${this.rootId()}-content`;
      write(content, "role", "tooltip");
      if (!content.hasAttribute("popover")) content.setAttribute("popover", "manual");
      write(content, "data-state", state);
    }
    if (trigger) {
      write(trigger, "aria-describedby", content ? content.id : null);
      write(trigger, "data-state", state);
    }

    this.#bind(trigger, content);
    this.#show(open ? content : null);
    this.#tooltip.sync();
  }

  /** Show `content` (anchored to the trigger), or hide what is showing when it is `null`. */
  #show(content: HTMLElement | null): void {
    if (content === this.#shown) return;
    // Stryker disable next-line ConditionalExpression: equivalent — hiding nothing throws inside the try below, which swallows it.
    if (this.#shown) {
      try {
        this.#shown.hidePopover();
      } catch {
        // Already hidden, or no longer a popover.
      }
    }
    this.#shown = content;
    if (!content) return;
    const showable = content as Showable;
    if (this.#trigger) showable.showPopover({ source: this.#trigger });
    else showable.showPopover();
  }
}

/** The one `<button>` a trigger decorates, or `null`, reported once, without exactly one element child. */
function decoratable(trigger: HTMLElement): HTMLElement | null {
  if (trigger.childElementCount === 1) return trigger.firstElementChild as HTMLElement;
  reportOnce(trigger, `<${TRIGGER}> needs exactly one element child (a <button>) to decorate.`);
  return null;
}

/**
 * `<primitiv-tooltip-trigger>` — an interactive part. It decorates exactly one
 * child the consumer writes, a `<button>`, which opens the tooltip on hover and
 * focus and is described by it (`aria-describedby`), so the rendered DOM
 * matches React's (RFC 0033 D24).
 *
 * @customElement primitiv-tooltip-trigger
 */
export class PrimitivTooltipTriggerElement extends ElementBase {}

/**
 * `<primitiv-tooltip-content>` — the tooltip itself. Structural: the root
 * gives it an id, `role="tooltip"`, `popover="manual"` (write it in your markup
 * too, so it is hidden before the script loads) and `data-state`.
 *
 * @customElement primitiv-tooltip-content
 */
export class PrimitivTooltipContentElement extends ElementBase {}

/**
 * `<primitiv-tooltip-arrow>` — an optional, decorative pointer, inside the
 * content. The element writes nothing on it; style it as you like.
 *
 * @customElement primitiv-tooltip-arrow
 */
export class PrimitivTooltipArrowElement extends ElementBase {}

/**
 * Define the five Tooltip elements on `registry` (the global `customElements`
 * by default). Safe to call more than once, and a no-op where there is no
 * registry (a server render).
 */
export function defineTooltip(registry: ElementRegistry | undefined = globalThis.customElements): void {
  defineElements(registry, [
    [ROOT, PrimitivTooltipElement],
    [PROVIDER, PrimitivTooltipProviderElement],
    [TRIGGER, PrimitivTooltipTriggerElement],
    [CONTENT, PrimitivTooltipContentElement],
    [ARROW, PrimitivTooltipArrowElement],
  ]);
}
