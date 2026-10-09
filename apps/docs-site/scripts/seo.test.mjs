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

const html = (path) => readFileSync(join(OUT, path, "index.html"), "utf8");

/*
 * The mode switch persists as a query param (`?mode=headless`), which makes one
 * page reachable at several crawlable URLs with different code samples. A
 * canonical link at the bare path is what collapses them back into one.
 */
test("every page declares its own bare URL as canonical", () => {
  for (const path of pages) {
    const canonicals = [...html(path).matchAll(/<link rel="canonical" href="([^"]+)"/g)];
    assert.deepEqual(
      canonicals.map((m) => m[1]),
      [`${ORIGIN}${path}`],
      path,
    );
  }
});

test("component pages carry a search-oriented title built from their heading", () => {
  const components = pages.filter((path) => /^\/components\/[^/]+\/$/.test(path));
  assert.ok(components.length > 0);
  for (const path of components) {
    const page = html(path);
    const heading = page.match(/<h1[^>]*>([^<]+)<\/h1>/)[1];
    const title = page.match(/<title>([^<]+)<\/title>/)[1];
    assert.equal(
      title,
      `${heading} React component, props &amp; accessibility · Primitiv`,
      path,
    );
  }
});

const meta = (page, attr, key) =>
  page.match(new RegExp(`<meta ${attr}="${key}" content="([^"]*)"`))?.[1];

/*
 * Link previews (Slack, social, chat apps) read Open Graph, not <title>, and
 * Next does not derive one from the other — a page with a good title and no
 * og:title previews as a bare URL.
 */
test("every page carries Open Graph and Twitter card tags that match its head", () => {
  for (const path of pages) {
    const page = html(path);
    const title = page.match(/<title>([^<]+)<\/title>/)[1];
    assert.equal(meta(page, "property", "og:title"), title.replace(/ · Primitiv$/, ""), path);
    assert.equal(meta(page, "property", "og:description"), meta(page, "name", "description"), path);
    assert.equal(meta(page, "property", "og:url"), `${ORIGIN}${path}`, path);
    assert.equal(meta(page, "property", "og:site_name"), "Primitiv", path);
    assert.equal(meta(page, "property", "og:type"), "website", path);
    assert.equal(meta(page, "name", "twitter:card"), "summary", path);
  }
});

/*
 * Descriptions come from JSDoc and content-page ledes, which are Markdown. A
 * search result or link preview shows the source characters, not the
 * formatting, so a backtick-quoted `<select>` arrives as literal backticks.
 */
test("meta descriptions are plain text, not Markdown", () => {
  for (const path of pages) {
    const description = meta(html(path), "name", "description");
    assert.doesNotMatch(description, /`|\*|\]\(/, path);
  }
});

/* Every JSON-LD block on a page, parsed. */
const jsonLd = (page) =>
  [...page.matchAll(/<script type="application\/ld\+json">([^<]*)<\/script>/g)].map((m) =>
    JSON.parse(m[1]),
  );

const ofType = (page, type) => jsonLd(page).filter((block) => block["@type"] === type);

/*
 * WebSite sets the site name Google prints above a result; Organization ties
 * the logo and the GitHub org to it. They describe the site, not a page, so they
 * belong on the home page only.
 */
test("the home page describes the site and its publisher in JSON-LD", () => {
  const home = html("/");
  assert.deepEqual(ofType(home, "WebSite"), [
    { "@context": "https://schema.org", "@type": "WebSite", name: "Primitiv", url: `${ORIGIN}/` },
  ]);
  assert.deepEqual(ofType(home, "Organization"), [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Primitiv",
      url: `${ORIGIN}/`,
      logo: `${ORIGIN}/primitiv-logo.svg`,
      sameAs: ["https://github.com/primitiv-ui"],
    },
  ]);
  for (const path of pages.filter((p) => p !== "/")) {
    assert.equal(ofType(html(path), "WebSite").length, 0, path);
  }
});

/*
 * Google wants breadcrumb markup to describe the trail the page visibly shows,
 * so the expectation is read off the rendered <nav aria-label="Breadcrumb">: a
 * page with a trail carries a matching BreadcrumbList, a page without carries
 * none.
 */
test("BreadcrumbList JSON-LD mirrors each page's visible breadcrumb trail", () => {
  let trails = 0;
  for (const path of pages) {
    const page = html(path);
    const nav = page.match(/<nav aria-label="Breadcrumb"[^>]*>(.*?)<\/nav>/)?.[1];
    const lists = ofType(page, "BreadcrumbList");
    if (nav === undefined) {
      assert.equal(lists.length, 0, path);
      continue;
    }
    trails += 1;
    const crumbs = [
      ...[...nav.matchAll(/<a [^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g)].map((m) => [m[1], m[2]]),
      [path, nav.match(/aria-current="page"[^>]*>([^<]+)</)[1]],
    ];
    assert.deepEqual(
      lists,
      [
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: crumbs.map(([href, name], i) => ({
            "@type": "ListItem",
            position: i + 1,
            name,
            item: `${ORIGIN}${href}`,
          })),
        },
      ],
      path,
    );
  }
  assert.ok(trails > 0, "no page rendered a breadcrumb trail");
});

/*
 * The Markdown mirror, at the llms.txt convention's address: a URL ending in a
 * slash gets `index.html.md` appended. Agents load these instead of the HTML,
 * so they carry the page's whole API, not a summary.
 */
const markdown = (path) => readFileSync(join(OUT, path, "index.html.md"), "utf8");

const DOCS_DATA = resolve(dirname(fileURLToPath(import.meta.url)), "../src/docs-data");

test("every component page has a Markdown mirror carrying its whole API", () => {
  const components = pages.filter((path) => /^\/components\/[^/]+\/$/.test(path));
  for (const path of components) {
    const id = path.split("/")[2];
    const docs = JSON.parse(readFileSync(join(DOCS_DATA, `${id}.docs.json`), "utf8"));
    const md = markdown(path);
    const heading = html(path).match(/<h1[^>]*>([^<]+)<\/h1>/)[1];

    assert.ok(md.startsWith(`# ${heading}\n`), path);
    assert.ok(md.includes(`${ORIGIN}${path}`), `${path}: links back to the page`);
    // `npx primitiv` resolves only once `primitiv-ui` is installed — without it,
    // npx would fetch an unrelated package called `primitiv`.
    assert.ok(
      md.includes(`\nnpm i -D primitiv-ui\nnpx ${docs.styled.installCommand}\n`),
      `${path}: install command`,
    );
    assert.doesNotMatch(md, /\{@link/, path);
    assert.doesNotMatch(md, /\| `` \|/, `${path}: empty code span`);
    // A value holding a backtick (a template-literal default) needs CommonMark's
    // double-backtick delimiters, or the span closes early and the cell garbles.
    assert.doesNotMatch(md, /\| `[^`|]*`[^`|\s][^|]*` \|/, `${path}: broken code span`);
    for (const part of docs.headless.subComponents) {
      assert.ok(md.includes(`\n### ${part.name}\n`), `${path}: ${part.name}`);
      for (const prop of [...part.props, ...(part.contractProps ?? [])]) {
        assert.match(md, new RegExp(`^\\| \`${prop.name}\` \\|`, "m"), `${path}: ${part.name}.${prop.name}`);
      }
    }
    for (const property of docs.styled.customProperties) {
      assert.ok(md.includes(`| \`${property.name}\` |`), `${path}: ${property.name}`);
    }
  }
});

const CONTENT = JSON.parse(
  readFileSync(
    resolve(dirname(fileURLToPath(import.meta.url)), "../src/content/pages.generated.json"),
    "utf8",
  ),
);

const codeBlocks = (blocks) =>
  blocks.flatMap((b) => (b.kind === "code" ? [b.code] : b.kind === "group" ? codeBlocks(b.blocks) : []));

test("every content page has a Markdown mirror carrying its sections and code", () => {
  assert.ok(CONTENT.length > 0);
  for (const page of CONTENT) {
    const md = markdown(page.route);
    const heading = html(page.route).match(/<h1[^>]*>([^<]+)<\/h1>/)[1];
    assert.ok(md.startsWith(`# ${heading}\n`), page.route);
    assert.ok(md.includes(page.lede), `${page.route}: lede`);
    assert.ok(md.includes(`${ORIGIN}${page.route}`), `${page.route}: links back to the page`);
    for (const section of page.sections) {
      assert.ok(md.includes(`\n## ${section.title}\n`), `${page.route}: ${section.title}`);
    }
    for (const code of codeBlocks([...page.head, ...page.sections.flatMap((s) => s.blocks)])) {
      assert.ok(md.includes(`\n${code}\n\`\`\``), `${page.route}: code block`);
    }
  }
});
