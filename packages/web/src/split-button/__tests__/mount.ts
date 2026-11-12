import "../../dropdown/__tests__/popover-polyfill";

import { defineSplitButton } from "../elements";

/** Mount markup and let the roots' first reconciles settle. */
export async function mount(html: string): Promise<void> {
  // Defined inside each test rather than in beforeAll: a failure there would
  // skip the file, and a skipped test kills no mutant.
  defineSplitButton();
  document.body.innerHTML = html;
  await settle();
}

/** Let the roots' MutationObservers and any reconcile they queue run. */
export async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

export const root = () => document.querySelector("primitiv-split-button") as HTMLElement;
export const dropdown = () => document.querySelector("primitiv-dropdown") as HTMLElement & { open: boolean };
export const action = () => document.querySelector("primitiv-split-button-action > *") as HTMLButtonElement;
export const trigger = () => document.querySelector("primitiv-dropdown-trigger > button") as HTMLButtonElement;
export const firstItem = () => document.querySelector("primitiv-dropdown-item > li") as HTMLElement;
