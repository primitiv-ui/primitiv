"use client";

import manifest from "@/content/illustrations.generated.json";

import { useDocsTheme } from "./use-docs-theme";

import "./themed-image.css";

/**
 * One of the ten content-page illustrations.
 *
 * The eight content pages were built in Figma with these as deliberate gaps —
 * dashed, sized, labelled frames carrying the brief — and the artwork itself was
 * then built on the Figma page "Docs Site — Content illustrations", both
 * breakpoints and both themes, twenty frames a side (§6.0.5–6.0.10 of
 * docs/docs-site-content-plan.md). What remains is getting those forty frames
 * out as PNGs, which needs a human: this sandbox's network policy denies
 * `www.figma.com` outright, so `get_screenshot`'s download URL and
 * `download_assets` are both unreachable, and re-pairing the Desktop Bridge does
 * not change that — the plugin relay is a different host, and it is reading
 * *pixels* out that is blocked, not scripting.
 *
 * Shape of the file, and why each half lives where it does:
 *
 * - **The geometry is measured, not declared.** `gen-illustrations.mjs` reads
 *   each PNG's own IHDR, because three of these ten were built at a size other
 *   than their brief's ratio and a number typed here would be a fourth opinion.
 * - **The alt text is authored, and has to be.** A brief says what to draw; alt
 *   says what a reader who cannot see it needs to know. Each string below is
 *   written from that illustration's brief and its build notes, so the drop-in
 *   is one step — but every one wants a single look against the landed export
 *   before this page is published.
 *
 * An id with no manifest entry renders nothing rather than a placeholder box.
 * That is the honest state — the prose reads on its own — and it is why a paired
 * row collapses to one column while its illustration is still outstanding.
 */
const ALT: Record<string, string> = {
  "START-01":
    "Three routes into Primitiv side by side. Each opens with a question and " +
    "resolves to a path and one command: already have your own styling, take the " +
    "headless package; want components that look finished, copy one in with the " +
    "CLI; designing rather than building, open the Figma library. You can change " +
    "your mind later.",
  "FAMILY-01":
    "The parts of Primitiv as three surface blocks sitting on one full-width band " +
    "of design tokens, with the Harmoni colour engine feeding that band from the " +
    "side. A caption names which parts are open source and which is paid.",
  "TOKENS-01":
    "One button's background colour traced up through the three token tiers: a raw " +
    "colour in the palette at the bottom, the intent role that points at it above, " +
    "and the rendered button at the top. Only the palette tier holds an actual " +
    "colour value.",
  "DENSITY-C01":
    "The same form panel rendered at all four density settings side by side — " +
    "dense, compact, comfortable, spacious — with identical content in each, and " +
    "the measured control height and corner radius stated under every column.",
  "DENSITY-C02":
    "Nested page regions showing that density is scoped by containment: a dense " +
    "region sitting inside an otherwise comfortable page, each with its own form " +
    "control, the inner one visibly smaller. The nearest setting wins.",
  "COMPOSE-01":
    "Two snippets, each above the DOM it produces. Without asChild, a button " +
    "wrapping a link — valid JSX, invalid HTML. With asChild, one anchor carrying " +
    "the button's own classes.",
  "A11Y-C01":
    "Two regions of equal weight either side of a dividing line: what the " +
    "component handles — keyboard, focus and ARIA — and what you handle. Both " +
    "sides are required work, so neither is marked as a pass or a fail.",
  "CLI-01":
    "Two zones with a single one-way arrow between them. Your repository holds " +
    "the copied component files, primitiv.json and primitiv.lock; one package is " +
    "installed from npm, carrying the behaviour, keyboard handling and ARIA. " +
    "Nothing flows back the other way.",
  "FIGMA-P01":
    "A screenshot of the Figma library: the Button component set as its full grid " +
    "of variants with generated row and column labels, the layers panel on the " +
    "left and the variant properties panel on the right.",
  "FIGMA-P02":
    "One source at the top branching into two arms of identical weight — Figma " +
    "variables on one side, CSS custom properties on the other — each showing the " +
    "same token name. No arrow runs between the two outputs.",
};

const SIZES: Record<string, { desktop: string; mobile: string }> = manifest;

export const hasIllustration = (id: string): boolean => id in SIZES && id in ALT;

export const ContentIllustration = ({ id }: { id: string }) => {
  const [theme] = useDocsTheme();
  const size = SIZES[id];
  const alt = ALT[id];
  if (!size || alt === undefined) return null;

  const src = (breakpoint: "desktop" | "mobile") =>
    `/illustrations/${id.toLowerCase()}-${breakpoint}-${theme}.png`;

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
   * `aspect-ratio` per source, from the measured file, so the box is reserved
   * before the image loads and the two compositions do not share one shape —
   * the mobile recomposition is a different drawing, not a scaled one.
   */
  return (
    <picture>
      <source
        media="(width < 64rem)"
        srcSet={src("mobile")}
        style={{ aspectRatio: size.mobile }}
      />
      <img
        className="docs-themed-image"
        style={{ aspectRatio: size.desktop }}
        src={src("desktop")}
        alt={alt}
      />
    </picture>
  );
};
