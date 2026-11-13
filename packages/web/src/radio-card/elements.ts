import type { RadioGroupOrientation } from "@primitiv-ui/core";

import { defineElements, ElementBase, write, type ElementRegistry } from "../internal/element.ts";
import { RadioRootElement } from "../internal/RadioRootElement.ts";

export type { ElementRegistry };

// Stryker disable StringLiteral: static — evaluated once at import, so runtime mutant switching never reaches them; the names are pinned by the defineRadioCard registry test instead.
const ROOT = "primitiv-radio-card";
const ITEM = "primitiv-radio-card-item";
const INDICATOR = "primitiv-radio-card-indicator";
// Stryker restore StringLiteral

/**
 * `<primitiv-radio-card>` — the state owner of a group of radio cards: tiles
 * whose whole surface picks one value, exactly one of which is selected.
 *
 * The root is a radio group: it takes `role="radiogroup"`, so name it with
 * `aria-label` or `aria-labelledby`, and each card's `<button>` takes
 * `role="radio"`. Only the selected card is in the page's Tab order — the first
 * enabled one while none is selected — and the arrow keys move focus and
 * selection together, wrapping at the ends and skipping disabled cards. By
 * default all four arrows work, since cards usually wrap into a grid. A
 * selected card never lets go: clicking it again changes nothing.
 *
 * @customElement primitiv-radio-card
 * @summary The state owner of a group of radio cards.
 * @attr {string} value - The selected card's value. Reflected: it changes as the user selects, so a server re-render or a history snapshot sees the live selection. Omit it for nothing selected.
 * @attr {"both" | "horizontal" | "vertical"} orientation - Which arrow keys move between cards. `both` (the default) uses all four, for cards that wrap into a grid, and writes no `aria-orientation`; `horizontal` or `vertical` keeps to one pair and states it.
 * @attr {string} name - Submit the selected value with a form, under this name, as a checked radio would: nothing while none is selected. A form reset restores the value the group first rendered with. Without it the group takes no part in forms.
 * @fires {CustomEvent<{ value: string }>} primitiv-radio-card-change - Bubbles, cancelable, fired before a user-driven selection is applied, with the card selected afterwards. Call `preventDefault()` to veto it.
 */
export class PrimitivRadioCardElement extends RadioRootElement {
  protected readonly itemTag: string = ITEM;
  protected readonly changeEvent: string = "primitiv-radio-card-change";
  /** A group of cards is never disabled as a whole; disable each card instead. */
  protected readonly disableable: boolean = false;
  protected readonly reconcileOn: readonly string[] = ["value", "disabled", "orientation", "force-mount", "name"];

  protected orientation(): RadioGroupOrientation {
    const orientation = this.getAttribute("orientation");
    return orientation === "horizontal" || orientation === "vertical" ? orientation : "both";
  }

  protected writeRoot(orientation: RadioGroupOrientation): void {
    write(this, "role", "radiogroup");
    write(this, "aria-orientation", orientation === "both" ? null : orientation);
  }

  /** A card's indicators show only while it is checked, unless force-mounted. */
  protected decorateItem(item: HTMLElement, checked: boolean): void {
    // Never a nested group's: those belong to that group's own reconcile.
    const indicators = [...item.querySelectorAll(INDICATOR)].filter((part) => part.closest(ROOT) === this);
    for (const indicator of indicators) {
      write(indicator, "aria-hidden", "true");
      write(indicator, "data-state", checked ? "checked" : "unchecked");
      write(indicator, "hidden", checked || indicator.hasAttribute("force-mount") ? null : "");
    }
  }
}

/**
 * `<primitiv-radio-card-item>` — an interactive part: one card. It decorates
 * exactly one child the consumer writes, a `<button>` holding the card's
 * content, which gets `role="radio"`, `aria-checked`,
 * `data-state="checked" | "unchecked"` and the roving `tabindex`.
 *
 * @customElement primitiv-radio-card-item
 * @attr {string} value - The card's value, the root's `value` while it is selected.
 * @attr {boolean} disabled - Skipped by the arrow keys and never selected (`aria-disabled` and `data-disabled` on the child).
 */
export class PrimitivRadioCardItemElement extends ElementBase {}

/**
 * `<primitiv-radio-card-indicator>` — the card's selected mark, placed anywhere
 * inside its `<button>`. Decorative (`aria-hidden`), with the card's
 * `data-state`, and `hidden` while its card is unchecked unless it carries
 * `force-mount`.
 *
 * @customElement primitiv-radio-card-indicator
 * @attr {boolean} force-mount - Keep the indicator shown while its card is unchecked, so a stylesheet can animate it in and out from `data-state`.
 */
export class PrimitivRadioCardIndicatorElement extends ElementBase {}

/**
 * Define the three RadioCard elements on `registry` (the global
 * `customElements` by default). Safe to call more than once, and a no-op where
 * there is no registry (a server render).
 */
export function defineRadioCard(registry: ElementRegistry | undefined = globalThis.customElements): void {
  defineElements(registry, [
    [ROOT, PrimitivRadioCardElement],
    [ITEM, PrimitivRadioCardItemElement],
    [INDICATOR, PrimitivRadioCardIndicatorElement],
  ]);
}
