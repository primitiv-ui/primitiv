import ICON_NAMES from "@/content/icon-names.generated.json";

/** The opening of each of an `<svg>`'s paths: what tells one glyph from another. */
const pathKey = (svg: string): string =>
  [...svg.matchAll(/\sd="([^"]{0,16})/g)].map((m) => m[1]).join("|");

const NAMES: Readonly<Record<string, string>> = ICON_NAMES;

/**
 * Elements markup with every inline icon replaced by a comment saying where it
 * goes and which one: `<!-- Insert your SVG icon here: close -->`. An `<svg>`
 * that is no `@primitiv-ui/icons` glyph is left as written.
 * Elements pages bring their own icons, so the markup shows the slot rather
 * than path data a reader would copy without meaning to. The live previews keep
 * the real glyphs; only what a reader copies changes. The CLI prints the same
 * comment, from the registry's own example markup.
 */
export const iconPlaceholders = (markup: string): string =>
  markup.replace(/<svg[\s>][\s\S]*?<\/svg>/g, (svg) => {
    /* The page examples already name their glyph (examples/glyphs.ts) and draw
       it only in the preview; anything else is recognised by its paths. */
    // An SVG with its own state (Code Block's copy glyphs carry
    // `data-copy-state` and `hidden`) or class is part of the markup's API:
    // turning it into a comment would drop what the element reads.
    const opening = /^<svg([^>]*)>/.exec(svg)?.[1] ?? "";
    if (/\s(?:data-[\w-]+|hidden|class)(?=[\s=]|$)/.test(opening)) return svg;
    const named = /<!-- ([a-z-]+) glyph -->/.exec(svg)?.[1] ?? NAMES[pathKey(svg)];
    // An SVG that is no icon from the set (Data Table's sort arrows, Stepper's
    // warning mark) is part of the component's own drawing: it stays as written.
    return named ? `<!-- Insert your SVG icon here: ${named} -->` : svg;
  });
