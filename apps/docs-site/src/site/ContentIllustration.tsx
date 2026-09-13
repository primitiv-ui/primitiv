"use client";

import manifest from "@/content/illustrations.generated.json";

import { FIGURES, hasFigure } from "./figures";
import { useDocsTheme } from "./use-docs-theme";

import "./themed-image.css";

/**
 * One of the ten content-page illustrations — nine of them DOM figures, one a
 * screenshot.
 *
 * The eight content pages were built in Figma with these as deliberate gaps —
 * dashed, sized, labelled frames carrying the brief — and the artwork was then
 * built on the Figma page "Docs Site — Content illustrations", both breakpoints
 * and both themes, twenty frames a side (§6.0.5–6.0.10 of
 * docs/docs-site-content-plan.md), exported by a human and landed.
 *
 * **Then nine of the ten were rebuilt in the DOM and their exports deleted**
 * (§6.0.29–6.0.31). The exported art was approved and the designs still stand —
 * the frames remain the design record, the way a component set does for its
 * registry component — but a PNG of mostly-small-text reads soft beside the
 * browser-rendered text next to it at any export scale, and nine of the ten
 * were drawings of things the design system renders natively. A figure follows
 * the theme, the density and a palette regeneration for free; a raster needs a
 * human to re-export four files.
 *
 * So this component is now mostly a router with one raster left in it:
 *
 * - **A figure wins, and needs none of the machinery below** — no manifest, no
 *   twin files, no `<picture>`, and no authored alt, because its content is
 *   real text in the page.
 * - **FIGMA-P01 stays raster for good.** It is a screenshot of the Figma UI,
 *   which the DOM cannot reproduce and should not imitate. Its geometry is
 *   measured rather than declared (`gen-illustrations.mjs` reads the PNG's own
 *   IHDR), and its alt is authored, because a screenshot cannot describe itself.
 *
 * An id with no figure and no manifest entry renders nothing rather than a
 * placeholder box. That is the honest state — the prose reads on its own — and
 * it is why a paired row collapses to one column while its illustration is
 * outstanding.
 */
const ALT: Record<string, string> = {
  "FIGMA-P01":
    "A screenshot of the Figma library: the Button component set as its full grid " +
    "of variants with generated row and column labels, the layers panel on the " +
    "left and the variant properties panel on the right.",
};

const SIZES: Record<string, { desktop: string; mobile: string }> = manifest;

export const hasIllustration = (id: string): boolean =>
  hasFigure(id) || (id in SIZES && id in ALT);

/**
 * `"1264 / 328"` → `{ width: 1264, height: 328 }`.
 *
 * The manifest stores each measured size in `aspect-ratio` syntax, which is
 * what it was first consumed as. The real pixel pair is what the DOM needs, and
 * it is still the measured IHDR — the same two integers, not a derived ratio.
 */
const dimensions = (ratio: string) => {
  const [width, height] = ratio.split("/").map((n) => Number(n.trim()));
  return { width, height };
};

export const ContentIllustration = ({ id }: { id: string }) => {
  const [theme] = useDocsTheme();

  /* A rebuilt figure wins over the exported PNGs, and needs none of the machinery
     below: no manifest, no twin files, no `<picture>`, and no authored alt —
     its content is real text in the page. */
  const Figure = FIGURES[id];
  if (Figure) return <Figure />;

  const size = SIZES[id];
  const alt = ALT[id];
  if (!size || alt === undefined) return null;

  const src = (breakpoint: "desktop" | "mobile") =>
    `/illustrations/${id.toLowerCase()}-${breakpoint}-${theme}.png`;

  const desktop = dimensions(size.desktop);
  const mobile = dimensions(size.mobile);

  /*
   * `<picture>` for the breakpoint, the theme in `src`, and that division is
   * forced rather than chosen: `<source media>` cannot key on
   * `prefers-color-scheme` (nor on the toggle's `data-theme`), while a theme
   * swap done in CSS would download both files. So the media query picks the
   * composition and the hook picks the theme, and exactly one image is fetched.
   *
   * The breakpoint is the shell's own — below 64rem it drops both rails and the
   * column becomes the full width, which is the point at which every one of
   * these briefs asks for its stacked composition.
   *
   * **The two shapes are carried as `width`/`height` ATTRIBUTES, per source,
   * and that is not interchangeable with a style.** An earlier version put
   * `style={{ aspectRatio }}` on the `<source>`, which does nothing at all: a
   * `<source>` is not a rendered element, so it has no box for CSS to shape.
   * Only the `<img>` renders, so every mobile composition was laid out at the
   * DESKTOP ratio — `start-01-mobile` is 684x816 and painted into a 326x85 box,
   * squashed by 4.6x. Nothing errors, the right FILE is fetched, and the
   * `<source>` carries a plausible-looking aspect-ratio in the DOM, which is
   * what made it survive review; it took measuring `naturalWidth/naturalHeight`
   * against the rendered rect to see it. It also could not surface before the
   * art landed, because the stand-ins were two copies of one file.
   *
   * `width`/`height` on a `<source>` are the platform's own art-direction
   * mechanism: the selected source's pair becomes the `<img>`'s intrinsic
   * aspect ratio, so the box is reserved before load AND each composition keeps
   * its own shape. The stylesheet's `inline-size: 100%` + `block-size: auto` is
   * what lets that ratio scale to the column — do not add a CSS `aspect-ratio`
   * back, it would override the source that won.
   */
  return (
    <picture>
      <source
        media="(width < 64rem)"
        srcSet={src("mobile")}
        width={mobile.width}
        height={mobile.height}
      />
      <img
        className="docs-themed-image"
        src={src("desktop")}
        width={desktop.width}
        height={desktop.height}
        alt={alt}
      />
    </picture>
  );
};
