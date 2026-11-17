import "./jsdom.ts";

import { defineCarousel, type PrimitivCarouselElement } from "../elements";

/** Define the elements, render `html`, and let the first reconcile land. */
export async function mount(html: string): Promise<void> {
  defineCarousel();
  document.body.innerHTML = html;
  await settle();
}

/** Let the MutationObserver's reconcile run. */
export async function settle(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

export const root = (): PrimitivCarouselElement => document.querySelector("primitiv-carousel") as PrimitivCarouselElement;
export const viewport = (): HTMLElement => document.querySelector("primitiv-carousel-viewport") as HTMLElement;
export const slides = (): HTMLElement[] => [
  ...document.querySelectorAll<HTMLElement>("primitiv-carousel-slide:not([data-carousel-clone])"),
];
export const button = (label: string): HTMLButtonElement =>
  [...document.querySelectorAll("button")].find((b) => b.textContent === label || b.getAttribute("aria-label") === label) as HTMLButtonElement;
export const indicators = (): HTMLElement[] => [...document.querySelectorAll<HTMLElement>("primitiv-carousel-indicator > *")];

/**
 * Errors thrown inside event listeners. jsdom reports them on `window` rather
 * than failing the test, so each suite asserts this stays empty.
 */
export const listenerErrors: unknown[] = [];
window.addEventListener("error", (event) => listenerErrors.push(event.error));

afterEach(() => {
  document.body.replaceChildren();
  expect(listenerErrors).toEqual([]);
});
