# RFC 0027 — Accessibility verification with axe-core

> **Status:** Draft — proposed
> **Author:** Claude, with a measured spike (see §3)
> **Date:** 2026-08-10
> **Builds on:** the headless test suite (`packages/react`, vitest + jsdom,
> 100% lines/branches/functions/statements), the kitchen-sink Playwright
> harness (`apps/kitchen-sink/e2e`, added for RFC 0018's Carousel loop), the
> token pipeline (RFC 0001, `packages/tokens/src/*.json` → `primitiv-emit`),
> and the docs-site plan (`docs/docs-site-planning.md` §1.5 — generated, not
> hand-maintained, component data).

## 1. Why this exists

`@primitiv-ui/react` describes itself as "headless, accessible React
components built on the WAI-ARIA authoring patterns." Accessibility is the
package's central claim. Today that claim is verified **only** by
hand-written assertions — a test asserts `role="tab"` is present because
someone thought to assert it. That catches what we remembered; it cannot
catch what we didn't think of, and it cannot see anything about the
*rendered* result at all.

The gap is not theoretical. A one-day spike (§3) ran axe-core over a sample
of the library and over the kitchen-sink in a real browser, and found four
distinct real defects — including one that the Tree README's own canonical
example instructs consumers to reproduce, and one where a documented usage
example produces a WCAG 4.1.2 failure. None was caught by a suite at 100%
coverage with a 100% mutation-score ratchet on several components.

That is the precise argument for axe: coverage proves a line ran, mutation
proves it is asserted on, and **axe proves the assertion was the right one
to make**. It is a third, orthogonal axis, and it is the only one of the
three that knows the ARIA spec.

## 2. What axe can and cannot see, per layer

This is the crux of the design, so it is stated before the plan. axe-core is
one library, but it answers a *different* question in each environment, and
putting a check in the wrong layer produces either noise or false comfort.

| Layer | Environment | axe sees | axe is blind to |
|---|---|---|---|
| `packages/react` headless | vitest + **jsdom** | role validity, required parent/child roles, `aria-*` attribute validity, accessible names, id-reference integrity, nested-interactive, tri-state values | everything about *rendering*: colour contrast, focus visibility, target size, real geometry |
| Registry + kitchen-sink | **Playwright + real Chromium** | all of the above **plus** colour contrast (per theme, per density), focus indicators, scroll/overflow, target size | nothing structural — this is the strictly larger surface |
| Token layer | pure Node, no DOM | contrast of every declared semantic pair, before any component exists | whether a pair is ever actually used together |
| Docs site | Playwright over the built site | the docs' own chrome, heading order, link names, nav landmarks | the components, which are already covered above |

Two consequences fall out of this table and shape the whole plan:

**(a) Colour contrast does not belong in the headless layer.** jsdom has no
CSS, so axe returns `color-contrast` as *incomplete* on essentially every
element — measured, every single fragment in the spike. Worse, the headless
package ships zero styles by design, so there is nothing there to measure
even in principle. Contrast is a **token and registry** property, and it
must be checked where the pixels are.

**(b) Document-scoped rules must be switched off for fragment testing.** A
headless test renders a fragment into a bare `<div>`, so rules that reason
about a whole page — `region`, `landmark-one-main`, `page-has-heading-one`,
`html-has-lang`, `bypass`, `document-title` — fire on structurally correct
components. The spike confirmed this: an isolated Tooltip reports a
`region` violation purely because it is not inside a landmark. These are
real rules that matter on the docs site and in a consumer's app; they are
pure noise against a component fragment.

## 3. The spike, and what it found

All numbers below are measured in this sandbox, not estimated. axe-core
4.13.0; the headless runs used vitest's existing jsdom environment, the
browser run used the pre-installed Chromium via the existing kitchen-sink
Playwright config.

### 3.1 Feasibility and cost

axe-core runs in jsdom **with no shims**, against the suite's current setup
files. Per-invocation cost on a rendered component fragment was **15–45 ms**
(one 337 ms first-run warm-up for module init). At a budget of ~4 axe
assertions per component across 53 components, that is a few seconds added
to a suite that currently takes minutes — negligible.

There is no maintained vitest binding worth taking on: `vitest-axe` is at
0.1.0, last touched January 2025, and pins `axe-core@^4.4.2`. The spike used
`axe.run()` directly and it was ~10 lines. **Recommendation: depend on
`axe-core` alone and hand-roll the matcher**, consistent with how this repo
already treats `insta`, arg parsing, and the mutation stand-in.

### 3.2 Real defects found

**(1) `Slider` — documented usage produces an unnamed slider (WCAG 4.1.2,
serious).** `Slider.Thumb` is the `role="slider"` element and needs the
accessible name. `Slider.Root` does not forward `aria-label` to it. But
`packages/react/src/Slider/README.md` lines 13 and 59, and the `Slider.Root`
JSDoc example at `Slider.tsx:337`, all put `aria-label` on the **Root** — so
anyone copying the canonical example ships an unnamed slider. The
`Slider.Thumb` JSDoc (`Slider.tsx:249`) says the right thing, which is how
the inconsistency survived. Confirmed twice: in jsdom, and in the real
browser against the shipped kitchen-sink demo (`aria-input-field-name`, 2
nodes, both themes).

**(2) `Tree` — `role="tree"` with forbidden children (critical).** ARIA
permits only `treeitem`/`group` as children of `tree`.
`Tree.SelectionPath` renders a `<nav aria-label="Breadcrumb">`, and the Tree
README's own example (line 324) places it **inside** `<Tree.Root>`. axe
reports `aria-required-children` critical on both kitchen-sink tree demos.
This is a headless-library structural bug with a documented reproduction,
and it is exactly the class of thing a role-presence assertion cannot see —
every individual role is correct; the *composition* is not.

**(3) `MillerColumns` — `role="separator"` inside the tree container
(critical).** Same rule, same class of defect, different component.

**(4) A dangling `aria-controls` (critical).** The vertical `Stepper` demo
has a trigger whose `aria-controls` points at a panel id that is not in the
document — the inactive step's panel is unmounted. `aria-controls` must
reference an existing element.

### 3.3 Contrast: two independent measurements agree

A pure-Node audit resolving `palette.json` + `intent.json` aliases and
computing WCAG ratios found that **`action.primary.foreground.default` on
`action.primary.default`** (white on `brand.500`) is **4.09:1** — below the
4.5:1 AA threshold for normal text, in both themes. The browser sweep
independently reported the same number on the real primary Button label
(`4.09`, `#ebebeb` on `#236ce1`).

Two measurements from opposite directions agreeing is the strongest signal
in the spike: **the primary button — the most-used component in the system —
fails AA for its label text.** Also flagged, and real: `content.muted` on
`surface.subtle` at 3.34:1 (light) / 3.68:1 (dark), and `content.muted` on
`surface.default` at 4.20:1 in dark.

The full browser sweep of the kitchen-sink home page reported
**`color-contrast`: 33 nodes in light, 81 in dark**. The light/dark asymmetry
is itself a finding — dark mode is measurably weaker, which tracks with the
dark palette being generated rather than hand-tuned (see the
`dark-mode-palettes` skill).

*Honest caveat on the token audit:* a naive cross-product of `content.*` ×
`surface.*` also produced five sub-3:1 "failures" that are **not** bugs —
`content.inverse` on `surface.default`, and anything on `surface.overlay`
(which is the modal scrim, `neutral.900`, not a text background). A token
contrast gate is only as good as its pairing table, and that table has to be
hand-curated. This is the main reason §5 Phase 0 is scoped as "curate the
pairs" rather than "check everything."

## 4. Design decisions

**D1 — `axe-core` direct, no wrapper library.** §3.1. One dependency, a
local `expectNoAxeViolations(container, options?)` helper in
`packages/react/src/test/`, alongside the existing polyfills.

**D2 — One dedicated `*.a11y.test.tsx` per component, not axe sprinkled
through existing tests.** Keeps the cost bounded and predictable, keeps
existing suites readable, and makes the a11y surface greppable and
reviewable as a unit. It also makes D5's carve-out cleanly scoped to a
known set of files.

**D3 — A shared, explicit rule policy, defined once.** Headless runs disable
`color-contrast` (meaningless — §2a) and the six document-scoped rules
(§2b). The policy lives in one exported constant with a comment per
exclusion justifying it; a future reader must never wonder why a rule is
off. Nothing else is disabled globally — a per-test exclusion is allowed but
must carry an inline justification, the same bar the mutation allowlist's
disable comments already meet.

**D4 — Fixtures must be realistic, and this is a real trap.** The spike's
own `RadioGroup` fixture reported a critical `button-name` violation purely
because the fixture rendered an indicator with no label. A thin fixture
generates false positives that erode trust in the suite faster than no suite
at all. Each component's a11y test should render the composition from its
README's canonical example — which has the excellent side effect that
**the README example itself gets verified**, and is precisely what would
have caught defects (1) and (2).

**D5 — The a11y suite is a guard layer, explicitly carved out of the
pure-red-green rule. This needs a human decision.** `CLAUDE.md` working-style
rule 2 says a test that passes on first run must be deleted. Most axe
assertions will pass on first run, because most components are already
correct — that is the *point* of a regression guard, and it is in direct
conflict with a rule marked non-negotiable. The options:

  - **(a) Carve-out (recommended).** Add a clause to `CLAUDE.md`: axe
    assertions are a guard layer, exempt from red-green, in the same
    category as `qa:prop-collisions` and `qa:stylesheets` — both of which
    are already passing guards nobody writes red-first.
  - **(b) Strict red-green.** Only add an axe test for a component where
    axe currently *fails*; fix, then keep the test. Genuinely red-green,
    and it produces exactly four tests today (§3.2) — no regression net for
    the other 49 components. Defensible but much weaker.

  Recommendation: **(a)**, with the reasoning written into `CLAUDE.md` so
  it reads as a deliberate boundary rather than an erosion.

**D6 — Exclude a11y tests from Stryker.** They are slow relative to their
mutant-killing power and would inflate every scoped mutation run. Add
`"!src/**/*.a11y.test.tsx"` handling to `stryker.config.mjs`'s test glob.

**D7 — Contrast is fixed at the token layer, not patched per component.**
Every contrast finding in §3.3 is a token-pair problem. Fixing it in a
component stylesheet would break the single-source-of-truth the whole token
pipeline exists to provide, and would not fix Figma. Findings route to
`packages/tokens/src/*.json` and follow the `figma-bridge-token-sync` loop.

**D8 — Do not gate CI on contrast until the backlog is burned down.** There
are 33/81 failing nodes today. A gate turned on now blocks every PR on
pre-existing debt. The browser sweep lands first as **reporting only**, with
a ratcheted baseline; the gate flips on once the count reaches zero.
Structural rules (`aria-*`, names, roles) *are* gated from day one — the
spike found only four, all fixable within the same phase.

## 5. Plan

Ordered so that each phase is independently valuable and independently
shippable. Phases 1 and 2 are the core of the proposal; 0, 3 and 4 are
smaller and can be dropped without invalidating the rest.

### Phase 0 — Fix the four known defects (small, do first)

Independent of any tooling. Each is a genuine red-green cycle, because axe
currently fails on each:

1. `Slider` — correct the README examples and the `Slider.Root` JSDoc to put
   the accessible name on `Slider.Thumb`; consider whether `Root` should
   forward a name to a single thumb as a convenience (a design question, not
   a doc fix — flag it, don't decide it here).
2. `Tree` — decide where `SelectionPath` legitimately lives. It is a sibling
   of the tree, not a child of it; fix the README example and, if the DOM
   shape forces it, the component's rendered structure.
3. `MillerColumns` — the same `aria-required-children` question.
4. `Stepper` (registry) — the dangling `aria-controls`; either mount all
   panels or drop the attribute when the target is absent.

### Phase 1 — Headless a11y suite (`packages/react`)

The core of the proposal.

1. Add `axe-core` as a devDependency; add `src/test/axe.ts` with the
   `expectNoAxeViolations` helper and the D3 rule policy.
2. Add `packages/react/src/<Component>/__tests__/<Component>.a11y.test.tsx`
   per component, driven by the README's canonical composition (D4), plus
   the states that change the ARIA surface: open/closed, disabled, invalid,
   RTL, and each `orientation`. Roughly 3–5 assertions per component.
3. Roll out **alphabetically, a few components per commit** — this is 53
   components and one big-bang commit is unreviewable. Expect further
   findings; each one becomes its own red-green fix commit.
4. Wire `qa:a11y` into `packages/react`'s scripts and the CI `test` job.
5. Update `CLAUDE.md`'s definition-of-done: a new component ships with an
   a11y test. Update the `new-react-component` skill and the
   `/scaffold-component` command to emit the file.

### Phase 2 — Real-browser sweep over the kitchen-sink

Where contrast, focus and geometry actually get verified.

1. Add `@axe-core/playwright` to `apps/kitchen-sink` (note: it is outside
   the pnpm workspace and carries its own lockfile).
2. `e2e/a11y.spec.ts` sweeps the kitchen-sink **per theme × per density** —
   both axes are already driven by `document.documentElement.dataset`, so
   this is a loop, not new infrastructure.
3. Interaction states matter and static sweeps miss them: open every
   Dropdown/Modal/Select/Tooltip and re-run. An open menu is where the ARIA
   gets hard, and it is invisible to a page-load sweep.
4. Land as **reporting-only with a ratcheted baseline count** (D8);
   structural rules gate immediately.
5. Extend `.github/workflows/e2e-carousel.yml` into a general
   `e2e.yml`, or add a sibling workflow — the install/browser steps are
   already solved there.

### Phase 3 — Token-level contrast gate

Cheapest possible feedback, furthest upstream: a failing pair is caught
before a component is even built, and it is the one check that can run in
the Rust/emit pipeline where the tokens actually live.

1. Hand-curate the pairing table (D3's honest caveat — the naive
   cross-product is wrong).
2. Implement as a Node script under `scripts/` beside the existing
   `qa:*` guards, **or** in `primitiv-emit` as a Rust check. Rust is the
   better long-term home (it is where the token model already lives, and it
   would let `primitiv tokens` warn a consumer whose custom brand colour
   fails AA) — but it is more work, and the 100% lines/regions/functions
   gate applies. Recommend starting in Node, moving it to Rust if and when
   consumer-facing warnings become a goal.
3. Report against AA (4.5:1 text, 3:1 non-text) and note AAA distance.

### Phase 4 — Docs site

1. An axe sweep over the built VitePress output, as part of
   `deploy-docs.yml`. Catches docs-authoring regressions — heading order,
   link names, landmark structure — which are a different failure mode from
   the components and are otherwise entirely unchecked.
2. **The interesting part:** `docs-site-planning.md` §1.5 already commits to
   the docs site consuming *generated structured data* rather than
   hand-maintained tables. An axe result set is exactly that shape. A
   per-component "Accessibility" panel — the ARIA pattern implemented, the
   states verified, the axe rule-set it passes, generated from the Phase 1
   run — turns the test suite into a published, verifiable claim rather than
   a marketing sentence. That is a genuine differentiator against every
   headless library that asserts accessibility in prose, and it also feeds
   the planned "Accessibility commitments" Concepts page with something
   concrete.

## 6. What this explicitly does not do

- **It does not replace manual testing.** axe catches roughly 30–40% of WCAG
  issues by the project's own published figures. Screen-reader verification,
  keyboard-only walkthroughs, and zoom/reflow testing stay human work. This
  RFC should not be read as "accessibility: done."
- **It does not touch the workbench.** Per `CLAUDE.md`, it is a legacy
  surface. The kitchen-sink is the registry verification surface.
- **It does not address the Figma side.** A `figma_audit_component_accessibility`
  MCP tool exists and the contrast findings in §3.3 have direct Figma
  variable analogues, but keeping the Figma library in step is the
  `figma-bridge-token-sync` loop's job once Phase 3 fixes the token values.
- **It does not gate on contrast on day one** (D8).

## 7. Open questions

1. **D5 — the red-green carve-out.** The one genuinely blocking decision.
2. **Slider's API** — should `Slider.Root` forward an accessible name to a
   lone thumb, or is doc-only the right fix? Convenience versus an explicit,
   unambiguous one-name-per-thumb model.
3. **Is `brand.500` changing, or is the primary button's text?** The 4.09:1
   failure has two fixes with very different blast radii: darken the brand
   ramp step used for `action.primary.default` (changes the system's most
   visible colour), or accept that the label needs a heavier weight / larger
   size to qualify under the 3:1 large-text threshold (changes Button's
   type). This is a design decision, not a test decision.
4. **How far does the density axis go in Phase 2?** Four density modes × two
   themes × interaction states is a real runtime cost. Contrast is
   density-independent, but *font size* is not, and the AA threshold depends
   on font size — so dense mode can fail where comfortable passes. Probably
   worth the cost; worth measuring first.
