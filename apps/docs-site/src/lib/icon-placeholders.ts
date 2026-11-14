import ICON_NAMES from "@/content/icon-names.generated.json";

/** The opening of each of an `<svg>`'s paths: what tells one glyph from another. */
const pathKey = (svg: string): string =>
  [...svg.matchAll(/\sd="([^"]{0,16})/g)].map((m) => m[1]).join("|");

const NAMES: Readonly<Record<string, string>> = ICON_NAMES;

/**
 * Elements markup with every inline `<svg>` replaced by a comment saying where
 * an icon goes and which one: `<!-- Insert your SVG icon here: close -->`.
 * Elements pages bring their own icons, so the markup shows the slot rather
 * than path data a reader would copy without meaning to. The live previews keep
 * the real glyphs; only what a reader copies changes. The CLI prints the same
 * comment, from the registry's own example markup.
 */
export const iconPlaceholders = (markup: string): string =>
  markup.replace(/<svg[\s>][\s\S]*?<\/svg>/g, (svg) => {
    /* The page examples already name their glyph (examples/glyphs.ts) and draw
       it only in the preview; anything else is recognised by its paths. */
    const named = /<!-- ([a-z-]+) glyph -->/.exec(svg)?.[1];
    return `<!-- Insert your SVG icon here: ${named ?? NAMES[pathKey(svg)] ?? "icon"} -->`;
  });
