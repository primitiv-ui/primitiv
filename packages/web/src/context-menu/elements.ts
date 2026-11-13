import { ElementBase, write, type ElementRegistry } from "../internal/element.ts";
import { defineMenu, MenuRootElement, MenuSubElement, menuTags, type MenuTags } from "../menu/elements.ts";

export type { ElementRegistry };

// Stryker disable StringLiteral: static — evaluated once at import, so runtime mutant switching never reaches it; the names are pinned by the defineContextMenu registry test instead.
const TAGS: MenuTags = menuTags("primitiv-context-menu");
// Stryker restore StringLiteral

/**
 * `<primitiv-context-menu>` — the state owner of a context menu (WAI-ARIA APG
 * Menu): a region that opens a menu at the pointer on a right-click, or on the
 * keyboard's context-menu key. The menu is a `popover="manual"` in the top
 * layer — a right-click's own release would light-dismiss an `auto` one — so
 * the root closes it on Escape, a press outside and a chosen item, and closes
 * its submenus with it.
 *
 * It publishes the pointer's position on the menu as the custom properties
 * `--primitiv-context-menu-x` / `-y`, the one style the elements write (RFC
 * 0033 D25): a point cannot be an anchor, so a stylesheet places the menu by
 * them.
 *
 * @customElement primitiv-context-menu
 * @summary The state owner of a context menu.
 * @attr {boolean} open - Whether the menu is open. Reflected: it changes as the user opens and dismisses it. Set it (or the `open` property) to open or close it from script, where it opens at its last position.
 * @fires {CustomEvent<{ open: boolean }>} primitiv-context-menu-change - Bubbles, cancelable, fired before a user-driven change is applied — a right-click, Escape, a press outside or a chosen item — with the open state afterwards. Call `preventDefault()` to veto it.
 * @fires {CustomEvent<null>} primitiv-context-menu-select - Bubbles, cancelable, fired on the item part when an item is chosen, after a checkbox or radio item has changed. Call `preventDefault()` to keep the menu open.
 * @fires {CustomEvent<{ checked: boolean }>} primitiv-context-menu-checked-change - Bubbles, cancelable, fired on a checkbox item before it changes, with its state afterwards. Call `preventDefault()` to veto it.
 * @fires {CustomEvent<{ value: string }>} primitiv-context-menu-value-change - Bubbles, cancelable, fired on a radio group before its value changes, with the value afterwards. Call `preventDefault()` to veto it.
 */
export class PrimitivContextMenuElement extends MenuRootElement {
  protected readonly tags: MenuTags = TAGS;
  /** The trigger region, as of the last reconcile. */
  #region: HTMLElement | null = null;

  /** A click is not the region's to handle: it opens on a right-click. */
  protected clickTrigger(): void {}

  protected listen(signal: AbortSignal): void {
    this.addEventListener("contextmenu", (event) => this.#contextmenu(event), { signal });
  }

  #contextmenu(event: MouseEvent): void {
    const region = this.#region;
    if (!region?.contains(event.target as Node) || region.hasAttribute("disabled")) return;
    event.preventDefault();
    const [content] = this.parts(TAGS.content);
    content?.style.setProperty("--primitiv-context-menu-x", `${event.clientX}px`);
    content?.style.setProperty("--primitiv-context-menu-y", `${event.clientY}px`);
    this.change(true);
  }

  protected reconcileContent(content: HTMLElement, open: boolean): void {
    if (!content.hasAttribute("popover")) content.setAttribute("popover", "manual");
    write(content, "data-state", open ? "open" : "closed");
  }

  protected reconcileTrigger(): HTMLElement | null {
    const [region = null] = this.parts(TAGS.trigger);
    this.#region = region;
    if (region) {
      // As React writes them: `data-state` marks an enabled region, constantly closed.
      const disabled = region.hasAttribute("disabled");
      write(region, "data-disabled", disabled ? "" : null);
      write(region, "data-state", disabled ? null : "closed");
    }
    return region;
  }

  protected reconcile(): void {
    super.reconcile();
    // Manual popovers do not hide with the menu they sit in: close the submenus
    // too. The attribute, not the property: a sub not yet upgraded would keep
    // a plain `open` property that shadows its own for good.
    if (!this.open) for (const sub of this.parts(TAGS.sub)) sub.removeAttribute("open");
  }
}

/**
 * `<primitiv-context-menu-sub>` — the state owner of a submenu, inside a
 * context menu: a sub-trigger row that opens a nested menu on a click, a
 * hover, or the arrow pointing away from its parent (ArrowRight, or ArrowLeft
 * right to left), and closes it on the arrow back, when the pointer moves to
 * another row of the parent menu, or when the context menu closes.
 *
 * @customElement primitiv-context-menu-sub
 * @summary The state owner of a submenu.
 * @attr {boolean} open - Whether the submenu is open. Reflected.
 * @fires {CustomEvent<{ open: boolean }>} primitiv-context-menu-sub-change - Bubbles, cancelable, fired before a user-driven change is applied, with the open state afterwards. Call `preventDefault()` to veto it.
 */
export class PrimitivContextMenuSubElement extends MenuSubElement {
  protected readonly tags: MenuTags = TAGS;
}

/**
 * `<primitiv-context-menu-trigger>` — the region a right-click opens the menu
 * in. Structural: it is the region itself, and gets `data-state` (or
 * `data-disabled`).
 *
 * @customElement primitiv-context-menu-trigger
 * @attr {boolean} disabled - A right-click here opens nothing, and the browser's own menu shows.
 */
export class PrimitivContextMenuTriggerElement extends ElementBase {}

/**
 * `<primitiv-context-menu-content>` — the menu itself. Structural: the root gives
 * it an id, `role="menu"`, `popover="manual"` (write it in your markup too, so
 * it is hidden before the script loads), `data-state`, and the pointer's
 * position as `--primitiv-context-menu-x` / `-y` for a stylesheet to place it
 * by.
 *
 * @customElement primitiv-context-menu-content
 */
export class PrimitivContextMenuContentElement extends ElementBase {}

/**
 * `<primitiv-context-menu-item>` — an interactive part: one item. It decorates
 * exactly one child the consumer writes — a `<div>`, a link, or a
 * `<button>` — which gets `role="menuitem"`, `tabindex="-1"` and
 * `data-highlighted` while the pointer is over it. A
 * `<button type="submit" name value>` submits its form as the submitter, by
 * click or Enter. Not an `<li>`: the content element is not a list.
 *
 * @customElement primitiv-context-menu-item
 * @attr {boolean} disabled - Skipped by the keyboard, and does nothing when clicked (`aria-disabled` on the child).
 */
export class PrimitivContextMenuItemElement extends ElementBase {}

/**
 * `<primitiv-context-menu-checkbox-item>` — an item that toggles. Its child gets
 * `role="menuitemcheckbox"` and `aria-checked`.
 *
 * @customElement primitiv-context-menu-checkbox-item
 * @attr {boolean} checked - Whether it is checked; `checked="indeterminate"` for mixed. Reflected.
 * @attr {boolean} disabled - As on an item.
 */
export class PrimitivContextMenuCheckboxItemElement extends ElementBase {}

/**
 * `<primitiv-context-menu-radio-group>` — a group of radio items, one of which is
 * checked. Structural: `role="group"`.
 *
 * @customElement primitiv-context-menu-radio-group
 * @attr {string} value - The checked item's value. Reflected.
 */
export class PrimitivContextMenuRadioGroupElement extends ElementBase {}

/**
 * `<primitiv-context-menu-radio-item>` — an item checked when its value is its
 * group's. Its child gets `role="menuitemradio"` and `aria-checked`.
 *
 * @customElement primitiv-context-menu-radio-item
 * @attr {string} value - The value it sets on its group.
 * @attr {boolean} disabled - As on an item.
 */
export class PrimitivContextMenuRadioItemElement extends ElementBase {}

/**
 * `<primitiv-context-menu-item-indicator>` — the check or dot inside a checkbox or
 * radio item, `hidden` while unchecked. Structural: it gets `data-state`.
 *
 * @customElement primitiv-context-menu-item-indicator
 * @attr {boolean} force-mount - Keep it shown while unchecked, to animate it.
 */
export class PrimitivContextMenuItemIndicatorElement extends ElementBase {}

/**
 * `<primitiv-context-menu-group>` — a labelled group of items. Structural:
 * `role="group"`, named by the label inside it.
 *
 * @customElement primitiv-context-menu-group
 */
export class PrimitivContextMenuGroupElement extends ElementBase {}

/**
 * `<primitiv-context-menu-label>` — a group's label, not an item. Structural: the
 * root gives it an id.
 *
 * @customElement primitiv-context-menu-label
 */
export class PrimitivContextMenuLabelElement extends ElementBase {}

/**
 * `<primitiv-context-menu-separator>` — a rule between items. Structural:
 * `role="separator"`.
 *
 * @customElement primitiv-context-menu-separator
 */
export class PrimitivContextMenuSeparatorElement extends ElementBase {}

/**
 * `<primitiv-context-menu-sub-trigger>` — the row that opens a submenu. It
 * decorates exactly one child, a `<div>`, which gets `role="menuitem"` and the
 * submenu's `aria-haspopup`, `aria-expanded` and `aria-controls`.
 *
 * @customElement primitiv-context-menu-sub-trigger
 * @attr {boolean} disabled - It does not open the submenu.
 */
export class PrimitivContextMenuSubTriggerElement extends ElementBase {}

/**
 * `<primitiv-context-menu-sub-content>` — the submenu itself, inside the parent
 * menu. Structural, as the content: an id, `role="menu"`, `popover="auto"`.
 *
 * @customElement primitiv-context-menu-sub-content
 */
export class PrimitivContextMenuSubContentElement extends ElementBase {}

/**
 * Define the fourteen Context Menu elements on `registry` (the global
 * `customElements` by default). Safe to call more than once, and a no-op where
 * there is no registry (a server render).
 */
export function defineContextMenu(registry: ElementRegistry | undefined = globalThis.customElements): void {
  defineMenu(registry, TAGS, [
    PrimitivContextMenuElement,
    PrimitivContextMenuTriggerElement,
    PrimitivContextMenuContentElement,
    PrimitivContextMenuItemElement,
    PrimitivContextMenuCheckboxItemElement,
    PrimitivContextMenuRadioGroupElement,
    PrimitivContextMenuRadioItemElement,
    PrimitivContextMenuItemIndicatorElement,
    PrimitivContextMenuGroupElement,
    PrimitivContextMenuLabelElement,
    PrimitivContextMenuSeparatorElement,
    PrimitivContextMenuSubElement,
    PrimitivContextMenuSubTriggerElement,
    PrimitivContextMenuSubContentElement,
  ]);
}
