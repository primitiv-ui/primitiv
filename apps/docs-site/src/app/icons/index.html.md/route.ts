import { iconsMarkdown, markdownResponse } from "@/lib/markdown";

/* `/icons/index.html.md` — the icon list as Markdown, for agents. */
export const dynamic = "force-static";

export function GET() {
  return markdownResponse(iconsMarkdown());
}
