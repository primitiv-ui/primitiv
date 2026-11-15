import { CollapsibleController, type CollapsibleControllerHost } from "../collapsible/CollapsibleController.ts";
import { defineElements, reportOnce, write, type ElementRegistry } from "../internal/element.ts";
import { PrimitivRootElement } from "../internal/RootElement.ts";

export type { ElementRegistry };

// Stryker disable StringLiteral: static — evaluated once at import, so runtime mutant switching never reaches them; the name is pinned by the defineTable registry test instead.
const TRIGGER = "primitiv-table-expand-trigger";
// Stryker restore StringLiteral

/**
 * `<primitiv-table-expand-trigger>` — a table row's expand control: it
 * decorates the one `<button>` you write in a cell, and shows and hides the
 * detail row that button names with `aria-controls`.
 *
 * **It sits in a cell, not around the rows.** The HTML parser moves any element
 * written between a table's rows out of the table, so nothing can wrap a row
 * and its detail row the way React's `Table.Expandable` does. The button names
 * its detail row by id instead, which is what `aria-controls` says anyway, and
 * the detail row stays an ordinary `<tr>` the element writes `hidden`,
 * `aria-hidden` and `data-state` on.
 *
 * The behaviour is a disclosure's, so it runs the Collapsible controller: a
 * click, or Enter or Space, toggles it once, and `disabled` stops it.
 *
 * @customElement primitiv-table-expand-trigger
 * @summary A table row's expand control, showing and hiding its detail row.
 * @attr {boolean} expanded - Whether the detail row is shown. Reflected: it moves as the user toggles, so a server re-render or a history snapshot sees the live state.
 * @attr {boolean} disabled - Stops the toggle; the button stays focusable.
 * @attr {boolean} force-mount - Keep a collapsed detail row rendered (only `aria-hidden`), for a stylesheet to animate.
 * @fires {CustomEvent<{ expanded: boolean }>} primitiv-table-expand-change - Bubbles, cancelable, fired before a user's toggle applies. Call `preventDefault()` to keep the row as it is.
 * @fires {CustomEvent} primitiv-table-expand-show - Bubbles from the detail row as it opens (not on first render), so a lazy row can fetch its content.
 */
export class PrimitivTableExpandTriggerElement extends PrimitivRootElement {
  /** Whether the detail row was shown at the last reconcile; unset before the first. */
  #shown: boolean | undefined;
  protected readonly controller: CollapsibleController = new CollapsibleController(this, this.#host());
  protected readonly reconcileOn: readonly string[] = ["expanded", "disabled", "force-mount", "aria-controls"];

  /** Whether the detail row is shown, reflected as the `expanded` attribute. */
  get expanded(): boolean {
    return this.hasAttribute("expanded");
  }

  set expanded(next: boolean) {
    this.toggleAttribute("expanded", next);
  }

  #host(): CollapsibleControllerHost {
    return {
      state: () => ({ open: this.expanded }),
      change: (expanded) => {
        if (this.announce("primitiv-table-expand-change", { expanded })) this.expanded = expanded;
      },
    };
  }

  /** The one element this decorates, reporting anything else once. */
  #button(): HTMLElement | null {
    if (this.childElementCount === 1) return this.firstElementChild as HTMLElement;
    reportOnce(this, `<${TRIGGER}> needs exactly one element child (a <button>) to decorate.`);
    return null;
  }

  protected reconcile(): void {
    const expanded = this.expanded;
    const state = expanded ? "open" : "closed";
    const disabled = this.hasAttribute("disabled");
    write(this, "data-state", state);

    const button = this.#button();
    if (button) {
      write(button, "aria-expanded", String(expanded));
      write(button, "aria-disabled", disabled ? "true" : null);
      write(button, "data-disabled", disabled ? "" : null);
      write(button, "data-state", state);

      // The detail row is wherever the button says, in this document or shadow root.
      const id = button.getAttribute("aria-controls");
      const row = id ? (this.getRootNode() as Document | ShadowRoot).getElementById(id) : null;
      if (row) {
        const mounted = this.hasAttribute("force-mount");
        write(row, "hidden", expanded || mounted ? null : "");
        // Every collapsed row, not only a force-mounted one: a stylesheet that
        // animates the row gives it a display that wins over `hidden`.
        write(row, "aria-hidden", expanded ? null : "true");
        write(row, "data-state", state);
        if (expanded && this.#shown === false) {
          row.dispatchEvent(new CustomEvent("primitiv-table-expand-show", { bubbles: true }));
        }
      }
    }

    // Stryker disable next-line StringLiteral: equivalent — a row has one trigger, so its value is never read.
    this.controller.setTriggers(button ? [{ value: "trigger", element: button, disabled }] : []);
    this.#shown = expanded;
  }
}

/**
 * Define the Table element — the expand trigger — on `registry` (the global
 * `customElements` by default). Safe to call more than once, and a no-op where
 * there is no registry (a server render).
 */
export function defineTable(registry: ElementRegistry | undefined = globalThis.customElements): void {
  defineElements(registry, [[TRIGGER, PrimitivTableExpandTriggerElement]]);
}
