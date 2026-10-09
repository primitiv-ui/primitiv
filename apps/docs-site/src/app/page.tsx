import type { Metadata } from "next";

import { pageMetadata } from "@/lib/page-metadata";
import { SITE_DESCRIPTION } from "@/lib/site";
import { HomePage } from "@/site/HomePage";

/*
 * A server route rendering the client landing page, for the reason
 * `components/page.tsx` documents: only a server component may export
 * `metadata`, and the landing page needs its own canonical link.
 */
export const metadata: Metadata = pageMetadata({
  description: SITE_DESCRIPTION,
  path: "/",
});

export default function Page() {
  return <HomePage />;
}
