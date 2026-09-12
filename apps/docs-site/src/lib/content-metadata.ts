import type { Metadata } from "next";

import type { ContentPage } from "./content-pages";

/**
 * A content page's `<head>`.
 *
 * The lede is the page's own one-paragraph summary, which is exactly what a meta
 * description is — so it is taken verbatim rather than written twice. First
 * sentence only, since a description is a summary and the full lede runs long on
 * several pages.
 */
export const contentMetadata = (page: ContentPage): Metadata => ({
  title: page.title,
  description: page.lede.split(/(?<=\.)\s/)[0],
});
