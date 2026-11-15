/**
 * What jsdom lacks and a real browser has: `Element.scrollTo`, which the strip
 * calls as a column opens. A spy, so a test can read the calls; it does
 * nothing, as jsdom has no layout to scroll.
 */
import { vi } from "vitest";

export const scrollTo = vi.fn();
Element.prototype.scrollTo = scrollTo as unknown as typeof Element.prototype.scrollTo;
