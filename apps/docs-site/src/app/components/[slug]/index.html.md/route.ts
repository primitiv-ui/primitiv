import { ALL_DOCS, getDocs, type ComponentId } from "@/lib/docs-data";
import { componentMarkdown } from "@/lib/markdown";

/*
 * `/components/<id>/index.html.md` — the page's Markdown mirror, for agents.
 * Same param list as the page route, so every page gets exactly one mirror.
 */
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return ALL_DOCS.map((docs) => ({ slug: docs.id }));
}

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return new Response(componentMarkdown(getDocs(slug as ComponentId)), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
