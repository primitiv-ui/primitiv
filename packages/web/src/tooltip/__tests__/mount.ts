import "./popover-polyfill";

import { defineTooltip } from "../elements";

/** Mount markup and let the root's first reconcile settle. */
export async function mount(html: string): Promise<void> {
  // Defined inside each test rather than in beforeAll: a failure there would
  // skip the file, and a skipped test kills no mutant.
  defineTooltip();
  document.body.innerHTML = html;
  await settle();
}

/** Let the root's MutationObserver and any queued reconcile run. */
export async function settle(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

export const root = () => document.querySelector("primitiv-tooltip") as HTMLElement & { open: boolean };
export const content = () => document.querySelector("primitiv-tooltip-content") as HTMLElement;
export const trigger = () => document.querySelector("primitiv-tooltip-trigger > button") as HTMLButtonElement;
export const shown = () => content().hasAttribute("data-popover-open");
