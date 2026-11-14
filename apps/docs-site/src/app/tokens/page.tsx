import type { Metadata } from "next";

import { pageMetadata } from "@/lib/page-metadata";
import { TokenReference } from "@/site/TokenReference";

export const metadata: Metadata = pageMetadata({
  title: "Token reference",
  description:
    "Every Primitiv design token by category — colour, spacing, type, motion, elevation and component tokens — with its value in each theme and density.",
  path: "/tokens/",
  markdown: true,
});

export default function Page() {
  return <TokenReference />;
}
