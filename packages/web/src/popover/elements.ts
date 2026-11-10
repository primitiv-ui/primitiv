import { defineElements, ElementBase, reportOnce, write, type ElementRegistry } from "../internal/element.ts";
import { PrimitivRootElement } from "../internal/RootElement.ts";
import { PopoverController, type PopoverControllerHost } from "./PopoverController.ts";

export type { ElementRegistry };

// Stryker disable StringLiteral: static — evaluated once at import, so runtime mutant switching never reaches them; the names are pinned by the definePopover registry test instead.
const ROOT = "primitiv-popover";
const TRIGGER = "primitiv-popover-trigger";
const ANCHOR = "primitiv-popover-anchor";
const CONTENT = "primitiv-popover-content";
const TITLE = "primitiv-popover-title";
const DESCRIPTION = "primitiv-popover-description";
const CLOSE = "primitiv-popover-close";
// Stryker restore StringLiteral

/**
 * The one element child `part` decorates — the `<button>`, heading or anchor
 * element the consumer writes — or `null`, reported once, when it has anything
 * but exactly one (RFC 0033 D24). `what` names the child in the report.
 */
function decoratable(part: HTMLElement, what: string): HTMLElement | null {
  if (part.childElementCount === 1) return part.firstElementChild as HTMLElement;
  reportOnce(part, `<${part.localName}> needs exactly one element child (${what}) to decorate.`);
  return null;
}

/**
 * `<primitiv-popover>` — the state owner of a non-modal popover: a trigger
 * that opens a floating panel, built on the native Popover API. The browser
 * puts the panel in the top layer and light-dismisses it; the element adds the
 * rest of the WAI-ARIA non-modal dialog pattern — focus moves into the panel
 * as it opens, Escape closes it and hands focus back to the trigger, and the
 * trigger's `aria-expanded` follows it.
 *
 * The panel is shown with its trigger (or the anchor) as its source, which
 * makes that element the panel's implicit anchor, so CSS anchor positioning
 * (`position-area`) places it with no `anchor-name` to wire.
 *
 * The root finds its own parts, so a popover nested in a panel keeps its own,
 * and reconciles their ARIA from its reflected state whenever a part arrives,
 * leaves, or changes an attribute the root reads (the lifecycle is
 * `PrimitivRootElement`'s).
 *
 * @customElement primitiv-popover
 * @summary The state owner of a non-modal popover on the native Popover API.
 * @attr {boolean} open - Whether the panel is open. Reflected: it changes as the user opens and dismisses it, so a server re-render or a history snapshot sees the live state. Set it (or the `open` property) to open or close the panel from script.
 * @fires {CustomEvent<{ open: boolean }>} primitiv-popover-change - Bubbles, cancelable, fired before a user-driven change is applied — a trigger or close click, Escape, or a light dismiss — with the open state afterwards. Call `preventDefault()` to veto it.
 */
export class PrimitivPopoverElement extends PrimitivRootElement {
  /** The panel the root currently decorates, and the controller over it. */
  #content: HTMLElement | null = null;
  #popover: PopoverController | null = null;
  /** The decorated trigger and close buttons, and the anchor, as of the last reconcile. */
  #trigger: HTMLElement | null = null;
  #anchor: HTMLElement | null = null;
  // Stryker disable next-line ArrayDeclaration: equivalent — the first reconcile runs as the root connects, before any click can reach it, and replaces it.
  #closers: HTMLElement[] = [];
  /** The root's own click listener, while connected. */
  #listening: AbortController | null = null;
  protected readonly controller: { connect(): void; disconnect(): void } = {
    connect: (): void => this.#connect(),
    disconnect: (): void => this.#disconnect(),
  };
  protected readonly reconcileOn: readonly string[] = ["open"];

  /** Whether the panel is open, reflected as the boolean `open` attribute. */
  get open(): boolean {
    return this.hasAttribute("open");
  }

  set open(next: boolean) {
    this.toggleAttribute("open", next);
  }

  /** The controller's view of this element: state lives in the reflected attribute. */
  #host(): PopoverControllerHost {
    return {
      state: () => ({ open: this.open }),
      change: (open) => this.#change(open),
      trigger: () => this.#trigger,
      source: () => this.#anchor ?? this.#trigger,
    };
  }

  /** A change the user asked for: announced first, so a listener can veto it. */
  #change(open: boolean): void {
    if (open === this.open) return;
    if (this.announce("primitiv-popover-change", { open })) this.open = open;
    // A veto can leave the panel out of step — the browser is light-dismissing
    // it — so put it back where the state says, once that dismissal is done.
    else queueMicrotask(() => this.#popover?.sync());
  }

  #connect(): void {
    this.#listening = new AbortController();
    this.addEventListener("click", (event) => this.#click(event), { signal: this.#listening.signal });
    this.#popover?.connect();
  }

  #disconnect(): void {
    // A root disconnects only after it connected, so it is listening.
    (this.#listening as AbortController).abort();
    this.#listening = null;
    this.#popover?.disconnect();
  }

  #click(event: MouseEvent): void {
    const target = event.target as Node;
    if (this.#trigger?.contains(target)) this.#change(!this.open);
    else if (this.#closers.some((button) => button.contains(target))) this.#change(false);
  }

  /**
   * Decorate `content` from now on: the controller follows it. Only a
   * reconcile calls this, and a root reconciles only while connected, so the
   * new controller listens at once.
   */
  #use(content: HTMLElement | null): void {
    // Stryker disable next-line ConditionalExpression: equivalent — rebuilding the controller over the same panel swaps one listener set for an identical one.
    if (content === this.#content) return;
    this.#popover?.disconnect();
    this.#content = content;
    this.#popover = content ? new PopoverController(content, this.#host()) : null;
    this.#popover?.connect();
  }

  protected reconcile(): void {
    const open = this.open;
    const state = open ? "open" : "closed";
    const rootId = this.rootId();
    write(this, "data-state", state);

    const [content = null] = this.parts(CONTENT);
    const [triggerPart] = this.parts(TRIGGER);
    const [anchorPart] = this.parts(ANCHOR);
    const [titlePart] = this.parts(TITLE);
    const [descriptionPart] = this.parts(DESCRIPTION);
    this.#trigger = triggerPart ? decoratable(triggerPart, "a <button>") : null;
    this.#anchor = anchorPart ? decoratable(anchorPart, "the element to anchor to") : null;
    const title = titlePart ? decoratable(titlePart, "a heading") : null;
    const description = descriptionPart ? decoratable(descriptionPart, "a <p>") : null;

    if (title && !title.id) title.id = `${rootId}-title`;
    if (description && !description.id) description.id = `${rootId}-description`;
    if (content) {
      if (!content.id) content.id = `${rootId}-content`;
      write(content, "role", "dialog");
      if (!content.hasAttribute("popover")) content.setAttribute("popover", "auto");
      write(content, "tabindex", "-1");
      write(content, "data-state", state);
      write(content, "aria-labelledby", title ? title.id : null);
      write(content, "aria-describedby", description ? description.id : null);
    }

    if (this.#trigger) {
      write(this.#trigger, "aria-haspopup", "dialog");
      write(this.#trigger, "aria-expanded", String(open));
      write(this.#trigger, "aria-controls", content ? content.id : null);
    }
    this.#closers = this.parts(CLOSE).flatMap((part) => decoratable(part, "a <button>") ?? []);

    this.#use(content);
    this.#popover?.sync();
  }
}

/**
 * `<primitiv-popover-trigger>` — an interactive part. It decorates exactly one
 * child the consumer writes, a `<button>`, which toggles the panel and receives
 * `aria-haspopup="dialog"`, `aria-expanded` and `aria-controls`, so the
 * rendered DOM matches React's (RFC 0033 D24).
 *
 * @customElement primitiv-popover-trigger
 */
export class PrimitivPopoverTriggerElement extends ElementBase {}

/**
 * `<primitiv-popover-anchor>` — optional. It decorates exactly one element the
 * consumer writes, which the panel is anchored to in place of the trigger: a
 * field, say, whose trigger is an icon inside it.
 *
 * @customElement primitiv-popover-anchor
 */
export class PrimitivPopoverAnchorElement extends ElementBase {}

/**
 * `<primitiv-popover-content>` — the panel. Structural: the root gives it an
 * id, `role="dialog"`, `popover="auto"` (write it in your markup too, so the
 * panel is hidden before the script loads), `tabindex="-1"`, `data-state`, and
 * `aria-labelledby` / `aria-describedby` pointing at the title and description.
 *
 * @customElement primitiv-popover-content
 */
export class PrimitivPopoverContentElement extends ElementBase {}

/**
 * `<primitiv-popover-title>` — decorates exactly one heading the consumer
 * writes, whose id becomes the panel's `aria-labelledby`.
 *
 * @customElement primitiv-popover-title
 */
export class PrimitivPopoverTitleElement extends ElementBase {}

/**
 * `<primitiv-popover-description>` — decorates exactly one element the
 * consumer writes (a `<p>`, usually), whose id becomes the panel's
 * `aria-describedby`.
 *
 * @customElement primitiv-popover-description
 */
export class PrimitivPopoverDescriptionElement extends ElementBase {}

/**
 * `<primitiv-popover-close>` — an interactive part. It decorates exactly one
 * `<button>` the consumer writes, which closes the panel. A popover may have
 * several.
 *
 * @customElement primitiv-popover-close
 */
export class PrimitivPopoverCloseElement extends ElementBase {}

/**
 * Define the seven Popover elements on `registry` (the global `customElements`
 * by default). Safe to call more than once, and a no-op where there is no
 * registry (a server render).
 */
export function definePopover(registry: ElementRegistry | undefined = globalThis.customElements): void {
  defineElements(registry, [
    [ROOT, PrimitivPopoverElement],
    [TRIGGER, PrimitivPopoverTriggerElement],
    [ANCHOR, PrimitivPopoverAnchorElement],
    [CONTENT, PrimitivPopoverContentElement],
    [TITLE, PrimitivPopoverTitleElement],
    [DESCRIPTION, PrimitivPopoverDescriptionElement],
    [CLOSE, PrimitivPopoverCloseElement],
  ]);
}
