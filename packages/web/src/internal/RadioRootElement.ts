import { radioGroupTabStop, type RadioGroupOrientation } from "@primitiv-ui/core";

import { reportOnce, write } from "./element.ts";
import { FormReset, reconcileFormValues } from "./form.ts";
import { RadioGroupController, type RadioGroupControllerHost } from "./RadioGroupController.ts";
import { PrimitivRootElement } from "./RootElement.ts";

/** An item the root can decorate: its wrapper, value, the child it decorates, and whether it is disabled. */
export type RadioItem = { item: HTMLElement; value: string; button: HTMLElement; disabled: boolean };

/**
 * The root element every single-select radio group shares (SegmentedControl,
 * RadioCard): the selection kept in a reflected `value` attribute, the
 * cancelable change event, the roving tab stop, and each item's `<button>`
 * decorated as a `role="radio"`. A subclass names its item tag and change event,
 * reads its own orientation and whole-group disable, and writes the root's own
 * attributes. Internal — not an entry point.
 */
export abstract class RadioRootElement extends PrimitivRootElement {
  /** The item element's tag name. */
  protected abstract readonly itemTag: string;
  /** The change event's type. */
  protected abstract readonly changeEvent: string;
  protected readonly controller: RadioGroupController = new RadioGroupController(this, this.#host());
  readonly #reset = new FormReset();

  connectedCallback(): void {
    super.connectedCallback();
    this.#reset.connect(this);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#reset.disconnect();
  }

  /** The selected item's value, reflected as the `value` attribute; `undefined` while none is selected. */
  get value(): string | undefined {
    return this.getAttribute("value") ?? undefined;
  }

  /** Select the item whose value is `next`. */
  set value(next: string) {
    this.setAttribute("value", next);
  }

  /** Which arrows move between items, read from the root's attributes. */
  protected abstract orientation(): RadioGroupOrientation;

  /** Whether a `disabled` attribute on the root disables the whole group. */
  protected abstract readonly disableable: boolean;

  /** Whether the whole group is disabled, every item with it. */
  #groupDisabled(): boolean {
    return this.disableable && this.hasAttribute("disabled");
  }

  /** Write the root's own role and state attributes. */
  protected abstract writeRoot(orientation: RadioGroupOrientation, disabled: boolean): void;

  /** Decorate anything inside `item` beyond its button, e.g. an indicator. */
  protected decorateItem(_item: HTMLElement, _checked: boolean): void {}

  /** The controller's view of this element: state lives in reflected attributes. */
  #host(): RadioGroupControllerHost {
    return {
      state: () => ({
        selected: this.value,
        disabled: this.#groupDisabled(),
        orientation: this.orientation(),
        dir: this.direction(),
      }),
      change: (value) => {
        if (this.announceValue(this.changeEvent, { value })) this.value = value;
      },
    };
  }

  /**
   * An item decorates exactly one element child and needs a `value`. Anything
   * else is reported once and left undecorated rather than thrown: a
   * server-rendered page has no error boundary to catch a throw (RFC 0033 D24).
   */
  #decoratable(item: HTMLElement): RadioItem | null {
    const value = item.getAttribute("value");
    if (item.childElementCount === 1 && value !== null) {
      return { item, value, button: item.firstElementChild as HTMLElement, disabled: item.hasAttribute("disabled") };
    }
    reportOnce(item, `<${this.itemTag}> needs a value and exactly one element child (a <button>) to decorate.`);
    return null;
  }

  protected reconcile(): void {
    const selected = this.value;
    const groupDisabled = this.#groupDisabled();
    this.writeRoot(this.orientation(), groupDisabled);

    const items = this.parts(this.itemTag).flatMap((item) => this.#decoratable(item) ?? []);
    const stop = radioGroupTabStop({
      values: items.map((item) => item.value),
      disabled: new Set(items.filter((item) => groupDisabled || item.disabled).map((item) => item.value)),
      selected,
    });

    // Replace the registration wholesale: a removed item, or an item whose
    // child a framework re-rendered, simply is not registered again.
    this.controller.setTriggers(items.map(({ value, button, disabled }) => ({ value, element: button, disabled })));

    for (const { item, value, button, disabled } of items) {
      const on = value === selected;
      const off = groupDisabled || disabled;
      write(button, "role", "radio");
      write(button, "aria-checked", String(on));
      write(button, "data-state", on ? "checked" : "unchecked");
      write(button, "tabindex", value === stop ? "0" : "-1");
      write(button, "aria-disabled", off ? "true" : null);
      write(button, "data-disabled", off ? "" : null);
      this.decorateItem(item, on);
    }

    // With a `name`, the selection submits like a checked radio: nothing while
    // none is selected, and nothing while the whole group is disabled.
    const submits = selected !== undefined && !groupDisabled;
    reconcileFormValues(this, this.getAttribute("name"), submits ? [selected] : []);
  }
}
