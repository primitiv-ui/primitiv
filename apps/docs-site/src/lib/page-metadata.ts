import type { Metadata } from "next";

import { SITE_NAME } from "./site";

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
 * alone. `path` is the served path, trailing slash included.
 */
export const pageMetadata = ({
  title,
  description,
  path,
}: {
  readonly title?: string;
  readonly description: string;
  readonly path: string;
}): Metadata => ({
  ...(title === undefined ? {} : { title }),
  description,
  alternates: { canonical: path },
  openGraph: {
    title: title ?? SITE_NAME,
    description,
    url: path,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: { card: "summary" },
});
