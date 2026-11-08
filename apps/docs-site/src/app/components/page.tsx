import type { Metadata } from "next";

import { pageMetadata } from "@/lib/page-metadata";
import { ComponentsIndexPage } from "@/site/ComponentsIndex";

/*
 * A SERVER component that renders a client one.
 *
 * This split is structural, not stylistic: `metadata` (and
 * `generateStaticParams` on the dynamic route) may only be exported from a
 * server component, while anything importing a registry component must be a
 * client component — every registry surface pulls in the single
 * `@primitiv-ui/react` barrel, which is full of hooks. So route files stay on
 * the server and hold the metadata; the UI lives in a `"use client"` sibling.
 */
export const metadata: Metadata = pageMetadata({
  title: "Components",
  description:
    "Every Primitiv component, documented across three consumption modes: " +
    "headless, styled registry, and Figma.",
  path: "/components/",
});

export default function ComponentsPage() {
  /* The index and its TOC rail follow the mode switch (Elements mode lists only
     the components with an elements surface), so both are built client-side
     from one list in `ComponentsIndexPage`. */
  return <ComponentsIndexPage />;
}
