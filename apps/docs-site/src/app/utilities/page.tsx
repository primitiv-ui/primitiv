import type { Metadata } from "next";

import { pageMetadata } from "@/lib/page-metadata";
import { UtilityReference } from "@/site/UtilityReference";

export const metadata: Metadata = pageMetadata({
  title: "Utility classes",
  description:
    "Primitiv's utility classes: flex, gap-16, p-16, text-muted, md:grid-cols-3 and the rest, each reading a design token, for plain CSS, SCSS and Primitiv Elements pages.",
  path: "/utilities/",
  markdown: true,
});

export default function Page() {
  return <UtilityReference />;
}
