import type { TabsActivationMode } from "@primitiv-ui/core";

import { defineElements, ElementBase, write, type ElementRegistry } from "../internal/element.ts";
import { PrimitivTabsElement, type TabsPartTags } from "../tabs/elements.ts";

export type { ElementRegistry };

// Stryker disable StringLiteral: static — evaluated once at import, so runtime mutant switching never reaches them; the names are pinned by the defineStepper registry test instead.
const ROOT = "primitiv-stepper";
const LIST = "primitiv-stepper-list";
const STEP = "primitiv-stepper-step";
const PANEL = "primitiv-stepper-panel";
// Stryker restore StringLiteral

const STEPPER_PARTS: TabsPartTags = { list: LIST, trigger: STEP, content: PANEL };

/**
 * `<primitiv-stepper>` — a step rail for a multi-step form. The behaviour is a
 * WAI-ARIA tab set's, exactly as React's registry Stepper composes Tabs: each
 * step's `<button>` becomes a tab, so activation, `aria-selected`, the roving
 * `tabindex`, Home / End and `disabled` are all Tabs'. What the stepper adds is
 * its own names, `manual` activation by default (browsing the steps never
 * changes step, so nothing half-typed in a panel is lost), and each step's
 * progress written onto its button as `data-step-state`.
 *
 * @customElement primitiv-stepper
 * @summary A step rail for a multi-step form, on the Tabs behaviour.
 * @attr {string} value - The current step's value. Reflected: it moves as the user changes step, so a server re-render or a history snapshot sees the live step.
 * @attr {"horizontal" | "vertical"} orientation - Which way the rail runs, which picks the arrow-key pair. Defaults to `horizontal`.
 * @attr {"automatic" | "manual"} activation-mode - `manual` waits for Enter or Space; `automatic` changes step as focus arrives. Defaults to `manual`.
 * @fires {CustomEvent<{ value: string; index: number }>} primitiv-stepper-change - Bubbles, cancelable, fired before a user-driven change of step is applied. Call `preventDefault()` to keep the user on the current step.
 */
export class PrimitivStepperElement extends PrimitivTabsElement {
  protected readonly reconcileOn: readonly string[] = ["value", "disabled", "label", "orientation", "state"];

  protected partTags(): TabsPartTags {
    return STEPPER_PARTS;
  }

  protected eventPrefix(): string {
    return ROOT;
  }

  protected defaultActivationMode(): TabsActivationMode {
    return "manual";
  }

  protected decorateTab(step: HTMLElement, tab: HTMLElement): void {
    write(tab, "data-step-state", step.getAttribute("state") ?? "upcoming");
  }
}

/**
 * `<primitiv-stepper-list>` — the rail, a tablist. Structural: the root writes its ARIA.
 *
 * @customElement primitiv-stepper-list
 * @attr {string} label - The rail's accessible name. Give this or `aria-labelledby`.
 */
export class PrimitivStepperListElement extends ElementBase {}

/**
 * `<primitiv-stepper-step>` — one step. It decorates exactly one child you
 * write (a `<button>`), which becomes the tab and carries the step's marker,
 * label and description.
 *
 * @customElement primitiv-stepper-step
 * @attr {string} value - The step's value, pairing it with the panel of the same value.
 * @attr {"upcoming" | "complete" | "error"} state - The progress the step carries in its own right, written on its button as `data-step-state`. Independent of which step is current, so an errored step keeps its error while the user stands on a later one. Defaults to `upcoming`.
 * @attr {boolean} disabled - A step the user cannot reach yet: arrow keys still land on it, but it never activates.
 */
export class PrimitivStepperStepElement extends ElementBase {}

/**
 * `<primitiv-stepper-panel>` — a step's body, a tab panel. Structural: the root writes its ARIA.
 *
 * @customElement primitiv-stepper-panel
 * @attr {string} value - The panel's value, pairing it with the step of the same value.
 * @fires {CustomEvent} primitiv-stepper-show - Bubbles from the panel as its step becomes current (not on first render), so a lazy panel can fetch its content.
 */
export class PrimitivStepperPanelElement extends ElementBase {}

/**
 * Define the four Stepper elements on `registry` (the global `customElements`
 * by default). Safe to call more than once, and a no-op where there is no
 * registry (a server render).
 */
export function defineStepper(registry: ElementRegistry | undefined = globalThis.customElements): void {
  defineElements(registry, [
    [ROOT, PrimitivStepperElement],
    [LIST, PrimitivStepperListElement],
    [STEP, PrimitivStepperStepElement],
    [PANEL, PrimitivStepperPanelElement],
  ]);
}
