# Docs site — session handoff (2026-08-21)

Continuing the `apps/docs-site` build. The **Button** component page is the
finished reference; **Select** is next and should be brought to the same
standard. Read `docs/registry-bugs.md` alongside this.

---

## State

- **Pushed to `main`:** 8 commits ending `00a335fc` — `useLocalStorage` in
  `packages/react`, two registry fixes at source (Button underline, List nested
  layout), the Select docs-data extractor entry, the docs-site scaffold, the
  registry-bugs record, InlineCode props tables, and the published-icons switch.
- **UNCOMMITTED** at handoff: the component-page template rebuilt against Figma,
  plus a batch of tweaks (see "What Button now does"), and a `:has()` scoping fix
  to `List` in `registry/components/list/styles.{css,scss}` and both app copies.
  Commit these in logical pieces before starting Select.
- Dev server: `cd apps/docs-site && pnpm dev` → **http://localhost:4100**.

**Pushing.** Work directly on `main` — no branches, no PRs. The remote gains
commits from other sessions (a 27-commit Harmoni run landed mid-session), so a
push may be rejected: `git fetch`, check `git diff --name-only` for overlap, then
**rebase** (`git rebase origin/main`) and push. Never force-push. Re-run the
gates after rebasing.

---

## Method (this mattered more than anything else)

1. **Read the Figma frame before building.** Twice in this session I built from
   section names and inference and had to redo it. The frames are on page
   "Wireframes — Docs Site (v1 — component page)":
   - Button: `1883:50912` (`Component page — Button (desktop) — system build`)
   - Select: `1897:102948`
   Walk them with `figma_execute` (instances + their `componentProperties` + text
   `fontSize`/`fontName`/bound fill variable), and **screenshot the section** —
   my structural walk reported the Playground Card's slot as EMPTY when the frame
   actually contained radios, a divider, a preview and two selects. The
   screenshot is what revealed it.
2. **Measure, never guess, for anything visual.** `apps/kitchen-sink` owns
   `@playwright/test` and Chromium is in the local cache:
   ```sh
   cd apps/kitchen-sink && cat > measure.mjs <<'EOF'
   import { chromium } from '@playwright/test';
   const b = await chromium.launch();
   const p = await b.newPage({ viewport: { width: 1440, height: 1400 } });
   await p.goto('http://localhost:4100/components/select/', { waitUntil: 'networkidle' });
   console.log(await p.evaluate(() => /* getComputedStyle + getBoundingClientRect */ null));
   await b.close();
   EOF
   node measure.mjs; rm -f measure.mjs
   ```
   It must run from `apps/kitchen-sink` (that is where the dep lives) and imports
   from `@playwright/test`, not `playwright`. This found a phantom margin after
   two wrong guesses, and separately found a nested list absent from the DOM
   entirely. Note measurements come back in **light** theme (fresh profile, no
   stored preference) while the site defaults to dark.
3. **Run the gates every time:**
   ```sh
   cd apps/docs-site && node scripts/check-tokens.mjs && pnpm build
   node scripts/check-registry-stylesheets.mjs      # only if registry/ was touched
   ```

---

## Conventions (all enforced or load-bearing)

- **Registry components first.** Compose `Box`/`Container`/`Stack`/`Grid`/`Card`/
  `List`/`Table`/`CodeBlock`/`Collapsible`/`Radio`/`Divider`/`Field`/`Badge`/
  `Breadcrumb`/`InlineCode`/`SegmentedControl`. Reach for bespoke CSS only when
  no styled surface fits — and treat that as a finding worth recording.
- **CSS is global with a `docs-` prefix** (matching kitchen-sink), NOT modules.
  `scripts/check-tokens.mjs` enforces three rules that all fail silently in a
  browser: no phantom `--primitiv-*` tokens, no bare lengths outside `--docs-*`
  constants, every selector anchored by a `.docs-*` class. `src/app/reset.css` is
  the one file exempt from the selector rule; `document.css`/`fonts.css` may use
  `html`/`body`/`:root` and bare form-control selectors.
- **Prose markup convention.** Every string from `docs-data` is source JSDoc and
  carries backticks / `{@link}`. Hand-authored spec strings (captions, a11y
  notes) use the **same** convention. Both render through
  `src/lib/render-doc.tsx`. `InlineCode` inherits nothing about size from
  context — pass `size` explicitly at every call site or one chip will look
  wrong.
- **JSX attributes take no backslash escapes.** `caption="…`role=\"link\"`…"`
  fails to parse; use an expression with a single-quoted string. Inside the
  `accessibility` array (ordinary JS strings) `\"` is fine.
- **Props tables are generated, never hand-written** (planning doc §1.5).
  Regenerate with `node scripts/docs-data/extract-docs-data.mjs select` then copy
  to `apps/docs-site/src/docs-data/`.
- **Dark is the default theme** — the Figma landing frame sets
  `explicitVariableModes: ["Intent=Dark"]`. An explicit OS *light* preference
  opts out; anything else falls to dark.

---

## What Button now does (the target shape for Select)

`src/site/ComponentDocsPage.tsx` drives every component page; Select needs no
new page code, only its spec and any shape differences.

- **`ComponentPageHeader`** — Breadcrumb (Docs / Components / X) · h1 48px +
  status `Badge` + `Spacer` + Source/Figma external links · lede (`body-lg`,
  through `renderDoc`).
- **`DocsSection`** — `Stack gap="md"`, h2 40px, optional `meta` line. The meta
  line is body text, not a caption.
- **`Playground`** — one `Card size="lg"` with three regions split by
  `Divider`s: `DensityRadios` (top) → PREVIEW → prop controls (bottom), then a
  `CodeBlock` and a body-text note. Prop controls are `SegmentedControl` in an
  auto-fit grid (`.docs-control-grid`) — chosen over the design's `Select`s on
  review, with the caveat that segmented controls stop working past ~5 options.
  **`toJsx` writes every prop including defaults** — omitting them made the
  snippet look unresponsive.
- **`InteractiveExample`** — same `Card` frame, the same shared `DensityRadios`
  above it, live `CodeBlock` below.
- **Installation** — two-column `.docs-install-grid`: tabbed `InstallTabs`
  beside an import panel showing a full `import { X } from "…";` statement
  (Figma mode shows `Primitiv / X` under a "Figma library" label, since no
  import exists).
- **Styling contract** — ONE `Collapsible variant="inline"` with
  `collapsedHeight` (clamped preview + the component's own fade), trigger below
  reading "Show all N" / "Show fewer".
- **Accessibility** — registry `List` with markers on, notes through
  `renderDoc`.

## Select specifically

- Spec lives in `src/site/examples/select.tsx`; 4 examples already exist (Rich
  mode / Native mode / Grouped options / Controlled). **Its captions and a11y
  notes are still plain strings — mark them up with backticks.**
- Its Figma frame is `1897:102948`. Read it before changing layout; it has 9
  props tables and a 21-entry nested TOC, so it stresses the template.
- Its description is much longer than Button's — check line length at 20px and
  consider a measure cap the Button lede did not need.
- `Select.Root`'s controlled/uncontrolled union **flattens** in the generated
  props table, so that constraint must be stated in prose (already is, in the
  Controlled example's caption).
- Native mode has a genuinely different composition — items sit directly on the
  root, no Trigger/Content. Prerendering catches it if you get it wrong.

---

## Traps already paid for

- **`@primitiv-ui/icons` must be the PUBLISHED dep, not `link:`** — its
  `@types/react` peer is never installed for a link, so `IconProps` collapses to
  `{}` and icons reject every prop. `react` stays linked. See registry-bugs §6.
- **`CardHeader` goes INSIDE `CardContent`** — content owns all the padding.
- **`li + li` in `primitiv.reset`** adds prose margin to every list; the registry
  `List` cancels it, hand-rolled `<ul>`s do not. `document.css` cancels it for
  the two remaining bespoke lists.
- **`trailingSlash: true`** means `usePathname()` returns `/components/select/`;
  compare with `samePath`/`samePage` from `src/lib/path.ts`.
- **`code-block` borrows `.primitiv-tabs__*`** without importing that sheet —
  `InstallTabs` imports it explicitly. Registry-bugs §3, still open.
- **`asChild` Buttons lose `text-box-trim`** — wrap the label in
  `<span className="primitiv-button__label">`. Registry-bugs §5, needs a
  generator fix.

## Outstanding

1. Commit + push the uncommitted work.
2. Bring Select up to Button's standard.
3. **Mobile drawer menu** — both header segmented controls hide below `48rem`
   awaiting it, and the sidebar/TOC rails are hidden below `64rem` with no
   replacement.
4. **Accessibility pass** — deferred by the user until after the first build;
   they want excellent scores.
5. Registry-bugs §3, §4, §5 are open and need decisions.
