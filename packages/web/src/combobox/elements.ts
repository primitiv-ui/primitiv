import { deriveId } from "@primitiv-ui/core";

import { defineElements, ElementBase, reportOnce, write, type ElementRegistry } from "../internal/element.ts";
import { PrimitivRootElement } from "../internal/RootElement.ts";
import { ComboboxController, type ComboboxControllerHost, type ComboboxOption } from "./ComboboxController.ts";

export type { ElementRegistry };

// Stryker disable StringLiteral: static — evaluated once at import, so runtime mutant switching never reaches them; the names are pinned by the defineCombobox registry test instead.
const ROOT = "primitiv-combobox";
const INPUT = "primitiv-combobox-input";
const CONTENT = "primitiv-combobox-content";
const ITEM = "primitiv-combobox-item";
const EMPTY = "primitiv-combobox-empty";

/** Marks the hidden input the root keeps for its form, so it is never mistaken for consumer markup. */
const NATIVE = "data-primitiv-combobox-native";
// Stryker restore StringLiteral

/** A decorated item: an option, with the text the field shows once it is committed. */
type Option = ComboboxOption & { label: string; disabled: boolean };

/**
 * An item needs a `value`. Without one it is reported once and left
 * undecorated rather than thrown: a server-rendered page has no error boundary
 * to catch a throw (RFC 0033 D24).
 */
function decoratable(item: HTMLElement): Option | null {
  const value = item.getAttribute("value");
  if (value === null) {
    reportOnce(item, `<${ITEM}> needs a value.`);
    return null;
  }
  const label = item.getAttribute("label") ?? (item.textContent as string).trim();
  return { value, element: item, disabled: item.hasAttribute("disabled"), label };
}

/**
 * `<primitiv-combobox>` — an editable text field with a popup list of
 * suggestions to choose from (WAI-ARIA APG combobox, list autocomplete).
 *
 * The root owns the state: `value`, the committed item, and `open`, both
 * reflected. The `<input>` inside `<primitiv-combobox-input>` keeps real focus
 * throughout; `<primitiv-combobox-content>` is the list, a `popover="auto"`
 * panel in the top layer that closes on a press outside. Typing opens it and
 * fires `primitiv-combobox-query-change`; ArrowDown opens it too. While it is
 * open the arrows move a cursor over the shown, enabled items — published as
 * `aria-activedescendant` on the field and `data-highlighted` on the item —
 * Home and End jump, and Enter or a click commits: the value changes, the
 * field shows the item's text and the list closes. Escape, or a press outside,
 * closes and puts the committed text back. Emptying the field clears the value.
 *
 * **Filtering is yours.** The element shows every item it holds: on each
 * `primitiv-combobox-query-change` (or the field's own `input` event) hide the
 * items that do not match with `hidden`, or swap in new ones from a server.
 * Hidden items are skipped by the cursor, and `<primitiv-combobox-empty>` shows
 * while no item is.
 *
 * With a `name` it keeps a hidden input inside itself, so the value — not the
 * field's text — submits with a form, and a form reset restores the value it
 * first rendered with.
 *
 * @customElement primitiv-combobox
 * @summary An editable text field with a popup list of suggestions.
 * @attr {string} value - The committed item's value. Reflected: it changes as the user chooses, so a server re-render or a history snapshot sees it.
 * @attr {boolean} open - Whether the list is showing. Reflected.
 * @attr {string} name - The name the value submits under. Without one the combobox takes no part in forms.
 * @fires {CustomEvent<{ value: string }>} primitiv-combobox-change - Bubbles, cancelable, fired before a committed or cleared value is applied. Call `preventDefault()` to veto it; the field shows the kept value's text.
 * @fires {CustomEvent<{ open: boolean }>} primitiv-combobox-open-change - Bubbles, cancelable, fired before the list opens or closes. Call `preventDefault()` to veto it.
 * @fires {CustomEvent<{ query: string }>} primitiv-combobox-query-change - Bubbles, fired as the field's text changes from typing. Filter the items from it.
 */
export class PrimitivComboboxElement extends PrimitivRootElement {
  #input: HTMLInputElement | null = null;
  #content: HTMLElement | null = null;
  /** The item under the cursor; it exists only while the list is open. */
  #active: string | undefined;
  /** The text that stands for the committed value, put back on a dismissal. */
  // Stryker disable next-line StringLiteral: equivalent — the field that reads it is brought in line, which assigns it, before anything can put it back.
  #committed = "";
  /** The field and value the text was last brought in line with. */
  #synced: { input: HTMLInputElement; value: string } | null = null;
  /** The value the combobox first rendered with, which a form reset restores. */
  #initial: string | null = null;
  #listening: AbortController | null = null;
  readonly #combobox: ComboboxController = new ComboboxController(this, this.#host());
  protected readonly controller: { connect(): void; disconnect(): void } = {
    connect: (): void => this.#connect(),
    disconnect: (): void => this.#disconnect(),
  };
  // Stryker disable next-line StringLiteral: killed by "skips an item that becomes disabled later" when that test is run against the mutant by hand; Stryker's vitest runner reports the `disabled` entry alone as surviving, a runner artifact rather than a gap.
  protected readonly reconcileOn: readonly string[] = ["open", "value", "name", "disabled", "hidden"];

  /** The committed item's value, or `""` when none is. */
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

  /** The controller's view of this element: value and open in reflected attributes, the cursor here. */
  #host(): ComboboxControllerHost {
    return {
      state: () => ({ open: this.open, value: this.value, active: this.#active }),
      input: () => this.#input,
      content: () => this.#content,
      change: (open) => this.#change(open),
      query: (query) => {
        this.dispatchEvent(new CustomEvent("primitiv-combobox-query-change", { bubbles: true, detail: { query } }));
      },
      select: (value, label) => {
        if (value !== this.value && this.announce("primitiv-combobox-change", { value })) this.#commit(value, label);
        this.#putBack();
        this.#change(false);
      },
      clear: () => {
        // The field is empty already; bringing it in line with "" keeps it so.
        if (this.announce("primitiv-combobox-change", { value: "" })) this.value = "";
      },
      dismiss: () => {
        this.#active = undefined;
        this.#putBack();
        this.#change(false);
      },
      moveCursor: (value) => {
        this.#active = value;
        this.reconcile();
      },
    };
  }

  #change(open: boolean): void {
    if (this.announce("primitiv-combobox-open-change", { open })) this.open = open;
    // A veto can leave the list out of step — the browser is light-dismissing
    // it — so put it back where the state says, once that dismissal is done.
    else queueMicrotask(() => this.#combobox.sync());
  }

  /** Take `value`, with `label` as the text that stands for it. */
  #commit(value: string, label: string): void {
    this.value = value;
    this.#committed = label;
  }

  /** Put the committed text back in the field. */
  #putBack(): void {
    if (this.#input && this.#input.value !== this.#committed) this.#input.value = this.#committed;
  }

  #connect(): void {
    this.#initial ??= this.value;
    this.#listening = new AbortController();
    const reset = (): void => {
      this.#synced = null;
      this.value = this.#initial as string;
      this.reconcile();
    };
    // A reset restores the field first, so read the value back after it.
    this.closest("form")?.addEventListener("reset", () => queueMicrotask(reset), { signal: this.#listening.signal });
    this.#combobox.connect();
  }

  #disconnect(): void {
    // A root disconnects only after it connected, so it is listening.
    (this.#listening as AbortController).abort();
    this.#combobox.disconnect();
  }

  protected reconcile(): void {
    const open = this.open;
    const value = this.value;
    const rootId = this.rootId();
    if (!open) this.#active = undefined;

    const [content = null] = this.parts(CONTENT);
    this.#content = content;
    if (content) {
      if (!content.id) content.id = `${rootId}-content`;
      write(content, "role", "listbox");
      if (!content.hasAttribute("popover")) content.setAttribute("popover", "auto");
    }

    const options = this.parts(ITEM).flatMap((item) => decoratable(item) ?? []);
    const cursor = options.find(
      (option) => option.value === this.#active && !option.disabled && !option.element.hidden,
    );
    this.#active = cursor?.value;
    for (const { value: itemValue, element, disabled } of options) {
      if (!element.id) element.id = deriveId(rootId, "option", itemValue);
      write(element, "role", "option");
      write(element, "aria-selected", String(itemValue === value));
      write(element, "aria-disabled", disabled ? "true" : null);
      write(element, "data-disabled", disabled ? "" : null);
      write(element, "data-highlighted", element === cursor?.element ? "" : null);
    }
    const anyShown = options.some(({ element }) => !element.hidden);
    for (const empty of this.parts(EMPTY)) {
      write(empty, "role", "presentation");
      write(empty, "hidden", anyShown ? "" : null);
    }

    const [inputPart] = this.parts(INPUT);
    this.#input = inputPart ? this.#decorateInput(inputPart) : null;
    if (this.#input) {
      write(this.#input, "role", "combobox");
      write(this.#input, "aria-autocomplete", "list");
      write(this.#input, "aria-expanded", String(open));
      write(this.#input, "aria-controls", content ? content.id : null);
      write(this.#input, "aria-activedescendant", cursor ? cursor.element.id : null);
      this.#syncText(this.#input, value, options);
    }
    this.#reconcileNative(value);

    this.#combobox.setTriggers(options);
    this.#combobox.sync();
  }

  #decorateInput(part: HTMLElement): HTMLInputElement | null {
    if (part.childElementCount === 1) return part.firstElementChild as HTMLInputElement;
    reportOnce(part, `<${INPUT}> needs exactly one element child (an <input>) to decorate.`);
    return null;
  }

  /**
   * Bring the field's text in line with the value once per change of either: a
   * field that arrives already holding text (a server render) keeps it, and
   * otherwise shows the committed item's text — its value when no item has it.
   */
  #syncText(input: HTMLInputElement, value: string, options: readonly Option[]): void {
    const synced = this.#synced;
    if (synced?.input === input && synced.value === value) return;
    this.#synced = { input, value };
    if (synced?.input !== input && input.value !== "") {
      this.#committed = input.value;
      return;
    }
    const item = options.find((option) => option.value === value);
    this.#committed = item ? item.label : value;
    this.#putBack();
  }

  /** Keep the hidden input a named combobox submits its value through. */
  #reconcileNative(value: string): void {
    let native = [...this.children].find((child) => child.hasAttribute(NATIVE));
    const name = this.getAttribute("name");
    if (name === null) {
      native?.remove();
      return;
    }
    if (!native) {
      native = document.createElement("input");
      native.setAttribute(NATIVE, "");
      native.setAttribute("type", "hidden");
      this.append(native);
    }
    write(native, "name", name);
    write(native, "value", value);
  }
}

/**
 * `<primitiv-combobox-input>` — an interactive part: it decorates exactly one
 * child you write, an `<input>`, which keeps real focus and gets
 * `role="combobox"`, `aria-autocomplete="list"`, `aria-expanded`,
 * `aria-controls` and `aria-activedescendant`. Name the input; consider
 * `autocomplete="off"` so the browser's own suggestions stay out of the way.
 *
 * @customElement primitiv-combobox-input
 */
export class PrimitivComboboxInputElement extends ElementBase {}

/**
 * `<primitiv-combobox-content>` — a structural part: the list itself,
 * `role="listbox"` and `popover="auto"`, shown in the top layer while the
 * combobox is open. Shown with the root's child that holds the field as its
 * source, so that box is its implicit CSS anchor.
 *
 * @customElement primitiv-combobox-content
 */
export class PrimitivComboboxContentElement extends ElementBase {}

/**
 * `<primitiv-combobox-item>` — a structural part: one suggestion. The element
 * is the option itself (`role="option"`), with `aria-selected`, an `id`
 * derived from the root's and its value, and `data-highlighted` while the
 * cursor is on it. Style the cursor from `data-highlighted`, not `:focus`.
 *
 * @customElement primitiv-combobox-item
 * @attr {string} value - The value the combobox takes when this item is committed.
 * @attr {string} label - The text the field shows once this item is committed. Defaults to the item's text.
 * @attr {boolean} disabled - Skipped by the cursor, and never committed (`aria-disabled` and `data-disabled`).
 * @attr {boolean} hidden - Filtered out: not shown, and skipped by the cursor.
 */
export class PrimitivComboboxItemElement extends ElementBase {}

/**
 * `<primitiv-combobox-empty>` — a structural part: the no-results message,
 * `role="presentation"`, shown only while no item is.
 *
 * @customElement primitiv-combobox-empty
 */
export class PrimitivComboboxEmptyElement extends ElementBase {}

/**
 * Define the five Combobox elements on `registry` (the global `customElements`
 * by default). Safe to call more than once, and a no-op where there is no
 * registry (a server render).
 */
export function defineCombobox(registry: ElementRegistry | undefined = globalThis.customElements): void {
  defineElements(registry, [
    [ROOT, PrimitivComboboxElement],
    [INPUT, PrimitivComboboxInputElement],
    [CONTENT, PrimitivComboboxContentElement],
    [ITEM, PrimitivComboboxItemElement],
    [EMPTY, PrimitivComboboxEmptyElement],
  ]);
}
