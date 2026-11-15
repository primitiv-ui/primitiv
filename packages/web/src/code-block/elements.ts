import { CODE_BLOCK_COPIED_MS, codeBlockCopyText } from "@primitiv-ui/core";

import { defineElements, reportOnce, write, type ElementRegistry } from "../internal/element.ts";
import { PrimitivRootElement } from "../internal/RootElement.ts";
import { CodeBlockCopyController } from "./CodeBlockCopyController.ts";

export type { ElementRegistry };

// Stryker disable StringLiteral: static — evaluated once at import, so runtime mutant switching never reaches them; the name is pinned by the defineCodeBlock registry test instead.
const COPY = "primitiv-code-block-copy";
// Stryker restore StringLiteral

/**
 * `<primitiv-code-block-copy>` — a code block's copy control: it decorates the
 * one `<button>` you write, and puts the block's code on the clipboard when it
 * is pressed.
 *
 * **The highlighting is yours.** A block is the `<pre><code>` your server or
 * build step wrote — Prism's token classes are what the registry stylesheet
 * colours — so nothing here parses or highlights code.
 *
 * The code it copies is the nearest one it can see: the first `<code>` in its
 * closest ancestor that holds one, skipping any inside a `hidden` element (so in
 * a tabbed block, the shown panel's), or the one `for` names. It copies the
 * text as the reader sees it: `aria-hidden` parts such as line numbers are left
 * out, so write each line's newline into the markup. While `copied`, the button
 * carries `data-copied`, its `aria-label` (when it has one) reads
 * `copied-label` with its own kept in `data-label`, and of its children marked
 * `data-copy-state`, the `copied` ones show and the `idle` ones are `hidden`.
 * `copied` is transient: an element that connects with it — from a history
 * snapshot, or moved mid-copy — drops it.
 *
 * @customElement primitiv-code-block-copy
 * @summary A code block's copy-to-clipboard control.
 * @attr {string} for - The id of the block (or `<code>`) to copy, when it is not the nearest one.
 * @attr {boolean} copied - Set for two seconds after a copy. Reflected, so a stylesheet can key off it; dropped on connect.
 * @attr {string} copied-label - The button's `aria-label` while copied. Defaults to "Copied".
 * @fires {CustomEvent<{ text: string }>} primitiv-code-block-copy - Bubbles, cancelable, fired before the text is written. Call `preventDefault()` to copy nothing.
 */
export class PrimitivCodeBlockCopyElement extends PrimitivRootElement {
  #timer: ReturnType<typeof setTimeout> | undefined;
  protected readonly controller: CodeBlockCopyController = new CodeBlockCopyController(this, { copy: () => this.#copy() });
  protected readonly reconcileOn: readonly string[] = ["copied", "copied-label"];

  /** Whether the copied state is showing, reflected as the `copied` attribute. */
  get copied(): boolean {
    return this.hasAttribute("copied");
  }

  set copied(next: boolean) {
    this.toggleAttribute("copied", next);
  }

  connectedCallback(): void {
    // Copied is transient: it arrives on a connect only from a snapshot (htmx
    // history) or a move, either of which has lost the timer that would end it.
    if (this.copied) this.removeAttribute("copied");
    super.connectedCallback();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    clearTimeout(this.#timer);
  }

  /** The one element this decorates, reporting anything else once. */
  #button(): HTMLElement | null {
    if (this.childElementCount === 1) return this.firstElementChild as HTMLElement;
    reportOnce(this, `<${COPY}> needs exactly one element child (a <button>) to decorate.`);
    return null;
  }

  /** The `<code>` to copy: the one `for` names, else the nearest one shown. */
  #code(): Element | null {
    const target = this.getAttribute("for");
    if (target) {
      const named = (this.getRootNode() as Document | ShadowRoot).getElementById(target);
      return named?.matches("code") ? named : (named?.querySelector("code") ?? null);
    }
    for (let node = this.parentElement; node; node = node.parentElement) {
      const code = [...node.querySelectorAll("code")].find((candidate) => !candidate.closest("[hidden]"));
      if (code) return code;
    }
    return null;
  }

  #copy(): void {
    const code = this.#code();
    if (!code) return;
    const shown = code.cloneNode(true) as Element;
    for (const hidden of shown.querySelectorAll('[aria-hidden="true"]')) hidden.remove();
    const text = codeBlockCopyText(shown.textContent);
    if (!this.announce("primitiv-code-block-copy", { text })) return;
    void navigator.clipboard?.writeText(text).then(() => {
      clearTimeout(this.#timer);
      this.copied = true;
      this.#timer = setTimeout(() => {
        this.copied = false;
      }, CODE_BLOCK_COPIED_MS);
    });
  }

  protected reconcile(): void {
    const copied = this.copied;
    const button = this.#button();
    if (button) {
      write(button, "data-copied", copied ? "" : null);
      // The button's own label waits in `data-label` while the copied one is on
      // it — in the markup, so a snapshot taken mid-copy can still restore it.
      const own = button.getAttribute("data-label") ?? button.getAttribute("aria-label");
      if (own !== null) {
        write(button, "data-label", copied ? own : null);
        write(button, "aria-label", copied ? (this.getAttribute("copied-label") ?? "Copied") : own);
      }
      for (const part of button.querySelectorAll("[data-copy-state]")) {
        write(part as HTMLElement, "hidden", (part.getAttribute("data-copy-state") === "copied") === copied ? null : "");
      }
    }
    // Stryker disable next-line StringLiteral: equivalent — a control has one trigger, so its value is never read.
    this.controller.setTriggers(button ? [{ value: "copy", element: button }] : []);
  }
}

/**
 * Define the Code Block element — the copy control — on `registry` (the global
 * `customElements` by default). Safe to call more than once, and a no-op where
 * there is no registry (a server render).
 */
export function defineCodeBlock(registry: ElementRegistry | undefined = globalThis.customElements): void {
  defineElements(registry, [[COPY, PrimitivCodeBlockCopyElement]]);
}
