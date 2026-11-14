import {
  navigationMenuIds,
  navigationMenuIndicatorGeometry,
  navigationMenuPanelMotion,
  type NavigationMenuOrientation,
} from "@primitiv-ui/core";

import { defineElements, ElementBase, reportOnce, write, type ElementRegistry } from "../internal/element.ts";
import { PrimitivRootElement } from "../internal/RootElement.ts";
import { NavigationMenuController, type NavigationMenuControllerHost } from "./NavigationMenuController.ts";

export type { ElementRegistry };

// Stryker disable StringLiteral: static — evaluated once at import, so runtime mutant switching never reaches them; the names are pinned by the defineNavigationMenu registry test instead.
const ROOT = "primitiv-navigation-menu";
const LIST = "primitiv-navigation-menu-list";
const ITEM = "primitiv-navigation-menu-item";
const TRIGGER = "primitiv-navigation-menu-trigger";
const CONTENT = "primitiv-navigation-menu-content";
const VIEWPORT = "primitiv-navigation-menu-viewport";
const INDICATOR = "primitiv-navigation-menu-indicator";
const LINK = "primitiv-navigation-menu-link";
// Stryker restore StringLiteral

/** React's `NavigationMenu.Root` defaults, for a root that sets none. */
const DEFAULT_DELAY = 200;
const DEFAULT_CLOSE_DELAY = 150;

/** A numeric attribute in milliseconds, or `fallback` when it is absent or not a number. */
function milliseconds(element: Element, name: string, fallback: number): number {
  const value = Number(element.getAttribute(name) ?? Number.NaN);
  return Number.isNaN(value) ? fallback : value;
}

/** Set a custom property only when it would change: `null` removes it. */
function publish(element: HTMLElement, name: string, value: string | null): void {
  // A null value removes the property.
  if (element.style.getPropertyValue(name) !== (value ?? "")) element.style.setProperty(name, value);
}

/** The one element child an interactive part decorates, or `null`, reported once. */
function decoratable(part: HTMLElement, what: string): HTMLElement | null {
  if (part.childElementCount === 1) return part.firstElementChild as HTMLElement;
  reportOnce(part, `<${part.localName}> needs exactly one element child (${what}) to decorate.`);
  return null;
}

/** A disclosure entry as of a scan: its trigger's button and its panel. */
type Entry = { button?: HTMLElement | null; panel?: HTMLElement };

/** Everything the root decorates, read fresh from the DOM — parts are never cached. */
type Scan = {
  entries: Map<string, Entry>;
  /** Decorated links: the anchor, and whether it is a top-level entry. */
  links: Array<{ part: HTMLElement; anchor: HTMLElement; top: boolean }>;
};

/**
 * `<primitiv-navigation-menu>` — the state owner of a site navigation: a bar
 * of top-level entries, each a plain link or a trigger that discloses a panel,
 * with one panel open at a time. It is the WAI-ARIA *Disclosure Navigation
 * Menu*, not a menubar: every top-level entry stays in the Tab order, the
 * arrows only move focus between them, and there are no menu roles.
 *
 * The root is the `navigation` landmark, named "Main" unless it carries an
 * `aria-label` or `aria-labelledby`. It owns the hover intent (`open-on-hover`,
 * `delay-duration`, `close-delay`) and the one Escape handler, and reconciles
 * every part from its reflected `value` whenever a part arrives, leaves, or
 * changes an attribute it reads (the lifecycle is `PrimitivRootElement`'s).
 *
 * @customElement primitiv-navigation-menu
 * @summary The state owner of a disclosure site navigation.
 * @attr {string} value - The open entry's `value`, or absent while nothing is open. Reflected: it changes as the user opens and closes panels, so a server re-render or a history snapshot sees the live state. Set it (or the `value` property, where `""` closes) to open an entry from script.
 * @attr {"horizontal" | "vertical"} orientation - The bar's axis, which picks the arrow-key pair. Defaults to `horizontal`.
 * @attr {"false"} open-on-hover - Set to `false` for a click-only menu. Hover opens a panel by default.
 * @attr {number} delay-duration - How long, in milliseconds, the pointer rests on a trigger before the first panel opens. Default 200; once a panel is open, hovering a sibling swaps at once.
 * @attr {number} close-delay - How long, in milliseconds, after the pointer leaves the nav that the open panel closes. Default 150.
 * @fires {CustomEvent<{ value: string }>} primitiv-navigation-menu-change - Bubbles, cancelable, fired before a user-driven change is applied — a click, hover, key, Escape, focus leaving or a followed link — with the open entry afterwards (`""` for none). Call `preventDefault()` to veto it.
 */
export class PrimitivNavigationMenuElement extends PrimitivRootElement {
  readonly #nav: NavigationMenuController = new NavigationMenuController(this.#host());
  /** The open value as of the last reconcile, and the one before it changed, for the panels' motion. */
  #tracked: string | undefined;
  #previous: string | undefined;
  /** The root's own listeners, while connected. */
  #listening: AbortController | null = null;
  /** The pending re-measure of the viewport, a frame after a panel opens. */
  #frame = 0;
  protected readonly controller: { connect(): void; disconnect(): void } = {
    connect: (): void => this.#connect(),
    disconnect: (): void => this.#disconnect(),
  };
  protected readonly reconcileOn: readonly string[] = ["value", "orientation", "active", "force-mount"];

  /** The open entry's value, `""` while nothing is open, reflected as the `value` attribute. */
  get value(): string {
    return this.getAttribute("value") ?? "";
  }

  set value(next: string) {
    if (next === "") this.removeAttribute("value");
    else this.setAttribute("value", next);
  }

  #orientation(): NavigationMenuOrientation {
    return this.getAttribute("orientation") === "vertical" ? "vertical" : "horizontal";
  }

  /** The controller's view of this element: state lives in reflected attributes. */
  #host(): NavigationMenuControllerHost {
    return {
      state: () => ({
        value: this.value,
        orientation: this.#orientation(),
        dir: this.direction(),
        openOnHover: this.getAttribute("open-on-hover") !== "false",
        delay: milliseconds(this, "delay-duration", DEFAULT_DELAY),
        closeDelay: milliseconds(this, "close-delay", DEFAULT_CLOSE_DELAY),
      }),
      change: (value) => {
        if (value !== this.value && this.announce("primitiv-navigation-menu-change", { value })) this.value = value;
      },
      trigger: (value) => this.#scan().entries.get(value)?.button ?? null,
      panel: (value) => this.#scan().entries.get(value)?.panel ?? null,
      entries: () => this.#topLevel(this.#scan()),
    };
  }

  /** Every top-level entry — trigger buttons and plain links — in DOM order. */
  #topLevel(scan: Scan): HTMLElement[] {
    const buttons = [...scan.entries.values()].flatMap(({ button }) => button ?? []);
    const links = scan.links.flatMap(({ anchor, top }) => (top ? [anchor] : []));
    return [...buttons, ...links].sort((a, b) =>
      a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
    );
  }

  #scan(): Scan {
    const entries = new Map<string, Entry>();
    const entry = (value: string): Entry => {
      let found = entries.get(value);
      if (!found) entries.set(value, (found = {}));
      return found;
    };
    for (const part of this.parts(TRIGGER)) {
      const value = part.closest(ITEM)?.getAttribute("value") ?? null;
      if (value === null) {
        reportOnce(part, `<${TRIGGER}> needs a <${ITEM}> with a value: an item without one is a plain link entry.`);
        continue;
      }
      entry(value).button = decoratable(part, "a <button>");
    }
    for (const panel of this.parts(CONTENT)) {
      const value = panel.getAttribute("value") ?? panel.closest(ITEM)?.getAttribute("value") ?? null;
      if (value === null) {
        reportOnce(panel, `<${CONTENT}> needs a value, its own or its <${ITEM}>'s, naming the entry it belongs to.`);
        continue;
      }
      entry(value).panel = panel;
    }
    const links = this.parts(LINK).flatMap((part) => {
      const anchor = decoratable(part, "an <a href>");
      return anchor ? [{ part, anchor, top: part.closest(CONTENT) === null }] : [];
    });
    return { entries, links };
  }

  #connect(): void {
    this.#listening = new AbortController();
    const options = { signal: this.#listening.signal };
    // pointerenter and pointerleave do not bubble, but they pass the root on
    // the way down: capturing them reaches each trigger, link and the root
    // itself exactly as each one's own enter and leave.
    const capture = { ...options, capture: true };
    this.addEventListener("pointerenter", (event) => this.#pointer(event, true), capture);
    this.addEventListener("pointerleave", (event) => this.#pointer(event, false), capture);
    this.addEventListener("click", (event) => this.#click(event), options);
    this.addEventListener("keydown", (event) => this.#keydown(event), options);
    this.addEventListener("focusout", (event) => this.#nav.focusOut(this, event.relatedTarget as Node | null), options);
    window.addEventListener("resize", () => this.#measure(this.#scan()), options);
    document.fonts?.addEventListener("loadingdone", () => this.#measure(this.#scan()), options);
  }

  #disconnect(): void {
    // A root disconnects only after it connected, so it is listening.
    (this.#listening as AbortController).abort();
    this.#listening = null;
    this.#nav.disconnect();
    cancelAnimationFrame(this.#frame);
  }

  #pointer(event: Event, enter: boolean): void {
    const target = event.target;
    if (target === this) {
      if (enter) this.#nav.rootPointerEnter();
      else this.#nav.rootPointerLeave();
      return;
    }
    const scan = this.#scan();
    for (const [value, { button }] of scan.entries) {
      if (button !== target) continue;
      if (enter) this.#nav.triggerPointerEnter(value);
      else this.#nav.triggerPointerLeave();
      return;
    }
    if (enter && scan.links.some(({ anchor, top }) => top && anchor === target)) this.#nav.linkPointerEnter();
  }

  #click(event: MouseEvent): void {
    const target = event.target as Node;
    const scan = this.#scan();
    for (const [value, { button }] of scan.entries) {
      if (button?.contains(target)) return this.#nav.triggerClick(value);
    }
    if (scan.links.some(({ anchor }) => anchor.contains(target))) this.#nav.linkClick();
  }

  #keydown(event: KeyboardEvent): void {
    const target = event.target as Node;
    const scan = this.#scan();
    // A key press is in at most one trigger or top-level link: neither part nests the other.
    for (const [value, { button }] of scan.entries) {
      if (button?.contains(target)) this.#nav.triggerKeydown(value, button, event);
    }
    const link = scan.links.find(({ anchor, top }) => top && anchor.contains(target));
    if (link) this.#nav.travel(link.anchor, event);
    this.#nav.rootKeydown(event);
  }

  protected reconcile(): void {
    const value = this.value;
    const orientation = this.#orientation();
    const rootId = this.rootId();
    if (value !== this.#tracked) {
      this.#previous = this.#tracked;
      this.#tracked = value;
    }
    const state = (open: boolean) => (open ? "open" : "closed");

    write(this, "role", "navigation");
    if (!this.hasAttribute("aria-label") && !this.hasAttribute("aria-labelledby")) write(this, "aria-label", "Main");
    write(this, "data-orientation", orientation);
    for (const list of this.parts(LIST)) {
      write(list, "role", "list");
      write(list, "data-orientation", orientation);
    }
    for (const item of this.parts(ITEM)) write(item, "role", "listitem");

    const scan = this.#scan();
    // The disclosure items' values in DOM order, which way a panel travels is read from.
    const values = this.parts(`${ITEM}[value]`).map((item) => item.getAttribute("value") as string);
    for (const [entryValue, { button, panel }] of scan.entries) {
      const open = entryValue === value;
      const ids = navigationMenuIds(rootId, entryValue);
      if (button && !button.id) button.id = ids.triggerId;
      if (panel && !panel.id) panel.id = ids.panelId;
      if (button) {
        write(button, "aria-expanded", String(open));
        write(button, "aria-controls", panel ? panel.id : null);
        write(button, "data-state", state(open));
      }
      if (panel) {
        const forced = panel.hasAttribute("force-mount");
        write(panel, "aria-labelledby", button ? button.id : null);
        write(panel, "data-state", state(open));
        write(
          panel,
          "data-motion",
          // The seed is only fed to `indexOf`, which rejects "" and any other unregistered string alike.
          // Stryker disable next-line StringLiteral: equivalent — see above.
          navigationMenuPanelMotion({ value: entryValue, openValue: value, previousValue: this.#previous ?? "", values }) ??
            null,
        );
        write(panel, "hidden", forced || open ? null : "");
        write(panel, "aria-hidden", forced && !open ? "true" : null);
      }
    }
    for (const { part, anchor } of scan.links) {
      const active = part.hasAttribute("active");
      write(anchor, "aria-current", active ? "page" : null);
      write(anchor, "data-active", active ? "" : null);
    }
    for (const marker of [...this.parts(VIEWPORT), ...this.parts(INDICATOR)]) {
      write(marker, "data-orientation", orientation);
      write(marker, "data-state", state(value !== ""));
      write(marker, "data-value", value || null);
      write(marker, "hidden", value !== "" || marker.hasAttribute("force-mount") ? null : "");
    }

    this.#nav.sync();
    this.#measure(scan);
    // A panel's first paint can still be mid-layout (a CSS Grid intrinsic-
    // sizing pass), so measure the viewport once more a frame later.
    cancelAnimationFrame(this.#frame);
    this.#frame = requestAnimationFrame(() => this.#measure(this.#scan()));
  }

  /**
   * Publish the geometry the stylesheet needs, as React does: the open
   * trigger's position and size on each indicator, and the open panel's size
   * on each viewport — kept through a close, so the exit animates from it.
   */
  #measure(scan: Scan): void {
    const value = this.value;
    const open = scan.entries.get(value);
    const geometry = open?.button ? navigationMenuIndicatorGeometry(this.#orientation(), open.button) : null;
    for (const indicator of this.parts(INDICATOR)) {
      publish(indicator, "--primitiv-navigation-menu-indicator-position", geometry && `${geometry.position}px`);
      publish(indicator, "--primitiv-navigation-menu-indicator-size", geometry && `${geometry.size}px`);
    }
    if (value === "") return;
    for (const viewport of this.parts(VIEWPORT)) {
      const panel = open?.panel && viewport.contains(open.panel) ? open.panel : null;
      publish(viewport, "--primitiv-navigation-menu-viewport-width", panel && `${panel.offsetWidth}px`);
      publish(viewport, "--primitiv-navigation-menu-viewport-height", panel && `${panel.offsetHeight}px`);
    }
  }
}

/**
 * `<primitiv-navigation-menu-list>` — the list of top-level entries.
 * Structural: the root gives it `role="list"` and `data-orientation`.
 *
 * @customElement primitiv-navigation-menu-list
 */
export class PrimitivNavigationMenuListElement extends ElementBase {}

/**
 * `<primitiv-navigation-menu-item>` — one top-level entry. Structural: the
 * root gives it `role="listitem"`. Its `value` is what makes it a disclosure:
 * give it one to hold a trigger and a panel, or leave it out for a plain link
 * entry.
 *
 * @customElement primitiv-navigation-menu-item
 * @attr {string} value - The entry's value, which the root's `value` names while its panel is open. Omit it for a plain link entry; a trigger in an item without one is reported and left undecorated.
 */
export class PrimitivNavigationMenuItemElement extends ElementBase {}

/**
 * `<primitiv-navigation-menu-trigger>` — an interactive part. It decorates
 * exactly one `<button>` the consumer writes, which toggles its item's panel
 * (on click, and on hover after the delay) and receives `aria-expanded`,
 * `aria-controls` and `data-state`, so the rendered DOM matches React's.
 *
 * @customElement primitiv-navigation-menu-trigger
 */
export class PrimitivNavigationMenuTriggerElement extends ElementBase {}

/**
 * `<primitiv-navigation-menu-content>` — an entry's panel. Structural: the
 * root gives it an id, `aria-labelledby`, `data-state`, `data-motion` (which
 * way it travels as the open entry changes) and `hidden` while closed (write
 * `hidden` in your markup too, so it is hidden before the script loads). Put it
 * in its item, or in the shared `<primitiv-navigation-menu-viewport>` with its
 * own `value`, where React's panels project.
 *
 * @customElement primitiv-navigation-menu-content
 * @attr {string} value - The entry this panel belongs to. Needed only in a viewport; in an item it defaults to the item's `value`.
 * @attr {boolean} force-mount - Keep the panel rendered while closed (`aria-hidden` rather than `hidden`), so a stylesheet can animate it out.
 */
export class PrimitivNavigationMenuContentElement extends ElementBase {}

/**
 * `<primitiv-navigation-menu-viewport>` — the one shared box every panel
 * placed in it opens in, so the open panel morphs into the next. Structural:
 * the root gives it `data-state`, `data-value` (the open entry),
 * `data-orientation` and `hidden` while closed, and publishes the open panel's
 * size as `--primitiv-navigation-menu-viewport-width` / `-height`, kept
 * through a close so the exit animates from it.
 *
 * @customElement primitiv-navigation-menu-viewport
 * @attr {boolean} force-mount - Keep the viewport rendered while closed, so a stylesheet can animate it out.
 */
export class PrimitivNavigationMenuViewportElement extends ElementBase {}

/**
 * `<primitiv-navigation-menu-indicator>` — the marker that tracks the open
 * trigger. Structural: the root gives it `data-state`, `data-value`,
 * `data-orientation` and `hidden` while closed, and publishes the open
 * trigger's geometry as `--primitiv-navigation-menu-indicator-position` /
 * `-size` (re-measured on resize), so the stylesheet decides how to draw it.
 *
 * @customElement primitiv-navigation-menu-indicator
 * @attr {boolean} force-mount - Keep the indicator rendered while closed, so a stylesheet can animate it out.
 */
export class PrimitivNavigationMenuIndicatorElement extends ElementBase {}

/**
 * `<primitiv-navigation-menu-link>` — an interactive part. It decorates
 * exactly one `<a href>` (or a router link) the consumer writes. Following it
 * closes the menu. A link directly in an item is a top-level entry the arrow
 * keys travel to, and hovering it closes the open panel; a link in a panel is
 * reached with Tab.
 *
 * @customElement primitiv-navigation-menu-link
 * @attr {boolean} active - Marks the link as the current page: `aria-current="page"` and `data-active` on the anchor.
 */
export class PrimitivNavigationMenuLinkElement extends ElementBase {}

/**
 * Define the eight Navigation Menu elements on `registry` (the global
 * `customElements` by default). Safe to call more than once, and a no-op where
 * there is no registry (a server render).
 */
export function defineNavigationMenu(registry: ElementRegistry | undefined = globalThis.customElements): void {
  defineElements(registry, [
    [ROOT, PrimitivNavigationMenuElement],
    [LIST, PrimitivNavigationMenuListElement],
    [ITEM, PrimitivNavigationMenuItemElement],
    [TRIGGER, PrimitivNavigationMenuTriggerElement],
    [CONTENT, PrimitivNavigationMenuContentElement],
    [VIEWPORT, PrimitivNavigationMenuViewportElement],
    [INDICATOR, PrimitivNavigationMenuIndicatorElement],
    [LINK, PrimitivNavigationMenuLinkElement],
  ]);
}
