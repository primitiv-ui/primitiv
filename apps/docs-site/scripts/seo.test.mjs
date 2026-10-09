/*
 * Search-engine and agent hygiene, asserted against the static export.
 *
 *   pnpm build && pnpm test:seo
 *
 * These read `out/` rather than calling the metadata functions, because the
 * exported files are what a crawler actually fetches: a `generateMetadata` that
 * returns the right object but never reaches the `<head>` (a client component,
 * a route the export skipped) would pass a unit test and still ship nothing.
 */
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), "../out");
const ORIGIN = "https://primitiv-ui.dev";

if (!existsSync(OUT)) {
  throw new Error("No out/ directory — run `pnpm build` first.");
}

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });

/*
 * Every real page, as the path it is served at. `trailingSlash: true` exports
 * `components/button/index.html`; the bare `404.html` and the not-found routes
 * are error documents, not pages anyone should land on from a search.
 */
const pages = walk(OUT)
  .filter((file) => file.endsWith(`${sep}index.html`))
  .map((file) => `/${relative(OUT, dirname(file)).split(sep).join("/")}/`.replace("//", "/"))
  .filter((path) => path !== "/404/" && path !== "/_not-found/")
  .sort();

test("the sitemap lists every exported page, and nothing else", () => {
  const xml = readFileSync(join(OUT, "sitemap.xml"), "utf8");
  const listed = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).sort();
  assert.deepEqual(
    listed,
    pages.map((path) => `${ORIGIN}${path}`),
  );
});

test("robots.txt allows every crawler and points at the sitemap", () => {
  const robots = readFileSync(join(OUT, "robots.txt"), "utf8");
  assert.match(robots, /^User-Agent: \*$/m);
  assert.match(robots, /^Allow: \/$/m);
  assert.doesNotMatch(robots, /^Disallow:/m);
  assert.match(robots, new RegExp(`^Sitemap: ${ORIGIN}/sitemap\\.xml$`, "m"));
});
