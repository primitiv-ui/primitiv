import { toggleGroupTabStop, type ToggleGroupOrientation } from "@primitiv-ui/core";

import { defineElements, ElementBase, reportOnce, write, type ElementRegistry } from "../internal/element.ts";
import { FormReset, reconcileFormValues } from "../internal/form.ts";
import { PrimitivRootElement } from "../internal/RootElement.ts";
import { ToggleGroupController, type ToggleGroupControllerHost } from "./ToggleGroupController.ts";

export type { ElementRegistry };

// Stryker disable StringLiteral: static — evaluated once at import, so runtime mutant switching never reaches them; the names are pinned by the defineToggleGroup registry test instead.
const ROOT = "primitiv-toggle-group";
const ITEM = "primitiv-toggle-group-item";
// Stryker restore StringLiteral

/** Split a space-separated `value` into item values. */
function tokens(value: string | null): string[] {
  // Stryker disable next-line Regex: equivalent — splitting on single whitespace leaves empty tokens, which the filter drops.
  return (value ?? "").split(/\s+/).filter(Boolean);
}

/** An item the root can decorate: its value, the child it decorates, and whether it is disabled. */
type Item = { value: string; button: HTMLElement; disabled: boolean };

/**
 * An item decorates exactly one element child and needs a `value`. Anything
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
 * `<primitiv-toggle-group>` — the state owner of a group of toggle buttons.
 *
 * The root is the group: it takes `role="group"`, so name it with `aria-label`
 * or `aria-labelledby`. Only one item is in the page's Tab order at a time —
 * the item focus last moved to, else the first pressed item, else the first —
 * and the arrow keys move between items. The root reconciles its items' ARIA
 * whenever an item arrives, leaves, or changes an attribute the root reads (the
 * lifecycle is `PrimitivRootElement`'s). `type` is read live at each toggle, so a
 * change to it needs no reconcile.
 *
 * @customElement primitiv-toggle-group
 * @summary The state owner of a group of toggle buttons.
 * @attr {string} value - The pressed items' values, separated by spaces. Reflected: it changes as the user presses items, so a server re-render or a history snapshot sees what is pressed. Item values therefore cannot contain whitespace.
 * @attr {"single" | "multiple"} type - `single` keeps at most one item pressed — pressing another lets go of it, and pressing it again leaves none; `multiple` lets items toggle independently. Defaults to `single`.
 * @attr {"horizontal" | "vertical"} orientation - Layout axis, which picks the arrow-key pair. Defaults to `horizontal`.
 * @attr {string} name - Submit the pressed values with a form, each under this name, as same-named checked checkboxes would: nothing while none is pressed. A form reset restores the values the group first rendered with. Without it the group takes no part in forms.
 * @fires {CustomEvent<{ value: string[] }>} primitiv-toggle-group-change - Bubbles, cancelable, fired before a user-driven toggle is applied, with every item pressed afterwards. Call `preventDefault()` to veto it.
 * @fires {Event} change - Bubbles, fired after a user's change has applied, as a form control's is: the hidden form inputs already hold the new value, so a `change` listener, `hx-trigger="change"` or `new FormData()` reads it. Not cancelable; veto with the event above.
 */
export class PrimitivToggleGroupElement extends PrimitivRootElement {
  /** The item focus last moved to, which holds the tab stop. */
  #focused: string | undefined;
  protected readonly controller: ToggleGroupController = new ToggleGroupController(this, this.#host());
  protected readonly reconcileOn: readonly string[] = ["value", "disabled", "orientation", "name"];
  readonly #reset = new FormReset();

  constructor() {
    super();
    // On the root itself, so it needs no removing: it cannot fire while the
    // root is out of the document.
    this.addEventListener("focusin", (event) => this.#focus(event.target as Node));
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.#reset.connect(this);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#reset.disconnect();
  }

  /** The pressed items' values, reflected as the space-separated `value` attribute. */
  get value(): string[] {
    return tokens(this.getAttribute("value"));
  }

  /** Set the pressed items, as an array or a space-separated string. */
  set value(next: string | readonly string[]) {
    this.setAttribute("value", typeof next === "string" ? next : next.join(" "));
  }

  /** The controller's view of this element: state lives in reflected attributes. */
  #host(): ToggleGroupControllerHost {
    return {
      state: () => ({
        pressed: this.value,
        multiple: this.getAttribute("type") === "multiple",
        orientation: this.#orientation(),
        dir: this.direction(),
      }),
      change: (value) => {
        if (this.announceValue("primitiv-toggle-group-change", { value })) this.value = value;
      },
    };
  }

  #orientation(): ToggleGroupOrientation {
    return this.getAttribute("orientation") === "vertical" ? "vertical" : "horizontal";
  }

  /** This root's decoratable items, never a nested group's. */
  #items(): Item[] {
    return this.parts(ITEM).flatMap((item) => decoratable(item) ?? []);
  }

  /** Move the tab stop to the item focus arrived in, if it is one of ours. */
  #focus(target: Node): void {
    const item = this.#items().find(({ button }) => button.contains(target));
    if (!item) return;
    this.#focused = item.value;
    this.reconcile();
  }

  protected reconcile(): void {
    const pressed = this.value;
    const orientation = this.#orientation();
    write(this, "role", "group");
    write(this, "data-orientation", orientation);

    const items = this.#items();
    const stop = toggleGroupTabStop({
      values: items.map((item) => item.value),
      disabled: new Set(items.filter((item) => item.disabled).map((item) => item.value)),
      pressed,
      focused: this.#focused,
    });

    // Replace the registration wholesale: a removed item, or an item whose
    // child a framework re-rendered, simply is not registered again.
    this.controller.setTriggers(items.map(({ value, button, disabled }) => ({ value, element: button, disabled })));

    for (const { value, button, disabled } of items) {
      const on = pressed.includes(value);
      write(button, "aria-pressed", String(on));
      write(button, "data-state", on ? "on" : "off");
      write(button, "tabindex", value === stop ? "0" : "-1");
      write(button, "aria-disabled", disabled ? "true" : null);
      write(button, "data-disabled", disabled ? "" : null);
    }

    // With a `name`, each pressed value submits as a checked checkbox would.
    reconcileFormValues(this, this.getAttribute("name"), pressed);
  }
}

/**
 * `<primitiv-toggle-group-item>` — an interactive part: one toggle. It decorates
 * exactly one child the consumer writes, a `<button>`, which gets `aria-pressed`,
 * `data-state="on" | "off"` and the roving `tabindex`.
 *
 * @customElement primitiv-toggle-group-item
 * @attr {string} value - The item's value, listed in the root's `value` while it is pressed. No whitespace.
 * @attr {boolean} disabled - Skipped by the arrow keys and never pressed (`aria-disabled` and `data-disabled` on the child).
 */
export class PrimitivToggleGroupItemElement extends ElementBase {}

/**
 * Define the two ToggleGroup elements on `registry` (the global
 * `customElements` by default). Safe to call more than once, and a no-op where
 * there is no registry (a server render).
 */
export function defineToggleGroup(registry: ElementRegistry | undefined = globalThis.customElements): void {
  defineElements(registry, [
    [ROOT, PrimitivToggleGroupElement],
    [ITEM, PrimitivToggleGroupItemElement],
  ]);
}
