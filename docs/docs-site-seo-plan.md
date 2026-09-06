# Primitiv Docs Site — SEO Plan

> **Companion doc.** This owns SEO-specific decisions only. The site's mode
> switch, page template, and docs-data pipeline are decided in
> [`docs-site-planning.md`](./docs-site-planning.md) and treated here as
> already-settled; what each page *says* is
> [`docs-site-content-plan.md`](./docs-site-content-plan.md). Don't
> re-litigate those here — cross-reference instead.

> **Status:** Working draft (planning stage — no implementation started)
> **Date:** 2026-09-06
> **Trigger:** an external SEO audit (of the docs site plan, not the built
> site) raised four categories of concern — rendering/discovery, on-page
> optimization, structural/semantic quality, and search hygiene/
> canonicalization. This doc checks each claim against what's actually
> implemented in `apps/docs-site` today, rather than assuming the audit's
> generic advice applies uniformly, and plans the genuine gaps.

---

## 0. Summary

Checking the audit against the current implementation found it's a mixed
bag: several of the concerns it raised are **already solved** by decisions
made earlier in `docs-site-planning.md` (full SSG, clean URLs, a real
direct-answer intro, real semantic tables and code markup), one is
**partially solved but worth tightening** (per-component meta titles), and
several are **genuine, unstarted gaps** (sitemap/robots, structured data,
canonical tags — including a real duplicate-content risk the mode-switch
design creates — and OG images). §1 has the item-by-item audit result; §3
is the phased plan for the gaps.

| Area | Status |
|---|---|
| SSG / pre-rendered HTML | **Done** — `output: "export"`, every route static |
| Clean URLs (no hash routing) | **Done** |
| Sitemap.xml + robots.txt | **Missing** — plan in §3 Phase 1 |
| Component meta titles | **Partial** — generic today, needs search-intent framing |
| Direct-answer intro paragraph | **Done** — already the first content on every component page |
| Semantic code snippets (`<pre><code>`) | **Done** |
| Semantic props/API tables (`<table>`) | **Done** |
| JSON-LD structured data | **Missing** — plan in §3 Phase 2 |
| Canonical tags | **Missing**, and there's a real bug-shaped gap (§1.4) |
| OG images | **Missing** — plan in §3 Phase 3 |
| Lazy-loading / Core Web Vitals | **Unmeasured** — needs a real audit before any change (§3 Phase 0/4) |

---

## 1. Audit results, checked against the current implementation

### 1.1 Rendering strategy & discovery

- **SSG — done, and stronger than the audit assumed.** `apps/docs-site/next.config.ts`
  sets `output: "export"` **unconditionally**, not just for the deploy build,
  specifically so that reaching for a route handler, middleware, ISR, or
  anything dynamic fails the build immediately rather than silently 404ing
  once deployed. Every route (landing, `/components`, and one route per
  component via `generateStaticParams` in
  `src/app/components/[slug]/page.tsx`) is pre-rendered to real HTML at
  build time. The page components are `"use client"` (they pull in the
  `@primitiv-ui/react` barrel), but per the config's own comment this is a
  hydration boundary, not client-side rendering — the static export still
  contains the full semantic markup. Confirmed structurally: `generateMetadata`
  and `generateStaticParams` live in the server-component route file
  specifically so the client UI sibling doesn't block them.
- **Clean URLs — done.** `trailingSlash: true` in the same config emits
  `components/button/index.html`, so `/components/button/` resolves
  cleanly on a static host. There is no hash-based routing anywhere in the
  site. (There *is* a URL query param involved in the mode switch — see
  §1.4, a related but distinct risk the audit didn't name.)
- **Sitemap.xml / robots.txt — missing.** Neither file nor Next's
  `sitemap.ts`/`robots.ts` metadata-route convention exists yet. Planned in
  §3 Phase 1.

### 1.2 High-intent on-page optimization

- **Component-level meta titles — partial.** `generateMetadata` in
  `src/app/components/[slug]/page.tsx` currently sets
  `title: humanName(docs.displayName)`, composed through the root layout's
  `title.template: "%s · Primitiv"` (e.g. "Button · Primitiv"). That's
  functional but generic — it doesn't carry the search-intent framing the
  audit asks for ("Button Component — Props, Accessibility & Examples").
  Planned in §3 Phase 1; needs a settled format (§4.1) before implementing,
  since it applies to every one of the 63 component pages at once.
- **Direct-answer introductions — already done, no work needed.** Every
  component page's `ComponentPageHeader.tsx` renders an `<h1>` immediately
  followed by a lede `<p>` sourced from `docs.description` — the component's
  own JSDoc summary — as the **first** content on the page, before the
  Playground. This was a design decision already made independent of SEO
  (the header block's own comment cites the Figma frame it was built from),
  and it happens to satisfy the audit's ask exactly.
- **Accessible code snippets — already done, verified in source.** The
  registry `code-block` component (`registry/components/code-block/code-block.tsx`)
  renders through `prism-react-renderer`'s `Highlight` render-prop straight
  into a real `<pre><code className="primitiv-code-block__code">` element —
  not a canvas or a div-only widget — and because the whole page is
  statically pre-rendered (§1.1), the highlighted markup is present in the
  build output a crawler fetches, not assembled after the fact by client JS.

### 1.3 Structural & semantic quality

- **Structured props/API tables — already done.** Per `docs-site-planning.md`
  §1.17, the props table is built on the registry `table`/`data-table`
  component — a real `<table>`, not styled `<div>` rows.
- **Structured data (JSON-LD) — missing.** No `SoftwareSourceCode`/
  `TechArticle` schema exists anywhere on the site. Planned in §3 Phase 2.
- **Interactive previews & Core Web Vitals — unmeasured, not necessarily a
  problem.** `ComponentDocsPage.tsx` is a `"use client"` tree that mounts the
  Playground and every example eagerly on hydration; whether that actually
  hurts LCP/CLS in practice hasn't been measured against a real build. The
  plan (§3 Phase 0/4) is to measure first and only add lazy-loading if the
  measurement shows a real cost — not to add `next/dynamic` speculatively
  everywhere the audit's generic advice suggests it.

### 1.4 Search hygiene & canonicalization

- **Canonical tags — missing, and this is a real gap, not just hygiene.**
  `docs-site-planning.md` §1.1 persists the global consumption-mode switch
  as **"a shareable URL param"** — meaning `/components/button/?mode=headless`
  and `/components/button/?mode=styled` are two independently crawlable URLs
  serving materially different rendered content (different code snippets,
  different Playground controls, per §1.26) for what is conceptually one
  page. Left alone, this is a genuine duplicate/near-duplicate-content
  vector once the site is indexed, not a hypothetical one. Planned in §3
  Phase 1: a site-wide canonical rule pointing every component page at its
  bare URL.
- **OG images — missing.** No `opengraph-image` special file or manual
  `og:image` meta exists. Planned in §3 Phase 3; needs a design pass before
  implementation (§4.3), same as any other visual-design work on the site
  (`docs-site-planning.md` §3 already defers site theming/visual design
  generally).

---

## 2. Overlap with the AI-agent discoverability goal (§1.22)

`docs-site-planning.md` §1.22 already commits the site to being agent-legible
(`llms.txt`/markdown mirrors, a thin MCP server over the registry), and its
open question 5 (§2.5) defers the concrete scoping. That goal and this one
are pulling the same lever: both want a clean, structured, per-page
statement of "what is this component and what's its API" — JSON-LD here,
`llms.txt`/markdown there. The extraction should be **one pass over
docs-data feeding multiple output formats**, not two independent
generators that can quietly disagree about, say, a component's description
or install command. This doc doesn't resolve §2.5 — it's flagged here so
whoever scopes the AI-agent work next reads this plan first rather than
building a second, divergent structured-data path.

---

## 3. The plan, phased

### Phase 0 — verify before building anything

- **Read the installed Next.js version's own docs for the `sitemap.ts` /
  `robots.ts` / `opengraph-image.tsx` metadata-route conventions under
  `output: "export"` before writing any of them.** `apps/docs-site/AGENTS.md`
  explicitly warns this Next version has breaking changes from training
  data and to read `node_modules/next/dist/docs/` first — that applies here
  as much as to any component code. (Not checked yet in this planning pass:
  `node_modules` isn't currently installed in this environment, so this is
  the literal first implementation step, not assumed compatible.)
- **Run a real Lighthouse/CWV pass against a production `next build` +
  static export**, not a guess, before deciding whether Phase 4's
  lazy-loading is even needed.

### Phase 1 — cheap, foundational, no design work

- **`src/app/sitemap.ts`.** Build the URL list from the same source
  `generateStaticParams` already uses — `ALL_DOCS` (from `@/lib/docs-data`)
  for every component route, plus the static top-level routes (`/`,
  `/components`) — so the sitemap can't drift from the actual route list the
  same way `docs-data`'s own sync guard (§1.27) prevents drift there. No new
  source of truth.
- **`src/app/robots.ts`.** Allow-all, pointing at the sitemap. The
  production deploy serves from the domain root with `DOCS_SITE_BASE_PATH`
  unset (per `CLAUDE.md`'s "Docs site" section), so no base-path prefixing
  is needed today — but read the env var the way `next.config.ts` already
  does, so this doesn't silently break if that ever changes.
- **Canonical tags.** Add `metadataBase` (the deployed origin,
  `https://primitiv-ui.dev`) to the root layout's `metadata`, then add
  `alternates: { canonical: ... }` to the component route's
  `generateMetadata` pointing at the bare `/components/<slug>/` path —
  closing the §1.4 duplicate-content gap the mode-switch query param opens.
- **Richer component meta titles.** Change `generateMetadata`'s `title`
  field from a bare `humanName(docs.displayName)`. Exact format is an open
  question (§4.1) — don't implement silently across 63 pages before it's
  settled.

### Phase 2 — structured data

- **`SoftwareSourceCode` JSON-LD** (schema.org's fit for API/library docs,
  over `TechArticle` — see §4.2 for the scope question) per component page,
  built from data the route already has: `docs.displayName`,
  `docs.description`, `programmingLanguage: "TypeScript"`, and
  `codeRepository` (the same `github.com/primitiv-ui/primitiv/tree/main/registry/components/<id>`
  URL `ComponentPageHeader.tsx` already computes for its "Source" link —
  reuse it, don't recompute it).
- Render it as a `<script type="application/ld+json">` from the **server**
  route file (`components/[slug]/page.tsx`, alongside `generateMetadata`),
  not from the `"use client"` `ComponentDocsPage` — same server/client split
  the file already documents for why metadata lives there.

### Phase 3 — OG images

- Static OG image for the landing page and `/components` index first —
  simplest case, no per-component data needed.
- Per-component OG cards via Next's colocated `opengraph-image` special
  file, using the same `generateStaticParams` params the route already
  provides. **Needs an actual design pass before implementation** — what the
  card shows (component name + a code snippet? a rendered preview, which is
  much more expensive to generate at build time and likely out of scope for
  v1?) is a visual decision, not a wiring one, and `docs-site-planning.md`
  §3 already defers the site's visual design generally.

### Phase 4 — perform the Core Web Vitals pass, only if Phase 0 shows a real cost

- If the Phase 0 measurement shows the eagerly-hydrated Playground/examples
  materially hurting LCP or CLS, code-split below-the-fold examples
  (`next/dynamic`, still statically rendered — code-split, not
  client-rendered) or gate them behind an intersection observer.
- If the measurement doesn't show a real cost, this phase is a deliberate
  no-op — record that rather than adding speculative lazy-loading the
  audit's generic advice suggested but the site's actual numbers don't
  support.

---

## 4. Open questions to settle before implementation

1. **Exact meta-title format for component pages.** Two directions worth
   picking between rather than deciding silently: a fuller search-intent
   phrase per the audit ("Button — Props, Accessibility & Examples") vs.
   keeping the current terse form and trusting the meta *description* (the
   JSDoc summary) to carry the intent signal instead. Whichever is chosen
   applies to all 63 pages at once, so it's worth a second look before
   landing.
2. **JSON-LD scope for v1.** `SoftwareSourceCode` alone for component pages,
   or also a lighter `TechArticle`/`Article` wrapper for the prose-shaped
   pages (Concepts, Recipes, Start Here) once those exist — a different
   content shape than a component page, not obviously covered by the same
   schema type.
3. **OG image content/design.** Blocked on a real visual-design pass, same
   status as the rest of the site's visual design per
   `docs-site-planning.md` §3.
4. **Canonical query-param stripping: `mode` only, or all query params?**
   `mode` is the only param that exists today, so stripping everything is
   currently equivalent to stripping just `mode` — but it's a real behavior
   decision (what happens if a future param is meant to be
   indexable-distinct?), not obviously permanent, so it's worth naming
   explicitly rather than assuming "strip everything" is forever correct.
5. **Sequencing against §1.22 / open question 5 (AI-agent discovery).**
   Should the JSON-LD generator and the future `llms.txt`/markdown-mirror
   generator be built as one shared extraction pass now, or should JSON-LD
   land on its own and the shared-extraction question wait for whoever
   scopes the AI-agent work per §2.5's still-open item? Flagged in §2; not
   resolved here.

---

## 5. Explicitly not yet started

- No `sitemap.ts`, `robots.ts`, or any metadata-route file exists.
- No JSON-LD structured data exists anywhere on the site.
- No canonical tags or `metadataBase` are set.
- No OG image generation (static or per-component) exists.
- No real Core Web Vitals measurement has been run against a production
  build — Phase 4 is contingent on this and shouldn't be assumed necessary.
