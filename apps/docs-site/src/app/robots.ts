import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

/*
 * Everything on the site is public documentation, so every crawler — search
 * engines and AI agents alike — is allowed everywhere. `force-static` for the
 * same reason as `sitemap.ts`: the export will not emit it otherwise.
 */
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
