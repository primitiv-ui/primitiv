# Docs site — session handoff (2026-08-21)

Continuing the `apps/docs-site` build. **Button and Select are both built.** Read
`docs/registry-bugs.md` alongside this — it now runs to §9.

---

## State

- **Pushed to `main`.** The previous session's work was already committed and in
  sync; this session added five commits taking Select to Button's standard.
- Dev server: `cd apps/docs-site && pnpm dev` → **http://localhost:4100**.

### What the Select pass changed

Select's Figma frame turned out to specify a RICHER template than Button's, not
the same one — it adds three sections and drops none:

- **Anatomy** (new) — the part tree as a tabbed `CodeBlock`, one tab per render
  path, each part paired with the DOM/ARIA it emits in a trailing `//` comment.
  Earns its section because five of Select's nine parts render nothing under
  `native`, so neither tree can be inferred from the other. Opt-in per spec
  (`anatomy`); Button has one part and gets none.
- **Keyboard** (new) — a Key/Behaviour table with `Kbd` caps. Hand-authored
  (`keyboard`), because key handling lives in the headless hooks and is nowhere
  in `contract.json`. A `literal` flag keeps "printable character" out of a key
  cap, since it names a class of key rather than a key.
- **Data attributes** (new) — **generated** from `contract.json`, so it is
  guarded on the data rather than the spec and Button gets a one-row table for
  free. This needed an extractor change: `dataAttributes` carried only NAMES, and
  `data-state` is declared twice (`checked`/`unchecked`), so keyed on the name
  alone the second row vanished. Now carries name/value/when.
- **Accessibility is KEPT**, though Select's frame omits it. The frame's Keyboard
  table is a subset of a11y documentation, and dropping the section would have
  lost the top-layer, form-submission and unmount-while-closed notes. Additive
  reading, deliberate.
- **Styling contract is grouped by part** once there is more than one — 58
  undifferentiated names is a wall. The grouping is DERIVED from the names
  (`--primitiv-select-<part>-…`), never listed, and anything unrecognised falls
  into the base group so a new part shows up in the wrong place rather than
  disappearing. Button (15 knobs, one part) still renders one ungrouped list.

Three defects found by measuring, all invisible in review:

1. **The playground was dead.** Controls came from `subs[0].contractProps`, and
   `Select.Root` has none (they are on `Select.Trigger`) — so zero controls and a
   snippet reading `<Select />`. `contractControls` now gathers across every
   part, deduped. It failed silently because an empty control set is legitimate.
2. **Every Select panel was unanchored**, painting at the viewport corner.
   Registry-bugs §7a — fixed at source, the same fix `dropdown` already carries.
3. **No chevrons anywhere**, and the trigger hugged to 61px as a result. The
   component does not supply one in rich mode; registry-bugs §7b.

Two things the human corrected mid-session, worth keeping:

- **Icons belong in the playground's rich rows** — it is the headline rich-mode
  feature and the caption claims it. The icon set has 47 general-purpose glyphs
  and no framework logos, so the playground uses its own theme-picker data
  (Sun/Moon/Settings) where the glyphs mean something, while the examples keep
  the frame's framework data. Flipping Mode to `native` then visibly drops the
  icons and the mark, which demonstrates the native path's real cost.
- **The preview box stays at Button's 96px.** A taller box was tried so the open
  panel would not cover the controls; it was rejected as too big. The knob was
  removed rather than left unused.

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

## Snippets are mode-aware now — read this before adding a component

The nav's mode switch (default **headless**) changes what a snippet may name, and
this was silently wrong before Select exposed it:

- **headless** — one compound export, parts reached through it: `Select.Trigger`.
  These are also the names the props tables use.
- **styled** — `primitiv add` copies a file of flat exports: `SelectTrigger`,
  which exists *only* in that file.

Button never showed the problem: `<Button variant="…">` reads identically in both
modes. Select's page had been printing `SelectTrigger` in the default mode, where
it is not importable.

Use `partNamer(mode, "Select")` for part names and `importBlock({…})` for the
import lines (`src/lib/playground.ts`). Every snippet now carries its imports,
which is also what makes the difference self-evidencing — the reader can see
`SelectTrigger` present in one mode and absent in the other. `ComponentSpec`'s
`snippet` and each example's `code` both receive `mode`; `snippetPrefix` accepts
a function of it.

Also: **`toJsx` is only right when the controls are the ROOT's props.** For a
compound whose modifiers sit on child parts it emits a lie — Select's generated
line was `<Select size="md" mode="rich" placement="bottom-start" />`, three props
the root does not accept. That is what `playground.snippet` is the escape hatch
for, not styling preference.

**Figma mode still gets the dot form**, which is the closer read but not really
right — JSX is not the artifact a designer wants. See Outstanding.

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

1. **Mobile drawer menu** — both header segmented controls hide below `48rem`
   awaiting it, and the sidebar/TOC rails are hidden below `64rem` with no
   replacement.
2. **Accessibility pass** — deferred by the user until after the first build;
   they want excellent scores.
3. **Figma mode shows JSX.** Every code block falls back to the headless dot form
   in Figma mode. A designer wants the component-set path and its property values
   (`Select / Trigger · Size=md`), the way the Installation panel already handles
   Figma honestly. Not designed in the frame either.
4. **The main column is 632px, the frame says 920** (824 content). Registry-bugs
   §9 — a shell-wide change, so it wants a deliberate call. It is why the anatomy
   tree needs a no-wrap override at all.
5. **The playground has no `State` control**, which Select's frame draws (a fourth
   Select beside Size/Mode/Placement, showing `default`). Deliberately skipped:
   `disabled` and invalid are not contract modifiers, and `toJsx`'s rule is that
   every control appears in the snippet — so a control that must NOT appear needs
   a "not a prop" concept the playground does not have. The states are documented
   in the Data attributes table instead.
6. Registry-bugs **§3, §4, §5, §7b, §8** are open and need decisions.

Two notes on the gates, both cost time this session:

- `check-registry-stylesheets.mjs` lives at the **repo root**, not
  `apps/docs-site/scripts/` (the old line above was wrong).
- The Playwright measuring script must run from `apps/kitchen-sink` AND
  `page.evaluate` takes **one** argument — pass an object, or it throws
  *"Too many arguments"*.
- Copying a registry `.tsx` over an app copy **strips its stylesheet import**
  (the CLI prepends `import "../styles/primitiv/<name>/styles.css"`, the registry
  source has none). Doing that silently unstyled the whole component and cost a
  wrong-diagnosis detour. Re-add the line after any such copy.
