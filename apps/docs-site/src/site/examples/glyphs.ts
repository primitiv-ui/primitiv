/**
 * The Elements code tabs show each icon as a commented placeholder — the paths
 * are noise there — so the live preview swaps the real `@primitiv-ui/icons`
 * glyphs back in, with `IconBase`'s own `<svg>` attributes.
 */
const GLYPHS: Record<string, string> = {
  plus: '<path d="M11.25 3.25h1.5v17.5h-1.5z"/><path d="M20.75 11.25v1.5H3.25v-1.5z"/>',
  check: '<path d="M21.057 5.904 10.05 19.111 2.939 12 4 10.94l5.95 5.949 9.954-11.946 1.153.961Z"/>',
  "arrow-right":
    '<path d="M19.75 11.25v1.5H3.25v-1.5z"/><path d="M21.06 12 13 20.06 11.94 19l7-7-7-7L13 3.94z"/>',
  search:
    '<path d="M16.25 10.5a5.75 5.75 0 1 0-11.5 0 5.75 5.75 0 0 0 11.5 0m1.5 0a7.25 7.25 0 1 1-14.5 0 7.25 7.25 0 0 1 14.5 0"/><path d="M21.06 20 20 21.06l-5.56-5.56 1.06-1.06z"/>',
  user: '<path d="M15.25 8a3.25 3.25 0 1 0-6.5 0 3.25 3.25 0 0 0 6.5 0m1.5 0a4.75 4.75 0 1 1-9.5 0 4.75 4.75 0 0 1 9.5 0"/><path d="M19.25 21c0-4.526-3.601-7.25-7.25-7.25S4.75 16.474 4.75 21v.75h-1.5V21c0-5.474 4.399-8.75 8.75-8.75s8.75 3.276 8.75 8.75v.75h-1.5z"/>',
  "chevron-left": '<path d="m16.06 5-7 7 7 7L15 20.06 6.94 12 15 3.94 16.06 5Z"/>',
  "chevron-right": '<path d="M17.06 12 9 20.06 7.94 19l7-7-7-7L9 3.94z"/>',
  info: '<path d="M20.25 12a8.25 8.25 0 1 0-16.5 0 8.25 8.25 0 0 0 16.5 0m1.5 0c0 5.385-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12 6.615 2.25 12 2.25s9.75 4.365 9.75 9.75"/><path d="M11.25 10.25h1.5v7.5h-1.5zm0-4h1.5v2.5h-1.5z"/>',
  success: '<path d="M20.25 12a8.25 8.25 0 1 0-16.5 0 8.25 8.25 0 0 0 16.5 0m1.5 0c0 5.385-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12 6.615 2.25 12 2.25s9.75 4.365 9.75 9.75"/><path d="m18.058 8.919-7.016 8.183L5.939 12 7 10.94l3.957 3.957 5.962-6.955z"/>',
  warning: '<path d="M23.311 20.75H.688L12 1.52zm-20-1.5H20.69L12 4.479z"/><path d="M11.25 8.25h1.5v6.5h-1.5zm0 7.5h1.5v2.5h-1.5z"/>',
  danger: '<path d="M20.25 12a8.25 8.25 0 1 0-16.5 0 8.25 8.25 0 0 0 16.5 0m1.5 0c0 5.385-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12 6.615 2.25 12 2.25s9.75 4.365 9.75 9.75"/><path d="M17.06 16 16 17.06 6.94 8 8 6.94z"/><path d="M17.06 8 8 17.06 6.94 16 16 6.94z"/>',
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
