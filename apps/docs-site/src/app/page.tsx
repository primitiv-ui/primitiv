import type { Metadata } from "next";

import { pageMetadata } from "@/lib/page-metadata";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import { HomePage } from "@/site/HomePage";
import { JsonLd } from "@/site/JsonLd";

/*
 * A server route rendering the client landing page, for the reason
 * `components/page.tsx` documents: only a server component may export
 * `metadata`, and the landing page needs its own canonical link.
 */
export const metadata: Metadata = pageMetadata({
  description: SITE_DESCRIPTION,
  path: "/",
});

/*
 * Site-level structured data, so it sits on the home page only: WebSite gives
 * Google the site name it prints above a result, Organization ties the logo and
 * the GitHub org to it.
 */
const WEBSITE = { "@type": "WebSite", name: SITE_NAME, url: `${SITE_URL}/` };

const ORGANIZATION = {
  "@type": "Organization",
  name: SITE_NAME,
  url: `${SITE_URL}/`,
  logo: `${SITE_URL}/primitiv-logo.svg`,
  sameAs: ["https://github.com/primitiv-ui"],
};

export default function Page() {
  return (
    <>
      <JsonLd data={WEBSITE} />
      <JsonLd data={ORGANIZATION} />
      <HomePage />
    </>
  );
}
