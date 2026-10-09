import type { Metadata } from "next";

import { SITE_NAME } from "./site";

/*
 * Descriptions are sourced from JSDoc and content-page ledes, both Markdown, and
 * a search result shows the raw characters — so code spans, emphasis and links
 * are reduced to their text.
 */
const plainText = (markdown: string): string =>
  markdown
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, "$1");

/**
 * Every page's `<head>`, from the three things that differ per page.
 *
 * One builder rather than per-route objects because Next derives none of these
 * from each other: `og:title` is not read from `title`, `og:url` is not read
 * from the canonical, and a child route's `openGraph` replaces its parent's
 * wholesale rather than merging. Spelled out per route, they drift.
 *
 * `title` is the bare page title — the root layout's template appends
 * " · Primitiv" to `<title>`, while Open Graph carries the site separately as
 * `og:site_name`. Omit it on the landing page, which is titled by the site name
 * alone. `description` may be Markdown. `path` is the served path, trailing
 * slash included.
 */
export const pageMetadata = ({
  title,
  description,
  path,
}: {
  readonly title?: string;
  readonly description: string;
  readonly path: string;
}): Metadata => {
  const summary = plainText(description);
  return {
    ...(title === undefined ? {} : { title }),
    description: summary,
    alternates: { canonical: path },
    openGraph: {
      title: title ?? SITE_NAME,
      description: summary,
      url: path,
      siteName: SITE_NAME,
      type: "website",
    },
    twitter: { card: "summary" },
  };
};
