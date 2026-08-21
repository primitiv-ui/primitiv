import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ALL_DOCS, getDocs, type ComponentId } from "@/lib/docs-data";
import { ComponentDocsPage } from "@/site/ComponentDocsPage";

/*
 * One route for every component, rather than a folder each.
 *
 * With `output: "export"` this is fully static: `generateStaticParams` is the
 * complete list of pages to prerender at build time, so `/components/button/`
 * and `/components/select/` come out as real HTML files. Adding a component is
 * then just its generated docs-data plus a spec — no route to create, no nav
 * entry, no TOC to maintain.
 *
 * This file stays a SERVER component because `generateStaticParams` and
 * `generateMetadata` may only be exported from one; the UI is a `"use client"`
 * sibling, since every registry component pulls in the hook-laden
 * `@primitiv-ui/react` barrel.
 */

const isComponentId = (slug: string): slug is ComponentId =>
  ALL_DOCS.some((d) => d.id === slug);

export function generateStaticParams() {
  return ALL_DOCS.map((docs) => ({ slug: docs.id }));
}

/*
 * `output: "export"` cannot serve a page that was not prerendered, so an
 * unknown slug must 404 rather than be generated on demand.
 */
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!isComponentId(slug)) return {};
  const docs = getDocs(slug);
  return {
    title: docs.displayName,
    // First sentence only — a meta description is a summary, not the full prose.
    description: docs.description.split(/(?<=\.)\s/)[0],
  };
}

export default async function ComponentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isComponentId(slug)) notFound();
  return <ComponentDocsPage id={slug} />;
}
