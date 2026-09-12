"use client";

import { ThemedImage } from "./ThemedImage";

/**
 * The ten content-page illustrations, keyed by the brief id the Figma pages use.
 *
 * The eight content pages were built in Figma with these as **deliberate gaps**
 * — dashed, sized, labelled frames carrying the brief (§6.0.4 of
 * docs-site-content-plan.md). The artwork is the remaining half of that step,
 * and it has to leave Figma as PNGs by hand: `mcp.figma.com` is unreachable from
 * the build sandbox (CLAUDE.md gotcha 31), so exporting is a human's job.
 *
 * An id absent from here renders nothing rather than a placeholder box. That is
 * the honest state — the prose is complete and reads on its own — and it is why
 * a paired row (see `ContentPage`) collapses to one column when its
 * illustration has not landed yet.
 *
 * To add one: export `<id>-light.png` and `<id>-dark.png` (lowercased) into
 * `public/illustrations/`, then add an entry with **authored** alt text. Alt is
 * not derivable from the brief — the brief says what to draw, alt says what a
 * reader who cannot see it needs to know — so it is written here, once, per
 * illustration.
 */
const ILLUSTRATIONS: Record<string, { readonly alt: string; readonly ratio: string }> = {};

export const hasIllustration = (id: string): boolean => id in ILLUSTRATIONS;

export const ContentIllustration = ({ id }: { id: string }) => {
  const art = ILLUSTRATIONS[id];
  if (!art) return null;
  return (
    <ThemedImage
      base={`/illustrations/${id.toLowerCase()}`}
      alt={art.alt}
      ratio={art.ratio}
    />
  );
};
