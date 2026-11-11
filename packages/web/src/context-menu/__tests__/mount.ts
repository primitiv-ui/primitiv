import "./popover-polyfill";

import { defineContextMenu } from "../elements";

/** Mount markup and let the roots' first reconciles settle. */
export async function mount(html: string): Promise<void> {
  // Defined inside each test rather than in beforeAll: a failure there would
  // skip the file, and a skipped test kills no mutant.
  defineContextMenu();
  document.body.innerHTML = html;
  await settle();
}

/** Let the roots' MutationObservers and any queued reconcile run. */
export async function settle(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

export const root = () => document.querySelector("primitiv-context-menu") as HTMLElement & { open: boolean };
export const sub = () => document.querySelector("primitiv-context-menu-sub") as HTMLElement & { open: boolean };
export const region = () => document.querySelector("primitiv-context-menu-trigger") as HTMLElement;
export const content = () => document.querySelector("primitiv-context-menu-content") as HTMLElement;
export const subContent = () => document.querySelector("primitiv-context-menu-sub-content") as HTMLElement;
/** The decorated child whose text is `name`. */
export const row = (name: string) =>
  [...document.querySelectorAll<HTMLElement>("li")].find((li) => li.firstChild?.textContent === name) as HTMLElement;
export const shown = (menu: HTMLElement = content()) => menu.hasAttribute("data-popover-open");

/**
 * Errors thrown inside event listeners. jsdom reports them on `window` rather
 * than failing the test, so each suite asserts this stays empty.
 */
export const listenerErrors: unknown[] = [];
window.addEventListener("error", (event) => listenerErrors.push(event.error));
