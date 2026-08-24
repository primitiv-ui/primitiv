"use client";

import { useLocalStorage } from "@primitiv-ui/react";

/*
 * Site-wide preferences, persisted.
 *
 * No React context here, deliberately: `useLocalStorage` is already a shared
 * store — every consumer of the same key subscribes to it and is notified on
 * write (the in-document listener set, since the browser's `storage` event
 * fires only in *other* documents). So the nav's mode switch and the landing's
 * "Installing a component" block stay in step by both calling `useMode()`,
 * with no provider to thread through the tree.
 */

export const MODE_KEY = "primitiv-docs-mode";
export const FRAMEWORK_KEY = "primitiv-docs-framework";

/** The three consumption modes (docs-site-planning.md §1.1). */
export const MODES = ["styled", "headless", "figma"] as const;
export type Mode = (typeof MODES)[number];

/** Framework flavour for code samples. */
export const FRAMEWORKS = ["react", "vue", "svelte"] as const;
export type Framework = (typeof FRAMEWORKS)[number];

const LABELS: Record<string, string> = {
  headless: "Headless",
  styled: "Styled",
  figma: "Figma",
  react: "React",
  vue: "Vue",
  svelte: "Svelte",
};

export const label = (value: string): string => LABELS[value] ?? value;

/**
 * The consumption mode, shared by every control that reads or writes it — the
 * top-nav switch and the playground's snippet tablist are two views of this one
 * value, not two pieces of state (`useLocalStorage` keys the store).
 *
 * **Defaults to `styled`** (changed 2026-08-21, was `headless`). Styled is the
 * copy-and-go path and the one a first-time reader almost always wants: it has
 * an install command that produces something that looks finished, and its
 * snippets carry the `variant`/`size` props the examples are demonstrating.
 * Headless is the more interesting product story but the sharper landing —
 * arriving in a mode whose snippets deliberately show no styling props reads as
 * "the docs are incomplete" rather than "the styling is yours".
 *
 * Only affects readers with no stored preference; anyone who has already chosen
 * keeps their choice.
 */
export const useMode = () => useLocalStorage<Mode>(MODE_KEY, "styled");

export const useFramework = () =>
  useLocalStorage<Framework>(FRAMEWORK_KEY, "react");

/** The install command a given mode implies, shown on component pages. */
export const installCommand = (mode: Mode, component: string) =>
  mode === "styled"
    ? `npx primitiv add ${component}`
    : `npm i @primitiv-ui/react`;
