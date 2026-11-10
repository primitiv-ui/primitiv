import "./dialog-polyfill";

import { defineModal } from "../elements";

/** Mount markup and let the root's first reconcile settle. */
export async function mount(html: string): Promise<void> {
  // Defined inside each test rather than in beforeAll: a failure there would
  // skip the file, and a skipped test kills no mutant.
  defineModal();
  document.body.innerHTML = html;
  await settle();
}

/** Let the root's MutationObserver and any queued reconcile run. */
export async function settle(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

export const root = () => document.querySelector("primitiv-modal") as HTMLElement & { open: boolean };
export const dialog = () => document.querySelector("dialog") as HTMLDialogElement;
export const trigger = () => document.querySelector("primitiv-modal-trigger > button") as HTMLButtonElement;
export const close = () => document.querySelector("primitiv-modal-close > button") as HTMLButtonElement;
export const heading = () => document.querySelector("primitiv-modal-title > h2") as HTMLElement;
export const paragraph = () => document.querySelector("primitiv-modal-description > p") as HTMLElement;
