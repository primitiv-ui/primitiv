import type { Metadata } from "next";

import { CATEGORY_ORDER, categorySlug } from "@/lib/docs-data";
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
  /*
   * The index gets the same right-hand TOC rail the component pages have — with
   * sixty-odd cards across ten groups it is a long page, and the rail is how you
   * reach "Overlays" without scrolling past four hundred pixels of Forms.
   *
   * Derived from `CATEGORY_ORDER` and the shared `categorySlug`, so the rail and
   * the headings cannot disagree about an anchor. Flat rather than nested: the
   * groups have no sub-sections, and `PageToc` reserves its second level for a
   * component page's sub-components.
   */
  const toc = CATEGORY_ORDER.map((category) => ({
    id: categorySlug(category),
    title: category,
  }));

  return (
    <Shell toc={toc}>
      <ComponentsIndex />
    </Shell>
  );
}
