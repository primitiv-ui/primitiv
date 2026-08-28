---
name: docs-site-component-page
description: End-to-end playbook for adding (or bringing up to standard) a component's page on the public docs site, apps/docs-site — the generated docs-data + roster, the hand-authored ComponentSpec (playground, examples, and the optional Anatomy / Keyboard / Data-attributes sections), the registration points, the gates, and the traps that only a real browser catches. TRIGGER when adding a docs-site page for a component, filling in a stub page, bringing a page up to the Button/Select standard, or editing the shared component-page template (ComponentDocsPage, Playground, PropsTable, the section components). SKIP for the kitchen-sink/workbench example surfaces (see workbench-examples), the registry component itself (see new-registry-component), the headless primitive (see new-react-component), and pure docs-site planning decisions (see docs-site-planning).
---

# Docs-site component page

The public docs site is `apps/docs-site` (Next.js, `output: "export"`, static).
Every component gets one page at `/components/<id>/`, rendered by a single shared
template. Adding a page is: **generate its data, write its spec, register two
lines** — the route and the nav derive themselves.

**Read `docs/docs-site-session-handoff.md` first.** It is the living procedure
and carries the traps in most detail; this skill is the durable map around it.
Read `docs/registry-bugs.md` too — building a page routinely surfaces registry
bugs (the anchor-not-wired and no-chevron cases came straight out of it).

**Two reference pages.** `button` is the simple shape (one part). `select` is the
rich shape (nine parts, plus the Anatomy / Keyboard / Data-attributes sections
and mode-aware snippets). Copy whichever matches; read both specs before writing
a new one — `src/site/examples/{button,select}.tsx`.

## The method that matters more than the steps

1. **Read the Figma frame before building — walk AND screenshot.** Frames live
   on the Figma page **"Wireframes — Docs Site (v1 — component page)"** (Button
   `1883:50912`, Select `1897:102948`; each component has its own). A structural
   walk alone lies — it once reported a Card slot empty when the frame held four
   controls, and it won't tell you a component's frame drops Accessibility and
   adds Anatomy/Keyboard/Data-attributes (Select's does). `figma_execute` to walk
   instances + `componentProperties` + text `fontSize`/`fontName`, and
   `figma_take_screenshot` each section. Building from section names alone gets
   redone.
2. **Measure, never guess, for anything visual.** `@playwright/test` + a cached
   Chromium live in **`apps/kitchen-sink`** — the script must run from there and
   import from `@playwright/test`. This is how you confirm the panel anchors, the
   chevrons render, nothing overflows. Two gotchas that cost time:
   `page.evaluate` takes **one** argument (pass an object, or it throws "Too many
   arguments"); and a fresh profile is **light** theme while the site defaults to
   dark — set `document.documentElement.dataset.theme` in `evaluate` to pick.
   Overlay scrollbars fade out of static screenshots — trust computed styles for
   those.
3. **A green `next build` is not verification.** Render-time React errors do not
   fail the build; they land in `apps/docs-site/.next/dev/logs/next-development.log`.
   Prerendering catches a broken composition (e.g. Select's native mode has no
   Trigger/Content) — a page that builds can still be wrong. Look at it.

## Adding a page — the mechanical steps

1. **Add an entry to `scripts/docs-data/registry.mjs`** (the single source both
   docs-data scripts read). Mirror an existing entry: `displayName`, `kind`
   (`registry` | `registry-only` — the latter is primitive-less, changes what
   Installation says), `status`, `category` (must be one of `CATEGORY_ORDER` —
   the typecheck rejects a typo), `propsFile`, `subComponents` (one per part,
   with `propsType`/`element`/`component`), `contract`, `figmaComponentSetKey`
   (omit if the file has no set — it's optional), `importPath`.
2. **Regenerate:** `node scripts/docs-data/sync-docs-data.mjs`. This rebuilds
   every `<id>.docs.json` and `roster.json`, in both `scripts/docs-data/` and
   `apps/docs-site/src/docs-data/`. Never hand-edit the JSON — CI runs
   `pnpm qa:docs-data` (`--check`) and fails if the committed copies moved.
3. **Write the spec** `src/site/examples/<id>.tsx` exporting a `ComponentSpec`
   (shape below).
4. **Register two lines** (both keyed by the same `id`):
   - `src/lib/docs-data.ts` — import the `.docs.json` + add to the `DOCS` map.
   - `src/site/examples/index.ts` — import the spec + add to the `SPECS` map.
5. **Nothing else.** The `[slug]` route (`generateStaticParams` over `ALL_DOCS`)
   and the sidebar/TOC nav (derived from `ROSTER`/`CATEGORY_ORDER`) pick it up
   automatically. No route file, no nav entry, no TOC.

## The ComponentSpec (`src/site/examples/types.ts`)

- **`playground`** — `component`, `render(values)`, and for a compound a
  hand-written **`snippet(values, mode)`** (see below). The controls are derived
  from the contract modifiers across **every** part (`contractControls`), so a
  compound whose modifiers sit on a child part still gets controls.
- **`examples[]`** — `{ id, title, render }`. Each renders an `InteractiveExample`
  (shared Card + density radios + live `CodeBlock`). `code(density, mode)`.
- **`anatomy?` / `anatomyMeta?`** — the part tree, one block per render path.
  Optional: only earns its place on a compound (Button has one part → skip).
- **`keyboard?` / `keyboardMeta?`** — Key/Behaviour rows (`Kbd` caps; `literal`
  for "printable character"). Hand-authored — key handling is nowhere in the
  contract.
- **`accessibility[]`** — hand-authored notes.
- **Data attributes** are **generated** from the contract (name/value/when) — no
  spec field; the section appears when the data is non-empty.

The template renders sections in the frame's order and shows the conditional
ones (Anatomy / Keyboard / Data-attributes) only when present.

## Load-bearing conventions

- **Compose registry components** (`Box`/`Stack`/`Grid`/`Card`/`Table`/`List`/
  `CodeBlock`/`Collapsible`/`Kbd`/`Badge`/`InlineCode`/`SegmentedControl`…).
  Bespoke CSS only where no styled surface fits — and treat that as a finding to
  record.
- **Snippets are mode-aware.** The nav's mode switch (default **headless**)
  changes what a snippet may name: `Select.Trigger` (headless, one compound
  export) vs `SelectTrigger` (styled, a flat export from the copied file that
  exists nowhere else). Use `partNamer(mode, "X")` for part names and
  `importBlock({…})` for the import lines (`src/lib/playground.ts`); every
  snippet carries its imports. `toJsx` is only correct when the controls are the
  **root's** props — for a compound whose modifiers live on child parts it emits
  a lie, which is what `playground.snippet` overrides.
- **Prose markup convention.** Every string from docs-data is source JSDoc with
  backticks / `{@link}`; hand-authored captions and notes use the **same**
  convention, both rendered through `src/lib/render-doc.tsx`. Pass `InlineCode`
  `size` explicitly at every call site — it inherits nothing.
- **JSX attributes take no backslash escapes** — `caption="…\"role\"…"` fails to
  parse; use an expression with a single-quoted string. Inside plain JS arrays
  (`accessibility`) `\"` is fine.
- **CSS is global with a `docs-` prefix**, not modules. `scripts/check-tokens.mjs`
  enforces: no phantom `--primitiv-*`, no bare lengths outside `--docs-*`
  constants, every selector `.docs-*`-anchored. `reset.css` is exempt from the
  selector rule; `document.css`/`fonts.css` may use `html`/`body`/`:root`;
  `primitiv-base.css` (the registry base) is excluded entirely.
- **Dark is the default theme.** An explicit OS *light* preference opts out.
- **The two surfaces do not have the same parts** — Modal's Header/Body/Footer
  are registry-only, Checkbox's Indicator is headless-only; the extractor derives
  both, and the code block must show what the example beside it renders.

## Gates (run every time)

```sh
cd apps/docs-site && node scripts/check-tokens.mjs && pnpm build   # docs gates
# from the REPO ROOT — these are the CI docs-data guards:
pnpm qa:docs-data        # sync-docs-data --check: committed JSON is current
pnpm qa:data-attributes  # every emitted data attr is declared on its part
pnpm qa:stylesheets      # registry stylesheets parse  (only if registry/ touched)
```

`check-registry-stylesheets.mjs` lives at the **repo root**, not
`apps/docs-site/scripts/`. Dev server: `cd apps/docs-site && pnpm dev` →
http://localhost:4100.

## Pushing

Straight to `main`, no branches, no PRs. If a push is rejected: `git fetch`,
`git diff --name-only ..origin/main` for overlap, **rebase** (never force-push),
re-run the gates, push. Commit in logical pieces — a registry fix at source is
its own commit from the page work that surfaced it.
