import "./popover-polyfill";

import { defineDropdown } from "../elements";

/** Mount markup and let the roots' first reconciles settle. */
export async function mount(html: string): Promise<void> {
  // Defined inside each test rather than in beforeAll: a failure there would
  // skip the file, and a skipped test kills no mutant.
  defineDropdown();
  document.body.innerHTML = html;
  await settle();
}

/** Let the roots' MutationObservers and any queued reconcile run. */
export async function settle(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

export const root = () => document.querySelector("primitiv-dropdown") as HTMLElement & { open: boolean };
export const sub = () => document.querySelector("primitiv-dropdown-sub") as HTMLElement & { open: boolean };
export const content = () => document.querySelector("primitiv-dropdown-content") as HTMLElement;
export const subContent = () => document.querySelector("primitiv-dropdown-sub-content") as HTMLElement;
export const trigger = () => document.querySelector("primitiv-dropdown-trigger > button") as HTMLButtonElement;
/** The decorated child whose text is `name`. */
export const row = (name: string) =>
  [...document.querySelectorAll<HTMLElement>("li")].find((li) => li.firstChild?.textContent === name) as HTMLElement;
export const shown = (menu: HTMLElement = content()) => menu.hasAttribute("data-popover-open");
