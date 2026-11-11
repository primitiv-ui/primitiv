import type { SegmentedControlOrientation } from "@primitiv-ui/core";

import { defineElements, ElementBase, write, type ElementRegistry } from "../internal/element.ts";
import { RadioRootElement } from "../internal/RadioRootElement.ts";

export type { ElementRegistry };

// Stryker disable StringLiteral: static — evaluated once at import, so runtime mutant switching never reaches them; the names are pinned by the defineSegmentedControl registry test instead.
const ROOT = "primitiv-segmented-control";
const ITEM = "primitiv-segmented-control-item";
// Stryker restore StringLiteral

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
export class PrimitivSegmentedControlElement extends RadioRootElement {
  protected readonly itemTag: string = ITEM;
  protected readonly changeEvent: string = "primitiv-segmented-control-change";
  protected readonly disableable: boolean = true;
  protected readonly reconcileOn: readonly string[] = ["value", "disabled", "orientation"];

  protected orientation(): SegmentedControlOrientation {
    return this.getAttribute("orientation") === "vertical" ? "vertical" : "horizontal";
  }

  protected writeRoot(orientation: SegmentedControlOrientation, disabled: boolean): void {
    write(this, "role", "radiogroup");
    write(this, "aria-orientation", orientation);
    write(this, "data-orientation", orientation);
    write(this, "data-disabled", disabled ? "" : null);
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
