import type { Metadata } from "next";

import { ComponentsIndex } from "@/site/ComponentsIndex";
import { Shell } from "@/site/Shell";

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
export const metadata: Metadata = {
  title: "Components",
  description:
    "Every Primitiv component, documented across three consumption modes: " +
    "headless, styled registry, and Figma.",
};

export default function ComponentsPage() {
  return (
    <Shell>
      <ComponentsIndex />
    </Shell>
  );
}
