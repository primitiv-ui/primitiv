"use client";

import { useEffect, useRef } from "react";

import { useMediaQuery } from "@primitiv-ui/react";

import { useDocsTheme } from "./use-docs-theme";

import "./a11y-animation.css";

/** Both breakpoints are a true 4:3 recomposition, not a scale of one another. */
const RATIO = "4 / 3";

const ALT =
  "A Primitiv menu being driven entirely from the keyboard: arrow keys move " +
  "the highlight, each step showing a visible focus ring, and Escape closes it.";

const source = (desktop: boolean, dark: boolean) =>
  `/illustrations/a11y-01-${desktop ? "desktop" : "mobile"}-${dark ? "dark" : "light"}`;

/**
 * The A11Y-01 animation: the one claim on the landing page that can be shown
 * rather than asserted.
 *
 * Four things here are forced rather than chosen, and the home-copy record
 * (section 9) settles each:
 *
 * 1. **It has to be a client component.** `<source media>` does not support
 *    `prefers-color-scheme`, so the theme swap cannot be expressed in markup;
 *    and two `<video>` elements swapped by a CSS rule would download both and
 *    drift out of sync with each other.
 * 2. **The theme comes from `useDocsTheme`**, the same hook `ThemeToggle`
 *    uses. Re-deriving it here would let the two disagree on first paint.
 * 3. **`currentTime` is carried across a theme change**, so switching theme
 *    mid-playback does not restart the animation — the two recordings are
 *    frame-aligned precisely so this is invisible. The time is stashed on
 *    every `timeupdate` and restored once the new file reports its metadata.
 * 4. **Reduced motion renders the `<img>` still, not a paused video.** A
 *    paused `<video>` still downloads the whole file to show its first frame;
 *    the still is that video's own last frame, so nothing is lost and nothing
 *    is fetched that will not play.
 */
export const A11yAnimation = () => {
  const [theme] = useDocsTheme();
  const isDesktop = useMediaQuery("(min-width: 48rem)");
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  const base = source(isDesktop, theme === "dark");
  const videoRef = useRef<HTMLVideoElement>(null);
  const resumeAt = useRef(0);

  // Changing the `src` attribute alone does not reload a <video> in every
  // engine, so the swap is explicit; playback resumes in onLoadedMetadata.
  useEffect(() => {
    videoRef.current?.load();
  }, [base]);

  if (prefersReducedMotion) {
    return (
      <img
        className="docs-a11y-animation"
        style={{ aspectRatio: RATIO }}
        src={`${base}.png`}
        alt={ALT}
      />
    );
  }

  return (
    <video
      ref={videoRef}
      className="docs-a11y-animation"
      style={{ aspectRatio: RATIO }}
      src={`${base}.mp4`}
      poster={`${base}.png`}
      autoPlay
      muted
      loop
      playsInline
      aria-label={ALT}
      onTimeUpdate={(event) => {
        resumeAt.current = event.currentTarget.currentTime;
      }}
      onLoadedMetadata={(event) => {
        const video = event.currentTarget;
        video.currentTime = resumeAt.current;
        // Autoplay can be refused; the poster then stands in, which is fine.
        void video.play().catch(() => {});
      }}
    />
  );
};
