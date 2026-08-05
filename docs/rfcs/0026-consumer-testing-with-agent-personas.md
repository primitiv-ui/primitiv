# RFC 0026 — Consumer testing with agent personas

> **Status:** Draft — proposed
> **Author:** Claude, with architectural drafting
> **Date:** 2026-08-01
> **Builds on:** RFC 0004 (consumption/styling contract — what a consumer is
> actually bound by: root class + modifiers + `data-*` + `--primitiv-*`),
> RFC 0005 (the CLI — the only sanctioned install path this RFC tests), RFC
> 0021 (composite components — 52 registry surfaces as of this writing), RFC
> 0022 (layout primitives — Box/Stack/Spacer/Center/AspectRatio landed,
> **Container/Grid not built**), RFC 0025 (responsive breakpoints — **no
> breakpoint scale exists**), RFC 0020 (agent manifest & MCP server — a
> different kind of "agent as consumer" work; that RFC makes Primitiv easier
> for an agent to *query*, this one measures how an agent fares *without*
> that yet, using only the CLI + published docs).
> **Prompted by:** a proposal to stress-test Primitiv's real-world
> usefulness by having AI agents role-play distinct consumer profiles,
> building small showcase sites under hard constraints, at the current
> release (v0.1.29).

---

## 1. Why this exists

Primitiv's component inventory is broad now — 43 headless components in
`packages/react`, 52 registry (styled, copy-in) surfaces, three token
formats, a v1-feature-complete CLI. Every one of those was validated the
same way: an agent (usually Claude, in this repo, with full context) built
it, wired its tokens, and shipped it. That is **inside-out** validation —
the same mind that designed the token architecture is also the one
confirming it's usable, with the CLAUDE.md file, every skill, and the
source tree sitting right there for reference.

Nothing has yet validated Primitiv **outside-in**: what happens when a
developer who has never seen this repo, who only has the published npm/JSR
packages, the CLI binary, and whatever README/`--help` text ships with
them, tries to build something real? That is a categorically different
test, and the risk of skipping it is concrete — RFC 0022 §4 already
flagged that `Container`/`Grid` are missing, but nobody has watched an
actual build attempt hit that hole and improvise around it. Component
count, coverage-table checkmarks, and 100%-coverage test suites all measure
"does the system do what we told it to." They cannot measure "was it
findable, was it obvious, did the constraints make sense from outside."

This RFC proposes a repeatable evaluation program: a shared **brief** (a
three-page showcase site, dense-and-sparse layouts, real images, all
constraints from the current-state token/component system) instantiated
with different **consumer-profile addenda**, run by an agent under fixed
rules, producing a **friction log** and a built artifact that a human (or a
separate reviewing agent with a browser) audits. It is explicitly a
benchmark, not a one-off — see §8 on cadence.

## 2. What this is not

- **Not a substitute for the existing 100%-coverage TDD discipline.**
  Every component already ships correct per its own contract. This test is
  about *composition*, *findability*, and *ergonomics* across components,
  not correctness of any one of them.
- **Not a load-bearing gate on shipping.** Nothing in the roadmap should
  block on this running first. It's diagnostic, feeding the backlog with
  real evidence — closer to a usability study than a release checklist.
- **Not another kitchen-sink.** `apps/kitchen-sink` already proves every
  registry component *can* render correctly in isolation, hand-synced by
  someone who already knows the answer. This test measures whether an
  outsider, composing components toward their *own* goal (a fictional
  business's website, not a component gallery), can get there — see §4 on
  why "showcase all components" is in tension with that goal.

## 3. The shared brief

One canonical brief, reused verbatim across every profile, so results are
comparable. Profile-specific rules layer on top (§5) rather than rewriting
the brief per run.

**The task.** You are a developer building a three-page marketing/showcase
website for a fictional business of your choosing (not a real company, no
real logos/trademarks/photography — use placeholder or generated imagery).
Three pages, each with real dummy content (not lorem ipsum for headings —
write copy that reads like a real page). Layouts must mix at least one
dense, information-heavy section (e.g. a pricing table, a feature grid, a
data-dense footer) with at least one sparse, high-negative-space section
(e.g. a hero, a testimonial spread) — both patterns should appear across
the three pages, not necessarily one of each per page. Use images to
enhance the UI as a real site would (hero art, avatars, product/feature
shots) — see §6 for the placeholder-imagery rule.

**Fixed constraints, every profile:**

- Primitiv is pinned at **v0.1.29** for this run (record the pinned version
  in the report regardless — see §8, this will drift on every re-run).
- Installation is **CLI-only** — `npm create vite@latest` (or the
  profile's equivalent scaffold) then the `primitiv` CLI for everything
  Primitiv-related. No manual copy-pasting component source from GitHub,
  no reading `packages/react` or `registry/components` source directly.
- Typography is **Khand + Asta Sans only**, loaded via a Google Fonts
  `<link>` in the generated `index.html` — this mirrors Primitiv's own
  default type tokens (`heading/*` rides Khand, `body/*` rides Asta Sans),
  so it isn't an arbitrary restriction, it's "use the system's actual
  default type," which most consumers who don't override the theme would
  do anyway.
- Styling is **token-bound only**. Whatever base styles, component
  styles, and `--primitiv-*` custom properties are available to the
  profile in question (this varies — see §5) are the *only* source of
  visual values. No raw hex colours, no raw px/rem font-sizes or spacing
  that isn't resolving a Primitiv token, no arbitrary custom CSS beyond
  structural layout (flex/grid mechanics, not colour/type/spacing values).
- Layout composition (beyond what registry component styles give for
  free) uses `Stack`/`Center`/`Box`/`Spacer`/`AspectRatio` where available
  for the profile. **`Container` and `Grid` do not exist yet** (RFC 0022
  §4, RFC 0025) — see §7 for why this is being run anyway and how to keep
  that gap from swallowing the rest of the signal.
- Every component genuinely useful to the site's actual content should be
  used — see §4 for why "all 95 components" is the wrong target.

## 4. Critique — "showcase all the components" is the wrong instruction

The original framing asked for three pages that "aim to showcase all
components." Flagging this because it's the one instruction most likely to
quietly wreck the experiment: a single fictional business's three-page site
has a natural component budget. A pricing page does not need a Tree view.
Forcing full coverage onto one site produces exactly the failure mode this
RFC exists to avoid — a contrived layout optimised for checkbox coverage,
not for the site's own goal, which tells you nothing about whether a real
developer would reach for Primitiv naturally.

**Recommendation:** coverage is a property of the *program* (all profiles
across all runs, tracked centrally — §5), not a requirement on any single
site. Replace "showcase all components" with two things: (a) a content
brief specific enough to demand real breadth naturally — e.g. a product
site needs nav, hero, feature grid, pricing/comparison table, testimonials,
FAQ (accordion), a contact/signup form, and a footer, which already pulls
in 20+ components without anyone forcing it — and (b) a soft target ("use
at least 25 distinct components meaningfully, prioritising composites and
layout primitives over decorative repeats of the same Button") that the
agent aims for but does not contort the design to hit. If a profile's site
naturally wants a component that isn't installed, install it — that's
signal, not scope creep.

## 5. Consumer profiles

The three profiles in the proposal are a good starting set. Each is an
**addendum** to §3's shared brief, not a separate brief.

**Profile A — Greenfield, full styled system (shadcn-style).** Empty Vite
project. Install the whole registry surface for whatever components the
site needs, using the copy-in `styles.css`. Free to modify the copied
styles directly (that's the point of copy-in distribution, RFC 0004).
Tests: `primitiv init` and `add` ergonomics, the raw copy-in developer
experience, how discoverable the token system is once it's sitting in the
consumer's own repo as editable files.

**Profile B — Brownfield, headless-only, existing design system.** *Needs
a real fixture, not an imagined one* — see the critique below.

**Profile C — Tailwind-powered project.** Either registry styles enhanced
with Tailwind utilities, or headless components styled purely with
Tailwind. Tests a real open architecture question: registry stylesheets
declare an explicit `@layer primitiv` stack (RFC 0008 §3.1); Tailwind v4
also owns `@layer` (`@layer theme, base, components, utilities`). Whether
these two layer stacks compose predictably, or fight over specificity and
cascade order, is not settled anywhere in the docs — this profile is the
first real test of it, and is higher-risk/higher-value than A or C reads
at first glance.

**Critique of Profile B as stated:** "an existing React project with an
already established app and router" is doing a lot of unstated work. If
the agent is simply told this in prose, it will most likely scaffold a
fresh app and mentally label it "existing," and the entire point of a
brownfield test — Primitiv's tokens/reset colliding with pre-existing CSS,
class-name collisions, cascade-layer interaction with a real competing
`@layer` or unlayered legacy stylesheet, an existing router's route
structure constraining where the three pages land — evaporates. **Fix:**
ship Profile B with a small, fixed starter fixture (a pre-built React +
React Router app, 2–3 existing pages, a deliberately unfashionable but
real existing CSS setup — e.g. plain BEM classes with a CSS reset of its
own, non-cascade-layered) that the agent is handed and told to *extend*,
not create. Without a real fixture, Profile B is not meaningfully
different from Profile A with the headless package instead of the
registry.

**A fourth profile worth adding, not in the original three:** a
**minimal-effort consumer** — the agent is told to get the site done as
fast as possible and explicitly discouraged from reading anything beyond
`primitiv init`'s interactive prompts and `--help` output (no READMEs, no
registry browsing beyond `list`). This is a different population than A–C:
most real adoption decisions get made in the first five minutes by someone
skimming, not someone who reads every doc before touching a keyboard. Not
required for the first run, but worth reserving RFC-number-wise as a
follow-on rather than folding it into A/B/C's scope.

## 6. Placeholder imagery and content

The brief calls for images "to enhance the UI like a real website." Two
rules, both currently unstated and worth pinning down before this runs:

- **No real brand names, logos, or scraped photography.** Fictional
  business, generated or licensed-placeholder imagery only (a placeholder
  image service keyed by seed/size, or images the agent generates itself
  if that capability is available in its environment). This is as much an
  IP-hygiene concern as an experiment-design one.
- **Copy is real prose, not lorem ipsum**, per §3 — lorem ipsum defeats
  the "dense vs. sparse" test, since real copy is what actually forces
  layout decisions (a testimonial's line length, a pricing tier's feature
  list length).

## 7. Critique — the layout-primitive gap will dominate this run, on purpose

`Container`/`Grid` are the two most reached-for components on any
marketing site (centred max-width column; responsive multi-column feature
grid) and neither exists (RFC 0022 §4, RFC 0025 §4). This is not a reason
to wait (see §8) — it is the single most valuable thing this first run
will surface, precisely because `Box` already exists as the designed
escape hatch (RFC 0022 §8: "no registry component writes inline styles,"
but a *consumer's own* wrapper CSS around `Box` is exactly the sanctioned
way out). Expect every profile to hand-roll a max-width container and a
CSS Grid/Flexbox multi-column layout with its own hand-written media
queries, because there is currently no other way to build a real site.

**The risk worth naming:** if this one gap generates the majority of the
friction log's volume, it will crowd out smaller, more specific findings
(a confusing prop name, an undocumented token, a `contract.json` gap) that
are individually cheaper to fix and might otherwise go unnoticed under the
noise of one big, already-known issue. **Mitigation:** the report template
(§9) must separate findings into "known gap, already tracked" (layout
responsiveness, Container/Grid, Toolbar/Menubar, Calendar/Date Picker —
anything already in `ROADMAP.md`) from "new finding" — so the reviewer can
skim past the former and focus on the latter, which is where this
experiment actually earns its cost.

## 8. Open question 1, answered — is now the right time?

**Run it now.** Waiting for `ROADMAP.md` to empty out is waiting for a
list that gets longer, not shorter — Toolbar, Menubar, Splitter, Calendar,
Date Picker, Command Palette, File Upload, and Stepper/Pagination/Data
Table are all still open, and new candidates keep surfacing as composites
land (Rating, Hover Card, Toast). There will never be a point where
"everything" is built. The value of running now, specifically:

- The CLI reached v1 feature-completeness and the registry crossed 50
  components very recently — this is the first point at which an
  outside-in test is even meaningful (a consumer test against a 10%-built
  library tells you nothing you don't already know).
- The API surface (props, token names, contract shapes) is still cheap to
  change. Every cycle this test is deferred is a cycle where more
  consumers (real ones, eventually) would be depending on whatever shape
  gets shipped in the meantime — better to find naming/ergonomics
  problems while `packages/react`/registry surfaces are still young.
- A missing-component finding from this test is a *stronger* signal for
  reprioritising `ROADMAP.md`'s backlog ordering than the current
  ordering, which is largely inferred from what's cheap to build next
  rather than from observed demand.

**Caveat, not a blocker:** brief the agent (and the report reviewer)
explicitly that hitting a genuine gap — a component that does not exist —
is an expected, valid, separately-logged outcome, not a failure of the
agent to find a workaround. Otherwise the agent will burn effort
contorting the design around a hole instead of reporting it cleanly, which
produces worse signal, not better.

**Recommend re-running** this same brief once RFC 0022 step 3
(Container/Grid) and RFC 0025 (breakpoints) land, specifically to see
whether the friction log's shape changes — that delta is itself a useful
measurement of whether those two RFCs closed the gap they were meant to.

## 9. Open question 2, answered — wait for breakpoints/Container/Grid?

**No — see §7.** Waiting turns a known, already-scoped gap (RFC 0022 §4
recommended non-responsive v1 for exactly this reason) into an unplanned
blocker on an unrelated experiment. Explicitly **permit** the agent to
hand-roll layout CSS (a container wrapper, a CSS Grid, its own media
queries) as the sanctioned escape hatch — and **require** every instance
of doing so to be logged as an escape-hatch event (§9's report template),
so the gap is captured as structured evidence instead of invisible
scaffolding. Do not ask the agent to avoid needing responsive layout
altogether (an unrealistic constraint no real site would accept) or to
build its own mini breakpoint system from scratch (out of scope for a
consumer, and would contaminate the "no arbitrary custom CSS values"
rule).

## 10. Open question 3, answered — what environment?

**Not `apps/` in this repo. A genuinely clean, separate environment**, and
this is close to a hard requirement rather than a preference:

- **`CLAUDE.md` leakage.** This file is loaded into every session in this
  repo and tells the agent about internal RFC numbers, roadmap state,
  token architecture, and the skills that encode "how we already build
  things here." A real consumer has none of this. An agent that can see
  it will consciously or unconsciously reach for insider shortcuts (e.g.
  recalling that Container/Grid don't exist and pre-emptively avoiding
  needing them, rather than discovering that the hard way like a real
  consumer would) — which quietly invalidates the entire premise of an
  outside-in test.
- **`apps/kitchen-sink` is the wrong reference environment for the
  opposite reason it's the right one for demos.** Its `vite.config.ts`
  deliberately aliases `@primitiv-ui/react`/`@primitiv-ui/icons` to
  **workspace source**, not the published packages, specifically so
  unreleased work can be exercised before a version bump. That is exactly
  what this test must *not* do — it needs to hit the real published
  npm/JSR packages and the real embedded-registry CLI binary, warts
  (including any embedded-registry-vs-published-version drift, a real
  gotcha called out elsewhere in this repo's own notes) and all.
- **Shared tooling contamination.** An in-repo app risks inheriting root
  `pnpm-workspace.yaml` hoisting, a shared lockfile, or repo-level
  `tsconfig`/`eslint` conventions a real greenfield consumer would never
  have.

**Recommendation:** run each profile as a **fresh agent session in an
environment with no `primitiv-ui/primitiv` source attached at all** — a
throwaway Claude Code Remote environment with no repo, or at minimum a
brand-new directory entirely outside this checkout with only outbound
network access to npm/JSR/GitHub-raw (whatever the CLI's `HttpsRegistry`
adapter needs) and no filesystem visibility into this repo. If run via
this same tool surface, that means a separate `environment_id`
(`list_environments`/a fresh session), not a worktree of this repo — a
worktree still has this file at its root. The agent driving each profile
should be given only: the brief (§3 + its profile addendum), a Vite/React
starting point appropriate to the profile, and the same public-facing
material a real consumer would find (repo README, package READMEs,
`primitiv --help`, `primitiv list`) — nothing else.

## 11. Additional open questions this needs before it can run

Beyond the three the proposal already raised:

1. **Self-report is not evidence.** The building agent's own claim that
   "everything works" cannot be trusted at face value — this repo's own
   history has repeatedly found real bugs only via an actual rendered
   screenshot (RFC 0022 §9's `AspectRatio` bug survived three wrong
   diagnoses until someone measured it in a real browser). **This
   environment has Chromium/Playwright pre-installed**, so there is no
   excuse to skip it: require the building agent (or, better, a
   *separate* reviewing agent that did not write the code) to screenshot
   all three pages at 2–3 viewport widths and sanity-check them visually
   before the run is marked complete.
2. **Determinism.** Agent behaviour is stochastic. A single run per
   profile cannot distinguish "Primitiv has a real ergonomics problem
   here" from "this particular run happened to go down an odd path."
   Recommend at least 2 runs per profile before treating any single
   finding as a systemic issue rather than noise.
3. **Fixed budget.** Without a turn/time cap, an agent can paper over
   friction by simply trying more things until something works, which
   under-reports the friction a time-boxed real developer would feel.
   Set an explicit budget (e.g. a fixed number of tool calls or wall-clock
   time) per run, recorded in the report, and comparable across profiles.
4. **Model/harness fixation.** Record which model and harness drove each
   run. If findings differ meaningfully across models, that's worth
   knowing rather than averaging away; if only one model is used for the
   first pass, say so explicitly rather than implying the results
   generalise.
5. **Framing tension: rich signal vs. natural behaviour.** Explicitly
   asking the agent to "critique" or "log friction" risks performative
   complaint-generation (an agent primed to find problems will find
   problems, real developers under a deadline often silently work around
   something and never mention it). Prefer framing the logging
   requirement as ordinary engineering diligence — "keep a running
   `NOTES.md` of any decision made because the obvious approach didn't
   work" — over "please evaluate this design system," to keep the
   artifact closer to what a real project would produce.
6. **Escape-hatch rate as the headline metric.** Of everything this test
   could measure, the single most decision-useful number is *how often*
   the agent had to step outside the token system (raw hex/px, ad hoc
   CSS, a hand-rolled layout primitive) versus how often the system had
   an answer. Make this a required, explicitly-counted field in the
   report (§12), not something inferred after the fact from a diff.

## 12. Report template

Every run produces, alongside the built site:

- **Run metadata** — profile, Primitiv version, model/harness, date,
  environment description, turn/time budget and actual usage.
- **Escape-hatch log** — every raw value or hand-rolled CSS construct used
  outside a Primitiv token/component, with a one-line reason, tagged
  `known-gap` (already in `ROADMAP.md`/an open RFC) or `new-finding`.
- **Missing-component log** — anything the site wanted that does not
  exist, same `known-gap`/`new-finding` tagging.
- **Friction notes** — anything that took longer than expected, any
  README/contract ambiguity, any prop/token name that misled — framed per
  §11.5, as project notes rather than a review.
- **Component coverage** — the list of components actually used
  meaningfully (not just installed), against the soft target from §4.
- **Screenshots** — all three pages, 2–3 viewport widths, per §11.1.
- **Reviewer pass** — a second, independent look (human or a fresh agent
  session with no knowledge of how the site was built) confirming the
  screenshots match the friction log's claims and flagging anything the
  builder missed or over/under-stated.

## 13. Suggested sequencing

1. Settle this RFC's open questions (§10's environment approach in
   particular needs a concrete decision on tooling before anything runs)
   — done in §14–§16.
2. Author `docs/consumer-testing/brief.md` + the per-profile addenda
   (§15) and provision the run environments (§14).
3. Build Profile B's brownfield fixture (§5, §16) — the one piece of prep
   work that doesn't yet exist.
4. Run Profile A first (cheapest, fewest moving parts) as a dry run of the
   process itself — report template, screenshot pass, escape-hatch
   logging — before committing to B and C, which are more expensive to
   set up.
5. Run B and C.
6. Synthesise across all three into one cross-profile findings doc, feed
   concrete items back into `ROADMAP.md` (tagged with which run surfaced
   them) and this RFC's status updated with the outcome.
7. Re-run (§8) once Container/Grid/breakpoints land, to measure the delta.

## 14. Environment & tooling — the concrete decision

§10 settled *what kind* of environment this needs; here's the mechanism.

- **One dedicated, bare environment per profile**, containing no
  `primitiv-ui/primitiv` source, no `CLAUDE.md`, no skills — created by the
  operator (not the test agent) before the run starts. Concretely, a fresh
  Claude Code Remote environment with no repository attached, or
  equivalently isolated infrastructure if that's unavailable. The
  non-negotiable invariant, regardless of backing infra: **the session
  driving a profile has never had this repo in its context.** A worktree
  of this checkout does not satisfy that — this file would still sit at
  its root. A subagent spawned from *this* conversation doesn't either —
  it inherits this session's ambient repo attachment. It has to be a
  genuinely fresh top-level session.
- **The test agent's first actions inside that environment** are the
  scaffold command appropriate to its profile (`npm create vite@latest`
  for A/C; Profile B starts from its pre-seeded fixture, never
  self-scaffolded — see §16) followed by the CLI, installed and pinned
  exactly: `npm install -D primitiv-ui@0.1.29` (or the profile's package
  manager equivalent), not a floating `^0.1.29` that could silently drift
  mid-run.
- **Network egress** from that environment needs to reach
  `registry.npmjs.org`, `jsr.io`, GitHub raw (the CLI's `HttpsRegistry`
  fallback path, RFC 0005 §6) and Google Fonts. It should *not* be able to
  reach `github.com/primitiv-ui/primitiv` at all — if the environment's
  default credentials happen to grant that, revoke it explicitly rather
  than relying on the agent not thinking to look.
- **The reviewer pass (§11.1) runs in its own fresh session too**, handed
  only the finished site (pulled out of the throwaway environment first,
  since Claude Code Remote environments are reclaimed after inactivity) —
  not the builder's `NOTES.md`, not told what to expect. It renders and
  screenshots cold, then its findings are diffed against the builder's own
  report. A reviewer primed by the builder's narrative isn't independent.
- **Reuse across runs of the same profile is fine**, if it saves
  provisioning cost — reuse across *different* profiles, or of an
  environment a prior run already touched, is not; that's the same
  contamination risk as running in-repo, just quieter.

## 15. Agent preparation — brief authoring & prompt strategy

Yes — a tailored prompt per profile, but **composed, not freehand**.
Freehand risks the shared portion silently drifting between profiles,
which would quietly break comparability the same way a different brand
hex per profile would (§16). Concretely:

- A new `docs/consumer-testing/` folder holds `brief.md` (the shared
  content from §3 — task, dense/sparse requirement, imagery rule,
  token-only-styling rule, completion criteria, budget) plus one addendum
  per profile (`profile-a-greenfield.md`, `profile-b-brownfield.md`,
  `profile-c-tailwind.md`) and `report-template.md` (§12). `brief.md` is
  the single source of truth for everything that must stay identical
  across runs.
- **The literal first message to each fresh session is `brief.md` +
  that profile's addendum, concatenated verbatim** — scripted, not
  retyped by hand, specifically so the shared portion is byte-identical
  across every profile. That identity is what makes a difference in the
  friction logs attributable to the *profile* rather than to incidental
  wording drift.
- **Framing settles the §11.5 tension directly: this reads as an ordinary
  client brief, never as an evaluation.** `brief.md` opens as "you've been
  hired to build a 3-page site for `<business>`," and the diligence
  logging requirement is folded in as ordinary delivery hygiene — "keep a
  `NOTES.md` of any decision you made because the obvious approach didn't
  work, the way you would on a real project" — never "critique," "log
  friction," or "evaluate." Every mention of Primitiv-as-subject, RFC
  numbers, `ROADMAP.md`, or "this is a known gap" stays entirely on the
  operator side (this RFC, the report template) and never appears in
  agent-facing text. The agent should discover the Container/Grid absence
  itself, not be told about it in advance — telling it up front would be
  exactly the same contamination §10 rules out for CLAUDE.md, just moved
  into the prompt instead of the repo.
- **Completion criteria are explicit in `brief.md`** so the agent
  self-terminates rather than wandering: three pages built and rendering
  with no console errors, `NOTES.md` written, screenshots taken (the
  agent's own environment should also have Chromium/Playwright available
  for this, mirroring what this session already has) — a checklist the
  agent ticks off itself before ending its turn, not an open-ended "make
  it good."

## 16. Brand colour via `primitiv theme --brand`

Good addition, and it costs nothing to add — the CLI already does exactly
this. RFC 0005 documents `primitiv theme --brand <hex>` (and `init`'s
interactive brand prompt / non-interactive `--brand` flag): it runs the
Harmoni engine against a hex input and emits a **paired light + dark**
theme-token overrides layer (RFC 0005 D48), through the same dynamic
foreground wiring RFC 0003 built. That last part matters — nothing else in
this program exercises RFC 0002/0003's contrast-correct foreground
computation in a real, composed, multi-component page; this is a free
integration test riding along on top of the consumer-experience one.

Two decisions, both left open by "give each profile a brand colour":

- **Hold the hex constant across profiles that choose one freely**
  (Profile A, and Profile C if it goes the registry-styling route).
  Distinct colours per fictional business would read more naturally, but
  they introduce a real confound: a friction-log difference between two
  profiles could be the *hue* hitting a genuine harmoni-engine edge case
  rather than the *consumption profile* being tested, and the two would be
  indistinguishable after the fact. Reuse the exact hex RFC 0005's own
  worked example already uses, `#0a7755`, so the emitted token layer is
  identical and directly diffable across runs. Varying brand hue across
  runs is a legitimate follow-on experiment in its own right — it
  stress-tests the palette engine, not the consumer experience — but
  belongs in a separate program, not folded into this one.
- **Profile B doesn't get a free choice, on purpose.** A brownfield
  consumer already has a house brand; the interesting question isn't
  which hex the agent picks, it's whether it even tries to reconcile
  Primitiv's theme with the existing one, or leaves Primitiv unthemed and
  takes only headless behaviour. Bake a specific, *different* hex into
  Profile B's fixture (§5) as an established fact stated in its addendum
  ("the app's existing primary brand colour is `#…`"), and let the agent
  decide what to do with it — log the decision either way. The addendum
  must not itself suggest running `theme --brand`; that would hand the
  agent the answer to the thing being observed.

**Report template addition** (§12): the literal `theme`/`init --brand`
invocation, if any, and the emitted token diff, so a reviewer can check
whether the auto-paired dark values actually hold up once placed against
real Khand/Asta Sans copy in a dense layout — nothing has verified that in
a live composed page before, only in isolation. Where a theme was set
(Profiles A and, situationally, C), the brief should require the site's
light/dark toggle to actually be exercised at least once, specifically so
the auto-generated dark pairing gets a real visual check rather than
shipping unverified.

## 17. Build outcome — brief materials landed

`docs/consumer-testing/` now holds everything §15 scoped: `brief.md` (the
shared, agent-facing brief, worded per §15's framing rule — no mention of
Primitiv-as-subject, "critique," or known gaps), the three profile
addenda, `report-template.md` (operator-only, never shown to the building
agent), and Profile B's fixture app under `fixtures/profile-b-existing-app/`
(a small React + React Router site — one fully-built home page on plain,
unlayered, hardcoded-hex legacy CSS, two stub routes waiting to be built
out, brand colour `#c1440e` baked into the nav/hero/footer). The fixture
was smoke-tested (`npm install`, `tsc -b`, `vite build`) end to end before
being committed — it builds clean. `README.md` in that folder records the
agent-facing/operator-facing split and how to hand a run its materials.

One divergence from the draft worth flagging: §15 originally described
`report-template.md` as something "handed to the agent... not just to the
reviewer after the fact." Writing the actual file surfaced why that was
wrong — a structured template with fields like an escape-hatch log and
known-gap/new-finding tags is exactly the kind of framing §15's own
"never evaluate, always ordinary client brief" rule rules out. The
building agent gets only the informal `NOTES.md` instruction from
`brief.md`; `report-template.md` is reviewer-only, synthesising `NOTES.md`
after the fact rather than being filled in live. `README.md` states this
split explicitly so it doesn't drift back the other way.

Not yet done: no run has actually happened. §13's next step is executing
Profile A as the dry run.

## 18. Build outcome — scratch artifact repo provisioned

The §14/§16 scratch repo is live: `simonrevill/primitiv-consumer-testing`
(personal account, per the operator's choice — a `primitiv-ui`-org repo
was the discussed alternative if this hadn't worked out, see below). It
holds a seeded copy of everything under this repo's `docs/consumer-testing/`
(brief, profile addenda, report template, the Profile B fixture) and is
where each run's `runs/<profile>-<date>/` output — the builder's finished
site, `NOTES.md`, screenshots, and the reviewer's filled `report-template.md`
— will land.

**Source-of-truth convention, to avoid the two copies drifting apart:**
`docs/consumer-testing/` in *this* repo is canonical — it's versioned
alongside this RFC and reviewed the same way any other change here is.
The scratch repo is the operational copy a bare session actually attaches
to; it is not where `brief.md`/the addenda/the report template get edited.
Change the brief materials here first, then re-push the updated copy to
the scratch repo, mirroring the code-first-then-sync pattern this repo
already uses elsewhere (see the `figma-bridge-token-sync` skill for the
same shape of rule applied to tokens).

**One tooling quirk worth recording, not a design problem:** `add_repo`
against `simonrevill/primitiv-consumer-testing` failed repeatedly from
*this* long-running session (six attempts, including after the repo had
real content pushed, ruling out "empty repo" and "GitHub App installation"
as causes) but succeeded immediately from a fresh session — the same kind
every real builder/reviewer run will be. This session's GitHub scope
appears to have been pinned at creation and can't be widened after the
fact; it doesn't reflect anything about the target repo or account, and
doesn't affect §14's plan. Worth knowing if this resurfaces: don't assume
a repo-attachment failure in a long-running session generalises to fresh
ones — verify in a fresh session before concluding the repo itself is the
problem.
