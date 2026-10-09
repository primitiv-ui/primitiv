import { llmsIndex } from "@/lib/markdown";

/* `/llms.txt` — see `llmsIndex`. Served as Markdown-flavoured plain text. */
export const dynamic = "force-static";

export function GET() {
  return new Response(llmsIndex(), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
