/**
 * The Elements code tabs show each icon as a commented placeholder — the paths
 * are noise there — so the live preview swaps the real `@primitiv-ui/icons`
 * glyphs back in, with `IconBase`'s own `<svg>` attributes.
 */
const GLYPHS: Record<string, string> = {
  plus: '<path d="M11.25 3.25h1.5v17.5h-1.5z"/><path d="M20.75 11.25v1.5H3.25v-1.5z"/>',
  "arrow-right":
    '<path d="M19.75 11.25v1.5H3.25v-1.5z"/><path d="M21.06 12 13 20.06 11.94 19l7-7-7-7L13 3.94z"/>',
  search:
    '<path d="M16.25 10.5a5.75 5.75 0 1 0-11.5 0 5.75 5.75 0 0 0 11.5 0m1.5 0a7.25 7.25 0 1 1-14.5 0 7.25 7.25 0 0 1 14.5 0"/><path d="M21.06 20 20 21.06l-5.56-5.56 1.06-1.06z"/>',
  close: '<path d="M20.06 19 19 20.06 3.94 5 5 3.94z"/><path d="M20.06 5 5 20.06 3.94 19 19 3.94z"/>',
};

/** The placeholder a code tab prints for a glyph. */
export const glyph = (name: keyof typeof GLYPHS & string) =>
  `<svg aria-hidden="true"><!-- ${name} glyph --></svg>`;

export const withGlyphs = (html: string) =>
  html.replace(
    /<svg aria-hidden="true"><!-- ([a-z-]+) glyph --><\/svg>/g,
    (_, name: string) =>
      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${GLYPHS[name]}</svg>`,
  );
