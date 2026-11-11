import { segmentedControlTabStop, type SegmentedControlOrientation } from "@primitiv-ui/core";

import { defineElements, ElementBase, reportOnce, write, type ElementRegistry } from "../internal/element.ts";
import { PrimitivRootElement } from "../internal/RootElement.ts";
import { SegmentedControlController, type SegmentedControlControllerHost } from "./SegmentedControlController.ts";

export type { ElementRegistry };

// Stryker disable StringLiteral: static — evaluated once at import, so runtime mutant switching never reaches them; the names are pinned by the defineSegmentedControl registry test instead.
const ROOT = "primitiv-segmented-control";
const ITEM = "primitiv-segmented-control-item";
// Stryker restore StringLiteral

/** A segment the root can decorate: its value, the child it decorates, and whether it is disabled. */
type Item = { value: string; button: HTMLElement; disabled: boolean };

/**
 * A segment decorates exactly one element child and needs a `value`. Anything
 * else is reported once and left undecorated rather than thrown: a
 * server-rendered page has no error boundary to catch a throw (RFC 0033 D24).
 */
function decoratable(item: HTMLElement): Item | null {
  const value = item.getAttribute("value");
  if (item.childElementCount === 1 && value !== null) {
    return { value, button: item.firstElementChild as HTMLElement, disabled: item.hasAttribute("disabled") };
  }
  reportOnce(item, `<${ITEM}> needs a value and exactly one element child (a <button>) to decorate.`);
  return null;
}

/**
 * `<primitiv-segmented-control>` — the state owner of a segmented control: a
 * linear strip of segments of which exactly one is selected.
 *
 * The root is a radio group: it takes `role="radiogroup"`, so name it with
 * `aria-label` or `aria-labelledby`, and each segment's `<button>` takes
 * `role="radio"`. Only the selected segment is in the page's Tab order — the
 * first enabled one while none is selected — and the arrow keys move focus and
 * selection together, wrapping at the ends and skipping disabled segments. A
 * selected segment never lets go: clicking it again changes nothing. The root
 * reconciles its segments' ARIA whenever a segment arrives, leaves, or changes
 * an attribute the root reads (the lifecycle is `PrimitivRootElement`'s).
 *
 * @customElement primitiv-segmented-control
 * @summary The state owner of a single-select segmented control.
 * @attr {string} value - The selected segment's value. Reflected: it changes as the user selects, so a server re-render or a history snapshot sees the live selection. Omit it for nothing selected.
 * @attr {"horizontal" | "vertical"} orientation - Layout axis, which picks the arrow-key pair. Defaults to `horizontal`.
 * @attr {boolean} disabled - Disables the whole control: every segment is skipped by the arrow keys and never selected, and `data-disabled` is set on the root and every segment.
 * @fires {CustomEvent<{ value: string }>} primitiv-segmented-control-change - Bubbles, cancelable, fired before a user-driven selection is applied, with the segment selected afterwards. Call `preventDefault()` to veto it.
 */
export class PrimitivSegmentedControlElement extends PrimitivRootElement {
  protected readonly controller: SegmentedControlController = new SegmentedControlController(this, this.#host());
  protected readonly reconcileOn: readonly string[] = ["value", "disabled", "orientation"];

  /** The selected segment's value, reflected as the `value` attribute; `undefined` while none is selected. */
  get value(): string | undefined {
    return this.getAttribute("value") ?? undefined;
  }

  /** Select the segment whose value is `next`. */
  set value(next: string) {
    this.setAttribute("value", next);
  }

  /** The controller's view of this element: state lives in reflected attributes. */
  #host(): SegmentedControlControllerHost {
    return {
      state: () => ({
        selected: this.value,
        disabled: this.hasAttribute("disabled"),
        orientation: this.#orientation(),
        dir: this.direction(),
      }),
      change: (value) => {
        if (this.announce("primitiv-segmented-control-change", { value })) this.value = value;
      },
    };
  }

  #orientation(): SegmentedControlOrientation {
    return this.getAttribute("orientation") === "vertical" ? "vertical" : "horizontal";
  }

  protected reconcile(): void {
    const selected = this.value;
    const orientation = this.#orientation();
    const controlDisabled = this.hasAttribute("disabled");
    write(this, "role", "radiogroup");
    write(this, "aria-orientation", orientation);
    write(this, "data-orientation", orientation);
    write(this, "data-disabled", controlDisabled ? "" : null);

    const items = this.parts(ITEM).flatMap((item) => decoratable(item) ?? []);
    const stop = segmentedControlTabStop({
      values: items.map((item) => item.value),
      disabled: new Set(items.filter((item) => controlDisabled || item.disabled).map((item) => item.value)),
      selected,
    });

    // Replace the registration wholesale: a removed segment, or a segment whose
    // child a framework re-rendered, simply is not registered again.
    this.controller.setTriggers(items.map(({ value, button, disabled }) => ({ value, element: button, disabled })));

    for (const { value, button, disabled } of items) {
      const on = value === selected;
      const off = controlDisabled || disabled;
      write(button, "role", "radio");
      write(button, "aria-checked", String(on));
      write(button, "data-state", on ? "checked" : "unchecked");
      write(button, "tabindex", value === stop ? "0" : "-1");
      write(button, "aria-disabled", off ? "true" : null);
      write(button, "data-disabled", off ? "" : null);
    }
  }
}

/**
 * `<primitiv-segmented-control-item>` — an interactive part: one segment. It
 * decorates exactly one child the consumer writes, a `<button>`, which gets
 * `role="radio"`, `aria-checked`, `data-state="checked" | "unchecked"` and the
 * roving `tabindex`.
 *
 * @customElement primitiv-segmented-control-item
 * @attr {string} value - The segment's value, the root's `value` while it is selected.
 * @attr {boolean} disabled - Skipped by the arrow keys and never selected (`aria-disabled` and `data-disabled` on the child).
 */
export class PrimitivSegmentedControlItemElement extends ElementBase {}

/**
 * Define the two SegmentedControl elements on `registry` (the global
 * `customElements` by default). Safe to call more than once, and a no-op where
 * there is no registry (a server render).
 */
export function defineSegmentedControl(registry: ElementRegistry | undefined = globalThis.customElements): void {
  defineElements(registry, [
    [ROOT, PrimitivSegmentedControlElement],
    [ITEM, PrimitivSegmentedControlItemElement],
  ]);
}
