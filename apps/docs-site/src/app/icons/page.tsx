import type { Metadata } from "next";

import { pageMetadata } from "@/lib/page-metadata";
import { WEB_RELEASE } from "@/lib/web-release";
import { IconGallery } from "@/site/IconGallery";

export const metadata: Metadata = pageMetadata({
  title: "Icons",
  description:
    "Every icon in @primitiv-ui/icons, with a button to copy its SVG for Primitiv Elements or any HTML page, and its React component name.",
  path: "/icons/",
  markdown: true,
});

export default function Page() {
  return <IconGallery version={WEB_RELEASE} />;
}
