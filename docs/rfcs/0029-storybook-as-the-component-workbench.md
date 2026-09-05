# RFC 0029 — Storybook as the component workbench

> **Status:** Draft — accepted in principle (the human has decided Storybook
> replaces the workbench, and eventually the kitchen-sink); build not started.
> **Author:** Claude, from a scoping conversation
> **Date:** 2026-09-05
> **Replaces:** `apps/workbench` (fully), `apps/kitchen-sink` (eventually)
> **Does not touch:** `apps/docs-site` — see §3, which is the load-bearing
> decision in this document.

## 1. The premise, and why it changes the arithmetic

Primitiv has **four** surfaces that render components: `apps/workbench`
(legacy, frozen since 2026-07-25), `apps/kitchen-sink` (63 sections in a
5,075-line `App.tsx`), `apps/docs-site` (38 of 63 component pages live) and
Figma. Adding Storybook as a *fifth* would be indefensible — that was the
first objection raised when this was scoped, and it is answered by the
decision recorded here: **Storybook is not additive. It replaces the
workbench outright and the kitchen-sink in time.** End state is two code
surfaces — the public docs site, and Storybook as the internal detail
workbench — down from three.

That flips the maintenance argument from cost to saving, and it is the only
premise under which this work is worth doing. If the replacement intent is
ever dropped, stop: a fourth example surface is worse than the status quo.

What Storybook uniquely buys, that nothing in the repo does today:

- **Exhaustive variant matrices** rendered in isolation — Button's 25
  size×variant cells, Card's six media layouts, Tree's connector states.
- **The a11y addon**, run per story.
- **A visual-regression hook** (Chromatic, or Playwright snapshots against
  built story URLs). Nothing in the repo has baselines today.

It does **not** buy prop tables or a playground — the docs site already has
both, generated (§3.1).

## 2. Inventory of what is being retired

Verified against the tree on 2026-09-05. An agent picking this up should
re-verify rather than trust these counts.

### 2.1 `apps/workbench` — the easy retirement

| Holding | Count | Disposition |
|---|---|---|
| Example pages (`src/pages/*Example/`) | 43 | → stories, near-mechanical |
| `src/OklchPicker/` | 37 files, 16 test files | **needs a home** — §8.1 |
| Specimen pages (`ElevationExample`, `DesignSystemTestExample`, `PluginFrameExample`) | 3 | → stories, under a Foundations section |

Three things to know:

1. **The picker is not a component example.** It is RFC 0010's OKLCH editor
   (Phases 1–4b), the reason workbench carries `harmoni-wasm: workspace:*`
   and `vite-plugin-wasm`, and it has its own vitest harness at 100% with
   wasm and canvas mocked (`apps/workbench/vitest.config.ts`). Wherever it
   lands, that harness travels with it.
2. **`ci.yml`'s "Build workbench" step is a real gate** — the only thing
   type-checking the example pages and the picker on a PR. A
   `storybook build` step replaces it one-for-one, and must land in the
   *same* PR that deletes the app.
3. **`apps/workbench/playwright.config.ts` points at `testDir: './tests'`,
   which does not exist.** So the root `test:e2e` and `test:full` scripts
   are currently vacuous. Nothing to migrate; two dead scripts to delete.

### 2.2 `apps/kitchen-sink` — the hard retirement

Two things Storybook **cannot** absorb, and both need a deliberate
replacement before the app is deleted:

**(a) It is the only proof the distribution works.** It is excluded from the
pnpm workspace on purpose (`pnpm-workspace.yaml`), with its own lockfile,
depending on the *published* `@primitiv-ui/*` packages plus
`primitiv add --all --force` and `primitiv tokens` — that is literally its
`update` script. A Storybook aliased to workspace source proves none of
that: not the published package, not the CLI copy, not the embedded
registry. Given CLAUDE.md's embedded-registry gotcha (a registry change is
not live until the CLI binary is rebuilt), this is exactly the class of bug
that surface catches. Replacement design in §7.1.

**(b) Eight real-browser QA specs** in `apps/kitchen-sink/e2e/` —
`border-contrast`, `button-optical`, `heading-tracking`, `prose-measure`,
`tabular-figures`, `table-align`, `carousel-drag`, `carousel-infinite`.
These are the visual/typographic layer jsdom cannot reach, and
`e2e-carousel.yml` gates the last two on WebKit and mobile-safari in CI.
They port to Storybook (Playwright against built story URLs) but that is a
migration plus a workflow rewrite, not a delete.

Also: `/primitiv/kitchen-sink/` is the phone-QA path in
`deploy-docs-site.yml`. Storybook takes that slot.

## 3. The decision: examples are NOT shared with the docs site

The tempting design is one example authored once, rendered by both
Storybook and the docs site — via Storybook's portable-stories
(`composeStories`), or via a neutral example module both import. **Reject
it.** The two surfaces answer different questions, and forcing the union of
their concerns into one format makes both worse.

`Alert` is the proof, and it is not an edge case. The docs site renders
examples in a **consumption mode** (`styled` / `headless` / `figma`,
`apps/docs-site/src/site/preferences.ts`), and for Alert the two React modes
are *not the same component with different imports*: the headless `Alert` is
a bare `<div role="alert">` taking `children` and `asChild` and nothing
else, while the copied styled file owns `tone`, `title`, the icon and the
dismiss control. The docs site therefore hand-writes a different JSX tree
per mode — see the comment block in
`apps/docs-site/src/site/examples/alert.tsx`. No story can be parameterised
over that. The same divergence exists wherever a registry component is
hand-authored rather than a thin wrapper (`badge`, `tag`, `chip`,
`code-block`, `alert`, `confirm-dialog`, `card`, `avatar-group`, ...).

Two further frictions, each fatal on its own:

- Every docs-site example carries a hand-authored, mode-aware
  `code(density, mode)` string built through `importBlock` / `contractAttr`.
  The snippet is *half the artifact* on a docs page and irrelevant in
  Storybook, which shows its own source.
- All 42 spec files wrap their content in `InteractiveExample`, which brings
  a Card frame, `DensityRadios` and `ModeCodeBlock` — chrome that duplicates
  Storybook's own toolbar and Source panel.

**This corrects an over-optimistic line from the scoping conversation**,
where harvesting the docs-site specs was floated as a cheap way to seed
stories. It is not: the specs are pedagogical, mode-aware and
snippet-paired; stories are exhaustive, interactive and per-variant. Harvest
from the **workbench and kitchen-sink** instead — both are raw JSX with no
chrome and no mode machinery, which is exactly the right shape.

The practical payoff of this decision is large: **the migration does not
touch `apps/docs-site` at all.** That removes the single biggest source of
risk from the plan.

### 3.1 What *is* shared: the generated docs-data

`scripts/docs-data/*.docs.json` (43 components today) already carries, per
sub-component: prop `name` / `type` / `required` / `default` /
`description`, plus `contractProps` and the CSS custom properties — all
extracted from JSDoc, and gated in CI by `pnpm qa:docs-data`.

That is Storybook's `argTypes` payload almost verbatim. **Storybook reads
the same JSON the docs site does**, so `react-docgen` is never installed and
a prop table cannot drift between the two surfaces. One generator, two
consumers, already built and already gated. This is the whole of the
sharing, and it is enough.

## 4. Target architecture

```
apps/storybook/                      workspace member (unlike docs-site/kitchen-sink)
  .storybook/
    main.ts                          stories glob, addons, vite builder
    preview.tsx                      decorators: theme / density / surface
    argtypes.ts                      loads scripts/docs-data/<id>.docs.json
  src/
    components/                      `primitiv add --all` output (4th copy — see §7.2)
    styles/                          emitted tokens.css + primitiv-base.css
    stories/
      styled/<component>.stories.tsx
      headless/<component>.stories.tsx
      foundations/                   elevation, density, colour, type specimens
      lab/                           OklchPicker (if §8.1 lands here)
```

**Workspace member, `link:` to `packages/react`.** Follow `docs-site`'s
model, not the kitchen-sink's: the kitchen-sink's `dedupe: ['react',
'react-dom']` gymnastics exist only because it is *excluded* from the
workspace and its aliased source resolves a second React copy. A workspace
member has no such problem. (After §7.1 lands, nothing needs the
kitchen-sink's exclusion trick at all.)

**Two top-level sections, Styled and Headless — not a mode toggle.** §3
establishes the two surfaces are genuinely different APIs. Modelling that as
a toolbar global would be a lie for every hand-authored registry component.
Write styled stories for all 63; write headless stories only where the
primitive has behaviour worth showing in isolation (roving tabindex,
controlled state, `asChild`), which is roughly the 47 directories under
`packages/react/src/`.

**Three toolbar globals**, each a decorator, mirroring what the docs site
already models:

| Global | Mechanism | Values |
|---|---|---|
| Theme | `[data-theme]` on the preview root | light / dark |
| Density | `data-density` on the preview root | dense / compact / comfortable / spacious |
| Direction | `dir` + `DirectionProvider` | ltr / rtl |

**CSF3, one file per component.** `argTypes` come from `argtypes.ts` reading
the generated JSON — never hand-written, so a prop rename propagates from
JSDoc through `pnpm docs-data` to both surfaces.

### 4.1 Density and size are not the same kind of thing

This is the question that most shapes the day-to-day feel of the Storybook,
and the two axes pull in opposite directions. Verified against the tree:

| | **Density** | **Size** |
|---|---|---|
| What it is | An inherited DOM attribute (`data-density`) on an ancestor — RFC 0009 | A per-instance prop / contract modifier on the component |
| Set by | The consumer's page or subtree | Each instance, individually |
| Component's awareness | **None.** RFC 0009 Principle 1: tokens emit under density-neutral names and the scope swaps the values | It *is* the component's own API |
| How many components | All of them, unconditionally | `size` is a contract modifier on **52 of 63**; a React prop on more (§4.4) |
| Values | dense / compact / comfortable / spacious (default **comfortable**) | xs / sm / md / lg / xl |
| **Storybook home** | **Global toolbar** | **Per-story arg, in Controls** |

**Density is global because no component takes it.** A grep across
`packages/react/src` finds zero components accepting a density prop — the
only three hits are prose in a JSDoc example. Modelling density as a story
arg would assert an API that does not exist and quietly teach every reader
the wrong architecture. It is environmental, exactly like theme, and it
belongs in the same place as theme.

**Size is per-story because it is a prop.** It varies per instance on any
real page — a toolbar of `xs` buttons beside an `md` input is normal, not a
mistake — and `argTypes` can source its values straight from the generated
docs-data (§3.1). A global size toggle would both misrepresent the API and
make the mixed-size compositions that matter impossible to build.

### 4.2 Density still needs a per-story override

The split above is not "density is only ever global". Scoping a *subtree* to
a different density is the whole point of RFC 0009's inheritance model, so
some stories exist precisely to show it. The decorator therefore reads:

1. `parameters.primitiv.density` if the story pins one, else
2. the toolbar global.

Used by the matrix story below, and by any story demonstrating nested
scoping. The toolbar stays the default for everything else.

### 4.3 The size × density matrix is the flagship story

The two axes are **not independent**: density scales the size ramp. A
`framed-control/{size}/height` at `md` resolves to 24 / 32 / 40 / 48 px
across dense / compact / comfortable / spacious. So `size="md"` renders four
materially different controls, and *nothing in the project shows that
today* — the docs site pairs one density control with one component at a
time, and a Figma frame pins a single density mode, so seeing all twenty
cells means opening four frames.

A **20-cell `SizeDensityMatrix` story** (5 sizes × 4 densities, one frame,
each column a `data-density` scope) is therefore the single most valuable
story in a component's set, and the clearest answer to "a very detailed look
at each component". It is only buildable because density is a scope rather
than a prop — each column is a wrapper div with one attribute.

### 4.4 Three traps in wiring these up

1. **Put the mode attributes on the preview iframe's `<html>`, never on a
   wrapper `<div>`.** `Portal` defaults to `createPortal(children,
   document.body)` (`packages/react/src/Portal/Portal.tsx`), so every
   portalled surface — Modal, Drawer, Popover, Dropdown, Tooltip, rich
   Select, Combobox, ContextMenu, the NavigationMenu viewport — renders
   *outside* a wrapper div and would silently inherit the root default
   instead of the story's density and theme. Custom properties inherit
   through the DOM tree, so a fixed-position panel still inside the React
   tree is fine; a portalled one is not. This applies identically to
   `data-theme`.
2. **`size` is not always on the React root.** Select's `contract.json`
   declares `size`/`mode`/`placement` as root modifiers, but its contract
   root is `{ element: "button", component: "Trigger" }` — the docs-data
   correctly attributes all three to `Select.Trigger`. A generator that
   spreads args onto the named root emits `<Select size="md">`, three props
   the root does not accept. Map args via docs-data's per-sub-component
   attribution, not by assuming the root. (The docs site hit this and needed
   a whole-snippet escape hatch; see the comment in
   `apps/docs-site/src/site/examples/types.ts`.)
3. **Contract modifiers are not the same set as React props.**
   `confirm-dialog` and `drawer` both take a real `size` prop
   (ConfirmDialog defaults to `"sm"` and forwards to `ModalContent`) while
   declaring no `size` modifier in `contract.json`, because their visual
   declarations belong to Modal. So the story template must key off the
   docs-data props, not the contract modifier list — and must tolerate the
   11 components that genuinely have no size axis at all: `aspect-ratio`,
   `box`, `breadcrumb-overflow`, `center`, `confirm-dialog`, `divider`,
   `drawer`, `grid`, `prose`, `spacer`, `stack`.

## 5. What "a detailed look" means — the bar for a story set

The request was "a place for a very detailed look at each component". That
needs a definition, or the migration lands 63 shallow default stories and
stops. A component's story set is **done** when it has:

1. **`Default`** — the canonical single instance, all controls live.
2. **A matrix story per contract axis** — every `variant`, every `size`,
   every `tone`, rendered together in one frame so they can be compared
   rather than clicked between. This is the thing no existing surface does.
   Where the component has a size axis, this includes the 20-cell
   **size × density** matrix of §4.3.
3. **Every interactive state made reachable** — hover, active, focus-visible,
   disabled, invalid, loading. Where a state cannot be triggered by the
   addon, a static story that forces it via the data attribute or class.
4. **Compound anatomy stories** — one per meaningful composition, not one
   per prop permutation (Select rich vs native; Card's six media layouts;
   Dropdown's nested submenu).
5. **The a11y addon passing**, or a documented exemption in the story's
   `parameters`.
6. **`argTypes` sourced from docs-data**, not hand-authored.

Items 2 and 3 are the reason this is worth building; items 1 and 6 are
nearly free. Budget accordingly: a component at this bar is roughly two
hours, and there are 63 of them.

## 6. Migration plan

Phased so that each phase is independently valuable and independently
revertible.

**Phase 0 — de-risk the toolchain (half a day, blocking).**
The repo runs Vite 8, React 19.2, TypeScript 6.0. Storybook's Vite builder
against Vite 8 is the one unknown that can turn this estimate into a
multi-week slog. Spike it in a throwaway directory *before* creating
`apps/storybook`. If it fails, stop and report — do not start hand-patching
the builder.

**Phase 1 — skeleton (~1 day).** `apps/storybook` as a workspace member,
tokens + base CSS, the three toolbar globals, and Button's story set
hand-written to the §5 bar as the reference other components are copied
from.

**Phase 2 — the argTypes generator (~1–2 days).** `argtypes.ts` + a
`qa:storybook-argtypes` check that every story file's component resolves to
a docs-data entry. After this, every subsequent story starts with a
complete Controls panel for free.

**Phase 3 — retire the workbench.** Port the 43 example pages, rehome the
picker (§8.1), swap `ci.yml`'s "Build workbench" for "Build storybook",
delete `apps/workbench`, delete the two dead root scripts. **This is the
first phase that removes something**, and it validates the whole setup
end-to-end before anything larger is bet on it.

**Phase 4 — raise the bar to §5 across the roster.** The long tail. Order by
where a variant matrix earns most: Button, Card, Tree, Select, Dropdown,
Navigation Menu, the form controls. Then wire visual regression, once there
are stories worth baselining.

**Phase 5 — retire the kitchen-sink.** Only after §7.1 and §7.2 are both
built and green. Port the 8 e2e specs onto story URLs, rewire
`e2e-carousel.yml`, move the phone-QA path in `deploy-docs-site.yml`, then
delete.

## 7. What must not be lost

### 7.1 The published-distribution check (replaces kitchen-sink's real job)

A new CI job, and arguably better than what it replaces because it starts
from zero rather than from a maintained app:

1. Install the **published** `primitiv-ui` CLI (not a local build).
2. Scaffold a bare Vite + React app in a temp dir.
3. `primitiv init --yes`, `primitiv add --all`, `primitiv tokens`.
4. `tsc --noEmit` and `vite build`.

This proves the published package, the CLI's copy path, the embedded
registry and the token emitter all agree — the four things the kitchen-sink
proved implicitly. **It must exist and be green before Phase 5 deletes the
kitchen-sink**, not after.

### 7.2 The fourth copy of the registry surface, and its drift guard

Storybook needs its own `primitiv add`-installed `src/components/` and its
own emitted `tokens.css`, exactly as the kitchen-sink and docs site each
have. There is precedent for getting this wrong: the docs-site token copy
was added *without* a drift guard and went stale immediately, which is why
`token-drift.yml` exists. **Extend `token-drift.yml` and
`pnpm qa:stylesheets` to cover `apps/storybook` in the same commit that
creates it.** (This copy goes away again at Phase 5, when kitchen-sink's
does — net copies after the migration: unchanged.)

### 7.3 The picker's test harness

Wherever the OKLCH picker lands, its 16 test files and 100% threshold travel
with it. Note that `ci.yml` does **not** currently run
`pnpm --filter workbench qa:units` — the picker's coverage is discipline,
not a gate. Rehoming it is a chance to fix that; say so explicitly rather
than silently preserving the gap.

## 8. Open decisions

Each needs a human call. Recommendations given; none is settled.

### 8.1 Where does the OKLCH picker live?

- **(a) A `lab/` section inside Storybook** — *recommended*. It is a
  component with a real controlled API, and a component showcase is a
  reasonable home. Cost: `apps/storybook` inherits `harmoni-wasm` and
  `vite-plugin-wasm`, so the Storybook build depends on a wasm-pack step
  (already in `ci.yml` for other reasons).
- **(b) Its own small `apps/color-lab`.** Keeps Storybook dependency-light
  and the picker's build concerns isolated. Cost: a new app, against the
  spirit of consolidating surfaces.

Note the picker is also being ported into the Harmoni plugin (RFC 0010
Phase 5, private repo). Neither option blocks that.

### 8.2 Headless story coverage — all of them, or only where it earns it?

§4 recommends "only where the primitive has behaviour worth showing in
isolation". The alternative is all ~47 for symmetry. Recommend the former:
a headless story for a component whose primitive is a bare `<div>` teaches
nothing the docs site does not already say better.

### 8.3 Does Storybook deploy publicly?

The kitchen-sink is public today at `/primitiv/kitchen-sink/`. Storybook
could take that path, or stay local-only / behind the org. Recommend
**public at `/primitiv/storybook/`**, same manual-dispatch workflow —
phone QA is a real use, and a public Storybook is a normal thing for a
design system to have.

### 8.4 Visual regression — Chromatic, or self-hosted snapshots?

Deferred to Phase 4 deliberately: it is meaningless before there are stories
worth baselining, and Chromatic is a paid dependency decision that should be
made with real story counts in hand.

## 9. Documentation debt

Not incidental — roughly a dozen files, and easy to forget until an agent
follows a stale instruction.

- **`CLAUDE.md`** — the definition-of-done requires a kitchen-sink example
  per new component, and separately records the 2026-07-25 "examples live in
  the kitchen-sink, not the workbench" decision. Both are superseded by this
  RFC and must be amended in the commit that lands Phase 3.
- **`.claude/skills/workbench-examples/`** — deleted at Phase 3.
- **`.claude/skills/carousel-variant/`** — its entire iteration loop is
  kitchen-sink-based; rewrite at Phase 5.
- Also reference one or both apps: `new-registry-component`,
  `registry-stylesheet-conventions`, `carousel-infinite-loop-engine`,
  `docs-site-component-page`, `docs-site-planning`, `sandbox-gotchas`,
  `figma-bridge-token-sync`, `rust-wasm-workflow`, `tweak-component`.
- A new **`storybook-story`** skill should replace `workbench-examples`,
  carrying the §5 bar as its checklist.

## 10. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Storybook's Vite builder does not support Vite 8 | **High** — blocks everything | Phase 0 spike, before any app exists |
| Phase 4 stalls half-done, leaving two half-surfaces | High | Phase 3 deletes the workbench *before* Phase 4 starts, so the win is banked early |
| Kitchen-sink deleted before §7.1 exists | High — silent loss of the only distribution check | Phase 5 gated on §7.1 being green |
| Storybook's `src/components/` drifts from the registry | Medium | Extend `token-drift.yml` + `qa:stylesheets` in the creating commit (§7.2) |
| Story count grows without the §5 bar being met | Medium | The `storybook-story` skill carries the checklist |

## 11. Facts verified while scoping this

Recorded so the next session does not re-derive them.

- 63 registry components (`registry/components/`); ~47 headless component
  directories (`packages/react/src/`).
- `apps/docs-site` — 38 of 63 pages live, 42 spec files, all using
  `InteractiveExample`; only `button.tsx` imports from `next/*`.
- `scripts/docs-data/` — 43 `*.docs.json`, gated by `pnpm qa:docs-data`.
- `apps/kitchen-sink/src/App.tsx` is 5,075 lines; 8 Playwright specs in
  `e2e/`.
- `apps/workbench` — 43 example page directories; `playwright.config.ts`
  points at a non-existent `./tests`, so root `test:e2e` / `test:full` are
  vacuous.
- `ci.yml` ends with a "Build workbench" step; it does **not** run the
  workbench's own vitest suite.
- `pnpm-workspace.yaml` excludes `apps/kitchen-sink` and `apps/docs-site`
  only; every other app is a member.
- No component in `packages/react/src` accepts a `density` prop; density is
  purely the inherited `data-density` attribute (RFC 0009), default
  **comfortable**.
- `size` is a contract modifier on 52 of 63 registry components, always
  declared at the contract root — but Select's contract root *is*
  `Select.Trigger`, and `confirm-dialog` / `drawer` carry a `size` React prop
  with no contract modifier.
- `packages/react/src/Portal/Portal.tsx` portals to `document.body` by
  default, which is what makes §4.4's wrapper-div trap real.
