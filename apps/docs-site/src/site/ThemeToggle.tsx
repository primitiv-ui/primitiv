"use client";

import { useEffect } from "react";

import { useLocalStorage, useMediaQuery } from "@primitiv-ui/react";

import { Moon, Sun } from "@primitiv-ui/icons";

import "./theme-toggle.css";

export const THEME_KEY = "primitiv-docs-theme";

type Theme = "light" | "dark";

/**
 * Light/dark switch, persisted with `useLocalStorage`.
 *
 * Three things worth knowing:
 *
 * 1. **Dark is the default, and the OS preference is only a light opt-out.**
 *    The Figma landing frame explicitly sets `Intent=Dark`
 *    (`explicitVariableModes: ["Intent=Dark"]`), so dark is the designed
 *    presentation rather than a variant. A stored choice always wins; with no
 *    stored choice, an explicit OS *light* preference is honoured and anything
 *    else falls to dark. `useLocalStorage` returning `null` until something is
 *    written is what keeps "no preference expressed" distinguishable from
 *    "explicitly chose dark".
 * 2. **The attribute is written in an effect, not during render.** The token
 *    layer keys off `[data-theme]` on `<html>`, which is outside this
 *    component's tree, so it has to be a side effect.
 * 3. **It is a `<button>` with `aria-pressed`, not a checkbox.** The control
 *    toggles a page-wide setting rather than submitting a value, and
 *    `aria-pressed` is what conveys the current state; the visible glyph alone
 *    would leave a screen-reader user guessing.
 */
export const ThemeToggle = () => {
  const [stored, setStored] = useLocalStorage<Theme | null>(THEME_KEY, null);
  const prefersLight = useMediaQuery("(prefers-color-scheme: light)");
  const theme: Theme = stored ?? (prefersLight ? "light" : "dark");

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
      onClick={() => setStored(isDark ? "light" : "dark")}
    >
      {/* No aria-hidden needed: IconBase applies it automatically unless an
          aria-label is passed, so the glyph is already hidden and the button's
          own aria-label is the accessible name. */}
      {isDark ? <Moon /> : <Sun />}
    </button>
  );
};
