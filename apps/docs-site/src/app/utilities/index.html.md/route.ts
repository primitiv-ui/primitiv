import { markdownResponse } from "@/lib/markdown";
import { utilitiesMarkdown } from "@/lib/utilities";

/* `/utilities/index.html.md` — the utility classes as Markdown, for agents. */
export const dynamic = "force-static";

export function GET() {
  return markdownResponse(utilitiesMarkdown());
}
