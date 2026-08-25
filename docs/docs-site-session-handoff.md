# Docs site — session handoff (2026-08-25)

Continuing the `apps/docs-site` build. **Eight component pages are live**:
Accordion, Badge, Button, Checkbox, Input, Modal, Select, Tabs. Read
`docs/registry-bugs.md` alongside this.

---

## State

- **Pushed to `main`** (this repo commits straight to main — no branches, no PRs
  unless asked).
- Dev server: `cd apps/docs-site && pnpm dev` → **http://localhost:4100**.
- `/components` lists all 63 registry components, each with a **symbolic card
  mark**. The marks are a shared spec — see "Card marks" below.

---

## Adding a component page — the procedure

Six steps. Everything except the spec file is generated.

1. **Add the component to `scripts/docs-data/registry.mjs`.** `propsFile`,
   `subComponents` (each `{ name, propsType, element, component }`), `contract`,
   `figmaComponentSetKey`, `category`, `displayName`, `status`.
   - `component` must match the contract's `component` key, or the part silently
     resolves to no contract props and no data attributes.
   - `element` only picks the interface named in "Extends ... — every native
     attribute of that element is accepted". Name the element the props actually
     come FROM: Checkbox.Root renders a `<label>` but its props are
     `Omit<ComponentProps<"input">, ...>`, so it is `"input"`.
   - A part may carry its own `propsFile` when the parts span two files — see
     below.
2. **Extract**: `node scripts/docs-data/extract-docs-data.mjs <id>`. Read the
   output: it prints every part, its `extends`, and its props, and warns
   "no contract entry for X" — which is fine for a headless-only part and a typo
   otherwise.
3. **Write `src/site/examples/<id>.tsx`** — the only hand-authored half. See
   `ComponentSpec` in `examples/types.ts` for what each field is for and when to
   omit `anatomy` / `keyboard`.
4. **Register in two places**: `src/lib/docs-data.ts` (import + the `DOCS` map)
   and `src/site/examples/index.ts`. Nav and the roster derive themselves.
5. **`node scripts/docs-data/sync-docs-data.mjs`** to regenerate and copy.
6. **Gates**: docs-site `tsc`, `next build`, `npm run check:css`, plus
   `pnpm qa:data-attributes` / `qa:stylesheets` / `qa:registry-types` at the root.

### The two surfaces do not have the same parts

This is the thing that most often makes a page lie, and it goes in **both**
directions:

- **Modal** — `Header`, `Body` and `Footer` exist only in the copied registry
  file; `@primitiv-ui/react` exports eight parts, not eleven. Their props type
  lives in `registry/components/modal/modal.tsx`, so those entries carry their
  own `propsFile`.
- **Checkbox** — the inverse. The copied file exports only `Checkbox`, so
  `CheckboxIndicator` exists in headless alone.

The extractor derives both cases (`styledOnly` from which file the props type was
found in, `headlessOnly` from what the registry file actually exports) and the
props tables print a note. **A snippet must not name a part that mode cannot
import** — write mode-aware structure, not just mode-aware names. Modal's
headless snippets show plain `<div>`s where the registry adds regions.

### Code blocks must match the example beside them

Checked on Checkbox and all three were wrong: the indeterminate block showed only
the parent while the demo renders parent + three children; the form block omitted
the Submit/Reset pair its own caption told the reader to press; the custom-mark
block showed a stylesheet rule where the example sets properties inline. **The
snippet is what a reader types to get what they see**, imports included — a
missing `Stack`/`Button` import line means the snippet does not run.

---

## Playground controls

`contractControls` derives the knobs from the registry contract's modifiers,
which is right for `size`/`variant`: they are class modifiers on the styled
surface and genuinely do not exist in headless, which is why they are dropped
under the Headless tab.

A compound's most interesting knob is often a **headless prop the contract cannot
know about** — Accordion's `multiple` changes what the component does, not how it
looks. Declare those in `ComponentSpec.playground.controls`; they are appended
after the contract's and are **not** dropped under Headless. A spec that declares
one must write its own `snippet`, because the generated `toJsx` prints every
control as an attribute on the named component.

**A boolean control renders as a `Switch`**, keyed off the options being exactly
`false`/`true` rather than off where the control came from — so a contract
modifier like Stepper's `compact` gets it too.

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
- **JSX attributes take no backslash escapes.** `caption="...`role=\"link\"`..."`
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
  beside an import panel showing a full `import { X } from "...";` statement
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

Button never showed the problem: `<Button variant="...">` reads identically in both
modes. Select's page had been printing `SelectTrigger` in the default mode, where
it is not importable.

Use `partNamer(mode, "Select")` for part names and `importBlock({...})` for the
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


### Traps found on 2026-08-25

- **Unlayered docs CSS beats every `@layer primitiv.*` rule, whatever the
  specificity.** `.docs-index-card { display: block }` silently disabled Card's
  own `display: flex`, so `layout="horizontal"` stayed stacked (only the media's
  36% width survived, being a plain width on a block child) and the vertical
  card's `flex-grow` media never absorbed the slack that keeps a row level. An
  `<a>` does need a block-level display; `block` was the wrong one. Anything in
  a docs sheet that sets a property the component also sets is an override
  whether or not it was meant as one, and `display` is the most destructive.
- **`key` alongside a spread does not reach the element.** `code-block`'s
  highlighter was written the way prism-react-renderer's README shows —
  `<span {...getLineProps({ line })} key={i}>` — and logged ~105 "Each child in a
  list should have a unique key" errors **per page view**, blamed on `Highlight`
  because the elements are created in its render callback. Under the automatic
  JSX runtime the compiler cannot hoist the key out of the props object, and
  `jsx()` (unlike `createElement`) only takes a key as its third argument.
  Destructure the getters and pass the parts explicitly.
- **Render warnings are not in the build output.** `next build` is clean while
  the app logs hundreds of errors per page. They land in
  `apps/docs-site/.next/dev/logs/next-development.log` from the running dev
  server. Reading the code will not find this class of bug and neither will a
  hand-written `createElement` reproduction — that runtime *does* extract a key
  from props, so it cannot reproduce a compiler behaviour. Bisect against the
  running server, and allow ~6s for the hot reload or you get false negatives.
- **No internal cross-references in consumer-facing prose.** RFC and decision
  citations were rendering in 22 places. `scripts/docs-data/strip-internal-refs.mjs`
  removes them where descriptions enter the site, so maintainers keep their
  pointers in `contract.json` and JSDoc. It is deliberately conservative: only a
  parenthetical that is entirely a citation, never one containing a colon or over
  60 chars. Do not add a general punctuation repair — one was tried and rewrote
  DescriptionList's deliberate "(dt : dd side by side)".
- **The card description is clamped in DATA, not CSS.** `-webkit-line-clamp`
  draws U+2026 itself and nothing suppresses it (`text-overflow` does not apply;
  `block-ellipsis` ships nowhere). A fade or mask applies unconditionally and
  would blur short descriptions that are already complete, since CSS cannot ask
  whether text overflowed. `src/lib/card-summary.ts` cuts at a word boundary and
  appends "..." only when it truncated; the full text stays in a visually hidden
  span so assistive tech is not truncated too.

---

## Outstanding

1. **Mobile drawer menu** — both header segmented controls hide below `48rem`
   awaiting it, and the sidebar/TOC rails are hidden below `64rem` with no
   replacement. (The `/components` index itself now has a compact shape — see
   Mobile below — but the shell around it does not.)
0. **55 components still have no page.** Eight are done; the roster shows the
   rest. Nothing blocks them but the per-page work above.
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

Never verified in a browser, and worth a look: the compact mobile index only
renders client-side, so its accordion and horizontal cards have never been seen;
and Select/Combobox plus Container/Center are the card-mark pairs least likely to
read apart at real card size.

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


---

## Card marks (2026-08-25)

All 63 components have a symbolic mark on `/components`. **The geometry lives in
`apps/docs-site/src/site/card-marks.json` and is read by both surfaces** — the
site renders it as inline SVG, and the Figma page "Docs — Component Card Marks"
builds its components from the same file. Canvas edits never reach the site and
are overwritten; every Figma component description says so.

The full visual language (256x144 trim, 8-unit module, 176 keyline, the five
paint roles, the layout family's dashed box, and the near-pair list) is written
up in the `figma-component-descriptions` skill under "Card Mark / *". Two things
worth knowing before touching them:

- **`content/on-action` is true white; `action/primary/foreground/*` is not** —
  it resolves to `color/white`, which is `#ebebeb` in this system.
- **Figma's `vectorPaths` rejects the SVG arc command.** Rounded corners must be
  cubic Béziers (`r * 0.5523`), and a `C` carries six parameters of which only
  the last two are the endpoint — code deriving a path's origin by pairing every
  number as x,y is wrong the moment a curve appears, and a VECTOR's x/y position
  its bounding box, so a mis-read minimum slides the whole shape silently.

## Mobile (2026-08-25)

Below `36rem` the index switches shape via `src/site/use-compact-index.ts`: the
cards take Card's own `horizontal` layout and the ten categories become an
`Accordion`. 63 vertical cards is ~34 phone screens. Both changes are structural,
which is why a hook rather than a media query — one is a class modifier the
component owns, the other a different element tree with its own ARIA. **The
server renders the wide shape deliberately**: it is the correct no-JavaScript
fallback, at the cost of one reflow on a phone's first load.
