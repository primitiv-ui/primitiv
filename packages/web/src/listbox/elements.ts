import { deriveId, type ListboxOrientation } from "@primitiv-ui/core";

import { defineElements, ElementBase, owned, reportOnce, write, type ElementRegistry } from "../internal/element.ts";
import { PrimitivRootElement } from "../internal/RootElement.ts";
import { ListboxController, type ListboxControllerHost } from "./ListboxController.ts";

export type { ElementRegistry };

// Stryker disable StringLiteral: static — evaluated once at import, so runtime mutant switching never reaches them; the names are pinned by the defineListbox registry test instead.
const ROOT = "primitiv-listbox";
const OPTION = "primitiv-listbox-option";
const GROUP = "primitiv-listbox-group";
const GROUP_LABEL = "primitiv-listbox-group-label";
// Stryker restore StringLiteral

/** Split a space-separated `value` into option values. */
function tokens(value: string | null): string[] {
  // Stryker disable next-line Regex: equivalent — splitting on single whitespace leaves empty tokens, which the filter drops.
  return (value ?? "").split(/\s+/).filter(Boolean);
}

/** An option the root can decorate: its value, its element, and whether it is disabled. */
type Option = { value: string; element: HTMLElement; disabled: boolean };

/**
 * An option needs a `value`. Without one it is reported once and left
 * undecorated rather than thrown: a server-rendered page has no error boundary
 * to catch a throw (RFC 0033 D24).
 */
function decoratable(option: HTMLElement): Option | null {
  const value = option.getAttribute("value");
  if (value !== null) return { value, element: option, disabled: option.hasAttribute("disabled") };
  reportOnce(option, `<${OPTION}> needs a value.`);
  return null;
}

/**
 * `<primitiv-listbox>` — a list of options the user chooses from, always
 * visible (WAI-ARIA APG listbox).
 *
 * The root is the listbox and the only tab stop: it takes `role="listbox"` and
 * `tabindex="0"`, so name it with `aria-label` or `aria-labelledby`. Real focus
 * never moves to an option. A cursor does instead, published as
 * `aria-activedescendant` and as `data-highlighted` on the option: it lands on
 * the first selected option (else the first) when the list takes focus, and is
 * cleared when it loses it. The arrow keys move it — following `orientation`,
 * mirrored under right-to-left — Home and End jump to the ends, Enter and Space
 * choose the option under it, and typing jumps to the next option whose text
 * starts with what was typed. In a `multiple` listbox, Shift+Arrow extends the
 * selection, Ctrl/Cmd+A selects every option (or none once all are) and
 * Ctrl/Cmd+Shift+Home/End selects through to that end. A click chooses an
 * option too. Disabled options are skipped and never chosen.
 *
 * The root reconciles its options' ARIA whenever an option arrives, leaves, or
 * changes an attribute the root reads (the lifecycle is `PrimitivRootElement`'s).
 * `selection-follows-focus` is read live at each key press.
 *
 * @customElement primitiv-listbox
 * @summary A list of options the user chooses from, always visible.
 * @attr {string} value - The selected options' values, separated by spaces. Reflected: it changes as the user chooses, so a server re-render or a history snapshot sees the selection. Option values therefore cannot contain whitespace.
 * @attr {"single" | "multiple"} type - `single` keeps one option selected — choosing another replaces it, and choosing it again keeps it; `multiple` lets options toggle independently and turns on range selection. Defaults to `single`.
 * @attr {"horizontal" | "vertical"} orientation - Layout axis, which picks the arrow-key pair. Defaults to `vertical`.
 * @attr {boolean} selection-follows-focus - Moving the cursor with the arrows, Home, End or typeahead also selects the option it lands on. A click is unaffected.
 * @fires {CustomEvent<{ value: string[] }>} primitiv-listbox-change - Bubbles, cancelable, fired before a user-driven selection change is applied, with every option selected afterwards. Call `preventDefault()` to veto it.
 */
export class PrimitivListboxElement extends PrimitivRootElement {
  /** The option under the cursor; it exists only while the list has focus. */
  #active: string | undefined;
  protected readonly controller: ListboxController = new ListboxController(this, this.#host());
  protected readonly reconcileOn: readonly string[] = ["value", "type", "orientation", "disabled"];

  /** The selected options' values, reflected as the space-separated `value` attribute. */
  get value(): string[] {
    return tokens(this.getAttribute("value"));
  }

  /** Set the selected options, as an array or a space-separated string. */
  set value(next: string | readonly string[]) {
    this.setAttribute("value", typeof next === "string" ? next : next.join(" "));
  }

  /** The controller's view of this element: the selection lives in a reflected attribute, the cursor here. */
  #host(): ListboxControllerHost {
    return {
      state: () => ({
        selected: this.value,
        active: this.#active,
        multiple: this.getAttribute("type") === "multiple",
        selectionFollowsFocus: this.hasAttribute("selection-follows-focus"),
        orientation: this.#orientation(),
        dir: this.direction(),
      }),
      change: (value) => {
        if (this.announce("primitiv-listbox-change", { value })) this.value = value;
      },
      moveCursor: (value) => {
        this.#active = value;
        this.reconcile();
      },
    };
  }

  #orientation(): ListboxOrientation {
    return this.getAttribute("orientation") === "horizontal" ? "horizontal" : "vertical";
  }

  protected reconcile(): void {
    const selected = this.value;
    const orientation = this.#orientation();
    const rootId = this.rootId();
    write(this, "role", "listbox");
    write(this, "tabindex", "0");
    write(this, "aria-multiselectable", this.getAttribute("type") === "multiple" ? "true" : null);
    write(this, "aria-orientation", orientation === "horizontal" ? "horizontal" : null);
    write(this, "data-orientation", orientation);

    const options = this.parts(OPTION).flatMap((option) => decoratable(option) ?? []);
    this.controller.setOptions(options);

    let cursor: string | null = null;
    for (const { value, element, disabled } of options) {
      if (!element.id) element.id = deriveId(rootId, "option", value);
      const active = value === this.#active;
      if (active) cursor = element.id;
      write(element, "role", "option");
      write(element, "aria-selected", String(selected.includes(value)));
      write(element, "aria-disabled", disabled ? "true" : null);
      write(element, "data-disabled", disabled ? "" : null);
      write(element, "data-highlighted", active ? "" : null);
    }
    write(this, "aria-activedescendant", cursor);

    this.parts(GROUP).forEach((group, index) => {
      write(group, "role", "group");
      const label = owned(group, GROUP_LABEL, GROUP)[0];
      if (label && !label.id) label.id = deriveId(rootId, "group-label", String(index));
      if (label) write(label, "role", "presentation");
      write(group, "aria-labelledby", label ? label.id : null);
    });
  }
}

/**
 * `<primitiv-listbox-option>` — a structural part: one choice. The element is
 * the option itself (`role="option"`), with `aria-selected`, and an `id`
 * derived from the root's and its value unless it already has one. Style the
 * cursor from `data-highlighted`, not `:focus`: real focus stays on the root.
 *
 * @customElement primitiv-listbox-option
 * @attr {string} value - The option's value, listed in the root's `value` while it is selected. No whitespace.
 * @attr {boolean} disabled - Skipped by the cursor and typeahead, and never chosen (`aria-disabled` and `data-disabled`).
 */
export class PrimitivListboxOptionElement extends ElementBase {}

/**
 * `<primitiv-listbox-group>` — a structural part: a named cluster of options,
 * `role="group"`. It is named by the `<primitiv-listbox-group-label>` inside
 * it, through `aria-labelledby`; a group with no label part keeps whatever
 * `aria-label` you write.
 *
 * @customElement primitiv-listbox-group
 */
export class PrimitivListboxGroupElement extends ElementBase {}

/**
 * `<primitiv-listbox-group-label>` — a structural part: a group's visible
 * heading. It is `role="presentation"`, so it is not read as an option, and it
 * keeps its own `id` or is given one for the group to point at.
 *
 * @customElement primitiv-listbox-group-label
 */
export class PrimitivListboxGroupLabelElement extends ElementBase {}

/**
 * Define the four Listbox elements on `registry` (the global `customElements`
 * by default). Safe to call more than once, and a no-op where there is no
 * registry (a server render).
 */
export function defineListbox(registry: ElementRegistry | undefined = globalThis.customElements): void {
  defineElements(registry, [
    [ROOT, PrimitivListboxElement],
    [OPTION, PrimitivListboxOptionElement],
    [GROUP, PrimitivListboxGroupElement],
    [GROUP_LABEL, PrimitivListboxGroupLabelElement],
  ]);
}
