import type { CheckboxCardCheckedState } from "@primitiv-ui/core";

import { defineElements, ElementBase, reportOnce, write, type ElementRegistry } from "../internal/element.ts";
import { reconcileFormValues } from "../internal/form.ts";
import { PrimitivRootElement } from "../internal/RootElement.ts";
import { CheckboxCardController, type CheckboxCardControllerHost } from "./CheckboxCardController.ts";

export type { ElementRegistry };

// Stryker disable StringLiteral: static — evaluated once at import, so runtime mutant switching never reaches them; the names are pinned by the defineCheckboxCard registry test instead.
const ROOT = "primitiv-checkbox-card";
const INDICATOR = "primitiv-checkbox-card-indicator";
// Stryker restore StringLiteral

/** The `data-state` a state publishes. */
function dataState(checked: CheckboxCardCheckedState): string {
  return checked === "indeterminate" ? checked : checked ? "checked" : "unchecked";
}

/**
 * `<primitiv-checkbox-card>` — a card whose whole surface is one checkbox. It
 * owns the state and decorates exactly one child the consumer writes, a
 * `<button>` holding the card's content, which gets `role="checkbox"`,
 * `aria-checked` (`mixed` while indeterminate) and
 * `data-state="checked" | "unchecked" | "indeterminate"`. A click — or Space or
 * Enter, the button's own click — toggles it, a mixed card becoming checked.
 * Cards are independent: group several in a `<fieldset>` with a `<legend>`.
 * With a `name`, a checked card submits its `value` (`"on"` without one) with
 * the surrounding form through a hidden input beside the button, as a native
 * checkbox does; an unchecked, mixed or disabled card submits nothing.
 *
 * @customElement primitiv-checkbox-card
 * @summary A card whose whole surface is one checkbox.
 * @attr {boolean | "indeterminate"} checked - Whether it is checked; `checked="indeterminate"` for mixed. Reflected: it changes as the user toggles, so a server re-render or a history snapshot sees the live state.
 * @attr {boolean} disabled - The card never toggles (`aria-disabled` and `data-disabled` on the button), staying focusable and announced.
 * @attr {string} name - Submit the card with the surrounding form under this name. Optional: without it, nothing is submitted.
 * @attr {string} value - What a checked card submits; `"on"` when absent, as a native checkbox.
 * @fires {CustomEvent<{ checked: boolean }>} primitiv-checkbox-card-change - Bubbles, cancelable, fired before a user-driven toggle is applied, with the state afterwards. Call `preventDefault()` to veto it.
 * @fires {Event} change - Bubbles, fired after a user's change has applied, as a form control's is: the hidden form inputs already hold the new value, so a `change` listener, `hx-trigger="change"` or `new FormData()` reads it. Not cancelable; veto with the event above.
 */
export class PrimitivCheckboxCardElement extends PrimitivRootElement {
  protected readonly controller: CheckboxCardController = new CheckboxCardController(this, this.#host());
  protected readonly reconcileOn: readonly string[] = ["checked", "disabled", "force-mount", "name", "value"];

  /** The state, from the `checked` attribute: absent, present, or `"indeterminate"`. */
  get checked(): CheckboxCardCheckedState {
    const checked = this.getAttribute("checked");
    return checked === "indeterminate" ? checked : checked !== null;
  }

  /** Set the state, reflected as the `checked` attribute. */
  set checked(next: CheckboxCardCheckedState) {
    // `write`, not `toggleAttribute`: a mixed card's "indeterminate" must become plain checked.
    write(this, "checked", next === "indeterminate" ? next : next ? "" : null);
  }

  /** The controller's view of this element: state lives in reflected attributes. */
  #host(): CheckboxCardControllerHost {
    return {
      state: () => ({ checked: this.checked }),
      change: (checked) => {
        if (this.announceValue("primitiv-checkbox-card-change", { checked })) this.checked = checked;
      },
    };
  }

  protected reconcile(): void {
    // The hidden input a named card submits through is the card's own, not a child to decorate.
    const children = [...this.children].filter((child) => !child.hasAttribute("data-primitiv-form"));
    if (children.length !== 1) {
      reportOnce(this, `<${ROOT}> needs exactly one element child (a <button>) to decorate.`);
      this.controller.setTriggers([]);
      return;
    }
    const button = children[0] as HTMLElement;
    const checked = this.checked;
    const disabled = this.hasAttribute("disabled");
    this.controller.setTriggers([{ value: ROOT, element: button, disabled }]);
    write(button, "role", "checkbox");
    write(button, "aria-checked", checked === "indeterminate" ? "mixed" : String(checked));
    write(button, "data-state", dataState(checked));
    write(button, "aria-disabled", disabled ? "true" : null);
    write(button, "data-disabled", disabled ? "" : null);

    // Never a nested card's: those belong to that card's own reconcile.
    const indicators = [...this.querySelectorAll(INDICATOR)].filter((part) => part.closest(ROOT) === this);
    for (const indicator of indicators) {
      write(indicator, "aria-hidden", "true");
      write(indicator, "data-state", dataState(checked));
      write(indicator, "hidden", checked !== false || indicator.hasAttribute("force-mount") ? null : "");
    }
    const submits = checked === true && !disabled;
    reconcileFormValues(this, this.getAttribute("name"), submits ? [this.getAttribute("value") ?? "on"] : []);
  }
}

/**
 * `<primitiv-checkbox-card-indicator>` — the card's check mark, placed anywhere
 * inside its `<button>`. Decorative (`aria-hidden`), with the card's
 * `data-state`, and `hidden` while the card is unchecked unless it carries
 * `force-mount`.
 *
 * @customElement primitiv-checkbox-card-indicator
 * @attr {boolean} force-mount - Keep the indicator shown while the card is unchecked, so a stylesheet can animate it in and out from `data-state`.
 */
export class PrimitivCheckboxCardIndicatorElement extends ElementBase {}

/**
 * Define the two CheckboxCard elements on `registry` (the global
 * `customElements` by default). Safe to call more than once, and a no-op where
 * there is no registry (a server render).
 */
export function defineCheckboxCard(registry: ElementRegistry | undefined = globalThis.customElements): void {
  defineElements(registry, [
    [ROOT, PrimitivCheckboxCardElement],
    [INDICATOR, PrimitivCheckboxCardIndicatorElement],
  ]);
}
