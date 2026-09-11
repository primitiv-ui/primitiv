"use client";

import { useEffect } from "react";

import { Moon, Sun } from "@primitiv-ui/icons";

import { useDocsTheme } from "./use-docs-theme";

import "./theme-toggle.css";

export { THEME_KEY } from "./use-docs-theme";

/**
 * Light/dark switch, persisted with `useLocalStorage`.
 *
 * Three things worth knowing:
 *
 * 1. **The value itself comes from `useDocsTheme`**, not from this component,
 *    so the animation that picks its `src` by theme cannot disagree with the
 *    switch that sets it. See that hook for the default-to-dark rule.
 * 2. **This component owns the `data-theme` side effect**, and it is written
 *    in an effect rather than during render. The token
 *    layer keys off `[data-theme]` on `<html>`, which is outside this
 *    component's tree, so it has to be a side effect.
 * 3. **It is a `<button>` with `aria-pressed`, not a checkbox.** The control
 *    toggles a page-wide setting rather than submitting a value, and
 *    `aria-pressed` is what conveys the current state; the visible glyph alone
 *    would leave a screen-reader user guessing.
 */
export const ThemeToggle = () => {
  const [theme, setTheme] = useDocsTheme();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="docs-theme-toggle"
      aria-pressed={isDark}
      aria-label="Dark mode"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {/* No aria-hidden needed: IconBase applies it automatically unless an
          aria-label is passed, so the glyph is already hidden and the button's
          own aria-label is the accessible name. */}
      {isDark ? <Moon /> : <Sun />}
    </button>
  );
};
