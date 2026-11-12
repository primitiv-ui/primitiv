import "../../select/__tests__/popover-polyfill";

import { defineCombobox } from "../elements";

/** Define the elements, render `html` and let the first reconcile land. */
export async function mount(html: string): Promise<void> {
  defineCombobox();
  document.body.innerHTML = html;
  await Promise.resolve();
}

/** The root, the field and the popup of the only (or first) combobox on the page. */
export const root = (): HTMLElement & { value: string; open: boolean } =>
  document.querySelector("primitiv-combobox") as HTMLElement & { value: string; open: boolean };
export const field = (): HTMLInputElement => document.querySelector("primitiv-combobox-input input") as HTMLInputElement;
export const popup = (): HTMLElement => document.querySelector("primitiv-combobox-content") as HTMLElement;
export const item = (value: string): HTMLElement =>
  document.querySelector(`primitiv-combobox-item[value="${value}"]`) as HTMLElement;
export const shown = (element: HTMLElement): boolean => element.hasAttribute("data-popover-open");

/** Let the root's MutationObserver deliver, and any microtask it queued run. */
export const settle = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};
