import { defineElements, ElementBase, reportOnce, write, type ElementRegistry } from "../internal/element.ts";
import { PrimitivRootElement } from "../internal/RootElement.ts";
import { DropdownController, type DropdownControllerHost } from "./DropdownController.ts";
import { DropdownSubController, type DropdownSubControllerHost } from "./DropdownSubController.ts";

export type { ElementRegistry };

// Stryker disable StringLiteral: static — evaluated once at import, so runtime mutant switching never reaches them; the names are pinned by the defineDropdown registry test instead.
const ROOT = "primitiv-dropdown";
const TRIGGER = "primitiv-dropdown-trigger";
const CONTENT = "primitiv-dropdown-content";
const ITEM = "primitiv-dropdown-item";
const CHECKBOX_ITEM = "primitiv-dropdown-checkbox-item";
const RADIO_GROUP = "primitiv-dropdown-radio-group";
const RADIO_ITEM = "primitiv-dropdown-radio-item";
const INDICATOR = "primitiv-dropdown-item-indicator";
const GROUP = "primitiv-dropdown-group";
const LABEL = "primitiv-dropdown-label";
const SEPARATOR = "primitiv-dropdown-separator";
const SUB = "primitiv-dropdown-sub";
const SUB_TRIGGER = "primitiv-dropdown-sub-trigger";
const SUB_CONTENT = "primitiv-dropdown-sub-content";
/** Every part that is a chosen item: the plain, checkbox and radio items. */
const ITEMS = `${ITEM},${CHECKBOX_ITEM},${RADIO_ITEM}`;
// Stryker restore StringLiteral

/** The one element child an interactive part decorates, or `null`, reported once, without exactly one. */
function decoratable(part: HTMLElement, what: string): HTMLElement | null {
  if (part.childElementCount === 1) return part.firstElementChild as HTMLElement;
  reportOnce(part, `<${part.localName}> needs exactly one element child (${what}) to decorate.`);
  return null;
}

/** Fire a bubbling, cancelable event on `target`; whether no listener vetoed it. */
function announceOn(target: Element, type: string, detail: unknown): boolean {
  return target.dispatchEvent(new CustomEvent(type, { bubbles: true, cancelable: true, detail }));
}

/** A checkbox item's state, from its `checked` attribute: absent, present, or `"indeterminate"`. */
function checkedState(part: Element): boolean | "indeterminate" {
  const value = part.getAttribute("checked");
  return value === "indeterminate" ? value : value !== null;
}

/** A radio item's state: whether its value is its group's. */
function radioChecked(part: Element): boolean {
  return part.closest(RADIO_GROUP)?.getAttribute("value") === part.getAttribute("value");
}

/**
 * `<primitiv-dropdown>` — the state owner of a dropdown menu (WAI-ARIA APG
 * Menu Button): a trigger that opens a menu of items. The menu is a
 * `popover="auto"` in the top layer, shown with the trigger as its source,
 * which makes the trigger its implicit anchor for CSS anchor positioning.
 * Choosing an item — any item, a submenu's too — closes the menu and hands
 * focus back to the trigger.
 *
 * The root finds its own parts and reconciles their ARIA from its reflected
 * state whenever a part arrives, leaves, or changes an attribute the root
 * reads (the lifecycle is `PrimitivRootElement`'s).
 *
 * @customElement primitiv-dropdown
 * @summary The state owner of a dropdown menu.
 * @attr {boolean} open - Whether the menu is open. Reflected: it changes as the user opens and dismisses it. Set it (or the `open` property) to open or close it from script.
 * @fires {CustomEvent<{ open: boolean }>} primitiv-dropdown-change - Bubbles, cancelable, fired before a user-driven change is applied — the trigger, Escape, a press outside or a chosen item — with the open state afterwards. Call `preventDefault()` to veto it.
 * @fires {CustomEvent<null>} primitiv-dropdown-select - Bubbles, cancelable, fired on the item part when an item is chosen, after a checkbox or radio item has changed. Call `preventDefault()` to keep the menu open.
 * @fires {CustomEvent<{ checked: boolean }>} primitiv-dropdown-checked-change - Bubbles, cancelable, fired on a checkbox item before it changes, with its state afterwards. Call `preventDefault()` to veto it.
 * @fires {CustomEvent<{ value: string }>} primitiv-dropdown-value-change - Bubbles, cancelable, fired on a radio group before its value changes, with the value afterwards. Call `preventDefault()` to veto it.
 */
export class PrimitivDropdownElement extends PrimitivRootElement {
  /** The menu the root currently decorates, and the controller over it. */
  #content: HTMLElement | null = null;
  #menu: DropdownController | null = null;
  /** The decorated trigger, as of the last reconcile. */
  #trigger: HTMLElement | null = null;
  /** The root's own listeners, while connected. */
  #listening: AbortController | null = null;
  protected readonly controller: { connect(): void; disconnect(): void } = {
    connect: (): void => this.#connect(),
    disconnect: (): void => this.#disconnect(),
  };
  protected readonly reconcileOn: readonly string[] = ["open", "disabled", "checked", "value"];

  /** Whether the menu is open, reflected as the boolean `open` attribute. */
  get open(): boolean {
    return this.hasAttribute("open");
  }

  set open(next: boolean) {
    this.toggleAttribute("open", next);
  }

  /** The controller's view of this element: state lives in the reflected attribute. */
  #host(): DropdownControllerHost {
    return {
      state: () => ({ open: this.open }),
      change: (open) => this.#change(open),
      trigger: () => this.#trigger,
      source: () => this.#trigger,
    };
  }

  /** A change the user asked for: announced first, so a listener can veto it. */
  #change(open: boolean): void {
    if (open === this.open) return;
    if (this.announce("primitiv-dropdown-change", { open })) this.open = open;
    // A veto can leave the menu out of step — the browser is light-dismissing
    // it — so put it back where the state says, once that dismissal is done.
    else queueMicrotask(() => this.#menu?.sync());
  }

  #connect(): void {
    this.#listening = new AbortController();
    const options = { signal: this.#listening.signal };
    this.addEventListener("click", (event) => this.#click(event), options);
    this.addEventListener("pointerover", (event) => this.#highlight(event, true), options);
    this.addEventListener("pointerout", (event) => this.#highlight(event, false), options);
    this.#menu?.connect();
  }

  #disconnect(): void {
    // A root disconnects only after it connected, so it is listening.
    (this.#listening as AbortController).abort();
    this.#listening = null;
    this.#menu?.disconnect();
  }

  /** The item part (of this root) an event landed in, or `null`. */
  #itemOf(target: EventTarget | null): HTMLElement | null {
    const part = (target as Element | null)?.closest?.<HTMLElement>(ITEMS) ?? null;
    return part?.closest(ROOT) === this ? part : null;
  }

  /** Mark the item the pointer is over, as React's `data-highlighted`. */
  #highlight(event: PointerEvent, over: boolean): void {
    const part = this.#itemOf(event.target);
    if (!part || part === this.#itemOf(event.relatedTarget)) return;
    const child = part.firstElementChild as HTMLElement;
    write(child, "data-highlighted", over ? "" : null);
  }

  #click(event: MouseEvent): void {
    const target = event.target as Node;
    if (this.#trigger?.contains(target)) {
      this.#change(!this.open);
      return;
    }
    const part = this.#itemOf(target);
    if (!part || part.hasAttribute("disabled")) return;
    if (part.localName === CHECKBOX_ITEM) {
      const checked = checkedState(part) !== true;
      if (announceOn(part, "primitiv-dropdown-checked-change", { checked })) part.toggleAttribute("checked", checked);
    } else if (part.localName === RADIO_ITEM && !radioChecked(part)) {
      const group = part.closest(RADIO_GROUP) as HTMLElement;
      const value = part.getAttribute("value") as string;
      if (announceOn(group, "primitiv-dropdown-value-change", { value })) group.setAttribute("value", value);
    }
    if (!announceOn(part, "primitiv-dropdown-select", null)) return;
    this.#change(false);
    this.#trigger?.focus();
  }

  /**
   * Decorate `content` from now on: the controller follows it. Only a
   * reconcile calls this, and a root reconciles only while connected, so the
   * new controller listens at once.
   */
  #use(content: HTMLElement | null): void {
    // Stryker disable next-line ConditionalExpression: equivalent — rebuilding the controller over the same menu swaps one listener set for an identical one.
    if (content === this.#content) return;
    this.#menu?.disconnect();
    this.#content = content;
    this.#menu = content ? new DropdownController(content, this.#host()) : null;
    this.#menu?.connect();
  }

  protected reconcile(): void {
    const open = this.open;
    const rootId = this.rootId();

    const [content = null] = this.parts(CONTENT);
    const [triggerPart] = this.parts(TRIGGER);
    this.#trigger = triggerPart ? decoratable(triggerPart, "a <button>") : null;

    if (content) {
      if (!content.id) content.id = `${rootId}-content`;
      write(content, "role", "menu");
      if (!content.hasAttribute("popover")) content.setAttribute("popover", "auto");
    }
    if (this.#trigger) {
      write(this.#trigger, "aria-haspopup", "menu");
      write(this.#trigger, "aria-expanded", String(open));
      write(this.#trigger, "aria-controls", content ? content.id : null);
    }

    for (const part of this.parts(ITEMS)) {
      const child = decoratable(part, "an <li>");
      if (!child) continue;
      const checkbox = part.localName === CHECKBOX_ITEM;
      const radio = part.localName === RADIO_ITEM;
      const checked = checkbox ? checkedState(part) : radio && radioChecked(part);
      write(child, "role", checkbox ? "menuitemcheckbox" : radio ? "menuitemradio" : "menuitem");
      write(child, "tabindex", "-1");
      write(child, "aria-disabled", part.hasAttribute("disabled") ? "true" : null);
      write(child, "aria-checked", checkbox || radio ? (checked === "indeterminate" ? "mixed" : String(checked)) : null);
    }
    for (const indicator of this.parts(INDICATOR)) {
      const item = indicator.closest(`${CHECKBOX_ITEM},${RADIO_ITEM}`);
      const checked = item?.localName === CHECKBOX_ITEM ? checkedState(item) : item ? radioChecked(item) : false;
      write(indicator, "data-state", checked === "indeterminate" ? checked : checked ? "checked" : "unchecked");
      write(indicator, "hidden", checked || indicator.hasAttribute("force-mount") ? null : "");
    }
    let labels = 0;
    for (const label of this.parts(LABEL)) {
      if (!label.id) label.id = `${rootId}-label-${++labels}`;
    }
    for (const group of this.parts(GROUP)) {
      const label = [...group.querySelectorAll(LABEL)].find((candidate) => candidate.closest(GROUP) === group);
      write(group, "role", "group");
      write(group, "aria-labelledby", label ? label.id : null);
    }
    for (const group of this.parts(RADIO_GROUP)) write(group, "role", "group");
    for (const separator of this.parts(SEPARATOR)) write(separator, "role", "separator");

    this.#use(content);
    this.#menu?.sync();
  }
}

/**
 * `<primitiv-dropdown-sub>` — the state owner of a submenu, inside a dropdown's
 * menu: a sub-trigger row that opens a nested menu on a click, a hover, or the
 * arrow pointing away from its parent (ArrowRight, or ArrowLeft right to
 * left), and closes it on the arrow back, or when the pointer moves to another
 * row of the parent menu.
 *
 * @customElement primitiv-dropdown-sub
 * @summary The state owner of a submenu.
 * @attr {boolean} open - Whether the submenu is open. Reflected.
 * @fires {CustomEvent<{ open: boolean }>} primitiv-dropdown-sub-change - Bubbles, cancelable, fired before a user-driven change is applied, with the open state afterwards. Call `preventDefault()` to veto it.
 */
export class PrimitivDropdownSubElement extends PrimitivRootElement {
  #content: HTMLElement | null = null;
  #menu: DropdownSubController | null = null;
  #trigger: HTMLElement | null = null;
  /** Whether the pointer is over the sub-trigger. */
  #hovered = false;
  #listening: AbortController | null = null;
  protected readonly controller: { connect(): void; disconnect(): void } = {
    connect: (): void => this.#connect(),
    disconnect: (): void => this.#disconnect(),
  };
  protected readonly reconcileOn: readonly string[] = ["open", "disabled"];

  /** Whether the submenu is open, reflected as the boolean `open` attribute. */
  get open(): boolean {
    return this.hasAttribute("open");
  }

  set open(next: boolean) {
    this.toggleAttribute("open", next);
  }

  #host(): DropdownSubControllerHost {
    return {
      state: () => ({ open: this.open }),
      change: (open) => this.#change(open),
      trigger: () => this.#trigger,
      source: () => this.#trigger,
      closeKey: () => (this.direction() === "rtl" ? "ArrowRight" : "ArrowLeft"),
    };
  }

  #change(open: boolean): void {
    if (open === this.open) return;
    if (this.announce("primitiv-dropdown-sub-change", { open })) this.open = open;
    else queueMicrotask(() => this.#menu?.sync());
  }

  /** Whether the sub-trigger is disabled. */
  #disabled(): boolean {
    return this.parts(SUB_TRIGGER)[0]?.hasAttribute("disabled") ?? false;
  }

  #connect(): void {
    this.#listening = new AbortController();
    const options = { signal: this.#listening.signal };
    this.addEventListener("click", (event) => this.#onTrigger(event) && this.#openIfEnabled(), options);
    this.addEventListener("keydown", (event) => this.#keydown(event), options);
    this.addEventListener("pointerover", (event) => this.#pointer(event, true), options);
    this.addEventListener("pointerout", (event) => this.#pointer(event, false), options);
    document.addEventListener("pointerover", (event) => this.#sibling(event), options);
    this.#menu?.connect();
  }

  #disconnect(): void {
    (this.#listening as AbortController).abort();
    this.#listening = null;
    this.#menu?.disconnect();
  }

  /** Whether an event landed on the decorated sub-trigger. */
  #onTrigger(event: Event): boolean {
    return this.#trigger?.contains(event.target as Node) ?? false;
  }

  #openIfEnabled(): void {
    if (!this.#disabled()) this.#change(true);
  }

  #keydown(event: KeyboardEvent): void {
    if (!this.#onTrigger(event) || this.#disabled()) return;
    if (event.key !== (this.direction() === "rtl" ? "ArrowLeft" : "ArrowRight")) return;
    event.preventDefault();
    event.stopPropagation();
    this.#change(true);
  }

  #pointer(event: PointerEvent, over: boolean): void {
    if (!this.#onTrigger(event) || this.#trigger?.contains(event.relatedTarget as Node | null)) return;
    this.#hovered = over;
    this.reconcile();
    if (over) this.#openIfEnabled();
  }

  /** The pointer reached another row of the parent menu: close, as moving the keyboard there would. */
  #sibling(event: PointerEvent): void {
    if (!this.open || this.contains(event.target as Node)) return;
    const row = (event.target as Element).closest?.('[role^="menuitem"]');
    if (row && row.closest('[role="menu"]') === this.parentElement?.closest('[role="menu"]')) this.#change(false);
  }

  #use(content: HTMLElement | null): void {
    // Stryker disable next-line ConditionalExpression: equivalent — rebuilding the controller over the same menu swaps one listener set for an identical one.
    if (content === this.#content) return;
    this.#menu?.disconnect();
    this.#content = content;
    this.#menu = content ? new DropdownSubController(content, this.#host()) : null;
    this.#menu?.connect();
  }

  protected reconcile(): void {
    const open = this.open;
    const [content = null] = this.parts(SUB_CONTENT);
    const [triggerPart] = this.parts(SUB_TRIGGER);
    this.#trigger = triggerPart ? decoratable(triggerPart, "an <li>") : null;

    if (content) {
      if (!content.id) content.id = `${this.rootId()}-content`;
      write(content, "role", "menu");
      if (!content.hasAttribute("popover")) content.setAttribute("popover", "auto");
    }
    if (this.#trigger) {
      write(this.#trigger, "role", "menuitem");
      write(this.#trigger, "tabindex", "-1");
      write(this.#trigger, "aria-haspopup", "menu");
      write(this.#trigger, "aria-expanded", String(open));
      write(this.#trigger, "aria-controls", content ? content.id : null);
      write(this.#trigger, "aria-disabled", this.#disabled() ? "true" : null);
      write(this.#trigger, "data-highlighted", this.#hovered || open ? "" : null);
    }

    this.#use(content);
    this.#menu?.sync();
  }
}

/**
 * `<primitiv-dropdown-trigger>` — an interactive part. It decorates exactly
 * one child the consumer writes, a `<button>`, which toggles the menu and is
 * its menu button (`aria-haspopup`, `aria-expanded`, `aria-controls`).
 *
 * @customElement primitiv-dropdown-trigger
 */
export class PrimitivDropdownTriggerElement extends ElementBase {}

/**
 * `<primitiv-dropdown-content>` — the menu itself. Structural: the root gives
 * it an id, `role="menu"` and `popover="auto"` (write it in your markup too, so
 * it is hidden before the script loads).
 *
 * @customElement primitiv-dropdown-content
 */
export class PrimitivDropdownContentElement extends ElementBase {}

/**
 * `<primitiv-dropdown-item>` — an interactive part: one item. It decorates
 * exactly one child the consumer writes, an `<li>` (or a link), which gets
 * `role="menuitem"`, `tabindex="-1"` and `data-highlighted` while the pointer
 * is over it.
 *
 * @customElement primitiv-dropdown-item
 * @attr {boolean} disabled - Skipped by the keyboard, and does nothing when clicked (`aria-disabled` on the child).
 */
export class PrimitivDropdownItemElement extends ElementBase {}

/**
 * `<primitiv-dropdown-checkbox-item>` — an item that toggles. Its child gets
 * `role="menuitemcheckbox"` and `aria-checked`.
 *
 * @customElement primitiv-dropdown-checkbox-item
 * @attr {boolean} checked - Whether it is checked; `checked="indeterminate"` for mixed. Reflected.
 * @attr {boolean} disabled - As on an item.
 */
export class PrimitivDropdownCheckboxItemElement extends ElementBase {}

/**
 * `<primitiv-dropdown-radio-group>` — a group of radio items, one of which is
 * checked. Structural: `role="group"`.
 *
 * @customElement primitiv-dropdown-radio-group
 * @attr {string} value - The checked item's value. Reflected.
 */
export class PrimitivDropdownRadioGroupElement extends ElementBase {}

/**
 * `<primitiv-dropdown-radio-item>` — an item checked when its value is its
 * group's. Its child gets `role="menuitemradio"` and `aria-checked`.
 *
 * @customElement primitiv-dropdown-radio-item
 * @attr {string} value - The value it sets on its group.
 * @attr {boolean} disabled - As on an item.
 */
export class PrimitivDropdownRadioItemElement extends ElementBase {}

/**
 * `<primitiv-dropdown-item-indicator>` — the check or dot inside a checkbox or
 * radio item, `hidden` while unchecked. Structural: it gets `data-state`.
 *
 * @customElement primitiv-dropdown-item-indicator
 * @attr {boolean} force-mount - Keep it shown while unchecked, to animate it.
 */
export class PrimitivDropdownItemIndicatorElement extends ElementBase {}

/**
 * `<primitiv-dropdown-group>` — a labelled group of items. Structural:
 * `role="group"`, named by the label inside it.
 *
 * @customElement primitiv-dropdown-group
 */
export class PrimitivDropdownGroupElement extends ElementBase {}

/**
 * `<primitiv-dropdown-label>` — a group's label, not an item. Structural: the
 * root gives it an id.
 *
 * @customElement primitiv-dropdown-label
 */
export class PrimitivDropdownLabelElement extends ElementBase {}

/**
 * `<primitiv-dropdown-separator>` — a rule between items. Structural:
 * `role="separator"`.
 *
 * @customElement primitiv-dropdown-separator
 */
export class PrimitivDropdownSeparatorElement extends ElementBase {}

/**
 * `<primitiv-dropdown-sub-trigger>` — the row that opens a submenu. It
 * decorates exactly one child, an `<li>`, which gets `role="menuitem"` and the
 * submenu's `aria-haspopup`, `aria-expanded` and `aria-controls`.
 *
 * @customElement primitiv-dropdown-sub-trigger
 * @attr {boolean} disabled - It does not open the submenu.
 */
export class PrimitivDropdownSubTriggerElement extends ElementBase {}

/**
 * `<primitiv-dropdown-sub-content>` — the submenu itself, inside the parent
 * menu. Structural, as the content: an id, `role="menu"`, `popover="auto"`.
 *
 * @customElement primitiv-dropdown-sub-content
 */
export class PrimitivDropdownSubContentElement extends ElementBase {}

/**
 * Define the fourteen Dropdown elements on `registry` (the global
 * `customElements` by default). Safe to call more than once, and a no-op where
 * there is no registry (a server render).
 */
export function defineDropdown(registry: ElementRegistry | undefined = globalThis.customElements): void {
  defineElements(registry, [
    [ROOT, PrimitivDropdownElement],
    [TRIGGER, PrimitivDropdownTriggerElement],
    [CONTENT, PrimitivDropdownContentElement],
    [ITEM, PrimitivDropdownItemElement],
    [CHECKBOX_ITEM, PrimitivDropdownCheckboxItemElement],
    [RADIO_GROUP, PrimitivDropdownRadioGroupElement],
    [RADIO_ITEM, PrimitivDropdownRadioItemElement],
    [INDICATOR, PrimitivDropdownItemIndicatorElement],
    [GROUP, PrimitivDropdownGroupElement],
    [LABEL, PrimitivDropdownLabelElement],
    [SEPARATOR, PrimitivDropdownSeparatorElement],
    [SUB, PrimitivDropdownSubElement],
    [SUB_TRIGGER, PrimitivDropdownSubTriggerElement],
    [SUB_CONTENT, PrimitivDropdownSubContentElement],
  ]);
}
