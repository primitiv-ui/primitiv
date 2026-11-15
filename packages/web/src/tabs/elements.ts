import {
  deriveId,
  tabsTabStop,
  type TabsActivationMode,
  type TabsOrientation,
} from "@primitiv-ui/core";

import { defineElements, ElementBase, reportOnce, write, type ElementRegistry } from "../internal/element.ts";
import { PrimitivRootElement } from "../internal/RootElement.ts";
import { TabsController, type TabsControllerHost } from "./TabsController.ts";

export type { ElementRegistry };

// Stryker disable StringLiteral: static — evaluated once at import, so runtime mutant switching never reaches them; the names are pinned by the defineTabs registry test instead.
const ROOT = "primitiv-tabs";
const LIST = "primitiv-tabs-list";
const TRIGGER = "primitiv-tabs-trigger";
const CONTENT = "primitiv-tabs-content";
// Stryker restore StringLiteral

/** The tags of a tab set's parts — Tabs' own, or a component built on it (Stepper). */
export type TabsPartTags = { readonly list: string; readonly trigger: string; readonly content: string };

const TABS_PARTS: TabsPartTags = { list: LIST, trigger: TRIGGER, content: CONTENT };

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
  reportOnce(
    trigger,
    `<${trigger.localName}> needs a value and exactly one element child (a <button>, an <a href> or a router link) to decorate.`,
  );
  return null;
}

/**
 * `<primitiv-tabs>` — the state owner of a WAI-ARIA tab set.
 *
 * The root finds its own parts, so a tab set nested in a panel keeps its own,
 * and reconciles their ARIA from its reflected state whenever a part arrives,
 * leaves, or changes an attribute the root reads (the lifecycle is
 * `PrimitivRootElement`'s). `activation-mode` is read live at each key press,
 * so a change to it needs no reconcile.
 *
 * @customElement primitiv-tabs
 * @summary The state owner of a WAI-ARIA tab set.
 * @attr {string} value - The active tab's value. Reflected: it moves as the user switches tabs, so a server re-render or a history snapshot sees the live selection.
 * @attr {"horizontal" | "vertical"} orientation - Layout axis, which picks the arrow-key pair. Defaults to `horizontal`.
 * @attr {"automatic" | "manual"} activation-mode - `automatic` activates a tab as focus arrives; `manual` waits for Enter or Space. Defaults to `automatic`.
 * @fires {CustomEvent<{ value: string; index: number }>} primitiv-tabs-change - Bubbles, cancelable, fired before a user-driven change is applied. Call `preventDefault()` to veto it.
 */
export class PrimitivTabsElement extends PrimitivRootElement {
  /** The value of the panel last shown, so a change fires primitiv-tabs-show. */
  #shown: string | undefined;
  #rendered = false;
  protected readonly controller: TabsController = new TabsController(this, this.#host());
  protected readonly reconcileOn: readonly string[] = ["value", "disabled", "label", "orientation"];

  /** The active tab's value, reflected as the `value` attribute. */
  get value(): string | undefined {
    return this.getAttribute("value") ?? undefined;
  }

  set value(next: string) {
    this.setAttribute("value", next);
  }

  /** The controller's view of this element: state lives in reflected attributes. */
  #host(): TabsControllerHost {
    return {
      state: () => ({
        active: this.value,
        orientation: this.#orientation(),
        dir: this.direction(),
        activationMode: this.#activationMode(),
      }),
      activate: (value, index) => {
        if (this.announce(`${this.eventPrefix()}-change`, { value, index })) this.value = value;
      },
    };
  }

  /**
   * The tags this root's parts carry. A component built on Tabs (Stepper)
   * names its own, so its markup reads as itself while the behaviour is Tabs'.
   */
  protected partTags(): TabsPartTags {
    return TABS_PARTS;
  }

  /** The prefix of the events this root fires: `<prefix>-change` and `<prefix>-show`. */
  protected eventPrefix(): string {
    return ROOT;
  }

  /** The activation mode when `activation-mode` names neither. */
  protected defaultActivationMode(): TabsActivationMode {
    return "automatic";
  }

  /** Write anything further a component built on Tabs puts on a decorated tab. */
  protected decorateTab(_trigger: HTMLElement, _tab: HTMLElement): void {}

  #activationMode(): TabsActivationMode {
    const mode = this.getAttribute("activation-mode");
    return mode === "manual" || mode === "automatic" ? mode : this.defaultActivationMode();
  }

  #orientation(): TabsOrientation {
    return this.getAttribute("orientation") === "vertical" ? "vertical" : "horizontal";
  }

  protected reconcile(): void {
    const tags = this.partTags();
    const orientation = this.#orientation();
    const active = this.value;
    const rootId = this.rootId();
    write(this, "data-orientation", orientation);

    for (const list of this.parts(tags.list)) {
      write(list, "role", "tablist");
      write(list, "aria-orientation", orientation);
      write(list, "data-orientation", orientation);
      const label = list.getAttribute("label");
      if (label !== null) write(list, "aria-label", label);
    }

    const panels = new Map<string, HTMLElement>();
    for (const panel of this.parts(tags.content)) {
      const value = panel.getAttribute("value");
      if (value !== null) panels.set(value, panel);
    }

    const triggers = this.parts(tags.trigger).flatMap((trigger) => {
      const part = decoratable(trigger);
      return part ? [{ trigger, ...part }] : [];
    });
    const stop = tabsTabStop({ values: triggers.map((t) => t.value), active });

    // Replace the registration wholesale: a removed part, or a trigger whose child
    // a framework re-rendered, simply is not registered again.
    this.controller.setTriggers(
      triggers.map(({ trigger, tab, value }) => ({
        value,
        element: tab,
        disabled: trigger.hasAttribute("disabled"),
      })),
    );

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
      this.decorateTab(trigger, tab);
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
      shownPanel.dispatchEvent(new CustomEvent(`${this.eventPrefix()}-show`, { bubbles: true }));
    }
    this.#shown = active;
    this.#rendered = true;
  }
}

/**
 * `<primitiv-tabs-list>` — the tablist. Structural: the root writes its ARIA.
 *
 * @customElement primitiv-tabs-list
 * @attr {string} label - The tablist's accessible name. Give this or `aria-labelledby`.
 */
export class PrimitivTabsListElement extends ElementBase {}

/**
 * `<primitiv-tabs-trigger>` — an interactive part. It decorates exactly one
 * child the consumer writes (a `<button>`, an `<a href>`, a router link), which
 * receives the tab role, so the rendered DOM matches React's `<button role="tab">`
 * (RFC 0033 D24).
 *
 * @customElement primitiv-tabs-trigger
 * @attr {string} value - The tab's value, pairing it with the panel of the same value.
 * @attr {boolean} disabled - Marks the tab disabled: arrow keys still land on it, but it never activates.
 */
export class PrimitivTabsTriggerElement extends ElementBase {}

/**
 * `<primitiv-tabs-content>` — a tab panel. Structural: the root writes its ARIA.
 *
 * @customElement primitiv-tabs-content
 * @attr {string} value - The panel's value, pairing it with the tab of the same value.
 * @fires {CustomEvent} primitiv-tabs-show - Bubbles from the panel as it becomes active (not on first render), so a lazy panel can fetch its content.
 */
export class PrimitivTabsContentElement extends ElementBase {}

/**
 * Define the four Tabs elements on `registry` (the global `customElements` by
 * default, so a scoped registry can be passed when browsers support one). Safe
 * to call more than once, and a no-op where there is no registry (a server
 * render).
 */
export function defineTabs(registry: ElementRegistry | undefined = globalThis.customElements): void {
  defineElements(registry, [
    [ROOT, PrimitivTabsElement],
    [LIST, PrimitivTabsListElement],
    [TRIGGER, PrimitivTabsTriggerElement],
    [CONTENT, PrimitivTabsContentElement],
  ]);
}
