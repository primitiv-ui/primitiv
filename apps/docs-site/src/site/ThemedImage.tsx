"use client";

import { useDocsTheme } from "./use-docs-theme";

import "./themed-image.css";

/**
 * A still illustration that follows the docs theme.
 *
 * `<source media>` does not support `prefers-color-scheme`, so the swap cannot
 * be done in markup, and two `<img>`s toggled by CSS would download both. That
 * makes this a client component for the same structural reason as the A11Y-01
 * animation — and it reads the theme from the same `useDocsTheme` hook, so the
 * two illustrations and the toggle can never disagree.
 *
 * @param base - Asset path without the `-light` / `-dark` suffix or extension.
 * @param ratio - CSS `aspect-ratio`, reserving the box before the file loads.
 */
export const ThemedImage = ({
  base,
  alt,
  ratio,
}: {
  base: string;
  alt: string;
  ratio: string;
}) => {
  const [theme] = useDocsTheme();
  return (
    <img
      className="docs-themed-image"
      style={{ aspectRatio: ratio }}
      src={`${base}-${theme}.png`}
      alt={alt}
    />
  );
};
