import type { MetadataRoute } from "next";

import { CONTENT_PAGES } from "@/lib/content-pages";
import { ALL_DOCS } from "@/lib/docs-data";
import { SITE_URL } from "@/lib/site";

/*
 * Built from the same lists the routes' `generateStaticParams` read, so a new
 * component or content page reaches the sitemap without being added here. The
 * three hand-written routes are the ones with no list behind them;
 * `scripts/seo.test.mjs` fails if this and the export ever disagree.
 *
 * `force-static` is required, not belt-and-braces: without it `output: "export"`
 * fails with "Failed to collect page data for /sitemap.xml".
 */
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "/",
    "/components/",
    "/colours/",
    ...CONTENT_PAGES.map((page) => page.route),
    ...ALL_DOCS.map((docs) => `/components/${docs.id}/`),
  ];
  return paths.map((path) => ({ url: `${SITE_URL}${path}` }));
}
