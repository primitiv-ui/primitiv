"use client";

import { useLocalStorage } from "@primitiv-ui/react";

export const THEME_KEY = "primitiv-docs-theme";

export type Theme = "light" | "dark";

/**
 * The docs site's current theme, and the setter that changes it.
 *
 * **This exists so that two components cannot disagree about the theme.** The
 * site has no theme context — `ThemeToggle` originally derived the value
 * inline — and anything else that needs to know (the A11Y-01 animation picks
 * its own `src` by theme) would otherwise re-derive it independently. One hook,
 * one answer.
 *
 * **Dark is the default; the toggle is the only opt-out, and it persists.**
 * The Figma landing frame pins `Intent=Dark`, so dark is the designed
 * presentation. We deliberately do NOT auto-follow `prefers-color-scheme`:
 * browsers report `(prefers-color-scheme: light)` as true for BOTH an OS
 * explicitly set to light AND no preference at all — the two are
 * indistinguishable — so honouring it renders the site light for most visitors,
 * the opposite of the intended default. A visitor who specifically wants light
 * expresses that through the toggle, whose choice `useLocalStorage` remembers;
 * that stored value is the reliable "I chose light" signal an OS media query
 * cannot give. `null` until something is written keeps "never chosen" (→ dark)
 * distinguishable from "chose dark".
 *
 * Must stay in lockstep with the pre-paint inline script in `layout.tsx`, which
 * applies the same `stored ?? "dark"` rule to `<html data-theme>` before first
 * paint so there is no flash. `ThemeToggle` owns the post-hydration
 * `data-theme` side effect.
 */
export const useDocsTheme = (): [Theme, (next: Theme) => void] => {
  const [stored, setStored] = useLocalStorage<Theme | null>(THEME_KEY, null);
  return [stored ?? "dark", setStored];
};
