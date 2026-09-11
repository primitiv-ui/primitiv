"use client";

import { useLocalStorage, useMediaQuery } from "@primitiv-ui/react";

export const THEME_KEY = "primitiv-docs-theme";

export type Theme = "light" | "dark";

/**
 * The docs site's current theme, and the setter that changes it.
 *
 * **This exists so that two components cannot disagree about the theme.** The
 * site has no theme context — `ThemeToggle` originally derived the value
 * inline — and anything else that needs to know (the A11Y-01 animation picks
 * its own `src` by theme) would otherwise re-derive it independently. Two
 * independent derivations read `useLocalStorage` and `useMediaQuery` at
 * slightly different moments and can disagree on first paint, which shows up
 * as a light video on a dark page for one frame. One hook, one answer.
 *
 * **Dark is the default and an OS *light* preference is the only opt-out.**
 * The Figma landing frame pins `Intent=Dark`, so dark is the designed
 * presentation rather than a variant. A stored choice always wins;
 * `useLocalStorage` returning `null` until something is written is what keeps
 * "no preference expressed" distinguishable from "explicitly chose dark".
 *
 * Deliberately does **not** write `data-theme` on `<html>`. That is a single
 * side effect with a single owner (`ThemeToggle`); doing it here would run it
 * once per consumer for no benefit.
 */
export const useDocsTheme = (): [Theme, (next: Theme) => void] => {
  const [stored, setStored] = useLocalStorage<Theme | null>(THEME_KEY, null);
  const prefersLight = useMediaQuery("(prefers-color-scheme: light)");
  return [stored ?? (prefersLight ? "light" : "dark"), setStored];
};
