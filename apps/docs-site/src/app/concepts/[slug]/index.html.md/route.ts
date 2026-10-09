import { CONTENT_PAGES, getContentPage } from "@/lib/content-pages";
import { contentMarkdown, markdownResponse } from "@/lib/markdown";

/*
 * `/concepts/<key>/index.html.md` — each Concepts page's Markdown mirror. Same
 * param list as the page route, read off the routes rather than hardcoded.
 */
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return CONTENT_PAGES.filter((p) => p.route.startsWith("/concepts/")).map((p) => ({
    slug: p.key,
  }));
}

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return markdownResponse(contentMarkdown(getContentPage(slug)));
}
