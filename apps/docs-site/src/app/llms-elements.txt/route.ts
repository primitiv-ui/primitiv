import { llmsElements } from "@/lib/markdown";

/* `/llms-elements.txt` — see `llmsElements`. Served as Markdown-flavoured plain text. */
export const dynamic = "force-static";

export function GET() {
  return new Response(llmsElements(), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
