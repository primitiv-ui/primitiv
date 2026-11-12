import { defineElements, ElementBase, reportOnce, write, type ElementRegistry } from "../internal/element.ts";
import { PrimitivRootElement } from "../internal/RootElement.ts";
import { SelectController, type SelectControllerHost, type SelectOption } from "./SelectController.ts";

export type { ElementRegistry };

// Stryker disable StringLiteral: static — evaluated once at import, so runtime mutant switching never reaches them; the names are pinned by the defineSelect registry test instead.
const ROOT = "primitiv-select";
const TRIGGER = "primitiv-select-trigger";
const VALUE = "primitiv-select-value";
const CONTENT = "primitiv-select-content";
const ITEM = "primitiv-select-item";
const INDICATOR = "primitiv-select-item-indicator";
const GROUP = "primitiv-select-group";
const SEPARATOR = "primitiv-select-separator";

/** Marks the native select the root keeps for its form, so it is never mistaken for consumer markup. */
const NATIVE = "data-primitiv-select-native";

/** The visually hidden style of the native select: present for forms and validation, never seen or tabbed to. */
const VISUALLY_HIDDEN =
  "position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0";
// Stryker restore StringLiteral

/**
 * An item needs a `value`. Without one it is reported once and left
 * undecorated rather than thrown: a server-rendered page has no error boundary
 * to catch a throw (RFC 0033 D24).
 */
function decoratable(item: HTMLElement): SelectOption | null {
  const value = item.getAttribute("value");
  if (value !== null) return { value, element: item, disabled: item.hasAttribute("disabled") };
  reportOnce(item, `<${ITEM}> needs a value.`);
  return null;
}

/**
 * `<primitiv-select>` — a value chosen from a list that opens from a trigger
 * (WAI-ARIA APG select-only combobox, as a button and a listbox).
 *
 * The root owns the state: `value`, the chosen item, and `open`, both
 * reflected. The `<button>` inside `<primitiv-select-trigger>` opens and closes
 * the list; `<primitiv-select-content>` is the list, a `popover="auto"` panel
 * in the top layer that closes on a press outside or Escape. Opening focuses
 * the selected item (else the first); the arrows, Home and End move, typing
 * jumps to the item it starts, and Enter, Space or a click chooses — which
 * closes the list and hands focus back to the trigger.
 *
 * With a `name` it takes part in forms like a native select: it keeps a
 * visually hidden `<select>` inside itself, so the value submits, `required`
 * validates and `disabled` leaves it out, and a form reset restores the value
 * it first rendered with.
 *
 * @customElement primitiv-select
 * @summary A value chosen from a list that opens from a trigger.
 * @attr {string} value - The chosen item's value. Reflected: it changes as the user chooses, so a server re-render or a history snapshot sees it.
 * @attr {boolean} open - Whether the list is showing. Reflected.
 * @attr {string} name - The name the value submits under. Without one the select takes no part in forms.
 * @attr {boolean} required - The form is invalid while nothing is chosen.
 * @attr {boolean} disabled - Leaves the value out of the form. Disable the trigger's `<button>` to stop it opening.
 * @fires {CustomEvent<{ value: string }>} primitiv-select-change - Bubbles, cancelable, fired before a chosen value is applied. Call `preventDefault()` to veto it; the list closes either way.
 * @fires {CustomEvent<{ open: boolean }>} primitiv-select-open-change - Bubbles, cancelable, fired before the list opens or closes. Call `preventDefault()` to veto it.
 */
export class PrimitivSelectElement extends PrimitivRootElement {
  #content: HTMLElement | null = null;
  #list: SelectController | null = null;
  #trigger: HTMLElement | null = null;
  #listening: AbortController | null = null;
  /** The value the select first rendered with, which a form reset restores. */
  #initial: string | null = null;
  protected readonly controller: { connect(): void; disconnect(): void } = {
    connect: (): void => this.#connect(),
    disconnect: (): void => this.#disconnect(),
  };
  protected readonly reconcileOn: readonly string[] = ["open", "value", "disabled", "name", "required", "placeholder", "label", "force-mount"];

  /** The chosen item's value, or `""` when none is chosen. */
  get value(): string {
    return this.getAttribute("value") ?? "";
  }

  set value(next: string) {
    this.setAttribute("value", next);
  }

  /** Whether the list is showing, reflected as the `open` attribute. */
  get open(): boolean {
    return this.hasAttribute("open");
  }

  set open(next: boolean) {
    this.toggleAttribute("open", next);
  }

  #host(): SelectControllerHost {
    return {
      state: () => ({ open: this.open }),
      change: (open) => this.#change(open),
      select: (value) => {
        if (value !== this.value && this.announce("primitiv-select-change", { value })) this.value = value;
      },
      trigger: () => this.#trigger,
      source: () => this.#trigger,
    };
  }

  #change(open: boolean): void {
    if (open === this.open) return;
    if (this.announce("primitiv-select-open-change", { open })) this.open = open;
    // A veto can leave the list out of step — the browser is light-dismissing
    // it — so put it back where the state says, once that dismissal is done.
    else queueMicrotask(() => this.#list?.sync());
  }

  #connect(): void {
    this.#initial ??= this.value;
    this.#listening = new AbortController();
    const { signal } = this.#listening;
    this.addEventListener("click", (event) => {
      if (this.#trigger?.contains(event.target as Node)) this.#change(!this.open);
    }, { signal });
    // A reset restores the native select first, so read the value back after it.
    this.closest("form")?.addEventListener("reset", () => queueMicrotask(() => (this.value = this.#initial as string)), { signal });
    this.#list?.connect();
  }

  #disconnect(): void {
    // A root disconnects only after it connected, so it is listening.
    (this.#listening as AbortController).abort();
    this.#listening = null;
    this.#list?.disconnect();
  }

  #use(content: HTMLElement | null): void {
    // Stryker disable next-line ConditionalExpression: equivalent — rebuilding the controller over the same list swaps one listener set for an identical one.
    if (content === this.#content) return;
    this.#list?.disconnect();
    this.#content = content;
    this.#list = content ? new SelectController(content, this.#host()) : null;
    this.#list?.connect();
  }

  protected reconcile(): void {
    const open = this.open;
    const value = this.value;
    const rootId = this.rootId();

    const [content = null] = this.parts(CONTENT);
    if (content) {
      if (!content.id) content.id = `${rootId}-content`;
      write(content, "role", "listbox");
      write(content, "tabindex", "-1");
      if (!content.hasAttribute("popover")) content.setAttribute("popover", "auto");
    }

    const [triggerPart] = this.parts(TRIGGER);
    this.#trigger = triggerPart ? this.#decorateTrigger(triggerPart) : null;
    if (this.#trigger) {
      write(this.#trigger, "aria-haspopup", "listbox");
      write(this.#trigger, "aria-expanded", String(open));
      write(this.#trigger, "aria-controls", content ? content.id : null);
    }

    const options = this.parts(ITEM).flatMap((item) => decoratable(item) ?? []);
    for (const { value: itemValue, element, disabled } of options) {
      const selected = itemValue === value;
      write(element, "role", "option");
      write(element, "tabindex", "-1");
      write(element, "aria-selected", String(selected));
      write(element, "data-state", selected ? "checked" : "unchecked");
      write(element, "aria-disabled", disabled ? "true" : null);
      write(element, "data-disabled", disabled ? "" : null);
    }
    for (const indicator of this.parts(INDICATOR)) {
      const selected = indicator.closest(ITEM)?.getAttribute("value") === value;
      write(indicator, "data-state", selected ? "checked" : "unchecked");
      write(indicator, "hidden", selected || indicator.hasAttribute("force-mount") ? null : "");
    }
    for (const group of this.parts(GROUP)) {
      write(group, "role", "group");
      write(group, "aria-label", group.getAttribute("label"));
    }
    for (const separator of this.parts(SEPARATOR)) write(separator, "role", "separator");

    const chosen = options.find((option) => option.value === value);
    for (const part of this.parts(VALUE)) this.#mirror(part, chosen?.element ?? null);
    this.#reconcileNative(value, options);

    this.#use(content);
    this.#list?.setTriggers(options);
    this.#list?.sync();
  }

  #decorateTrigger(part: HTMLElement): HTMLElement | null {
    if (part.childElementCount === 1) return part.firstElementChild as HTMLElement;
    reportOnce(part, `<${TRIGGER}> needs exactly one element child (a <button>) to decorate.`);
    return null;
  }

  /** Show the chosen item's content in a value part, less its indicator, or the placeholder. */
  #mirror(part: HTMLElement, item: HTMLElement | null): void {
    let html: string;
    if (item) {
      const copy = item.cloneNode(true) as HTMLElement;
      for (const indicator of copy.querySelectorAll(INDICATOR)) indicator.remove();
      html = copy.innerHTML;
    } else {
      const holder = document.createElement("span");
      holder.textContent = part.getAttribute("placeholder");
      html = holder.innerHTML;
    }
    // Compare first: the mirror's own write is a child mutation the root hears.
    if (part.innerHTML !== html) part.innerHTML = html;
    write(part, "data-placeholder", item ? null : "");
  }

  /** Keep the hidden native select a named select submits and validates through. */
  #reconcileNative(value: string, options: readonly SelectOption[]): void {
    let native = [...this.children].find((child) => child.hasAttribute(NATIVE)) as HTMLSelectElement | undefined;
    const name = this.getAttribute("name");
    if (name === null) {
      native?.remove();
      return;
    }
    if (!native) {
      native = document.createElement("select");
      native.setAttribute(NATIVE, "");
      native.setAttribute("aria-hidden", "true");
      native.setAttribute("tabindex", "-1");
      native.setAttribute("style", VISUALLY_HIDDEN);
      this.append(native);
    }
    write(native, "name", name);
    // Boolean attributes reflect on every set, even an unchanged one, and the
    // root observes `required` and `disabled` across its subtree: set only on change.
    const required = this.hasAttribute("required");
    const disabled = this.hasAttribute("disabled");
    if (native.required !== required) native.required = required;
    if (native.disabled !== disabled) native.disabled = disabled;
    // "" is the placeholder option already, so an item valued "" adds no second one.
    const values = ["", ...options.map((option) => option.value).filter(Boolean)];
    if ([...native.options].map((option) => option.value).join("\n") !== values.join("\n")) {
      native.replaceChildren(...values.map((optionValue) => new Option("", optionValue)));
    }
    native.value = value;
  }
}

/**
 * `<primitiv-select-trigger>` — an interactive part: it decorates exactly one
 * child you write, a `<button>`, which opens and closes the list and gets
 * `aria-haspopup="listbox"`, `aria-expanded` and `aria-controls`. Put a
 * `<primitiv-select-value>` inside the button to show the choice.
 *
 * @customElement primitiv-select-trigger
 */
export class PrimitivSelectTriggerElement extends ElementBase {}

/**
 * `<primitiv-select-value>` — a structural part: shows a copy of the chosen
 * item's content (its indicator left out), or the `placeholder` with
 * `data-placeholder` set while nothing is chosen.
 *
 * @customElement primitiv-select-value
 * @attr {string} placeholder - Shown while nothing is chosen.
 */
export class PrimitivSelectValueElement extends ElementBase {}

/**
 * `<primitiv-select-content>` — a structural part: the list itself,
 * `role="listbox"` and `popover="auto"`, shown in the top layer while the
 * select is open.
 *
 * @customElement primitiv-select-content
 */
export class PrimitivSelectContentElement extends ElementBase {}

/**
 * `<primitiv-select-item>` — a structural part: one choice. The element is the
 * option itself (`role="option"`), with `aria-selected` and
 * `data-state="checked" | "unchecked"`, focused as the arrows move.
 *
 * @customElement primitiv-select-item
 * @attr {string} value - The value the select takes when this item is chosen.
 * @attr {boolean} disabled - Skipped by the arrows and typeahead, and never chosen (`aria-disabled` and `data-disabled`).
 */
export class PrimitivSelectItemElement extends ElementBase {}

/**
 * `<primitiv-select-item-indicator>` — a structural part: a mark inside an
 * item, `hidden` unless that item is chosen, with `data-state`. Left out of the
 * value part's copy.
 *
 * @customElement primitiv-select-item-indicator
 * @attr {boolean} force-mount - Keep it shown while its item is unchosen, to animate it from `data-state`.
 */
export class PrimitivSelectItemIndicatorElement extends ElementBase {}

/**
 * `<primitiv-select-group>` — a structural part: a named cluster of items,
 * `role="group"`.
 *
 * @customElement primitiv-select-group
 * @attr {string} label - The group's accessible name.
 */
export class PrimitivSelectGroupElement extends ElementBase {}

/**
 * `<primitiv-select-separator>` — a structural part: a divider between items,
 * `role="separator"`.
 *
 * @customElement primitiv-select-separator
 */
export class PrimitivSelectSeparatorElement extends ElementBase {}

/**
 * Define the eight Select elements on `registry` (the global `customElements`
 * by default). Safe to call more than once, and a no-op where there is no
 * registry (a server render).
 */
export function defineSelect(registry: ElementRegistry | undefined = globalThis.customElements): void {
  defineElements(registry, [
    [ROOT, PrimitivSelectElement],
    [TRIGGER, PrimitivSelectTriggerElement],
    [VALUE, PrimitivSelectValueElement],
    [CONTENT, PrimitivSelectContentElement],
    [ITEM, PrimitivSelectItemElement],
    [INDICATOR, PrimitivSelectItemIndicatorElement],
    [GROUP, PrimitivSelectGroupElement],
    [SEPARATOR, PrimitivSelectSeparatorElement],
  ]);
}
