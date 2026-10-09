import { getContentPage } from "@/lib/content-pages";
import { contentMarkdown, markdownResponse } from "@/lib/markdown";

/* `/registry-cli/index.html.md` — this page's Markdown mirror, for agents. */
export const dynamic = "force-static";

export function GET() {
  return markdownResponse(contentMarkdown(getContentPage("registry-cli")));
}
