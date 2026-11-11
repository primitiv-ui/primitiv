import { defineElements, reportOnce, write, type ElementRegistry } from "../internal/element.ts";
import { PrimitivRootElement } from "../internal/RootElement.ts";
import { DropdownController, type DropdownControllerHost } from "../dropdown/DropdownController.ts";
import { DropdownSubController, type DropdownSubControllerHost } from "../dropdown/DropdownSubController.ts";

/** A menu component's tag names, every one its prefix and a part. */
export type MenuTags = {
  root: string;
  trigger: string;
  content: string;
  item: string;
  checkboxItem: string;
  radioGroup: string;
  radioItem: string;
  indicator: string;
  group: string;
  label: string;
  separator: string;
  sub: string;
  subTrigger: string;
  subContent: string;
  /** Every part that is a chosen item: the plain, checkbox and radio items. */
  items: string;
};

/** The tag names of the menu component whose root is `root` (`primitiv-dropdown`). */
export function menuTags(root: string): MenuTags {
  const tags = {
    root,
    trigger: `${root}-trigger`,
    content: `${root}-content`,
    item: `${root}-item`,
    checkboxItem: `${root}-checkbox-item`,
    radioGroup: `${root}-radio-group`,
    radioItem: `${root}-radio-item`,
    indicator: `${root}-item-indicator`,
    group: `${root}-group`,
    label: `${root}-label`,
    separator: `${root}-separator`,
    sub: `${root}-sub`,
    subTrigger: `${root}-sub-trigger`,
    subContent: `${root}-sub-content`,
  };
  return { ...tags, items: `${tags.item},${tags.checkboxItem},${tags.radioItem}` };
}

/**
 * Define a menu component's fourteen elements on `registry`: `classes` in the
 * order of {@link MenuTags} — root, trigger, content, item, checkbox item,
 * radio group, radio item, indicator, group, label, separator, sub,
 * sub-trigger, sub-content.
 */
export function defineMenu(
  registry: ElementRegistry | undefined,
  tags: MenuTags,
  classes: readonly CustomElementConstructor[],
): void {
  const names = Object.values(tags);
  defineElements(
    registry,
    classes.map((element, index) => [names[index], element]),
  );
}

/** The one element child an interactive part decorates, or `null`, reported once, without exactly one. */
export function decoratable(part: HTMLElement, what: string): HTMLElement | null {
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

/**
 * The state owner every menu component shares — Dropdown and Context Menu —
 * over a `popover` menu its {@link DropdownController} runs: the items,
 * checkbox and radio items, indicators, groups, labels and separators, the
 * pointer's highlight, and choosing an item, which closes the menu and hands
 * focus back. A subclass supplies its tag names and its trigger: how the menu
 * opens, what focus returns to, and what the menu is anchored to.
 *
 * Its events are named after the root's tag: `<root>-change`, `-select`,
 * `-checked-change` and `-value-change`.
 */
export abstract class MenuRootElement extends PrimitivRootElement {
  /** The menu the root currently decorates, and the controller over it. */
  #content: HTMLElement | null = null;
  #menu: DropdownController | null = null;
  /** What Escape and a chosen item hand focus back to, as of the last reconcile. */
  #returnFocus: HTMLElement | null = null;
  /** The root's own listeners, while connected. */
  #listening: AbortController | null = null;
  protected readonly controller: { connect(): void; disconnect(): void } = {
    connect: (): void => this.#connect(),
    disconnect: (): void => this.#disconnect(),
  };
  protected readonly reconcileOn: readonly string[] = ["open", "disabled", "checked", "value"];
  /** The component's tag names. */
  protected abstract readonly tags: MenuTags;

  /**
   * Decorate the trigger for this reconcile and return what focus goes back
   * to when the menu closes, which is also what a press on is not outside it.
   */
  protected abstract reconcileTrigger(open: boolean, content: HTMLElement | null): HTMLElement | null;

  /** Decorate the menu itself beyond its id and role. */
  protected abstract reconcileContent(content: HTMLElement, open: boolean): void;

  /** The element to show the menu from, its implicit anchor; none by default. */
  // Stryker disable next-line BlockStatement: equivalent — undefined and null both mean no source to the controller.
  protected source(): HTMLElement | null {
    return null;
  }

  /** Handle a click on `target` if it is the trigger's; a trigger is never an item. */
  protected abstract clickTrigger(target: Node): void;

  /** Listen for the trigger beyond clicks, until `signal` aborts. */
  protected listen(_signal: AbortSignal): void {}

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
      change: (open) => this.change(open),
      trigger: () => this.#returnFocus,
      source: () => this.source(),
    };
  }

  /** A change the user asked for: announced first, so a listener can veto it. */
  protected change(open: boolean): void {
    if (open === this.open) return;
    if (this.announce(`${this.tags.root}-change`, { open })) this.open = open;
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
    this.listen(this.#listening.signal);
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
    const part = (target as Element | null)?.closest<HTMLElement>(this.tags.items) ?? null;
    return part?.closest(this.tags.root) === this ? part : null;
  }

  /** A radio item's state: whether its value is its group's. */
  #radioChecked(part: Element): boolean {
    return part.closest(this.tags.radioGroup)?.getAttribute("value") === part.getAttribute("value");
  }

  /** Mark the item the pointer is over, as React's `data-highlighted`. */
  #highlight(event: PointerEvent, over: boolean): void {
    const part = this.#itemOf(event.target);
    // The relatedTarget test keeps the highlight steady as the pointer crosses
    // the row's own children. user-event sets no relatedTarget, so only a real
    // browser can tell: the interop lab's dropdown spec counts the flips.
    // Stryker disable next-line ConditionalExpression,LogicalOperator: see above — unobservable in jsdom, proven in Chromium.
    if (!part || part === this.#itemOf(event.relatedTarget)) return;
    const child = part.firstElementChild as HTMLElement;
    write(child, "data-highlighted", over ? "" : null);
  }

  #click(event: MouseEvent): void {
    const target = event.target as Node;
    this.clickTrigger(target);
    const part = this.#itemOf(target);
    if (!part || part.hasAttribute("disabled")) return;
    const root = this.tags.root;
    if (part.localName === this.tags.checkboxItem) {
      const checked = checkedState(part) !== true;
      // `write`, not `toggleAttribute`: a mixed item's "indeterminate" must become plain checked.
      if (announceOn(part, `${root}-checked-change`, { checked })) write(part, "checked", checked ? "" : null);
    } else if (part.localName === this.tags.radioItem && !this.#radioChecked(part)) {
      const group = part.closest(this.tags.radioGroup) as HTMLElement;
      const value = part.getAttribute("value") as string;
      if (announceOn(group, `${root}-value-change`, { value })) group.setAttribute("value", value);
    }
    if (!announceOn(part, `${root}-select`, null)) return;
    this.change(false);
    this.#returnFocus?.focus();
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
    const tags = this.tags;

    const [content = null] = this.parts(tags.content);
    if (content) {
      if (!content.id) content.id = `${rootId}-content`;
      write(content, "role", "menu");
      this.reconcileContent(content, open);
    }
    this.#returnFocus = this.reconcileTrigger(open, content);

    for (const part of this.parts(tags.items)) {
      const child = decoratable(part, "an <li>");
      if (!child) continue;
      const checkbox = part.localName === tags.checkboxItem;
      const radio = part.localName === tags.radioItem;
      const checked = checkbox ? checkedState(part) : radio && this.#radioChecked(part);
      write(child, "role", checkbox ? "menuitemcheckbox" : radio ? "menuitemradio" : "menuitem");
      write(child, "tabindex", "-1");
      write(child, "aria-disabled", part.hasAttribute("disabled") ? "true" : null);
      write(child, "aria-checked", checkbox || radio ? (checked === "indeterminate" ? "mixed" : String(checked)) : null);
    }
    for (const indicator of this.parts(tags.indicator)) {
      const item = indicator.closest(`${tags.checkboxItem},${tags.radioItem}`);
      const checked = item?.localName === tags.checkboxItem ? checkedState(item) : item ? this.#radioChecked(item) : false;
      write(indicator, "data-state", checked === "indeterminate" ? checked : checked ? "checked" : "unchecked");
      write(indicator, "hidden", checked || indicator.hasAttribute("force-mount") ? null : "");
    }
    let labels = 0;
    for (const label of this.parts(tags.label)) {
      if (!label.id) label.id = `${rootId}-label-${++labels}`;
    }
    for (const group of this.parts(tags.group)) {
      const label = [...group.querySelectorAll(tags.label)].find((candidate) => candidate.closest(tags.group) === group);
      write(group, "role", "group");
      write(group, "aria-labelledby", label ? label.id : null);
    }
    for (const group of this.parts(tags.radioGroup)) write(group, "role", "group");
    for (const separator of this.parts(tags.separator)) write(separator, "role", "separator");

    this.#use(content);
    this.#menu?.sync();
  }
}

/**
 * The state owner of a submenu every menu component shares: a sub-trigger row
 * that opens a nested menu on a click, a hover, or the arrow pointing away
 * from its parent (ArrowRight, or ArrowLeft right to left), and closes it on
 * the arrow back, or when the pointer moves to another row of the parent
 * menu. Its event is `<root>-sub-change`.
 */
export abstract class MenuSubElement extends PrimitivRootElement {
  #content: HTMLElement | null = null;
  #menu: DropdownSubController | null = null;
  #trigger: HTMLElement | null = null;
  /** The sub-trigger part (whose `disabled` the sub reads), as of the last reconcile. */
  #triggerPart: HTMLElement | null = null;
  /** Whether the pointer is over the sub-trigger. */
  #hovered = false;
  #listening: AbortController | null = null;
  protected readonly controller: { connect(): void; disconnect(): void } = {
    connect: (): void => this.#connect(),
    disconnect: (): void => this.#disconnect(),
  };
  protected readonly reconcileOn: readonly string[] = ["open", "disabled"];
  /** The component's tag names. */
  protected abstract readonly tags: MenuTags;

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
    if (this.announce(`${this.tags.sub}-change`, { open })) this.open = open;
    else queueMicrotask(() => this.#menu?.sync());
  }

  /** Whether the sub-trigger is disabled. Only asked once a decorated sub-trigger exists. */
  #disabled(): boolean {
    return (this.#triggerPart as HTMLElement).hasAttribute("disabled");
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
    // Past the first test there is a decorated trigger. The relatedTarget test
    // keeps the hover steady across the row's own children, which only a real
    // browser can show (see MenuRootElement's highlight).
    // Stryker disable next-line ConditionalExpression,LogicalOperator: unobservable in jsdom, proven in Chromium by the interop lab.
    if (!this.#onTrigger(event) || (this.#trigger as HTMLElement).contains(event.relatedTarget as Node | null)) return;
    this.#hovered = over;
    this.reconcile();
    if (over) this.#openIfEnabled();
  }

  /** The pointer reached another row of the parent menu: close, as moving the keyboard there would. */
  #sibling(event: PointerEvent): void {
    if (!this.open || this.contains(event.target as Node)) return;
    const row = (event.target as Element).closest('[role^="menuitem"]');
    // A connected sub always has a parent; only a row of its parent's menu closes it.
    if (row && row.closest('[role="menu"]') === (this.parentElement as HTMLElement).closest('[role="menu"]')) this.#change(false);
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
    const [content = null] = this.parts(this.tags.subContent);
    const [triggerPart = null] = this.parts(this.tags.subTrigger);
    this.#triggerPart = triggerPart;
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
