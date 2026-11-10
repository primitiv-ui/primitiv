import "./popover-polyfill";

import { definePopover } from "../elements";

/** Mount markup and let the root's first reconcile settle. */
export async function mount(html: string): Promise<void> {
  // Defined inside each test rather than in beforeAll: a failure there would
  // skip the file, and a skipped test kills no mutant.
  definePopover();
  document.body.innerHTML = html;
  await settle();
}

/** Let the root's MutationObserver and any queued reconcile run. */
export async function settle(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

export const root = () => document.querySelector("primitiv-popover") as HTMLElement & { open: boolean };
export const content = () => document.querySelector("primitiv-popover-content") as HTMLElement;
export const trigger = () => document.querySelector("primitiv-popover-trigger > button") as HTMLButtonElement;
export const close = () => document.querySelector("primitiv-popover-close > button") as HTMLButtonElement;
export const heading = () => document.querySelector("primitiv-popover-title > h2") as HTMLElement;
export const paragraph = () => document.querySelector("primitiv-popover-description > p") as HTMLElement;
export const shown = () => content().hasAttribute("data-popover-open");
