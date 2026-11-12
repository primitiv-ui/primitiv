import { defineDropdown } from "../dropdown/elements.ts";
import { defineElements, ElementBase, owned, reportOnce, write, type ElementRegistry } from "../internal/element.ts";
import { PrimitivRootElement } from "../internal/RootElement.ts";
import { SplitButtonController, type SplitButtonControllerHost } from "./SplitButtonController.ts";

export type { ElementRegistry };

// Stryker disable StringLiteral: static — evaluated once at import, so runtime mutant switching never reaches them; the names are pinned by the defineSplitButton registry test instead.
const ROOT = "primitiv-split-button";
const ACTION = "primitiv-split-button-action";
const DROPDOWN = "primitiv-dropdown";
const DROPDOWN_TRIGGER = "primitiv-dropdown-trigger";
// Stryker restore StringLiteral

/** The one element child an interactive part decorates, or `null` (reported once) when there is not exactly one. */
function decoratable(part: HTMLElement): HTMLElement | null {
  if (part.childElementCount === 1) return part.firstElementChild as HTMLElement;
  reportOnce(part, `<${part.localName}> needs exactly one element child (a <button>) to decorate.`);
  return null;
}

/**
 * `<primitiv-split-button>` — one primary action welded to a menu of related
 * alternatives (WAI-ARIA APG Button + Menu Button), bound into a single
 * `role="group"`. It holds two things the consumer writes: a
 * `<primitiv-split-button-action>` around the action's `<button>`, and a
 * `<primitiv-dropdown>` whose trigger is the chevron half and whose content is
 * the menu — so the menu's whole behaviour, and its `open` state and events,
 * are the dropdown's.
 *
 * What the group adds: ArrowDown on the action opens the menu (through the
 * trigger, so the dropdown's change event still fires), `data-state` mirroring
 * the menu, a `disabled` that disables both halves, and the trigger's
 * accessible name — unless the trigger carries `aria-label` or
 * `aria-labelledby`, it is named by its own content then the action's
 * (`aria-labelledby="<trigger id> <action id>"`), so a visually hidden "More
 * options" reads as "More options, Squash and merge". Defining it defines the
 * Dropdown elements too.
 *
 * @customElement primitiv-split-button
 * @summary One primary action welded to a menu of alternatives.
 * @attr {boolean} disabled - Disables both halves: native `disabled` and `data-disabled` on each button. To disable one half alone, put `disabled` on its part — `<primitiv-split-button-action>` or `<primitiv-dropdown-trigger>` — not on the button, which the group owns.
 */
export class PrimitivSplitButtonElement extends PrimitivRootElement {
  protected readonly controller: SplitButtonController = new SplitButtonController(this, this.#host());
  protected readonly reconcileOn: readonly string[] = ["open", "disabled", "aria-label", "aria-labelledby", "id"];
  /** The menu's trigger `<button>`, as of the last reconcile. */
  #trigger: HTMLElement | null = null;
  /** The `aria-labelledby` this group wrote on each trigger, so one the consumer wrote is left alone. */
  readonly #derivedName = new WeakMap<HTMLElement, string>();

  /** The controller's view of this element: the menu opens through its trigger. */
  #host(): SplitButtonControllerHost {
    return { open: () => this.#trigger?.click() };
  }

  /** Disable a half's `button` with its part or the group; whether it is disabled. */
  #disable(part: HTMLElement, button: HTMLElement, group: boolean): boolean {
    const disabled = group || part.hasAttribute("disabled");
    write(button, "disabled", disabled ? "" : null);
    write(button, "data-disabled", disabled ? "" : null);
    return disabled;
  }

  protected reconcile(): void {
    const rootId = this.rootId();
    const disabled = this.hasAttribute("disabled");
    const [dropdown = null] = this.parts(DROPDOWN);
    write(this, "role", "group");
    write(this, "data-split-button", "");
    write(this, "data-state", dropdown?.hasAttribute("open") ? "open" : "closed");
    write(this, "data-disabled", disabled ? "" : null);

    const [actionPart] = this.parts(ACTION);
    const action = actionPart ? decoratable(actionPart) : null;
    if (action) {
      if (!action.id) action.id = `${rootId}-action`;
      write(action, "data-split-button-action", "");
      this.controller.setTriggers([{ value: ACTION, element: action, disabled: this.#disable(actionPart, action, disabled) }]);
    } else {
      this.controller.setTriggers([]);
    }

    const [triggerPart] = dropdown ? owned(dropdown, DROPDOWN_TRIGGER, DROPDOWN) : [];
    this.#trigger = triggerPart?.childElementCount === 1 ? (triggerPart.firstElementChild as HTMLElement) : null;
    const trigger = this.#trigger;
    if (!trigger) return;
    if (!trigger.id) trigger.id = `${rootId}-trigger`;
    write(trigger, "data-split-button-trigger", "");
    this.#disable(triggerPart, trigger, disabled);
    // The trigger is named by its own content then the action's, unless the
    // consumer named it: an `aria-label` (which this name would outrank), or an
    // `aria-labelledby` that is neither the one this group wrote nor the one it
    // would write — a pre-rendered page's derived name is adopted as its own.
    const derived = action && !trigger.hasAttribute("aria-label") ? `${trigger.id} ${action.id}` : null;
    const labelledBy = trigger.getAttribute("aria-labelledby");
    if (labelledBy !== null && labelledBy !== this.#derivedName.get(trigger) && labelledBy !== derived) return;
    if (derived) this.#derivedName.set(trigger, derived);
    write(trigger, "aria-labelledby", derived);
  }
}

/**
 * `<primitiv-split-button-action>` — an interactive part: the primary half. It
 * decorates exactly one child the consumer writes, a `<button>` (or a link),
 * which keeps its own click and gets `data-split-button-action`, an id if it
 * has none, and ArrowDown to open the menu.
 *
 * @customElement primitiv-split-button-action
 * @attr {boolean} disabled - Disables the action half alone (native `disabled` and `data-disabled` on its button).
 */
export class PrimitivSplitButtonActionElement extends ElementBase {}

/**
 * Define the two SplitButton elements, and the Dropdown elements its menu is
 * made of, on `registry` (the global `customElements` by default). Safe to call
 * more than once, and a no-op where there is no registry (a server render).
 */
export function defineSplitButton(registry: ElementRegistry | undefined = globalThis.customElements): void {
  defineDropdown(registry);
  defineElements(registry, [
    [ROOT, PrimitivSplitButtonElement],
    [ACTION, PrimitivSplitButtonActionElement],
  ]);
}
