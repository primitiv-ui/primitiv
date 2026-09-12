import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { contentMetadata } from "@/lib/content-metadata";
import { CONTENT_PAGES, getContentPage } from "@/lib/content-pages";
import { ContentPageShell } from "@/site/ContentPageShell";

/*
 * The five Concepts pages, one dynamic route — the same shape `/components/
 * [slug]` uses, and for the same reason: with `output: "export"`,
 * `generateStaticParams` is the complete list of pages to prerender, so each one
 * comes out as real HTML and adding a sixth concept means adding it to the page
 * data, not creating a route.
 *
 * Which keys live under `/concepts/` is not hardcoded here: it is read back off
 * the routes the generator assigned, so the folder and the nav cannot disagree
 * about where a page lives.
 */
const CONCEPTS = CONTENT_PAGES.filter((p) => p.route.startsWith("/concepts/"));

const isConcept = (slug: string) => CONCEPTS.some((p) => p.key === slug);

export function generateStaticParams() {
  return CONCEPTS.map((p) => ({ slug: p.key }));
}

/* `output: "export"` cannot serve a page that was not prerendered. */
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!isConcept(slug)) return {};
  return contentMetadata(getContentPage(slug));
}

export default async function ConceptPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isConcept(slug)) notFound();
  return <ContentPageShell page={getContentPage(slug)} />;
}
