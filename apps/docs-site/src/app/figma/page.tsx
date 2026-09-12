import type { Metadata } from "next";

import { contentMetadata } from "@/lib/content-metadata";
import { getContentPage } from "@/lib/content-pages";
import { ContentPageShell } from "@/site/ContentPageShell";

const page = getContentPage("figma");

export const metadata: Metadata = contentMetadata(page);

export default function Page() {
  return <ContentPageShell page={page} />;
}
