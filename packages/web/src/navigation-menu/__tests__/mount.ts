import { defineNavigationMenu } from "../elements";

/** Define the elements, render `html`, and let the first reconcile land. */
export async function mount(html: string): Promise<void> {
  defineNavigationMenu();
  document.body.innerHTML = html;
  await settle();
}

/** Let the MutationObserver's reconcile run. */
export async function settle(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

/** Wait `ms` of real time. */
export const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export const root = (): HTMLElement => document.querySelector("primitiv-navigation-menu") as HTMLElement;
export const button = (label: string): HTMLElement =>
  [...document.querySelectorAll("button")].find((b) => b.textContent === label) as HTMLElement;
export const anchor = (label: string): HTMLElement =>
  [...document.querySelectorAll("a")].find((a) => a.textContent === label) as HTMLElement;
export const panel = (value: string): HTMLElement =>
  [...document.querySelectorAll<HTMLElement>("primitiv-navigation-menu-content")].find(
    (p) => (p.getAttribute("value") ?? p.closest("primitiv-navigation-menu-item")?.getAttribute("value")) === value,
  ) as HTMLElement;
export const part = (name: string): HTMLElement =>
  document.querySelector(`primitiv-navigation-menu-${name}`) as HTMLElement;

/**
 * Errors thrown inside event listeners. jsdom reports them on `window` rather
 * than failing the test, so each suite asserts this stays empty.
 */
export const listenerErrors: unknown[] = [];
window.addEventListener("error", (event) => listenerErrors.push(event.error));
