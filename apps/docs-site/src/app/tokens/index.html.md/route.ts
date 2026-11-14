import { markdownResponse } from "@/lib/markdown";
import { SITE_URL } from "@/lib/site";
import { tokenReferenceMarkdown } from "@/lib/token-reference";

/* `/tokens/index.html.md` — the token reference as Markdown, for agents. */
export const dynamic = "force-static";

export function GET() {
  return markdownResponse(tokenReferenceMarkdown(SITE_URL));
}
