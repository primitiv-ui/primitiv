import { write } from "./element.ts";

/** Marks the hidden inputs a root keeps for its form, so consumer markup is never touched. */
// Stryker disable next-line StringLiteral: static — evaluated once at import, so runtime mutant switching never reaches it; the name is asserted by the form tests instead.
const MARK = "data-primitiv-form";

/**
 * Keep one hidden `<input>` per value directly inside `root`, all named `name`,
 * so the root takes part in its form the way same-named native controls do: a
 * radio group submits its one value, checkboxes one entry each. With no `name`,
 * or no values, there are none. Writes only on change, so markup a server
 * rendered is adopted as it is.
 */
export function reconcileFormValues(root: HTMLElement, name: string | null, values: readonly string[]): void {
  const inputs = [...root.querySelectorAll<HTMLInputElement>(`:scope > input[${MARK}]`)];
  const wanted = name === null ? 0 : values.length;
  for (const extra of inputs.splice(wanted)) extra.remove();
  while (inputs.length < wanted) {
    const input = root.ownerDocument.createElement("input");
    input.setAttribute(MARK, "");
    input.type = "hidden";
    root.append(input);
    inputs.push(input);
  }
  inputs.forEach((input, index) => {
    write(input, "name", name);
    write(input, "value", values[index]);
  });
}

/**
 * Restore a root's first rendered `value` when its form resets, as a native
 * control returns to its default. Connect it as the root connects and
 * disconnect it as the root leaves, so a root moved out of a form stops
 * hearing that form's reset.
 */
export class FormReset {
  #listening: AbortController | null = null;
  #captured = false;
  #initial: string | null = null;

  connect(root: HTMLElement): void {
    if (!this.#captured) {
      this.#captured = true;
      this.#initial = root.getAttribute("value");
    }
    this.#listening = new AbortController();
    const initial = this.#initial;
    // A reset restores the hidden inputs first, so set the value after it.
    const restore = (): void => {
      if (initial === null) root.removeAttribute("value");
      else root.setAttribute("value", initial);
    };
    root.closest("form")?.addEventListener("reset", () => queueMicrotask(restore), { signal: this.#listening.signal });
  }

  disconnect(): void {
    // A root disconnects only after it connected, so it is listening.
    (this.#listening as AbortController).abort();
    this.#listening = null;
  }
}
