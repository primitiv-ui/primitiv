# Primitiv Docs Site — Content Plan

> **Status:** Planning, agreed 2026-09-02. Nothing built from it yet.
> **Scope:** The *words*. What each page argues, in what order, for whom.
> **Companion docs:** [`docs-site-planning.md`](./docs-site-planning.md)
> owns the site's architecture (the mode switch, the docs-data pipeline,
> the page template). [`voice-and-tone.md`](./voice-and-tone.md) owns how
> the sentences are written. This doc owns what they say.
> Page-by-page copy lands in its own file as it is written:
> [`docs-site-home-copy.md`](./docs-site-home-copy.md) ·
> [`docs-site-start-here-copy.md`](./docs-site-start-here-copy.md) ·
> [`docs-site-concepts-copy.md`](./docs-site-concepts-copy.md) ·
> [`docs-site-registry-cli-copy.md`](./docs-site-registry-cli-copy.md) ·
> [`docs-site-figma-copy.md`](./docs-site-figma-copy.md).
> Harmoni (`/figma/harmoni`) is the one page still unwritten — its
> scope needs agreeing first (§7.5).

---

## 0. Why this exists

`docs-site-planning.md` §1.1–§1.27 settled how the site *works* over
twenty-seven decisions. It settled almost nothing about what it *says* —
§3 records "visual design / theming of the site itself" as deliberately
deferred, and content went the same way by omission.

The result, as of this plan:

- **The home page is a sitemap, not a pitch.** Its four sections are
  Hero → Choose your path → Documentation map → Component block. The
  middle one is a nav list wearing a section's clothes; it argues
  nothing.
- **All twelve non-component nav links are dead.** `/#installation`,
  `/#what-primitiv-is`, `/#tokens`, `/#density`, `/#composition`,
  `/#accessibility`, `/#cli`, `/#cli-add`, `/#cli-tokens`, `/#harmoni`,
  `/#recipes`, `/#changelog`. None of those ids exists anywhere in
  `apps/docs-site/src`. The sidebar, the mobile drawer and the landing
  page's own Documentation map all point at them, on a deployed site.
- **The prose reads as machine-written**, for reasons now measured and
  fixed in `voice-and-tone.md`.

---

## 1. Decisions taken

| # | Decision | Consequence |
| --- | --- | --- |
| D1 | **Audience: the Radix / shadcn / Chakra crowd — designers and developers equally — plus a team lead or PM on the home page** | The home page works at two altitudes in one column: benefit claim, then the mechanism beneath it |
| D2 | **Component ledes: rewrite the shared `contract.json` description** | One source of truth stays one. 63 contracts to rewrite; the Figma component descriptions should follow |
| D3 | **Nine new pages this round; Guides and Changelog deferred** | Their two nav entries come out rather than pointing nowhere |
| D4 | **Concepts is five pages, not one** | Each carries its own diagram and its own TOC |
| D5 | **Hero leads on accessible-by-construction** | See §2.1, with the three alternates recorded |
| D6 | **A voice spec exists and is binding** | `voice-and-tone.md`, and a new axis in `character-brief.md` |
| D7 | **Every page's copy carries its illustration briefs inline, in position** | The artwork is made by a design model from these briefs, so a brief must be executable without reading the repo. Schema in `docs-site-home-copy.md` |

### 1.1 The competitive position the copy has to hold

The audience arrives comparing. The site currently never acknowledges
this, and it should — not by naming competitors on the page, but by
making sure every section answers the question the reader brought.

| They know | Their unanswered question | Which section answers it |
| --- | --- | --- |
| **Radix** — headless only; you still design everything | "Do I have to build the look myself again?" | §2.6 Three ways to build |
| **shadcn/ui** — copy-in components, no colour or density system | "How is this different from what I already use?" | §2.4 Harmoni, §2.5 Density |
| **Chakra** — a runtime styling engine you end up fighting | "What am I locked into?" | §2.7 You own the code |

Three things nobody in that set has, and they are the spine of the whole
site:

1. **Harmoni** — colour generated to be accessible by construction
2. **Density as one global dial** — four modes, so one system covers a
   dense enterprise dashboard and an editorial marketing page alike
3. **Figma and code built from the same tokens** — and the Figma library
   genuinely exists, at 60+ component sets

---

## 2. The home page

Ten sections. Each makes exactly one argument, and each names who it is
really for.

**Order changed 2026-09-02: density moved ahead of colour.** Density
answers *will this fit what we build?*; colour answers *is it any good?*.
Fit is the more fundamental adoption question, and it lands better
straight after the problem section.

Three sections carry moving artwork: **§2.4 is a live demo**, **§2.7 and
§2.9 are animations**. §2.5 is deliberately static — see below.

### 2.1 Hero — the promise

**For:** everyone. **Argument:** this produces good, accessible
interfaces without a team to maintain it.

```
INTERFACES THAT LOOK DESIGNED,
AND PROVE THEY'RE ACCESSIBLE.

Colour generated to hold its contrast. Spacing that scales on one
dial. 63 components your designers already have in Figma and your
developers already have in code.

[ Get started ]   [ Browse components ]

Open source · MIT · Copy the code into your repo and own it
```

**Why this claim and not another.** Three reasons, in order of weight:

1. **It is the only differentiated option.** "Saves you a year" is what
   every component library implies. "Stop rebuilding the same button" is
   a shadcn-sized claim that leaves Harmoni and density unsold.
   Accessible-*by-construction* is a claim almost nobody in the category
   can make honestly.
2. **It is already true and the code proves it.** The contrast floors
   live in Rust, `readable_step` derives the semantic roles rather than
   hand-picking them, and `crates/harmoni-core/tests/intent_roles.rs`
   pins them so they cannot drift. Every section below the hero can back
   the claim with something real.
3. **The character brief already says it.** Its first ethos principle
   reads *"harmonious and accessible by construction — palettes generated
   to hold their perceptual relationships and contrast, not hand-picked
   and spot-checked after the fact."* This is that sentence as a
   headline, so it is a description rather than a promise to live up to.

**Alternates, recorded so the decision stays revisitable.** The headline
is one string and the cheapest thing on the site to change.

| Alternate | Leads on | Why it lost |
| --- | --- | --- |
| *"Everything a design system needs. None of the year it takes to build one."* | Time and cost | Strongest lead trigger, least differentiated claim. Its time argument moves to §2.3, where it is earned rather than asserted |
| *"Your team keeps rebuilding the same button."* | A recognisable pain | Opens on a negative, and undersells the product to shadcn's size |
| *"The design system your team already agrees on."* | Designer/developer friction | Warmest, but says least about what this actually is |

> **Replaces** the current *"One design system. Three ways to build."* —
> a true sentence about the product's *shape*, which is packaging, not
> benefit. It survives as §2.6's heading, which is where it belongs.

### 2.2 Proof strip — cheap credibility

**For:** everyone. **Argument:** this is real and finished enough to
adopt.

A single row, no prose. Four or five figures, each verified before it
ships:

- **63 components** — in code and in Figma
- **4 density modes** — one attribute changes all of them
- **CSS, SCSS or Tailwind** — the tokens emit to all three
- **MIT** — engine and components both
- **100% test coverage** — lines, branches and functions

> Every number here needs re-verifying against the repo at build time,
> not copied from this plan. A stale proof strip is worse than none.

### 2.3 The problem — what goes wrong without this

**For:** the team lead. **Argument:** you are already paying for this,
just not in one place.

Four short paragraphs, each a symptom a lead recognises from their own
sprint board. Written at team level, not code level:

1. **Three developers build three different buttons.** Nobody meant to.
   There was no shared one on the day each was needed.
2. **The design file and the app drift apart.** The mockup says 16px, the
   build says 14px, and by the third release nobody trusts either.
3. **Accessibility becomes a panic before launch.** Contrast and keyboard
   support get audited at the end, when fixing them is most expensive.
4. **A rebrand costs a quarter.** Because the colours are spread across
   hundreds of files rather than derived from one.

This is where the deferred time-and-cost claim lands, in its last line:
*building the layer that fixes all four takes a team the better part of
a year. This is that layer.*

### 2.4 The same components, from dense dashboard to editorial page

**For:** everyone. **Moved ahead of colour 2026-09-02**, because it
answers a more fundamental adoption question: *will this fit what we
build?* comes before *is it any good?*. It also lands right after the
problem section, where a reader is most receptive to "here is a system
that covers your case".

**The claim is RANGE, not adjustability.** This is the distinction the
section turns on. "Spacing is configurable" is what a `size` prop does
and impresses nobody. What Primitiv actually offers is that one system
covers products as different as a **busy enterprise dashboard** and a
**large editorial section on a marketing site**, with no fork, no theme
and nothing to fight.

**Live demo — confirmed, and it ships (§7.1 closed).** Four radios above
a stage split into **two regions**: a data-dense operations region
(toolbar, table, badges) on the left, and an editorial region (heading,
prose, quote, button) on the right. Both driven by one dial. At Dense
the whole composition reads like an admin tool; at Spacious it reads
like a marketing page. Nothing in the markup changed.

The two regions are the design. A single scene at four densities says
*the spacing is adjustable*; two very different scenes on one control
says *this fits whatever you build* — which is the claim being made.

Three blocks of copy follow the demo:

1. **The mechanism** — one `data-density` attribute on an ancestor, and
   everything beneath responds: spacing, height, corner radius, type.
2. **It is not all-or-nothing** — density is inherited, so a dense table
   inside a roomy article is one attribute on the table's container.
   This is the flexibility claim at its strongest and the first draft
   missed it entirely.
3. **Why it holds together** — radius is *derived* from height
   (`radius = height × 0.1875`), so it follows density for free rather
   than being a fourth hand-maintained table. `DENSITY-02` draws it.

Deep link to `/concepts/density`.

### 2.5 Every swatch already knows what text colour goes on it

**For:** everyone. The single most differentiated section on the page.

**Revised 2026-09-02, and the revision made it stronger.** The section
was drafted as an interactive Harmoni demo — change a brand colour,
watch the ramp regenerate. That was wrong on two counts. **Harmoni is a
separate commercial product with its own site**, so demonstrating the
plugin here sends a reader toward something this page is not selling.
And a demo of a tool is weaker evidence than the tool's actual output.

**What the section shows instead: the real shipped palette as a proof
sheet.** Six ramps, ten steps each, with `Ag` on every swatch painted
in the foreground the engine paired with it, and the step number
beneath. This is the same specimen the plugin produces today, and it is
the thing itself rather than a demonstration of the thing.

Three consequences worth having:

1. **It is static.** No wasm in the browser, no engine dependency, no
   interaction to build. It removes the colour half of §7.1 entirely.
2. **The `swatch/*` Context tokens already exist** — `box`,
   `sample-size`, `sample-caption-size`, `radius`, `panel-cap` — authored
   for exactly this specimen and, so far, consumed by no code. The docs
   site would be their first consumer, which is dogfooding rather than
   new work.
3. **The claim is already gated in CI, and honestly phrased.**
   `crates/harmoni-core/tests/ramp_regression.rs` carries
   `every_ramp_keeps_an_accessible_foreground_on_every_step` (*"True
   today across all 100 shipped swatches"*), `no_ramp_greys_out`,
   `every_ramp_holds_its_hue_by_construction` and
   `no_ramp_collapses_two_steps_onto_one_colour`. The copy states what
   those tests assert and nothing more.

**Claim-and-proof pair**, per `voice-and-tone.md` §5:

> The letters on each colour below are not a design flourish. They are
> the actual text colour the engine chose for that swatch, and every one
> of them clears its contrast minimum.

**The precision point, so nobody quietly overclaims:** the 100-swatch
guarantee covers the **five generated ramps** (brand, success, warning,
danger, info) across both themes — `packages/tokens/harmoni-seeds.json`
is the manifest. **Neutral is not in it**; it comes from a different
part of the engine and is deliberately excluded. Showing neutral in the
sheet is right, since it is where most interface colour comes from. Any
caption extending the guard to it would be false.

**Harmoni is named, linked, and not demonstrated.** One short block
attributes the palette to it and points at its own site. Full copy and
both illustration briefs are in
[`docs-site-home-copy.md`](./docs-site-home-copy.md) §4.

### 2.6 Design and code from the same source

**For:** designers, and the lead who has watched handoff fail.

**Argument:** the Figma library is not a drawing of the components. Both
are built from the same tokens, so they cannot quietly disagree.

Side-by-side: a Figma frame and the rendered component, visibly
identical. Then the honest caveat, because trust is the point of this
section — two places the design file genuinely cannot match the web
(`Grid` is a wrap-based approximation, `Aspect Ratio` is fixed-pixel),
both already recorded in the Figma component descriptions.

Deep link to `/figma`.

### 2.7 The code is yours

**For:** the lead's risk question, and every developer burned by a
styling engine.

**Live demo.** Run `primitiv add button` and show the actual file that
lands in the repo — real, readable, editable code, not a dependency.

> There is no styling engine to fight and no upgrade that changes your
> buttons overnight. The component becomes a file in your project. Edit
> it, delete it, rewrite it. It is yours.

Then the nuance a developer will ask about immediately: behaviour and
accessibility can still come from the npm package, so you are not
forking the hard part. That is what §2.8 explains.

### 2.8 Three ways to build

**For:** the practitioner. This is the router into the docs, and the
current "Choose your path" section largely survives.

Keep the three cards and their install blocks. Change two things:

- **Demote it.** It is mechanism, not headline. It reads much better as
  the answer to "so how do I actually take this?" than as the page's
  opening claim.
- **Lead each card with who it is for**, not what it contains. *"You have
  a design system already and want the behaviour"* beats *"Behaviour,
  props and a11y only."*

### 2.9 Accessible by default, not by audit

**For:** everyone, and it closes the loop the hero opened.

Concrete commitments, not a badge:

- Every interactive component follows its WAI-ARIA pattern
- Keyboard support is part of the component, not an add-on
- Colour contrast is guaranteed by the engine that generates it
- Focus is always visible

Then the proof a developer will want: the behaviour layer is tested to
100% coverage and mutation-tested, so the keyboard model is not merely
covered but actually asserted on.

### 2.10 Close

One restatement of the hero claim in different words, and the same two
CTAs. Nothing new.

### 2.11 What gets deleted

**The Documentation map section.** It is a nav list, it argues nothing,
and every one of its links is currently dead. Its content belongs in the
footer, which is where readers look for a sitemap.

---

## 3. The nine new pages

All nine are real routes. Every one currently exists only as a dead
anchor. Guides and Changelog are deferred (D3) and **their nav entries
come out** — a missing entry is honest, a dead one is not.

### 3.1 `/start-here`

**Argument:** here is the whole product in five minutes, and here is
which door is yours.

Absorbs the dead `/#installation` anchor. Sections: what Primitiv is in
three sentences · which of the three paths fits you (a short decision
aid, not a quiz — `docs-site-planning.md` §1.3 already rejected the quiz)
· install it · render your first component · where to go next.

### 3.2 `/concepts/what-primitiv-is`

**Argument:** four things share one name; here is how they fit together.

Primitiv (the design system) · Harmoni (the colour engine inside it) ·
the registry and CLI (how you take the code) · the Figma library. Then
the piece that ties them: one set of tokens feeds all four.

**Needs a diagram.** This page is the reason the family is confusing
without one.

### 3.3 `/concepts/tokens`

**Argument:** change one value, and the right things change everywhere.

The three tiers, in plain English before jargon:

- **Palette** — the raw colours, generated by Harmoni
- **Intent** — what a colour is *for* (a surface, a border, text on a
  button). Light and dark are two modes of this tier
- **Context** — how big things are, per density mode

The rule that makes it work: only the Palette tier holds raw values.
Everything above it points at something else. That is why dark mode is a
mode swap rather than a second stylesheet.

Then: the three output formats, and how to change a token.

**Needs a diagram** — the three tiers with an arrow from one Palette
value out to the places it lands.

### 3.4 `/concepts/density`

**Argument:** proportion is a feature, not a preference.

Why four modes when most systems ship one. What actually changes (and
what does not). How to set it globally and per component. The
height-derived radius rule, because it is the clearest example of the
system deriving rather than hand-assigning.

**This page absorbs the boilerplate.** *"Sized xs–xl; `data-density`
scales each size further"* currently appears verbatim on 12 component
pages. It is deleted from all 12 and explained here once, per
`voice-and-tone.md` rule 6.

**Needs the live density demo** — the same one as §2.5, reused.

### 3.5 `/concepts/composition`

**Argument:** a few patterns repeat across every component, so learn
them once.

`asChild` and why it beats a `as` prop · controlled vs uncontrolled, in
plain English (*"do you want to hold the value yourself, or let the
component hold it?"*) · compound components and why parts are separate ·
the data attributes you can style against.

### 3.6 `/concepts/accessibility`

**Argument:** here is what we guarantee, and here is how you can check.

The commitments from §2.9, expanded. What is ours versus what is yours
(we cannot know your labels, your reading order, or your alt text). How
the guarantees are kept: the WAI-ARIA patterns followed, the contrast
floors in the engine, the test bar.

> **Note the existing debt.** The session handoff records an
> accessibility pass as deferred by the user until after the first
> build, and this page should not overclaim before it runs. Write the
> commitments; verify each before publishing.

### 3.7 `/registry-cli`

**Argument:** how the code gets into your project, and why it works that
way.

`primitiv add` · `primitiv tokens` · `primitiv theme` · `primitiv list` ·
`primitiv.json` and `primitiv.lock` · why a registry rather than a
package, and honestly when a package would be better.

### 3.8 `/figma`

**Argument:** the design library, and what it can and cannot promise.

What is in it. How it stays in step with the code. The two known
divergences (Grid, Aspect Ratio) stated plainly, because a designer who
finds them alone trusts the rest less.

### 3.9 `/figma/harmoni`

**Argument:** the colour engine, as a thing a designer can use in Figma.

**Care needed.** Harmoni's plugin lives in the private
`primitiv-ui/harmoni` repo and is a commercial product. This page is
public-facing product copy only — what it does and who it is for. No
implementation detail, no file layout, nothing licence-related. The
engine itself is MIT and public; the plugin is not.

---

## 4. Component pages

### 4.1 The lede rewrite (D2)

63 descriptions in `registry/components/*/contract.json`, rewritten to
`voice-and-tone.md`. That field is read by the docs site, the CLI and
the Figma component descriptions, so the rewrite lands in one place and
surfaces in three.

Measured starting point:

| Pattern | Count |
| --- | --- |
| Descriptions containing an em-dash | 52 / 63 |
| Carrying the identical density sentence | 12 / 63 |
| Opening with "Composes the…" | 6 / 63 |
| Containing a semicolon | 23 / 63 |

Worked example:

> **Before.** *"A small status/count indicator attached to another
> element or beside a heading. Read-only, never interactive. Four
> semantic tones × two treatments (a low-emphasis label chip, a
> high-emphasis counter chip), sized xs–xl; `data-density` scales each
> size further."*
>
> **After.** *"A small pill that shows status or a count. It sits beside
> something else and is never clickable."*

The detail that leaves the lede is not lost — tones and sizes are in the
props table directly below, and density moves to `/concepts/density`.

**Two rules for the rewrite:**

1. **The Figma component descriptions follow.** They read the same field
   and are the primary way an agent learns a component. Leaving them
   stale splits the source of truth D2 exists to keep whole.
2. **Architecture notes move, they do not vanish.** "Composes the
   headless X primitive", "over the headless Tabs", "the control is
   Input verbatim" all belong in the component README, where maintainers
   read them.

### 4.2 A new block: "When to use this"

No component page has one, and for a plain-English reader it is the most
valuable thing we can add. A short pair at the top of every page:

> **Use it when** — you need to flag state at a glance: Stable, Beta, 3
> unread.
>
> **Reach for something else when** — you want a plain label with no
> status (that is `Tag`), or something clickable (that is `Chip`).

63 short items. They live in **`contract.json`**, not in the docs-site
spec file — see §4.4 for why, and for the small amount that has to be
built to carry them.

**Why it earns its place:** it is the only block that tells a reader
*not* to use the component. It is also where the near-miss pairs get
disambiguated — Badge/Tag/Chip, Select/Combobox, Modal/Drawer/Popover,
Table/DataTable — which no props table can do.

### 4.3 The 21 pages that do not exist

42 of 63 are done. Remaining, by category:

| Category | Missing |
| --- | --- |
| Data Display | avatar, avatar-group, card, chip, data-table, table, tag |
| Disclosure | breadcrumb, breadcrumb-overflow, carousel, collapsible, pagination, stepper |
| Collections & Selection | combobox, listbox, miller-columns, tree |
| Overlays | confirm-dialog, context-menu |
| Navigation | navigation-menu |
| Buttons | split-button |

Procedure is unchanged and already cheap — see the
`docs-site-component-page` skill and the session handoff. This plan adds
only the "When to use this" block to each.

**Suggested order:** Data Display first (seven pages, and `card` and
`table` are among the most-searched components in any library), then
Collections, then Disclosure, then the three singletons.

---

### 4.4 How the generator picks all of this up

The finding that makes D2 cheap: **the lede pipeline already exists and
is already guarded.** Nothing needs building for the 63 rewrites.

```
registry/components/<id>/contract.json  ·  .description
        │
        ├─ extract-docs-data.mjs:524 ──→ scripts/docs-data/<id>.docs.json ──→ the page lede
        └─ sync-docs-data.mjs:131  ───→ scripts/docs-data/roster.json     ──→ the /components card
                                                    │
                                    both also copied to apps/docs-site/src/docs-data/
```

One edit, one command, and CI catches staleness:

```sh
node scripts/docs-data/sync-docs-data.mjs   # regenerate + copy both destinations
pnpm qa:docs-data                           # --check; fails if a committed file is behind
```

`stripInternalRefs` runs on the way through, so an RFC citation left in
a description is removed before it reaches a reader — no second,
reader-facing copy of the sentence is needed.

**Adding the "When to use this" field is safe.** Verified rather than
assumed: `crates/primitiv-emit/src/contract.rs:11` declares `Contract`
as a plain `#[derive(Debug, Deserialize)]` with **no
`#[serde(deny_unknown_fields)]`**, so serde ignores keys it does not
know. A new field in `contract.json` cannot break the CLI, the wrapper
generator, or the embedded registry.

That settles open question §7.4 in favour of `contract.json` over
`ComponentSpec`, on four counts:

1. **One edit per component, in one file.** The lede rewrite and the
   use/don't-use pair are the same act of thinking about a component.
   Splitting them across two files makes a 63-item pass materially more
   expensive.
2. **It rides the existing pipeline**, including the CI staleness guard.
   A `ComponentSpec` field has no guard at all.
3. **The CLI and any agent reading the registry get it too** — which is
   the §1.22 goal of making the docs agent-consumable, at no extra cost.
4. **It matches D2's logic**, which decided the same question the same
   way for the lede.

**What has to be built** — small, and all in one pass:

| Where | Change |
| --- | --- |
| `registry/components/*/contract.json` | New optional `"whenToUse": { "use": [...], "insteadOf": [...] }` |
| `scripts/docs-data/extract-docs-data.mjs` | Carry it onto `out`, through `stripInternalRefs` as `description` already is |
| `apps/docs-site/src/lib/docs-data.ts` | Add to the `ComponentDocs` type |
| `apps/docs-site/src/site/ComponentDocsPage.tsx` | Render beneath the header, above the Playground |
| `crates/primitiv-emit/src/contract.rs` | **Nothing.** Serde ignores it |

Keep the field **optional**, so it can land component by component
rather than as one 63-file commit, and so the 21 undocumented components
can gain a page before they gain the block.

## 5. Illustration and Figma work this creates

### 5.0 How the artwork gets made (D7)

The creative work is done by a design model (Fable 5.1) working from
written briefs, under two constraints: it builds from the real design
system assets, and it produces screenshots, diagrams and animations that
illustrate how the components and Harmoni actually behave.

That only works if the briefs are good. So **every page's copy document
carries its illustration briefs inline, at the exact point in the flow
where the artwork appears** — never collected in an appendix, because an
image's job is set by the sentence above it.

The brief schema is defined once, in
[`docs-site-home-copy.md`](./docs-site-home-copy.md), and every later
page reuses it. Fifteen fields, of which four do most of the work:

- **`rhetorical-job`** — the argument the image carries. Every other
  decision serves it, and a maker who has this can make good choices the
  brief did not anticipate.
- **`must-not`** — the failure modes. Negative constraints prevent more
  bad output than positive ones produce good output.
- **`craft-notes`** — what separates competent from outstanding. Usually
  one or two details that reward a second look.
- **`tokens`** — real token names, so nothing is approximated. Verified
  against `packages/tokens/src/*.json`; inventing a token name is a bug.

The home page has **ten briefs**, four of them live or animated. Expect a
similar density on the concept pages, which are the ones that most need
diagrams.

### 5.1 Figma frames



The existing landing wireframe (`Landing (desktop) — system build v2`,
node `1830:10331`) covers Hero, the three path cards, the Documentation
map and the component block. Against §2, that is **two of ten sections**.

| Needs designing | Note |
| --- | --- |
| §2.2 Proof strip | New. A figures row |
| §2.3 The problem | New. Four-item editorial block, no components exist for this shape |
| §2.4 Density section | New. An interactive demo has no Figma equivalent, so the frame specifies the two-region layout and draws all four density states |
| §2.5 Colour proof sheet | New. The EASIEST of the new sections to design: static, and its anatomy is already tokenised (`swatch/*`). Build it from the real palette in both themes |
| §2.6 Figma ↔ code | New. Side-by-side comparison |
| §2.7 You own the code | New. Terminal + resulting file |
| §2.9 Accessibility | New. Commitments list |
| §2.10 Close | New |
| §2.1 Hero | Exists; headline and sub change |
| §2.8 Three ways | Exists; card copy changes |

### 5.2 Landed: the home page design, with the gaps left open (2026-09-03)

Built on a new Figma page, **"Docs Site — Home (v3)"** — a separate page
from `Landing Page`, which keeps the superseded four-section v2 as a
reference rather than overwriting it.

One 1440 x 11,089 frame, `Intent=Dark` with `Palette` left on Light,
`Context=Comfortable`, ten section bands in the settled order with
alternating `surface/default` / `surface/subtle` grounds. A **Build
notes** panel sits beside it carrying the conventions, so the next
person needs no repo context.

**The ten briefs are in place as deliberate gaps.** Each is a dashed
frame named `⟦ ILLUSTRATION GAP · <ID> ⟧`, already at the aspect ratio
its brief specifies, showing its id, pixel size and rhetorical job:

| Gap | Size | Gap | Size |
| --- | --- | --- | --- |
| HERO-01 | 1200x750 | FIGMA-01 | 1200x600 |
| PROBLEM-01 | 1200x400 | CODE-01 | 1200x750 |
| DENSITY-01 | 1200x675 | PATHS-01 | 1200x480 |
| DENSITY-02 | 560x420 | A11Y-01 | 560x420 |
| COLOUR-01 | 1200x720 | COLOUR-02 | 560x420 |

Keep the id in the layer name — it is how finished artwork gets matched
back to its brief.

**Three build findings worth keeping.**

1. **On a HORIZONTAL frame, `primaryAxisSizingMode = "AUTO"` silently
   cancels a `layoutSizingHorizontal = "FILL"` set immediately before**,
   because the primary axis *is* the horizontal one. A wrap frame hugged
   to 2368px and overflowed the 1200 column; nothing errored. Use
   `layoutSizingHorizontal` / `layoutSizingVertical` and do not touch
   `primary`/`counterAxisSizingMode` afterwards. Same family as the
   `resize()` trap in `CLAUDE.md` gotcha 7.
2. **`counterAxisAlignItems` does not accept `"STRETCH"`** — it takes
   `MIN | MAX | CENTER | BASELINE`. To equalise card heights, fix the
   row's height and set each child to `layoutSizingVertical = "FILL"`.
3. **`figma.currentPage = page` throws under `documentAccess:
   dynamic-page`** — use `figma.setCurrentPageAsync(page)`. It threw as
   the last statement of an otherwise-successful script, so everything
   before it had already applied: the partial-apply hazard, reached
   through a new door.

**One deliberate deviation, recorded rather than hidden.** The section
bands and their content columns are **plain auto-layout frames**, not
`Box` / `Container` / `Stack` instances. All *content* uses real
components. §1.23 set a zero-anonymous-frames goal, and this trades it
away knowingly: scaffolding ten sections out of slot-bearing primitives
stacks four to five slot levels per section, and slot staleness
(gotchas 13, 21) is the most destructive failure mode in this file.
The drift risk §1.23 was guarding against is also lower here — these
bands are bespoke page furniture, not reusable components. Converting
later is mechanical, and worth doing once the layout is settled.

**Also needed, and not a landing frame:** a **prose page template**.
Nine content pages are about to be built and there is no wireframe for a
non-component content page anywhere in the file. The app shell exists
(from the component-page wireframe) but a page of prose, diagrams and
callouts does not. **Design this before the concept pages are built**,
or nine pages get invented ad hoc.

**Four diagrams**, each content in its own right:

1. The Primitiv family (§3.2)
2. The three token tiers (§3.3)
3. The density dial (§3.4)
4. The registry copy-in flow (§3.7)

Per `CLAUDE.md` working-style rule 9, the landing sections that compose
existing components go through Figma first. The new editorial shapes
(§2.3, §2.9) genuinely have no component precedent, so they are the ones
most likely to surface new tokens — which is exactly the case rule 9
exists for.

---

## 6. Build order

Sequenced so the voice is proven on a small surface before it is applied
to 70+ pages.

| Step | Work | Why here |
| --- | --- | --- |
| 1 | `voice-and-tone.md` + character-brief axis | ✅ **done** — everything downstream depends on it |
| 2 | This plan | ✅ **done** |
| 3 | Home page copy + its ten illustration briefs | ✅ **done** — `docs-site-home-copy.md`. Cheapest place to confirm the voice, and it sets the brief schema |
| 4 | Review the home copy | §7.1 is closed, so this is a read-through rather than a decision gate |
| 5 | **Figma: the home page design, with the ten briefs as deliberate gaps** | ✅ **done 2026-09-03** — page "Docs Site — Home (v3)". See §5.2 |
| 6 | Fable fills the ten gaps from the briefs | The gaps are already sized and labelled in place |
| 7 | Figma: the prose page template | Rule 9. Unblocks step 8, and nine pages get invented ad hoc without it |
| 8 | Build the home page in code | |
| 9a | Copy + briefs for eight of the nine content pages | ✅ **done** — Start Here, the five Concepts pages, Registry & CLI, Figma |
| 9b | Harmoni page copy | Blocked on §7.5 — what a public page may say about a commercial product in a private repo |
| 9c | Artwork for the ten content-page briefs, then build the pages | After the home page proves the pipeline |
| 10 | Remove the Guides + Changelog nav entries | Do it with step 8 so no link is ever dead |
| 11 | Rewrite 63 `contract.json` ledes + mirror to the Figma descriptions | No tooling needed (§4.4). Runs in parallel from step 4 |
| 12 | Build the `whenToUse` field (§4.4) and add it to the 42 existing pages | Small build, then a 42-item authoring pass |
| 13 | The 21 missing component pages | Largest chunk, least blocked |

Steps 11–13 are independent of 4–10 and can run alongside them.

**The one hard ordering constraint:** copy and its briefs are written
*before* any artwork, and the prose page template exists *before* the
nine content pages. Both exist because the expensive mistake in a
project this size is producing work that then has to be redone for
consistency.

---

## 6.0 Figma build status (2026-09-03)

The home page exists in Figma on page **"Docs Site — Home (v3)"** — not
built from this plan's script, but by an earlier pass working from the
same copy doc. This session added the three things its own build notes
listed as missing.

| Artefact | State |
| --- | --- |
| `Home — desktop (v3)` | 12 sections: header, the ten content sections, footer |
| `Home — mobile (v3)` | 390 wide, transformed from the desktop clone |
| `Build notes` | Updated in-canvas with what this pass changed |

**The header is cloned, not rebuilt**, from `Landing (desktop) — system
build v2`. Edit it there; a change made on the home page makes the two
drift, which is the thing cloning exists to prevent. It picked up
`Intent=Dark` automatically, because both frames set the same mode.

**The footer is new** and absorbs the old Documentation map section
(§2.11). Four link columns, real `Divider` and `Lockup` instances, type
bound inline to the Context variables like every other text node there.

**Three findings worth keeping:**

1. **Section frames are transparent; the root frame carries the dark
   fill.** Exporting a single section in isolation renders it against
   white and reads as broken — pale text on white, and a dark-theme
   lockup that vanishes entirely. Screenshot in canvas context
   (`get_screenshot`), not via `exportAsync` on the node.
2. **`mainComponent` returns null on the async plugin API**, so a
   variant-name check silently matches nothing. Four vertical `Divider`
   instances survived a first cleanup pass because of it, each stretched
   to full width as a grey slab. Match on the node's own name instead,
   or use `getMainComponentAsync()`.
3. **A cloned footer cannot be repaired into a mobile footer.** It
   carries desktop heights that clip its own columns once stacked, and
   three rounds of forcing `primaryAxisSizingMode` did not clear it.
   Rebuilding it natively at 390 worked first time. The generic
   clone-and-restack transform is right for prose sections and wrong for
   anything whose geometry was authored per-breakpoint.

**Dark-mode colour drift, found and partly fixed 2026-09-03.**
`content/muted` was rendering at 2.66:1 and the link family bottomed out
at 1.06:1, because Figma's dark Intent aliases the *light* palette ramp
and several roles pointed at the wrong half of it. Six aliases fixed;
about forty cosmetic divergences remain and cannot be re-aliased exactly.
Full account, including the durable mirror-family fix, in
[`dark-intent-figma-drift.md`](./dark-intent-figma-drift.md).

**Still open on the Figma side:** nothing from the list above. The mobile
footer runs 957px as a full sitemap and was **reviewed and kept flat** (an
accordion is not needed at this size).

### 6.0.1 Mobile nav and the layout audit (2026-09-03, later the same day)

**The mode switch is fixed, on both frames.** The landing frame read
*Headless* where §1.1 settled *Styled*. Fixing the source did **not** reach
the home page's cloned header — `followedSource` came back `false`, because a
clone captures its overrides at clone time. Both now read `React` / `Styled`.
Treat every cloned instance as a separate edit until proven otherwise.

**The mobile nav is a logo and a burger, and nothing else.** A full drawer was
built first — scrim, `Drawer` instance at `Side=left`, the two segmented
controls, a five-section `SideNav` — and then removed on the call that the
nav is not what this page is for. What ships is a native 390-wide header frame:
`Lockup` (`Brand=Primitiv, Layout=Horizontal, Theme=Dark` — *Dark* is the
white-ink mark, for dark grounds) on the left, a 32px burger on the right
carrying the `menu` glyph at `content/secondary` on a `radii/8` corner, both
inside a `surface/default` bar with a `border/subtle` hairline under it. That
is `mobile-menu.css` read literally.

It replaces the cloned desktop header, which was a `Container xl` at 1280px
squeezed into a 390px frame. **Do not clone the desktop header onto a phone
frame** — the same lesson the mobile footer taught, now recorded twice.

**Then a layout audit over both frames, which found four real defects.** All
four were invisible to a structural read — every node reported plausible
numbers — and only showed up in a render or in an explicit overflow check:

1. **Ten mobile illustration gaps had captions wider than their own box.**
   The caption text nodes were `FIXED` at the frame's full 342px inside a
   frame with 40–48px of horizontal padding, so every caption ran under the
   dashed border. Padding is now 20px all round and every caption is `FILL`.
   The desktop gaps were already correct.
2. **Three stacked two-column rows under-measured their own height.** Their
   second child was `layoutSizingVertical = "FILL"` inside a parent with
   `primaryAxisSizingMode = "AUTO"`. That pair is a contradiction, and Figma
   resolves it by **not counting the FILL child at all**: the parent hugged to
   its first child and the illustration gap hung 250px past the bottom edge.
   Nothing errors, and the parent's reported height is a plausible number —
   which is what makes it hard to see. A FILL child needs a fixed-height
   parent; in a hugging parent it must be HUG.
3. **The same pairing clipped the three path cards' body copy** on mobile,
   and the cards' headings and bodies were `FIXED` at 330px inside a 294px
   content box, so every card lost its right-hand words mid-sentence.
4. **An 80px gutter became an 80px hole.** The four rows that are two columns
   on desktop keep their gutter as vertical spacing once stacked, which reads
   as an accidental void rather than a break. Now 32px, and the frames are
   named `two-column row (stacked)` so the next person can see what they are.

Both frames now pass an overflow audit — no child of any auto-layout frame
extends past its parent's padding box, horizontally or vertically. **Run that
audit after any layout change**; it is a dozen lines and it catches the whole
family of FILL/HUG contradictions above, which no amount of reading node
properties will.

---

## 6.1 A finding logged while verifying copy

**`README.md` has drifted from the repository it describes.** Verifying
figures for the Start Here page turned up two stale numbers: it says
**62** registry components in two places where `registry.json` and
`roster.json` both say **63**, and **48** icons where
`packages/icons/src/icons/` holds **50**.

Not urgent, and not this plan's job to fix — but it is exactly the class
of drift §2.2's proof-strip warning exists for, and it is a reminder that
any figure reaching a reader wants regenerating rather than copying.

---

## 7. Open questions

1. ~~Do the live demos ship with v1?~~ **Closed 2026-09-02.** The
   colour section became a static proof sheet by design (§2.5), and the
   **density dial ships live** (§2.4) — it needs no engine in the
   browser, only one `data-density` attribute over the token layer that
   already ships. Both halves settled; nothing left open here.
2. **Does the home page name competitors?** §1.1 assumes not — it answers
   their questions without naming them. A comparison table converts well
   and ages badly.
3. **Who verifies the proof-strip numbers before publishing**, and does a
   check get wired into CI the way `qa:docs-data` guards the generated
   data?
4. ~~Does the "When to use this" block belong in `contract.json` too?~~
   **Settled 2026-09-02 — yes, it does.** See §4.4.
5. **`/figma/harmoni` and the private repo — now the one thing blocking
   step 8b.** The public page needs
   product copy that the private repo's `CLAUDE.md` rules do not forbid.
   Worth confirming what may be shown before it is written.
