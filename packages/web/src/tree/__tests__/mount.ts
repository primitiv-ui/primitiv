import { defineTree } from "../elements";

/** Define the elements, render `html`, and let the first reconcile land. */
export async function mount(html: string): Promise<void> {
  defineTree();
  document.body.innerHTML = html;
  await settle();
}

/** Let the MutationObserver's reconcile run. */
export async function settle(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

export const root = (): HTMLElement => document.querySelector("primitiv-tree") as HTMLElement;
export const node = (value: string): HTMLElement =>
  document.querySelector(`[value="${value}"]:is(primitiv-tree-item, primitiv-tree-branch)`) as HTMLElement;
export const control = (value: string): HTMLElement =>
  node(value).querySelector(":scope > primitiv-tree-branch-control") as HTMLElement;
export const group = (value: string): HTMLElement =>
  node(value).querySelector(":scope > primitiv-tree-branch-content") as HTMLElement;
export const path = (): HTMLElement => document.querySelector("primitiv-tree-selection-path") as HTMLElement;

/**
 * Errors thrown inside event listeners. jsdom reports them on `window` rather
 * than failing the test, so each suite asserts this stays empty.
 */
export const listenerErrors: unknown[] = [];
window.addEventListener("error", (event) => listenerErrors.push(event.error));
