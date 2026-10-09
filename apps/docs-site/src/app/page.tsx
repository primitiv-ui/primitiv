import type { Metadata } from "next";

import { HomePage } from "@/site/HomePage";

/*
 * A server route rendering the client landing page, for the reason
 * `components/page.tsx` documents: only a server component may export
 * `metadata`, and the landing page needs its own canonical link.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Page() {
  return <HomePage />;
}
