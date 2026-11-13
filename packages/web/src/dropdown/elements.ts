import { ElementBase, write, type ElementRegistry } from "../internal/element.ts";
import { decoratable, defineMenu, MenuRootElement, MenuSubElement, menuTags, type MenuTags } from "../menu/elements.ts";

export type { ElementRegistry };

// Stryker disable StringLiteral: static — evaluated once at import, so runtime mutant switching never reaches it; the names are pinned by the defineDropdown registry test instead.
const TAGS: MenuTags = menuTags("primitiv-dropdown");
// Stryker restore StringLiteral

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
export class PrimitivDropdownElement extends MenuRootElement {
  protected readonly tags: MenuTags = TAGS;
  /** The decorated trigger, as of the last reconcile. */
  #trigger: HTMLElement | null = null;

  /** The trigger toggles the menu. */
  protected clickTrigger(target: Node): void {
    if (this.#trigger?.contains(target)) this.change(!this.open);
  }

  /** The menu is shown from its trigger, its implicit anchor. */
  protected source(): HTMLElement | null {
    return this.#trigger;
  }

  protected reconcileContent(content: HTMLElement): void {
    if (!content.hasAttribute("popover")) content.setAttribute("popover", "auto");
  }

  protected reconcileTrigger(open: boolean, content: HTMLElement | null): HTMLElement | null {
    const [triggerPart] = this.parts(TAGS.trigger);
    this.#trigger = triggerPart ? decoratable(triggerPart, "a <button>") : null;
    if (this.#trigger) {
      write(this.#trigger, "aria-haspopup", "menu");
      write(this.#trigger, "aria-expanded", String(open));
      write(this.#trigger, "aria-controls", content ? content.id : null);
    }
    return this.#trigger;
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
export class PrimitivDropdownSubElement extends MenuSubElement {
  protected readonly tags: MenuTags = TAGS;
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
 * exactly one child the consumer writes — a `<div>`, a link, or a
 * `<button>` — which gets `role="menuitem"`, `tabindex="-1"` and
 * `data-highlighted` while the pointer is over it. A
 * `<button type="submit" name value>` submits its form as the submitter, by
 * click or Enter. Not an `<li>`: the content element is not a list.
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
 * decorates exactly one child, a `<div>`, which gets `role="menuitem"` and the
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
  defineMenu(registry, TAGS, [
    PrimitivDropdownElement,
    PrimitivDropdownTriggerElement,
    PrimitivDropdownContentElement,
    PrimitivDropdownItemElement,
    PrimitivDropdownCheckboxItemElement,
    PrimitivDropdownRadioGroupElement,
    PrimitivDropdownRadioItemElement,
    PrimitivDropdownItemIndicatorElement,
    PrimitivDropdownGroupElement,
    PrimitivDropdownLabelElement,
    PrimitivDropdownSeparatorElement,
    PrimitivDropdownSubElement,
    PrimitivDropdownSubTriggerElement,
    PrimitivDropdownSubContentElement,
  ]);
}
