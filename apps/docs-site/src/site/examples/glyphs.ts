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
  user: '<path d="M15.25 8a3.25 3.25 0 1 0-6.5 0 3.25 3.25 0 0 0 6.5 0m1.5 0a4.75 4.75 0 1 1-9.5 0 4.75 4.75 0 0 1 9.5 0"/><path d="M19.25 21c0-4.526-3.601-7.25-7.25-7.25S4.75 16.474 4.75 21v.75h-1.5V21c0-5.474 4.399-8.75 8.75-8.75s8.75 3.276 8.75 8.75v.75h-1.5z"/>',
  "chevron-left": '<path d="m16.06 5-7 7 7 7L15 20.06 6.94 12 15 3.94 16.06 5Z"/>',
  "chevron-right": '<path d="M17.06 12 9 20.06 7.94 19l7-7-7-7L9 3.94z"/>',
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
