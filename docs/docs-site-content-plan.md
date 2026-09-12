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
> Harmoni (`/figma/harmoni`) is **not being built** — decided 2026-09-07,
> it gets its own website instead (§3.9).

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
| D3 | **Nine new pages this round; Guides and Changelog deferred** | Their two nav entries come out rather than pointing nowhere. Amended 2026-09-07: eight, not nine — Harmoni is dropped too (§3.9), so three entries come out |
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

Also on this page once it ships: **the standard ramps** — a wider set of
fixed scales, generated the same way, that no semantic role points at,
for colour the six semantic scales were never going to cover (chart
series, tags, illustration). Opt-in, and untouched by
`primitiv theme --brand`. Copy is drafted and marked PENDING in
`docs-site-concepts-copy.md` Page 2 §5; the decisions behind it are that
file's note 7.

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

### 3.9 `/figma/harmoni` — **dropped (2026-09-07)**

**Harmoni is getting its own website, so it does not get a page here.**
That closes §7.5 by removing the question rather than answering it: there
is no longer any need to decide what a public Primitiv page may say about
a commercial product in a private repo.

**The consequence is a link removal, not just a page that never appears.**
Three surfaces pointed at it — the sidebar's *Design in Figma* group, the
footer's DESIGN column, and a `Harmoni →` link closing §6 of
`/figma` — and a link to a page that will not exist is the exact defect
D3's reasoning exists to prevent.

**Gone from the page spec and from the Figma frames** — 28 nodes in total,
which is more than it sounds: the sidebar entry on each of the eight desktop
frames, the `Harmoni →` closing §6 on both `/figma` frames, and the footer's
DESIGN-column entry on all sixteen content frames *plus* both home frames,
because the footer is cloned rather than shared. `verify-docs-content-pages.mjs`
is green across all eight pages.

**Naming the engine in prose stays, and has to.** `/concepts/what-primitiv-is`
introduces Harmoni as one of the four parts, `/figma` §6 explains that the
palette is generated rather than picked, and the home page's colour section
rests on it. None of that is a link, and none of it is a claim about a
product page. When the Harmoni site is live, the nav entry comes back as an
external link.

> **Original scope, kept because it still governs anything written about
> Harmoni here.** Its plugin lives in the private `primitiv-ui/harmoni`
> repo and is a commercial product: public-facing product copy only — what
> it does and who it is for. No implementation detail, no file layout,
> nothing licence-related. The engine itself is MIT and public; the plugin
> is not.

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

### 4.5 The page-action Split Button — every page, content and component (2026-09-11)

Requested this session, with the Rive CLI docs as the reference: a Split
Button sitting directly under the lede, on **every** page — the nine content
pages and all 63 component pages. Its default half performs the common
action; its chevron half opens a menu of the variants.

**This is not a new product goal — it is the concrete shape of one already
committed.** `docs/docs-site-planning.md` §1.22 (raised 2026-08-09) adopted
"the docs site must be built for AI agents, not just human readers" as a
product goal and named this exact pattern as the prompt for it, then
deferred every build decision to the docs-site build phase. That phase is
now here, so this settles §1.22's **goal 2** (an agent that has already
chosen Primitiv can load the full API quickly). §1.22's goal 1 — proactive
discovery via a thin MCP server over the registry — is untouched and still
open; it is a different mechanism and does not belong in this control.

**The rows, from the reference.** Each is a leading mark, a title, and a
one-line description beneath it:

| Row | Title | Description |
| --- | --- | --- |
| 1 | Copy page | Copy page as Markdown for LLMs |
| 2 | View as Markdown ↗ | View this page as plain text |
| 3 | Open in ChatGPT ↗ | Ask questions about this page |
| 4 | Open in Claude ↗ | Ask questions about this page |

Row 1 is also the default half's action, so the action label reads
**"Copy page"** with a copy glyph — the same doubling the reference uses, and
the right one: the menu documents what the button already does rather than
hiding it.

**The markdown mirror is the blocking dependency, not the control.** Three
of the four rows need a `.md` route per page to point at, and the fourth
needs one to fetch. §1.22 already planned that mirror (`llms.txt` /
`llms-full.txt` + a markdown route alongside each page's HTML) and called it
framework-level and cheap. Build it first; the Split Button is a thin skin
over it. Until it exists the control has nothing to do, so **do not ship the
control ahead of the routes** — a "Copy page" button that copies rendered
HTML would be worse than no button.

**Four things this surfaces that are genuinely new work.**

1. **`Dropdown / Item` has no description line.** The registry stylesheet
   ships `__item-leading` / `__item-label` / `__item-trailing` (added for
   the Select composition-depth work) and the label is one string. A
   two-line title-over-description row does not exist anywhere in the
   library. Decide deliberately: extend the shared Dropdown row with an
   optional description part (it would benefit every menu), or compose this
   one bespoke in the docs site the way `breadcrumb-overflow` draws its own
   trigger. The first is the better system answer and the reason to check
   before building the second.
2. **Two of the four marks are third-party logos.** The ChatGPT and Claude
   marks are brand assets, not system glyphs — they must **not** enter
   `@primitiv-ui/icons`, which is Primitiv's own icon set. Inline them in
   the docs site as local SVG assets.
3. **The deep-link URL formats are not settled.** "Open in ChatGPT" and
   "Open in Claude" pass the page's markdown URL as a prompt parameter; the
   exact query shape for each is an external contract to look up and record
   here, not to invent.
4. **`split-button` is one of the 21 component pages that do not exist**
   (§4.3). So the control ships on a page whose own documentation page is
   still missing — worth landing that page early in §4.3's order rather than
   leaving the site using a component it cannot yet document.

**Figma.** Both breakpoints of both page families need it: the content pages
(page `2229:25998`, sixteen frames) get it in the head region between the
lede and the first section, and the component-page frames get it under the
lede in the same place. The mobile treatment needs a decision — at 390px the
menu is nearly full-bleed and the description lines may need to drop, which
is the kind of call that belongs in the Figma pass rather than in prose.
`scripts/figma/docs-content-pages.js` needs a new `['pageAction']` head
block so the builder places it from the spec like every other block.
---

### 4.6 Harmoni is off the site, and the whole nav is dead anchors (2026-09-11)

Per the decision to leave Harmoni off the site until it has its own, the four
live surfaces that linked to it are done: the sidebar's *Design in Figma*
child (`lib/nav.ts`), the landing page's Figma path card and documentation-map
row (`LandingSections.tsx`), the header nav (`SiteHeader.tsx`) and the
footer's DESIGN column (`SiteFooter.tsx`). Each now points at `/figma/` — the
`/figma` content page — and the standalone `Harmoni` rows are gone. Prose
naming the engine stays: the Figma path card still reads "powered by
Harmoni", which is the fact, not a link to a product that has nowhere to go.
The matching Figma canvas removal is tracked in §6.0 as its own item.

**Found while doing it, and larger than the Harmoni question:** every
in-page anchor in the site's navigation is dead. Only three section ids exist
on the landing page — `choose-your-path`, `component-block` and
`documentation-map` — while the nav, header, footer and documentation map
between them link to `/#what-primitiv-is`, `/#tokens`, `/#density`,
`/#composition`, `/#accessibility`, `/#cli`, `/#cli-add`, `/#cli-tokens`,
`/#recipes`, `/#changelog` and `/#icons`. All eleven resolve to nothing.
That is not a bug to patch anchor-by-anchor: nine of them are the content
pages §3 specifies, which have no routes yet (`src/app` holds exactly three
`page.tsx` files). **The fix is building those routes**, at which point the
anchors become real paths — so this is a reason to schedule §3's pages, not a
separate defect. `/#recipes` and `/#changelog` are the two with no page
behind them in any plan, and need a decision: drop them from the map, or
commit to the pages.

---

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
| 7 | Figma: the prose page template | ✅ **done 2026-09-07** — settled as the shared shell of the eight content pages rather than a separate specimen frame (§6.0.4), so the template and its first use are the same artefact and cannot drift apart |
| 8 | Build the home page in code | |
| 9a | Copy + briefs for eight of the nine content pages | ✅ **done** — Start Here, the five Concepts pages, Registry & CLI, Figma |
| 9b | ~~Harmoni page copy~~ | **Dropped 2026-09-07** — Harmoni gets its own website (§3.9). Its links come out with step 10 |
| 9c | Artwork for the ten content-page briefs, then build the pages | **Pages built 2026-09-07** — all eight, both breakpoints, with the ten briefs in place as gaps (§6.0.4). The artwork itself is the remaining half |
| 10 | Remove the Guides + Changelog + Harmoni nav entries | Do it with step 8 so no link is ever dead. Done on the Figma frames already; `src/lib/nav.ts` still carries all three |
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

**Defect 2 was the one that was actually visible.** `DENSITY-02` hung 289px
out of section 04 and landed on section 05's *heading* — reported from the
canvas as "an image behind the section heading". It now ends 58px inside its
own section. Worth remembering as the tell: **a FILL/HUG contradiction shows
up one section later**, so the section that looks broken is not the one that
is.

### 6.0.2 The path cards carry real components now (2026-09-03)

The three §2.8 cards had a hand-drawn `command` frame — a mono line on a
`surface/subtle` box. All six (desktop and mobile) now hold real instances:

- **HEADLESS and STYLED** get a **`Code Block`** at `Type=tabbed, Size=sm`,
  tabs npm · pnpm · yarn · bun, code `$ npm i @primitiv-ui/react` and
  `$ npx primitiv add button`. The tab labels needed no editing — the
  component's own defaults are already the four package managers, which
  avoided the one risky part (a nested-instance `Label` override).
- **FIGMA** gets a **secondary `Button`** with a trailing `external-link`
  icon, labelled *Open the Figma library*, **centred, with no trailing link**.
  That card is not a command, and a sentence in a monospace chip beside two
  working shell commands reads as a command that does not work. The other two
  cards keep `... docs →` because a code block is something you copy rather
  than somewhere you go, so the link is their only way out; the Figma button
  *is* the way out, and a link beneath it would be two controls competing for
  one click.

  **Centring one child needs a wrapper.** `layoutAlign = "CENTER"` on the
  child silently reverts to `INHERIT` — cross-axis alignment belongs to the
  parent now, so it is all children or none. The button sits in a fill-width,
  hug-height `button row` frame whose `primaryAxisAlignItems` is `CENTER`.

### 6.0.3 `overline` gained the size scale every other type family had (2026-09-03)

The eyebrows read too small, and the reason was structural: **`overline` was
the only type family in the system with no size slots.** `body/*`, `label/*`
and `heading/*` all run xs–xl; `overline` was a single unsized preset serving a
card eyebrow, a section eyebrow and a nav-rail heading alike — and its values
were *exactly* `body/xs`, the smallest rung on the ladder.

The codebase had already noticed twice. Both `.docs-toc-heading` and
`.docs-nav-group-title` hardcoded `font-size-14` under the comment *"One step
up from the overline defaults (12px / medium)"* — two rules reaching past the
preset for the same escape. Rather than add a third, the family now carries
**xs–xl in all four densities**, mirroring the `body` ladder exactly (it always
did, at one fixed rung) and differing only in family and weight:

| slot | dense | compact | comfortable | spacious |
| --- | --- | --- | --- | --- |
| xs | 10/12 | 12/16 | 12/16 | 12/20 |
| **sm** | 11/14 | 14/20 | **14/20** | 14/24 |
| md | 12/16 | 16/24 | 16/24 | 16/28 |
| lg | 13/16 | 18/28 | 20/32 | 22/36 |
| xl | 14/20 | 20/32 | 22/36 | 24/40 |

**The unsized tokens survive, as an alias of `sm`, and that is deliberate.**
146 Figma nodes across four pages bind them — including specimen pages and the
Harmoni plugin views, which are not this change's to rewrite. So
`overline/font-size` now aliases `overline/sm/font-size` on both sides:
one source of truth, no rewrite, and every existing binding keeps working.
Intra-context aliasing was already established (`{body.xl.font-size}` inside
the `dropdown/*` family), so this needed no emitter change — it emits as
`--primitiv-overline-font-size: var(--primitiv-overline-sm-font-size)` and
resolves through the cascade.

Every docs-site rule now names a slot rather than the unsized default, and the
two workarounds are gone. One place kept 12px on purpose — `.docs-install-hint`,
whose comment says *"The 12px muted trailing hint"* — and was only borrowing the
overline's size by coincidence; it names `body/xs` now so it cannot drift again.

Verified end to end: Figma resolves 5 slots × 4 modes identically to the
emitted CSS, and `check-tokens` passes over 21 stylesheets.

**The home page then took `lg` for every eyebrow** (20/32 comfortable) — all
20 text nodes across the two frames, plus `.docs-section-overline`. A two-tier
split was tried first (sections at `md`, cards one rung down at `sm`) on the
theory that a card is a smaller context than a section; on the page it read as
an inconsistency rather than a hierarchy, so both went to `lg`. The slots are
still what made the question askable — before this, one token served both and
neither could move without the other.

**Growing the eyebrow broke the card row, silently.** At `lg` the two install
cards need 386px and the row was still pinned at the 370 measured before the
bump, so card one filled 369 of 370 — one pixel from clipping, and the
overflow audit passed because the `body/md` child is `FILL` and absorbed the
squeeze on the parent's behalf. **A FILL child can hide an overflow as well as
cause one.** The reliable measurement is to set every FILL child to `HUG`,
read the card's natural height, then restore: 386 · 386 · 326. The row is now
386 by construction rather than by a stale measurement.

---

**The swap made the row overflow, and the fix is the one §5.2 already
recorded.** The cards grew from 314 to 370 while the row stayed pinned at
314, so both docs links were clipped and the `PATHS-01` gap painted over
them. Resize the row to its tallest child, keep it `FIXED`, then set every
card to `layoutSizingVertical = "FILL"` — that is the counter-axis case, and
it is the *opposite* of the primary-axis trap above. Equal-height cards need
a fixed row; a hugging row cannot give them one.

---

### 6.0.4 The eight content pages, both breakpoints (2026-09-07)

Built on a new Figma page, **"Docs Site — Content pages (v3)"** — sixteen
frames in eight rows, mobile (390) at `x=0` and desktop (1440) at `x=480`,
with a **Build notes** panel at `x=2000` carrying the conventions in canvas.

| Page | Route | Gaps |
| --- | --- | --- |
| Start Here | `/start-here` | START-01 |
| What Primitiv is | `/concepts/what-primitiv-is` | FAMILY-01 |
| Tokens and theming | `/concepts/tokens` | TOKENS-01 |
| Density | `/concepts/density` | DENSITY-C01, DENSITY-C02 |
| Composition | `/concepts/composition` | COMPOSE-01 |
| Accessibility | `/concepts/accessibility` | A11Y-C01 |
| The registry and CLI | `/registry-cli` | CLI-01 |
| Design in Figma | `/figma` | FIGMA-P01, FIGMA-P02 |

**A page is data.** `scripts/figma/docs-content-pages.js` holds a `PAGES`
object — eyebrow, title, lede, and a list of sections whose blocks are short
tuples (`['p', text, inlineCodeFragments?]`, `['code', …]`, `['alert', tone,
…]`, `['gap', id, …]`, `['defs', …]`) — and a renderer that turns any of it
into both breakpoints. Adding or editing a page means editing its entry, not
the renderer: `build(['tokens'])` rebuilds one page, `build(ALL)` rebuilds
every one, and `sizeGaps()` / `layout()` / `overflowAudit()` finish the job.

**The data is checked against the canvas rather than trusted.**
`scripts/figma/verify-docs-content-pages.mjs` reduces both sides to a
whitespace-stripped fingerprint per page and diffs them — necessary because a
paragraph with inline code is one string in the spec and a run of per-word text
nodes on the canvas, so they cannot be compared directly. It found two
divergences on its first run: one artefact of the checker itself, and one real
— the three token formats read as lowercase sentence fragments (`custom
properties. The default…`), because the copy doc writes them as em-dash
continuations on one line and this layout puts the term on its own line. The
canvas now capitalises them and all eight pages match.

**Mobile first, desktop derived — and that ordering is load-bearing.** Each
desktop frame clones its mobile sections into the docs shell, so the copy
cannot diverge between breakpoints; rebuilding a page means rebuilding its
mobile frame and re-deriving. It also sidesteps the failure §6.0 recorded in
the other direction: a desktop footer cloned down to 390 kept heights that
clipped its own columns, and three rounds of forcing `primaryAxisSizingMode`
did not clear it.

**These are docs pages, not landing pages, and the geometry says so.** The home
page is one column with 120px gutters and alternating section grounds. A
content page uses the shell `apps/docs-site/src/site/shell.css` already
implements: a 1280 container in 1440, 32px gutters, **260 / 632 / 260**, one
continuous `surface/default` ground. Mobile is that column at 24px gutters with
no rails — which is `shell.css` again, since it hides both below 64rem. What
*is* carried over from the home page is everything that makes them one site:
the cloned header and footer, the type roles, the Intent/Context binding
discipline, the `flow · *` rhythm frames and the dashed gap frames.

**Inline code is a real `Inline Code` instance, and getting there needed a
technique.** A Figma text node cannot contain a component, so a paragraph with
inline code became a wrapping horizontal auto-layout of word nodes with chips
among them. Two details cost a rebuild. An auto-width text node **trims its
trailing space**, so a first pass rendered "Yougetthekeyboardhandling" — spacing
has to be `itemSpacing`, set to the *measured* space advance of `body/md`
rather than a guess. And uniform `itemSpacing` then puts a gap between a chip
and the full stop after it, so atoms with no space between them share one
zero-gap group, which is a single flex item. The source string is stored on the
frame's `pluginData`, so a paragraph can be rebuilt without retyping it.

**Code blocks sit in a centred well on desktop** (`space/space-48` either
side), settled with the human after three readings of "centred" were measured
and rejected — the block's internal padding was intact and the main column was
already page-centred. Inside a half-width paired column they step to `Size=xs`,
or the line wraps.

**Three briefs specify half the content width beside their prose**
(DENSITY-C02, COMPOSE-01, FIGMA-P02). On desktop the gap and the blocks above
it are wrapped into a two-column row; on mobile they stay stacked, which is
what those briefs' `below-48rem` notes ask for.

**Two publication gates are drawn into the pages, not left in a doc.**
Accessibility carries a warning `Alert` at the top (it must not ship before the
deferred accessibility pass runs), and Tokens and theming carries one on the
standard-ramps block (planned, not shipped). Design in Figma carries a third on
§6's open question — whether the standard ramps belong in the Figma file at
all — because "the same tokens as the code" is a claim that page makes.

**One shared master was repaired on the way.** `Alert`'s **`Show dismiss`
boolean was wired to nothing on all 20 variants** — the property existed, the
panel accepted a value, and the dismiss control rendered regardless. The
`Dismiss` frame now carries the `visible` reference on every variant, verified
20/20. Same family as `CLAUDE.md` gotcha 4, except this one had never been
wired rather than losing its refs to a clone, so it affected every Alert in the
file.

**Two traps worth keeping.** A gap re-parented into a wider column **does not
reflow within the same `figma_execute` call**, so its first resize lands
against the old content height — size it in a second call (the same
measure-in-the-next-call rule the density panel hit in §6.0). And a **hidden
node keeps its master width**: a Code Block header hidden by `Show Header`
still reads 440 wide inside a 632 instance, which is a benign hit in any
overflow audit, so that audit must skip invisible children. The overflow audit
across all sixteen frames returns zero.

---

### 6.0.5 The first two illustrations (2026-09-11)

**A11Y-C01 and CLI-01 are built and placed**, both breakpoints each, on the
Figma page **"Docs Site — Content illustrations"** and cloned into their gap
frames on the content pages. Eight of the ten briefs remain.

Two deviations from the briefs, both deliberate:

- **A11Y-C01 came out 2.63:1, not the brief's 3:1.** Six items on the right at
  `body/sm` with `space/space-24` padding is 240px tall at 632 wide; 211 meant
  either 10px padding or type below what the brief's own `tokens` block
  specifies. The ratios in these briefs were written before the content
  existed, so the content wins and the deviation is recorded rather than
  crammed away. CLI-01 is exactly 2:1 as briefed.
- **CLI-01 mobile points its connector at the repository zone, not at
  `button.tsx`.** Stacked, an arrow reaching the first file would run the full
  height of the list past four files it has nothing to do with. The one-way
  relationship — the thing the brief exists to establish — survives; the
  precision does not.

**These are absolutely-positioned frames, not spec-driven like the pages.** A
connector that starts at one node and lands on another cannot be expressed in
auto-layout, so CLI-01 places every element by computed coordinate. That makes
the auto-layout overflow audit useless on it, so the build carries **a second
audit: any two painted siblings whose boxes intersect.** It earned its place
immediately — it caught the closing sentence sitting on top of "Updates
normally." on the mobile frame, which reading node properties had missed and
which I would otherwise have shipped.

**FAMILY-01 and TOKENS-01 followed (same day).** Four of ten placed; START-01,
DENSITY-C01, DENSITY-C02, COMPOSE-01, FIGMA-P01 and FIGMA-P02 remain.

**TOKENS-01 pins `Primitives / Palette` to Dark on one frame, and that
contradicts the house rule on purpose.** The rule exists because an Intent
alias resolved through the dark ramp renders near-black text on a near-black
surface. It does not apply to a node bound *directly* to `color/brand/*` with
no Intent-coloured text inside it — which is exactly what the swatch row is,
and why it is its own frame with the pin on it and every label outside. The
payoff is that the ramp shown is the one dark mode actually renders: `500`
holds at `#236ce1` because it is the pinned seed, and every other step
inverts. The brief called that "the clearest possible demonstration of why the
middle tier exists", and showing the light ramp on a dark page would have made
the diagram quietly untrue.

**TOKENS-01 states its palette value in OkLCH, not hex** — `oklch(0.5557
0.1923 259.8783)`, taken verbatim from the engine's own
`color::output::format_oklch` rather than computed here. That follows
[RFC 0031](./rfcs/0031-oklch-first-token-output.md): once `palette.json` holds
OkLCH, `#236ce1` will not exist in the source at all, so the hex label would
have been showing a value the token layer no longer has.

Two more deviations, both recorded rather than hidden:

- **TOKENS-01 mobile drops the Context leader.** Stacked, Context moves to its
  own row beneath the palette, so a leader to the button's geometry would run
  the height of the diagram past everything it is not about. The row keeps its
  `CONTEXT` label; the line goes.
- **Both TOKENS-01 breakpoints draw two connectors but highlight one.** The
  brief's `must-not` forbids highlighting more than one path, while its
  `contents` asks for a second connector from `content/on-action`. Those are
  reconcilable and the craft note says so: the second path is drawn quiet. It
  is what makes "a component is a set of roles" concrete.

**A placed illustration carries no fill of its own.** The build-page source
keeps a `surface/default` fill so it reads in isolation; the clones on the
pages have it cleared, so a section that later sits on a tinted band does not
show a rectangle of the wrong colour.

---

### 6.0.6 The three half-width diagrams (2026-09-11)

**DENSITY-C02, COMPOSE-01 and FIGMA-P02 are built and placed**, both
breakpoints each. Seven of ten done; START-01, DENSITY-C01 and FIGMA-P01
remain.

**None of the three fits its own `contents` into the 4:3 its brief asks for,
and that is a finding about the briefs rather than the drawings.** "Half the
content width" is 300px on desktop, so 4:3 means a 225px-tall box. Measured
against what each brief actually asks to be drawn:

| id | Built | Ratio | 4:3 would need |
| --- | --- | --- | --- |
| DENSITY-C02 | 300×238 | 1.26 | 225 — closest of the three |
| FIGMA-P02 | 300×296 | 1.01 | 225 |
| COMPOSE-01 | 300×424 | 0.71 | 225 |

Every ratio in these briefs was written before the content existed, so the
content wins and the deviation is recorded. The same call was already made for
A11Y-C01 (§6.0.5). **Width is the constraint that is real** — it comes from the
two-column row — so all three hold 300 exactly and vary only in height. All
three still sit shorter than the prose column beside them (392/238, 492/424,
308/296), so no row grows to accommodate them.

**COMPOSE-01 stacks JSX above DOM instead of placing them side by side, and
this was forced.** Its brief asks for "the JSX on the left and the resulting
DOM on the right". A first pass built exactly that and the code silently
overflowed its column into the connector — `  <Link href="/x">Go</Link>` is
178px at `code/xs`, against a JSX column of 152px. Widening the code column
starves the DOM column, which then cannot hold `class="primitiv-button"` on one
line; every split of 268px fails one side or the other. Stacking within each
row keeps both legible and keeps what the brief is actually for: **two boxes
above, one box below**. The craft note's "make the upper one visibly taller" is
satisfied by the boxes themselves (52 vs 24), which is what the eye compares.

**Auto-width text does not wrap, it overflows.** That is what hid the collision
until a render: every code line reported a sensible width and sat outside its
column. Measure the longest line and size the column from it, or set an
explicit width and let it wrap — never assume a character width. The frames
carry an intersection audit for exactly this class of defect, since an
absolutely-positioned diagram is invisible to the auto-layout overflow audit.

**Two smaller notes.** DENSITY-C02 exaggerates the loose/tight contrast past
what the real tokens give, as its own craft note directs — it is a diagram of a
concept, not a specimen sheet. FIGMA-P02's variable swatch is bound to
`action/primary/default` rather than filled with a literal, so the chip shows
the colour the token actually resolves to.

**TOKENS-01's palette row is labelled `dark theme`, and the reason is worth
keeping.** The dark ramp runs **deep → pale** — the opposite of the
conventional 50–900 reading — which looks like a mistake until you see why:

```
brand  light   50 #f0f5ff   500 #236ce1   900 #000923
brand  dark    50 #121922   500 #236ce1   900 #e1ecfe
```

`dark.content.primary` points at `{color.neutral.900}`, exactly as the light
theme does. **Body text is step 900 in both modes; the ramp inverts underneath
it.** That inversion is what lets one Intent name serve both themes — without
it every role would need a different step per mode and "same name, two modes"
collapses, which is the precise property this diagram exists to teach. So the
surprise is the point, and it only reads as an error while unlabelled.

**Consequence for shipping: the light twin will run the other way**, and that
is correct rather than a bug to reconcile. The brief anticipated this — its
craft note calls the dark version resolving to different values "the clearest
possible demonstration of why the middle tier exists" — but assumed both
versions would be seen. Only the dark one exists today because the Figma
content pages are dark-only.

**A gap this surfaces, logged rather than fixed:** the docs site has a theme
toggle, and the home-page illustrations already ship as light/dark pairs
(`a11y-01-*-light.mp4` / `-dark.mp4`, `figma-01-light.png` / `-dark.png`).
**All ten content-page illustrations will need light twins before they ship.**
TOKENS-01 is the one where the twin is not a recolour — its palette row has to
be regenerated against the light ramp, which is exactly what the brief asked
for.

**One inconsistency left deliberately.** COMPOSE-01 uses `href="/x"` (its
brief's string) while the code block beside it on the page uses
`href="/pricing"` (the page copy's string), so the same example reads with two
different hrefs. `/pricing` was not adopted because
`<Link href="/pricing">See pricing</Link>` wraps at 268px and the diagram stops
being scannable. Worth a look if it reads as two examples rather than one.

---

### 6.0.7 Two findings from preparing DENSITY-C01 (2026-09-11)

DENSITY-C01 prints "the md control height and the resulting corner radius,
real values from the token layer" beneath each of its four columns, so those
values were read from the source before drawing anything. Both findings come
from that read.

**1. The radius formula the Density page states is not what ships.** §4 "Why
radius follows" gives `radius = height × 0.1875` and says "that fraction is
fixed across the whole system". Against `context.json`:

| mode | md height | radius shipped | height × 0.1875 |
| --- | --- | --- | --- |
| Dense | 24 | 4 | 4.5 |
| Compact | 32 | 6 | **6.0 — exact** |
| Comfortable | 40 | 8 | 7.5 |
| Spacious | 48 | **8** | 9.0 |

The derivation is real, but the result is **snapped to the radii scale**, which
runs `… 4, 6, 8, 10 …` with no 9. Dense and Comfortable round to a neighbouring
step; Spacious lands exactly between 8 and 10 and the tie breaks downward, so
it ships the *same* radius as Comfortable despite being 8px taller.

This matters because **DENSITY-C01 puts both numbers side by side directly
beneath the prose that states the formula**, so a reader who does the
arithmetic finds 48 × 0.1875 = 9 and reads 8. The copy needed one qualifying
clause — the fraction snapped to the nearest step on the radius scale — rather
than the diagram hiding the numbers. Not changed here: the copy doc owns its
own words.

**2. Spacious and Comfortable are visually identical at the corner.** Whether
that is intended or a gap in the scale is a token question, not a copy one.
Worth a look before the density page publishes, because a reader comparing the
two columns in this very diagram will see two different heights and one
radius.

---

**Fixed 2026-09-11, once DENSITY-C01 made it unmissable.** The illustration
prints `40px · r8` and `48px · r8` two sections above the claim, so §4's
closing line now reads "That fraction is fixed across the whole system, and
the result snaps to the nearest step on the radius scale — which is why
Comfortable and Spacious, 8px apart in height, share a radius of 8." Changed
in `PAGES` and on both Density frames together, and the fingerprint check
passes on all eight pages. **Whether Spacious *should* share Comfortable's
radius is still open** — this makes the page honest about what ships, it does
not settle the design question.

### 6.0.8 The last three illustrations, and four scripting traps (2026-09-11)

**All ten illustrations are placed, both breakpoints each. Zero gaps remain**
on `Docs Site — Content pages (v3)`, and the overflow audit over all sixteen
content frames returns 32 flags of exactly one kind — `Tabs / Trigger >
indicator`, the tab underline sitting on its parent's bottom edge outside the
padding box, which is by design. Nothing else escapes a padding box anywhere.

**The Harmoni canvas removal was already done.** It had been carried as an
outstanding item since the bridge died two sessions ago, and it was stale: a
scan of every text node in the file found the docs-site pages carry Harmoni
only as prose naming the engine (the four-parts list on
`/concepts/what-primitiv-is`, the palette-scales line on `/concepts/tokens`,
and `/figma` §6's two paragraphs), which stays. The sidebar reads `DESIGN IN
FIGMA › The library` and the footer's DESIGN column reads `Figma library ·
Card marks`; there is no `Harmoni →` link closing §6. The eight pages were
built *after* the spec change, so they came out correct and never needed
retro-editing.

**START-01** (632×164 · 342×408) — three parallel routes, each a question
resolving to a path name and one command: *Already styled? → Headless → `npm i
@primitiv-ui/react`*, *Want it to look finished? → Styled → `primitiv add
button`*, *Designing, not building? → Figma → Open the Figma library*. The
third route's chip carries **prose, not mono, deliberately**: that route has
no terminal command, and changing the type tells the truth about the
difference rather than inventing a command to keep the columns matching.

**FIGMA-P01** (632×396 · 342×267) — a genuine screenshot, supplied by the
human, of the Button set as its full variant grid with the layers panel left
and variant properties right. Two things worth keeping:
- **Its natural ratio is 1.95:1, not the 16:10 the brief assumed**, so the
  desktop frame is 632×396 rather than 632×395 — which lands on the brief's
  height by coincidence once the caption is included. Cropping a genuine
  screenshot to hit a number written before the content existed would have
  been the wrong trade; same finding as §6.0.6.
- The caption states **125 Button variants from three axes**, and that was
  *counted* off the live component set (Variant 5 × Size 5 × State 5 = 125),
  not assumed. A caption that quotes a number has to be checked.
- **Figma's upload endpoint is unreachable from the sandbox** — `mcp.figma.com`
  returns 403 at CONNECT under the network policy, so `upload_assets` cannot
  be used. The alternatives are a human dragging the file in (what happened)
  or emitting ~150,000 characters of base64 through the bridge. Assume image
  work needs a human hand.

**DENSITY-C01** (632×358 · 342×592) — the same panel at all four densities,
four columns on desktop and 2×2 on mobile, each column stating its own
measured geometry (`24px · r4` / `32px · r6` / `40px · r8` / `48px · r8`).
The columns are top-aligned so their differing heights are themselves the
message. Values were resolved from the Context collection per mode rather
than assumed, which extends §6.0.7's table:

| mode | fc height | fc radius | fc padding-inline | body font-size | body line-height | cell padding-block |
| --- | --- | --- | --- | --- | --- | --- |
| Dense | 24 | 4 | 8 | 12 | 16 | 4 |
| Compact | 32 | 6 | 12 | 16 | 24 | 8 |
| Comfortable | 40 | 8 | 16 | 16 | 24 | 12 |
| Spacious | 48 | 8 | 20 | 16 | 28 | 16 |

**`body/md/font-size` is 16 in three of the four modes — only Dense drops to
12.** Density is carried by *spacing and line-height*, not by body type size;
`label/md/font-size` is the family that really scales (12/16/18/20). That is
worth knowing before writing any copy that claims text gets bigger, and it
is why the illustration's columns deliberately share one label size: identical
content, geometry alone changing, is the honest reading of the system.

**COMPOSE-01's `<a>` labels were not centred** — caught by the human on a
render, not by any check. The DOM-tree pills and their code labels are flat
siblings, not parent and child, so nothing enforced the relationship and the
labels were placed with an eyeballed `+5` offset. Fixed by giving each label
a box the size of the row it occupies and `textAlignVertical: 'CENTER'`, so
centring is derived rather than guessed; the `<button>` box gets only the band
above its nested pill. Applied to all four copies — both sources and both
placements.

#### Four scripting traps this cost, all silent

1. **A text node's height does not settle inside the call that set its
   `characters`.** Reading `height` immediately afterwards returns the old
   value, so anything positioned beneath it lands against a stale
   measurement — START-01's first question wrapped to two lines and
   overlapped its heading while the node still reported 18px. Set the
   characters in one call, measure and re-flow in the next. Same family as
   the re-parented-frame trap.
2. **`resize()` silently clears `textAutoResize`.** Arming auto-height
   *before* resizing loses it, which is what let the overflow above go
   unmeasured. Arm it *after* the resize — the text-node sibling of the
   known `primaryAxisSizingMode` trap.
3. **`setBoundVariableForPaint` does not recompute the paint's literal
   colour.** Whatever literal you hand it is what renders; the binding is
   metadata. A helper that passed black every time rendered every node black
   on a dark frame and every freshly-created frame white on the first pass.
   Resolve the variable for the active modes — walking the alias chain, with
   Intent pinned Dark and Palette left on Light per the house rule — and set
   the literal to the resolved value. This sharpens gotcha 3 from "re-set the
   non-colour fields" to "re-set the colour too".
4. **A cloned text template carries its `rotation` and both alignments.**
   All four DENSITY-C01 mode names came through rotated 90° and hanging above
   the frame, because the `overline/xs` node cloned was a vertical label in
   A11Y-C01. Reset `rotation`, `textAlignHorizontal` and `textAlignVertical`
   on every clone before positioning it.

And one pairing bug worth naming: **matching nodes by `characters` grabs the
same node twice** when a diagram repeats a tag. COMPOSE-01 has two `<a>`
pills, both matched the first `<a>` text, and one pill ended up with two
labels while the other had none. Claim each candidate once.

---
### 6.0.9 Making the illustrations survive a palette regeneration (2026-09-11)

Flagged before the light-twin build: the **brand seed, the neutral anchors
(soft white / soft black) and all four feedback ramps (info / warning /
success / danger) are not settled**. Fresh palettes will be generated once the
Harmoni plugin is finished, and the codebase synced. Most of the site follows
for free — 203 of 206 Intent values are aliases, and the components bind to
those — but **the illustrations are the exception, and it is worth knowing
exactly why.**

**A bound paint's literal matters only at WRITE time — corrected 2026-09-11
after measuring it.** The first version of this section claimed every scripted
colour was frozen against today's palette and that the illustrations would not
follow a regeneration. That was an over-reading of gotcha 3, and it is wrong.
`setBoundVariableForPaint` does not *compute* the literal for you, so a helper
that passes black writes black — but once written, **Figma keeps the literal in
sync with the variable**. Both halves were measured: flipping a frame's Intent
pin re-resolved all 17 paints in a cloned illustration, and changing
`color/neutral/900` moved a bound literal `#121418 → #ff0080` and back on
restore. So a palette regeneration *does* reach the illustrations, and an audit
across all twenty frames found **575 bound paints, zero unbound, zero drifted**
— they are swap-ready as they stand.

**The tool is a safety net and an audit, not the mechanism.**
`scripts/figma/resync-illustration-literals.js` walks every illustration on
the three docs pages, reads each paint's bound variable, re-resolves it
against that frame's own pinned modes, and rewrites the literal. Three
properties make it the right shape for a palette swap:

- **Idempotent.** A run against an unchanged palette reports zero writes, so
  it doubles as a drift audit — run it *before* a swap to see what has already
  moved, and *after* to land the new values.
- **It reproduces what Figma renders**, rather than imposing a second
  opinion: modes come from each frame's own `explicitVariableModes`, inherited
  down the tree, falling back to a collection's `defaultModeId`. The house
  rule holds unchanged — a dark frame pins `Intent = Dark` and leaves
  `Primitives / Palette` on Light.
- **It reports what it cannot fix.** A paint with no binding at all is listed
  as `unbound`, and every one is a hazard: a raw hex silently keeps the old
  brand colour through a swap. The fix is to *bind* it, never to hand-edit the
  hex. `dryRun: true` audits without writing.

**What this means for how the light twins get built.** They are **clones of
the dark frames with the Intent pin flipped, then resynced** — not
hand-authored second drawings. Three payoffs, and they are the whole reason
to do it this way:

1. One source of truth for geometry. A layout fix lands on the dark twin and
   the light twin is re-cloned, rather than two drawings drifting apart.
2. Every colour still comes from the same variable, so both twins move
   together on one resync run.
3. **TOKENS-01's twin stops being a special case.** Its palette row binds
   directly to `color/brand/*` with `Primitives / Palette` pinned Dark — the
   one deliberate exception to the house rule (§6.0.5), because the row's
   whole point is showing the ramp dark mode actually renders. Re-pinning that
   sub-frame to Light and resyncing regenerates the row against the light ramp
   automatically, which is what the earlier note meant by "its twin is not a
   recolour".

**The landing-page artwork already ships as light/dark pairs**, so it has the
same exposure and the script covers `Docs Site — Home (v3)` for that reason.

**The one thing that genuinely will not follow: FIGMA-P01.** It is a raster
screenshot of the Figma UI, so its Button variants are pixels of today's brand
blue. After a palette swap it must be **retaken**, not resynced — it is the
only illustration with that exposure, and the audit shows it as the lone image
fill among 575 bound paints.

**One limit worth stating.** The script fixes *values*, not *composition*. A
regenerated palette that changes a ramp's character — a brand hue far from
today's blue, or a warning ramp that stops reading as amber — may make an
illustration's colour choices wrong even with every literal correct. TOKENS-01
is the one to re-review by eye after a swap, since its subject *is* the ramp.

---
### 6.0.10 The light twins, and the density illustrations rebuilt from real components (2026-09-11)

**Twenty light twins landed**, one per illustration per breakpoint, on the
illustrations page at x=3400 (desktop) / x=4100 (mobile). Built as **clones
with the Intent pin flipped**, per §6.0.9 — not second drawings. Audit after:
575 bound paints on each side, zero unbound, zero drifted.

**TOKENS-01's twin needed the special case §6.0.9 predicted**, and the first
attempt silently failed to apply it. The clone pass guarded the pin change on
`n.clearExplicitVariableModes ? n.setExplicitVariableModeForCollection(...) :
null` — a method that does not exist on a `FRAME`, so the ternary took the
null branch and **nothing was written, while the script still reported
success**. Only the render exposed it: the light twin showed the dark ramp.
Re-applied unconditionally and read back. Its caption now says "light theme"
and the row is renamed `swatch row (Palette=Light)`. **Never report a write you
have not read back.**

**A real contrast defect the light twin exposed.** TOKENS-01's swatches carry
no stroke, so on a white surface `absolute/white` sits at **1.00:1** —
literally invisible — and `brand/50` at 1.09:1. The dark twin has the same flaw
at its own end (`brand/50` 1.04:1 on `#141414`). Fixed with a `border/default`
hairline on all 11 swatches in all four frames: 3.91:1 on dark, 3.05:1 on
light, and every chip now reads as a chip.

#### The density illustrations are built from real components now

Both were schematic — hand-drawn frames at hardcoded heights with bars
standing in for content. A drawing of density is not a demonstration of it, so
both were rebuilt from **real `Field` and `Button` instances** over a `stage`
frame that pins `Context`, plus **real lorem-ipsum prose** so the line-height
change is visible in actual text rather than implied by bar spacing.

Nothing in either illustration knows which density it is drawing. The measured
result, read back off the instances themselves rather than from the token
table, is an independent confirmation of §6.0.8's numbers:

| mode | Button + Input height | radius | prose font-size / line-height |
| --- | --- | --- | --- |
| Dense | 24 | 4 | 12 / 16 |
| Compact | 32 | 6 | 16 / 24 |
| Comfortable | 40 | 8 | 16 / 24 |
| Spacious | 48 | 8 | 16 / 28 |

The captions now quote the **instance's own** measured height and radius, so
they cannot drift from what is drawn above them. DENSITY-C02 became a genuine
nested demo — a `Context=Spacious` region containing a `Context=Dense` one,
each with a real Field — and the nesting proves itself: outer input 48px,
inner 24px, under the unchanged closing line "The nearest setting wins."

**A shared-master defect found on the way — FIXED 2026-09-11 across all 50
`Input` variants.** The `value` text node was `textAutoResize: HEIGHT` with
`textTruncation: DISABLED`, so a long value **wrapped to a second line and
spilled out of the input frame** — impossible for a real `<input>`, which is
inherently single-line. Now `maxLines = 1` + `textTruncation = 'ENDING'`,
verified by reading all 50 back and confirmed to propagate into `Field`'s 15
variants.

Three things that came out of doing it, none of them guessable:

1. **I had the shipped behaviour wrong, and checked before acting.** I claimed
   the registry Input was "single-line ending-truncated, settled during the
   Select work" — that was *Select's trigger value*.
   `registry/components/input/styles.css` carries **no truncation rules at
   all**, and correctly so: a native `<input>` cannot wrap and needs no CSS to
   get that. So the bug was never "Figma forgot the ellipsis", it was "Figma
   allows something the platform cannot do".
2. **Figma couples `maxLines` to `textTruncation`, so the ellipsis is
   mandatory, not chosen.** Setting `textTruncation = 'DISABLED'` to get a
   clip-without-ellipsis (which is what a browser actually does) **silently
   cleared `maxLines` on all 50** and the wrapping came straight back — caught
   by the read-back, which reported every variant as not-landed and measured
   the value height back at two lines. There is no "one line, no ellipsis"
   state. Wrapping is the worse defect, so `ENDING` stays, recorded in the
   component description as a deliberate Figma↔CSS divergence in the same
   category as Card's three.
3. **The artwork avoids ever showing it.** The ellipsis was disliked on sight,
   and the fix is the placeholder rather than the component: `hi@acme.io` fits
   at all four densities, so no illustration renders an ellipsis. Verified —
   zero wrapped value nodes and zero overflow across all eight density frames.

---

### 6.0.11 The v3 home sections start landing in code (2026-09-11)

**Scope correction first.** "Wire the staged illustrations into the home page"
turned out to be the wrong description of the work. The code home page was
still the **v1 landing** — Hero, ChooseYourPath, DocumentationMap,
ComponentBlock — while the v3 home is designed in Figma at 12,055px across ten
sections. The ten assets sitting unused in `public/illustrations/` since 4-7
September had **no host sections**. So the remaining home work is *building the
v3 sections*, and the assets follow for free.

Two are now built, both verified in real Chromium (the handoff's own rule --
render-time React errors never appear in `next build`):

- **Section 9, Accessibility** (`AccessibleByDefault`) with the A11Y-01
  animation. Four states checked, each with zero page errors and zero failed
  requests: desktop dark/light and mobile dark all serve the matching `.mp4`,
  and `prefers-reduced-motion: reduce` serves the `<img>` still -- carrying
  `alt` rather than `aria-label`, which is the right swap.
- **Section 6, Figma and code** (`DesignAndBuild`) with FIGMA-01 full content
  width.

**`useDocsTheme()` was extracted, and the home-copy record is why.** The site
has no theme context -- `ThemeToggle` derived the value inline -- so any
illustration picking its own `src` by theme would re-derive it independently
and the two could disagree on first paint, flashing a light video on a dark
page. One hook, one answer; `ThemeToggle` keeps sole ownership of the
`data-theme` side effect so it does not run once per consumer.

**The render caught a duplicate caption.** The spec gives FIGMA-01 a caption
("The same three tokens, on both sides.") and the built asset has it **baked
into the composite**, so composing `Figure.Caption` around it printed it twice.
The image now renders bare, with the caption folded into its `alt`.

**Gap found, not closed: FIGMA-01 has no mobile recomposition.** Its spec asks
for one explicitly -- *"below-48rem: stack vertically, Figma above, browser
below, token names as a horizontal band between them"* -- but only
`figma-01-{light,dark}.png` was ever built, unlike A11Y-01 which has proper
`{desktop,mobile}` variants. At 390px the 2:1 composite renders 358x179 and the
token names and Figma chrome are an illegible smear. It ships that way for now
because the fix is an asset, not code: it needs the `a11y-recorder` scene plus
a fresh human Figma screenshot at the stacked composition. **Anything reading
the parity claim on a phone currently cannot check it.**

**One thing to settle when the remaining sections land: banding.** Sections
alternate tinted/untinted, and with only three of ten built the alternation is
guesswork -- `DesignAndBuild` and `AccessibleByDefault` are both banded with
`ChooseYourPath` between them. Correct against the Figma frame once the run is
complete rather than guessing section by section.

**The docs site has no test framework** -- no vitest, no test files;
devDependencies are TypeScript and types only. Strict TDD was therefore not
available for this work, and the gate followed instead was the site's own
(`pnpm qa` = `check:css` + `typecheck`, both passing, 1,339 tokens resolving)
plus the real-browser render. Adding a runner to docs-site is a real decision
worth taking deliberately rather than slipping in mid-task.

---

### 6.0.12 Section 2, the proof strip (2026-09-12)

Built, verified in Chromium at 1280 and 390. The five figures were
**re-verified against the repository**, which the brief demands in bold and
which is the only reason this section can claim anything:

| figure | checked against | result |
| --- | --- | --- |
| 63 components | `registry/registry.json` | 63 entries |
| 4 density modes | `packages/tokens/src/context.json` | comfortable, compact, spacious, dense |
| CSS, SCSS or Tailwind | `primitiv --format` | css \| scss \| tailwind |
| 100% test coverage | `packages/react/vite.config.ts` | lines, branches, functions, statements all 100 |
| MIT | `LICENSE` | MIT License |

**The published icon package and the workspace source disagree on one name.**
The glyph is `Grid` in `@primitiv-ui/icons@0.1.29`, which the docs site
consumes, but the workspace source has since renamed it `GridIcon` so it
cannot collide with the Grid *layout* component — and that rename is not
published. Importing `GridIcon` fails to typecheck here. It is aliased
(`Grid as GridGlyph`) so the collision the rename exists to prevent stays
prevented. **Anyone reading the source and writing `GridIcon` in a
published-package consumer will hit this until the next release.**

**Three defects the render caught, one of them mine twice over.**

1. **The glyph was centring against the whole figure.** With a two- or
   three-line figure the mark floated halfway down the tile and read as a
   stray. It now rides the first line (`align-items: flex-start` plus an
   optical nudge, since the glyph box is taller than the cap height beside it).
2. **The captions sat at five different baselines.** Tiles stretch to a common
   height, so `margin-block-start: auto` on the caption pins every qualifier to
   one line regardless of how many lines its figure took.
3. **A comment claimed behaviour the CSS did not have.** It said the vertical
   rules "go" once the row wraps; nothing implemented that, and the mobile
   render showed four rules hanging beside stacked tiles. Now actually gated
   below 64rem — and worth the general lesson: **a comment describing
   behaviour is not evidence the behaviour exists.**

**One deliberate deviation from the copy record, forced and measured.** The
brief specifies `display/lg` for the figures. That is 56px, and the tiles
resolve to ~218px on a 1216 container — "components" alone needs ~245px, so
the figure overflowed its tile and collided with the divider. The brief
assumed "five numbers"; three of the five figures are phrases
("CSS, SCSS or Tailwind", "100% test coverage", "MIT"), which is exactly what
56px cannot absorb. Stepped to `heading/h2` (40px), the largest step on the
scale that fits. **Revisit against the Figma frame** — if the design really is
56px then the tiles need to be wider or the row needs fewer than five, and
that is a design decision rather than a CSS one.

---

### 6.0.13 Section 10, and two corrections to the proof strip (2026-09-12)

**Section 10, the close** (`CloseSection`) — centred heading, a 50ch-capped
lede and the two `lg` buttons, verified in Chromium at 1280 and 390 with zero
errors. Deliberately **not** a `LandingSection`: it has no overline and is
centred, so reusing that shell would mean bolting an optional overline and an
alignment switch onto a component whose whole value is that every section
looks the same. The copy record is explicit that the close carries **no
illustration** — after nine sections of images, an unillustrated ending reads
as confidence and gives the call to action the frame. Five of ten v3 sections
now exist in code.

**Then the frame settled it, and corrected the build at its root
(2026-09-12).** After three review rounds on this one section — glyph
placement, then stacking, then alignment — reading
`02 — Proof strip` on `Home — desktop (v3)` showed the real mistake was
upstream of all three: **the figure is the number alone.**

The copy record writes each row as `**63 components** — in code and in Figma`,
and that bolding reads as the figure. It is not. The frame puts only `63` at
`display/lg` and moves the noun into the caption:

| figure (56px) | caption (body/sm) | glyph |
| --- | --- | --- |
| 63 | components — in code and in Figma | grid |
| 4 | density modes — one attribute changes all | list |
| 3 | token formats — CSS, SCSS, Tailwind | file |
| 100% | test coverage — lines, branches, functions | success |
| MIT | engine and components both | copy |

So `display/lg` was right all along. The step down to `heading/h2` in §6.0.12
was solving a problem the build had created by promoting the whole phrase to
the figure — **that deviation is reverted**, and the note recording it is
superseded by this one. The third tile also changes claim: not
"CSS, SCSS or Tailwind" but "**3** token formats", which is the more useful
number and still verified (css \| scss \| tailwind).

Exact geometry, now matched and verified in Chromium: tile **175px fixed**,
row gap **40**, divider **1x56 centred** (not a full-height edge), glyph
**32px** (`Icon` at `lg`), `stat` gap **8**, stat-to-caption gap **12**.
Mobile is the frame's own second layout: **vertical, gap 32, tiles full
width, zero dividers.**

**The lesson is worth more than the section.** Every one of the four
corrections here was readable off the frame before any code was written, and
prose describing a design is not the design. Read the frame first for any
section that has one.

**The proof-strip tiles centre their contents.** Left-aligning glyph, figure
and qualifier made each tile read as a paragraph start rather than as one of
five even columns in a band — caught on review after the glyph fix below.

**The proof-strip glyph was beside the figure; it belongs above it.** Caught
on review, and the copy record says so in as many words: *"a single quiet
`content/secondary` glyph **above** each figure gives the column a top edge
without competing with the number"*. The spec's `stack/gap/sm` unit of
`[glyph, figure]` was built as a row, which is also why a two-line figure
wrapped around the mark and the column lost the top edge the glyph exists to
give it. Now a column, and **tiles stack one-per-row below 64rem** rather than
packing two-up — two figures sharing a baseline read as a grid rather than a
strip, and the last line was left with an orphan.

### 6.0.14 Two things FIGMA-01 needs, and they are one job (2026-09-12)

Flagged on review: **`figma-01-dark.png` does not look right.** Two separate
problems, both fixable only by rebuilding the asset, so they should be done
together:

1. **The dark composite has a light Figma canvas.** The left-hand half renders
   a white canvas with only the properties panel dark, so it reads as light
   Figma chrome around a dark specimen. The copy record's own `themes` key
   asks for *"dark: dark Figma canvas beside a dark browser render"*.
2. **There is no mobile recomposition** (§6.0.11). The spec asks for one
   explicitly — stack vertically, Figma above, browser below, token names as a
   horizontal band — but only `figma-01-{light,dark}.png` was built. At 390px
   the 2:1 composite renders 358x179 and the token names are illegible, so the
   parity claim cannot be checked on a phone.

Both need the `a11y-recorder` scene (`tools/a11y-recorder/src/FigmaOne.tsx`,
scene `figma-01-composite`) plus a fresh Figma screenshot from a real machine
— the bridge's screenshot tools export canvas *nodes*, never the application,
so the panels can only come from a human capture. Budget one pass for both.

---

### 6.0.15 The v3 section recipe, measured off the frame (2026-09-12)

With the bridge up, the remaining sections' geometry was read rather than
inferred — and it corrected the two sections already built. **One recipe holds
across every section measured (03, 06, 09), and its gaps are exactly the
`flow/*` tokens**, which is the rhythm system working as designed rather than
a coincidence:

```
section                       padding-block-start 96
  overline (overline/lg, 20px)
  ↕ 48   flow/region
  heading/h2 (40px)
  ↕ 12   flow/tight
  body/lg lede (20px)
  ↕ 32   flow/section
  [illustration or next block]
```

Within a block: `heading/h4` → `body/md` is **12** (`flow/tight`), and
consecutive h4 blocks are **16** apart in §09 (32 in §03, which has more room).

**`LandingSection` was calibrated to the v2 landing wireframe, not the v3
home** — its own header comment said so, and that is where the drift came
from. Recalibrated, and verified in Chromium against the frame's numbers:

| | was | frame | now |
| --- | --- | --- | --- |
| section padding-block | 80 | 96 | 96 |
| overline → heading | 4 (`xs`) | 48 | 48 |
| heading → lede | 32 | 12 | 12 |
| h4 → note | 4 (`xs`) | 12 | 12 |
| between commitments | 24 (`lg`) | 16 | 16 |

**The heading → lede gap needed a structural change, not a number.** It was 32
because the lede sat in `children`, a whole `flow/section` below the heading
block. The frame nests heading and lede together in one `flow/tight` group, so
`LandingSection` gained a **`lede` prop** rendered inside a
`.docs-section-title-group`. Passing a lede through `children` will always
land it 32 away and read as a separate block rather than as the heading's own
sentence.

**Two of these gaps are off Stack's scale.** Stack tops out at `xl` = 32 and
has no 48 rung, so the region and tight gaps are set in CSS from
`--primitiv-flow-region` / `--primitiv-flow-tight`. Reaching for the flow
tokens is correct here; inventing a Stack size would not be.

#### Banked for the unbuilt sections

Recorded so the next pass needs no pairing. Each already has its illustration
gap frame sized on the canvas:

| section | h | illustration gaps (w×h) | notes |
| --- | --- | --- | --- |
| 03 The problem | 1148 | PROBLEM-01 1200×400 | then a 2×2 of four h4+body/md "symptoms" at gap 32, closing body/lg |
| 04 Density | 2225 | DENSITY-01 1200×675 · DENSITY-03 1200×374 · DENSITY-02 560×420 | the largest section; DENSITY-01 is the live demo, DENSITY-02 sits in a 1200 row at gap 80 beside an h4 block |
| 05 Colour | 1374 | COLOUR-01 1200×412 · COLOUR-02 560×294 | same 1200-row-at-gap-80 pairing as §04's tail |
| 07 Ownership | 1258 | CODE-01 1200×750 (16:10) | animation, ~7s, plays once |

**Every one of these is still blocked on artwork**, which is why they are
banked rather than built — but the layout, copy structure and gap sizes are
now known without the bridge.

---

### 6.0.16 A render check, because nothing else sees these defects (2026-09-12)

`apps/docs-site/scripts/render-check.mjs` — renders a page in real Chromium
and reports what a browser actually sees. Written after hand-rolling the same
throwaway script six times in two days.

**It exists because neither existing gate can see this defect class.**
`next build` does not surface render-time React errors, and jsdom never loads
a stylesheet, so `toBeVisible()` passes on an element painted underneath
another. Every docs-site defect found on 2026-09-11/12 was caught by looking
at a render: a caption baked into an asset and printed twice, a glyph centring
against a three-line figure, a figure overflowing into a divider, four
dividers hanging beside stacked tiles, and a comment asserting behaviour its
CSS did not have.

It reports page errors, any request that 404s, and **elements whose text is
wider than the box it sits in** — the overflow class that properties alone
never reveal. Scope it with `--section <aria id>`, take two widths in one run
(`--width 1280 --width 390`), and switch `--scheme` / `--motion` to exercise
the theme and reduced-motion paths.

**It exits non-zero, so it is a gate rather than an eyeball** — verified in
both directions: a missing section exits 1, a good one exits 0. (Checking that
needed care: `$?` after a pipe reports `tail`, not node, which made the first
red test look like a pass.)

Two environment notes baked into it, both of which cost time to find: it must
run **from the repo root** because `@playwright/test` resolves there and not
in `apps/docs-site`; and it points at
`chromium_headless_shell-1194`, because the pinned Playwright passes
`--headless=old`, which current Chrome has removed — launching the normal
`chrome` binary fails with a message about the old headless mode.

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
5. ~~**`/figma/harmoni` and the private repo.**~~ **Closed 2026-09-07 by
   dropping the page** — Harmoni gets its own website, so no Primitiv page
   has to decide what may be said about it. See §3.9 for what that costs
   (three link removals) and what it does not (the prose naming the engine,
   which stays).

### 6.0.17 The eight content pages, in code (2026-09-12)

All eight routes are live and prerendered: `/start-here`, the five
`/concepts/*` pages, `/registry-cli`, `/figma`. Build-order step 9c's
second half, and step 10 with it.

**The copy is generated, not retyped — and that is the whole shape of
this increment.** `scripts/figma/docs-content-pages.js` already holds
every page as a `PAGES` object of block tuples, and
`verify-docs-content-pages.mjs` already proves that object matches the
sixteen settled frames. So `apps/docs-site/scripts/gen-content-pages.mjs`
reads the `PAGES` literal (a text slice between `const PAGES` and
`const ALL`, evaluated on its own — the rest of that file touches the
`figma` global) and writes `src/content/pages.generated.json`. Retyping 85
paragraphs into TSX would have made a third copy of the copy, free to drift
from both the canvas and the markdown. `pnpm check:content` fails if the
committed JSON is stale, so the two cannot quietly disagree.

Two things the generator resolves so the renderer stays dumb:

- **Link labels become real hrefs.** The Figma data carries only "Design in
  Figma →", because a canvas link goes nowhere. `ROUTES` maps every one and
  an unmapped label **throws** — a new next-step link fails the generator
  rather than rendering a dead link.
- **Headings get ids.** Every section's first block is its `h2` and its text
  is the matching `toc` entry — asserted for all eight pages, and it held
  first run. So the anchor, the `aria-labelledby` and the TOC all come from
  one string, and the TOC is derived (`tocFor`) rather than authored.

Language for each code block is detected, not carried: a shell transcript
prefixes every line with `$ `, JSX opens with a capital tag where HTML opens
with a lowercase one, and the one block that is not source at all
(`radius = height × 0.1875`) gets `text` so highlighting does not colour an
equation. All 22 classify correctly; an explicit `language` in the block's
options wins for anything a future page adds.

**Every block form renders through the real component**, not an
approximation of one: `alert`, `code-block`, a real `<dl>` for `defs` and
`flags`, `List` for the next-step links. Figma's `tabbed` is its Code Block
`Show Header` boolean, which here is what carries the **copy control** — so
the shell transcripts a reader is meant to run have a copy button and the
illustrative snippets do not.

#### Publication gates must not reach the site at all

§6.0.4 drew three gates into the frames on purpose. They are addressed to
whoever builds the page — "do not ship this page before the deferred
accessibility pass has run" — and they must not be published.

**A first pass kept them as a block kind the renderer skipped, and that
leaked.** The whole page object is handed to a client component, so the gate
text sat in the serialized RSC payload of the public HTML: invisible on
screen, plainly there in view-source of the page it forbids. Gates are now
diverted into `src/content/gates.generated.json`, a file **no component
imports**; `pnpm gates` is the only reader. Verified zero matches in both the
dev HTML and the static export.

**A gate inside a `group` withholds that group.** The tokens page is why: its
"standard ramps" group documents work that is planned and not shipped, and
its gate says "Do not publish it". Dropping only the notice would have
published a `primitiv.json` config key that does not exist, without its
caveat. Six blocks withheld. A gate outside a group (the accessibility
page's, in `head`) has no mechanically derivable scope, so it withholds
nothing — `pnpm gates` reports which did which.

**Two sentences now dangle, and they need a copy decision.** With the
standard-ramps group withheld, §02's Palette block still says "A larger set
of standard ramps is available too … **see below**" and §04 still says "The
standard ramps are fixed and are not touched by this." Both are in
`PAGES`, so fixing them edits the Figma builder and puts the fingerprint
checker out of step with the canvas until the frames are rebuilt. The gate
resolves it either way: ship the ramps, or cut the claim from all three
places. Documenting a config key that does not exist was the worse of the
two, so the group is withheld and the dangling references stand.

#### Illustrations

The ten content-page briefs are still gaps. `ContentIllustration` reads a
manifest that is **empty** — an id absent from it renders nothing rather than
a placeholder box, which is the honest state (the prose reads on its own),
and a paired row collapses to one column when its illustration has not
landed. Exporting needs a human hand (gotcha 31). Alt text is authored in
that manifest, per illustration: the brief says what to draw, alt says what a
reader who cannot see it needs to know, and the two are not the same string.

#### Three dead-link families came out with the routes

Step 10, done properly rather than only in the nav:

- **`src/lib/nav.ts`** — Start Here / Registry & CLI / Design in Figma now
  derive their children from the page data (`pageLinks`), so a renamed
  heading renames its nav entry. Guides, Changelog and Harmoni are absent,
  not dead.
- **The footer** — every link was a `/#anchor` pointing at nothing. Recipes,
  Icons and Changelog came out (no page in any plan; Changelog deferred);
  the rest name their page. Its `columns={4}` was also a fixed four at every
  width despite a comment claiming it reflowed: at 390 that made four 66px
  cells and **every link overflowed its own cell, on every page of the
  site**. `Grid` takes a mobile-first map, so it is `{ base: 1, sm: 2, lg: 4 }`
  — the component's own prop, not a docs media query.
- **The home page** — the documentation map was entirely dead anchors, and
  the hero's primary "Start Here" button went to `/components/`.

#### The well is a width, not a margin

A code block sits inset by `space/space-48` on desktop (§6.0.4). Applying
that as `margin-inline` overflowed every section by exactly 48px: the
component sets `inline-size: 100%` **deliberately** (a flex item that is
itself a flex container with `overflow: hidden` does not reliably resolve
`width: auto` through its parent's stretch), so a margin shifts a full-width
box sideways instead of shrinking it. Overriding `inline-size` back to `auto`
would walk into the bug the 100% exists to prevent, so the well is
`calc(100% - space-96)` with `margin-inline: auto`.

#### Verification

`render-check.mjs` at 1280 and 390, dark and light: all eight content pages
clean, plus `/`, `/components/` and a component page re-checked for the
footer change. One pre-existing defect found and **not** fixed, since it
belongs to the component-page surface and its own handoff:
`/components/*`'s playground **`docs-control-grid` overflows at 390** (416 in
a 284 column), on all 42 pages.

**Still open on this increment:** the 40 illustration exports · the
`FIGMA-01` rebuild (§6.0.14) · the six remaining v3 home sections
(§6.0.15) · the deferred Split Button (§4.5) · and the deploy, which is a
deliberate act: read `pnpm gates` first, and decide the accessibility page's
gate before publishing it.

### 6.0.18 Mobile overflow across all 42 component pages (2026-09-12)

Every component page overflowed its viewport at 390. Fixed, and the whole
roster now passes `render-check.mjs` at 390, 768 and 1280.

**The playground, and it was not flex-wrap.** `.docs-control-grid` used
`repeat(auto-fit, minmax(26rem, 1fr))`, and **`minmax()`'s first argument is a
hard floor**: once the container is narrower than one track, auto-fit still
lays out a 416px column and the grid overflows by the difference rather than
shrinking. 416 in a 284px column, on all 42 pages, and it was the page's
horizontal scroll. The fix is `minmax(min(26rem, 100%), 1fr)` — cap the floor
at the container. The radio row inside it already had `flex-wrap: wrap` and
was never the problem; nothing could wrap while the track refused to shrink.

**The render check had to be hardened first, and this is the part worth
remembering.** It flagged the grid correctly, but also six false hits per page
from Code Block's `wrap={false}` `<pre>` — which scrolls on purpose, an
anatomy tree's aligned trailing `//` annotations being its content — and one
per Slider thumb. A tool that cries wolf gets ignored, so it gained three
filters:

- **A user-scrollable ancestor takes responsibility.** `overflow-x: auto` or
  `scroll` is an author saying "scroll this if it does not fit", so anything
  inside is intended.
- **`hidden` does NOT count, and that distinction is the whole thing.** A
  first pass excused any non-`visible` ancestor and **went green on the very
  bug it had just caught** — the control grid sits inside a `Card`, whose
  `overflow: hidden` clips media to the corner radius, so "someone above
  handles it" was false. `hidden` clips, which means content is being silently
  cut off: exactly what the check exists to find. Verified in both directions
  afterwards — reverted CSS fails, fixed CSS passes — and that round-trip is
  worth repeating on any future filter.
- **An element with no children and no text has nothing to clip.** Slider's
  18px thumb measures 22 (its 2px borders), on every thumb.

**Five pages had their own causes, all separate defects:**

| Page | Cause | Fix |
| --- | --- | --- |
| `aspect-ratio` | Demo frames at fixed `20rem`/`22rem`, and a non-wrapping row of three `7rem` frames | `maxInlineSize: 100%` on `frameBase`; `flexWrap` on the comparison row |
| `radio-card` | The orientation example's `Stack direction="row"` ran 443px of cards into 284 | `wrap="wrap"` — a wrapped row is still a row-direction Stack, so the example still demonstrates `orientation` |
| `spacer` | The three-group navbar needs ~327px and **cannot wrap and stay a demo** — `Spacer` distributes the leftover space of ONE row | `overflowX: auto` on the bar, so it scrolls in its own box |
| `checkbox-card` | Lede carries `unchecked/checked/indeterminate).` — 336px in a 326px column | `overflow-wrap: break-word` |
| `code-block` | Lede carries `(CodeBlock.Tabs/Header/List/Trigger/Content/Copy)` — 492px | as above |

**The two lede cases are structural, not one-offs.** That prose is *generated*
from source JSDoc, and slashes and dots are not line-break opportunities — so
any identifier-heavy lede pushes the whole page wider than the viewport, and 21
component pages are still to come. `overflow-wrap: break-word` only breaks a
word that cannot fit a line on its own, so ordinary prose is untouched;
`.docs-section-meta` got it too, being the same kind of text from the same
source.

### 6.0.19 The illustration drop-in, and why the export needs a human (2026-09-12)

The forty PNGs are the last thing standing between the eight content pages and
a deploy. Everything on the code side is now built and **verified against
stand-in files**, so landing the art is one command.

**Getting pixels out of Figma is blocked at the network policy, and re-pairing
the Desktop Bridge does not change it.** Measured, not assumed:
`get_screenshot` works and returns a short-lived URL on `www.figma.com`, and
the egress proxy answers **403 at CONNECT** for that host — the same wall
`upload_assets` hits (gotcha 31), reached from the other direction.
`download_assets` serves from the same origin. The distinction worth keeping:
the plugin relay is a *different* host and is fine, so **scripting the canvas
works and reading rendered pixels does not**. The only bridge route for pixels
is `exportAsync` → base64 through `figma_execute`, at roughly 150,000
characters an image; forty of those is millions of characters of context for
2.4MB of files. So the export is a human's job, and this is a property of the
sandbox rather than of Figma.

**Rebuilding the ten as HTML scenes was considered and rejected.** The
machinery exists — `tools/a11y-recorder` is a vite app whose scenes are picked
by query string and captured by a local Chromium at an exact size and DPR, and
it is how A11Y-01, CODE-01 and FIGMA-01 were made. The tempting argument for it
is palette survivability, and **that argument is wrong**: §6.0.9 already
measured that the Figma illustrations follow a regeneration (575 bound paints,
zero unbound, zero drifted) and `resync-illustration-literals.js` lands the new
values. The only thing that does not follow is an exported raster, and
re-exporting after a resync is the same work as exporting the first time.
Rebuilding ten settled Figma diagrams in HTML to avoid a future re-export is a
bad trade. FIGMA-P01 remains the one that must be *retaken* rather than
resynced, exactly as §6.0.9 says.

**What to export.** Forty files into
`apps/docs-site/public/illustrations/`, named
`<id>-<desktop|mobile>-<light|dark>.png`, lowercased — matching the home page's
`a11y-01-*` convention. `pnpm illustrations` prints the full list of what is
missing, so the names never have to be typed from memory. The light twins are at
x=3400 (desktop) / x=4100 (mobile) on `Docs Site — Content illustrations`
(§6.0.10). Scale does not matter: the site sizes these to the column and only
uses the aspect, so 1x or 2x both work — 2x is the better choice for a HiDPI
screen.

**The geometry is measured, never declared.** `scripts/gen-illustrations.mjs`
reads each PNG's own IHDR — no dependency, the header is a fixed signature then
a length, `IHDR`, and two big-endian integers. This is deliberate: every one of
these ten has a brief stating a ratio and **three were built at a different
size**, the briefs' ratios having been written before the content existed
(§6.0.5, §6.0.6, §6.0.8). A number typed into the site would have been the
fourth opinion about each image's shape. The generator also **fails** when a
light and dark twin disagree on size, since the twins are clones of one frame
and a mismatch means a stale frame or a different export scale.

**An id renders only when all four of its files are present.** A half-landed
illustration shows nothing rather than a broken theme or a broken breakpoint,
and a paired row (DENSITY-C02, COMPOSE-01, FIGMA-P02) stays one column until
its illustration arrives.

**`<picture>` for the breakpoint, the hook for the theme, and that split is
forced.** `<source media>` cannot key on `prefers-color-scheme` or on the
toggle's `data-theme`, while doing the theme swap in CSS downloads both files.
So the media query picks the composition at the shell's own 64rem boundary —
where both rails drop and every brief asks for its stacked version — and
`useDocsTheme` picks the twin. Exactly one image is fetched. Each source
carries its **own** measured aspect ratio, because the mobile version is a
recomposition and not a scaled copy.

**The alt text is authored, all ten, and it is brief-derived.** A brief says
what to draw; alt says what a reader who cannot see it needs to know, so it
cannot be generated. Each string is written from that illustration's brief and
its build notes — which means **each wants one look against the landed export**
before publication, and that check belongs with the export rather than here.

**Verified before the art exists, in both directions.** Two illustrations were
faked from the A11Y-01 assets (START-01, and COMPOSE-01 for the paired case) and
the render confirmed: desktop serves `-desktop-`, mobile serves `-mobile-`, dark
serves `-dark-` and light `-light-`, the paired row goes `300px 300px` at 1280
and one `326px` column at 390, and alt reaches the DOM. The stand-ins were then
removed and both pages re-checked clean at 0/10. `pnpm check:illustrations`
guards the manifest against the folder.

### 6.0.20 Home section 5 — the colour proof sheet, live (2026-09-12)

Section 5 is built and on the page, ahead of §2.6. It needed **no artwork**,
which is what made it the right next section: §2.5's revision away from an
interactive Harmoni demo to "the real shipped palette as a proof sheet" left
something that is a rendered DOM specimen rather than an image.

**Every colour comes from the engine, and that is enforced end to end.**
`harmoni-core`'s `swatch-sheet` example already dumped the five generated ramps
with each swatch's `best_foreground`; this session **added the neutral row**,
which the dumper deliberately could not produce (neutral comes from the
`neutral` module, its 500 differs by theme where every chromatic ramp shares one
seed, and it is not reproducible from `harmoni-seeds.json`). Its swatches are
read out of the shipped `palette.json` and paired through
`get_best_foreground` — the same primitive the generator and the neutral module
call — with that ramp's own 900 and 50 as the harmonious candidates and the
shipped soft white/black (`color.white` / `color.black`) as the customs, which
is `neutral::ramp`'s own argument list.

**And the example proves the method before trusting it.** The same code path is
run over the five generated ramps, whose pairings are already known, and every
one must agree: **100 of 100 re-paired identically, 0 skipped.** That also
corrected an assumption — CLAUDE.md notes `info` is "not reproducible from its
seed", which is about chroma against the seed's intent, not about the committed
hexes disagreeing with a fresh generate. They agree exactly. A swatch whose hex
had drifted would be skipped and counted, and the assertion fails below 80 of
100 rather than quietly testing nothing.

**`generated` rides in the data, per ramp.** The 100-swatch CI guard covers the
five generated ramps; neutral is shipped but outside it. Showing neutral is
correct — it is where most interface colour comes from — so the flag is in the
JSON and the prose states the scope, rather than a caption being trusted to
remember.

**First code consumer of the `swatch/*` Context family**, which was authored for
exactly this specimen and had nothing reading it: `box`, `gap`, `panel-cap`,
`radius`, `sample-size`, `sample-caption-size` and `padding-block` all come from
it, so the sheet scales with density like everything else.

**Two composition decisions worth keeping.** The radius belongs to the SCALE,
not the swatch — rounding each chip would put ten corners back into a row that
must read as one continuous ramp, so it is clipped at the row. And the ten
tracks are `minmax(0, 1fr)`, not `1fr`: a track's `auto` minimum is its
content's min-content width, so the "Ag" would floor each track and the row
would overflow on a phone instead of compressing. A ramp that wraps stops being
a ramp, which is the brief's own instruction.

**`box` is a FLOOR, not a height — a real defect.** `sample-size` (32) plus
`sample-caption-size` (13) is 44px of content in the 40px `box`, so the step
number under every "Ag" was sliced off by the row's clip. Height is intrinsic
now, with the family's own `padding-block`. **The screenshot found it; the
render check could not**, which is its own finding below.

**Three departures from the copy document, all deliberate.** The "standard
ramps" sentence is cut — the copy marks it PENDING and says to cut it if this
section publishes first, which it does. Harmoni is **named but not linked**: the
copy asks for a link to its own site, which does not exist yet (§3.9), and the
footer and documentation map got the same call. And **COLOUR-02, the hue-drift
diagram, is not here** — it is the one claim in the section a reader cannot
verify from the sheet, so those paragraphs ship stated and CI-gated but not yet
drawn. Its data is already generated (`colour-02-hue-drift.json`).

#### The render check is horizontal-only, and that is now a conclusion

Extending it to the vertical axis looked obvious — its own comment claimed both
axes — and was **reverted the same hour**. `scrollHeight` exceeds
`clientHeight` on essentially every piece of trimmed type here, because the
registry uses `text-box-trim`: measured on the home page, the hero heading reads
**24px over a 112px box** and a proof figure 11 over 64, both correct on screen.
The magnitudes scale with font-size, so they are *larger* than real defects —
the clipped swatch was 4px — and no threshold separates them. A precise clipping
detector (a child whose rect leaves a `hidden` ancestor's rect) was also tried:
very quiet, but it **missed that same swatch**, because the clipper was the
grandparent. A vertical clip needs the screenshot the script can already take.

---

### 6.0.21 The site holds from 320 to 1600 (2026-09-12)

Seven more overflow defects, every one at a width nobody had checked. The
lesson across all of them: **the breakpoint has to be measured, not estimated.**
Two guesses at the proof strip's threshold (64rem, then 70rem) each shipped an
overflow before measuring showed the row needs **1216px** of content, which only
an `xl` container at 1280 provides.

| Defect | Cause | Fix |
| --- | --- | --- |
| Proof row broke out of its section at 1024 and 1120 | Five 175px tiles + four dividers + eight 40px gaps need 1199px | Row above 80rem, stacked below — no intermediate state |
| Path cards' install tabs overflowed their card header on every tablet | `columns={3}` fixed at every width; three ~188px cards at 768 | `{ base: 1, lg: 2, xl: 3 }` |
| `/components` and a component page overflowed at 320 | `minmax()` hard floor, twice more | `min(X, 100%)` |
| Install tab strip overflowed by 3px at 340 | Four triggers measure 213px and none can shrink | `min-inline-size: 0` + `overflow-x: auto` on the strip |
| Index card titles collapsed to ONE LETTER PER LINE at 320 | Header is `[title][status pill]`; the pill is a fixed ~90px | `flex-wrap: wrap` on the header |
| The component-page header crushed its status Badge 48px → 20 on **21 of 42 pages** | The row was `nowrap` **against a comment claiming it wrapped** | `flex-wrap: wrap` below md |
| A fixed-width playground demo escaped its preview at 320 | The preview's implicit column is `auto` = max-content, so the demo grew the track and its own `max-inline-size: 100%` measured *that* | `grid-template-columns: minmax(0, max-content)` |

Two of these are worth internalising. **A percentage cap is only as good as the
track it measures** — `max-inline-size: 100%` was set on that demo and did
nothing. And **a crushed column wraps, it does not overflow**, which is why the
card titles and the squeezed Badge sat there unflagged: the index card titles
were already wrapping to two lines at the 390 baseline.

**State: the home page, the components index, all eight content pages and all
42 component pages are clean at 320, 390, 768, 1024, 1280 and 1600**, in both
schemes.

**Still open, and deliberately bounded:** eight component pages have per-example
overflow at **320 only** — `code-block`, `divider`, `dropdown`, `figure`,
`grid`, `list`, `segmented-control`, `stack`. Every systemic cause is fixed;
what remains is individual demos whose content is genuinely wider than 320
(a five-segment control, a multi-column grid), and each needs the same
per-case judgement the `spacer` navbar got — wrap, scroll, or shrink, depending
on what the example is *for*. 320 is below the 390 baseline the site is designed
against, so this is a known edge rather than a regression.

### 6.0.22 320px is a conformance floor, not an edge (2026-09-12)

Corrected from §6.0.21, which called 320 "a known edge rather than a
regression". It is neither: **WCAG 2.1 SC 1.4.10 Reflow (Level AA)** requires
content to reflow without scrolling in two dimensions at a width equivalent to
**320 CSS pixels** — the width a 1280px viewport reaches at 400% zoom, which is
where the number comes from. The eight pages left open were an AA gap.

**The gate now asserts the criterion itself.** `render-check.mjs` tests
`documentElement.scrollWidth > clientWidth` — does the page scroll sideways —
which is stricter and far less ambiguous than the element scan beside it. Both
run, because they catch different things: a page can have elements overflowing
their boxes while the document does not scroll (an ancestor clips them, so
content is silently cut off), and a page could scroll with no single element
flagged. **Verified: not one page on the site scrolls horizontally at 320** —
the home page, the components index, all eight content pages and all 42
component pages. That was already true before this increment; what was wrong
was content being *clipped* inside cards.

**The rule that resolved it: layout gives way, controls do not.**

- **Layout containers release their min-content floor.** A flex or grid item
  defaults to `min-width: auto`, i.e. its min-content width, so a demo refuses
  to shrink however narrow the preview gets. Measured at 320, where an example
  row is 214px: List floored at 270, Stack at 237, Segmented Control at 227 and
  231, Grid at 218. `min-inline-size: 0` throughout a preview lets them reflow —
  it only *permits* shrinking, so a demo still takes its natural size whenever
  there is room. It has to go all the way down, not just to the demo root:
  Stack's `Short / A taller cell / End` row needs the CELL to give way so its
  text wraps, because wrapping the row would destroy the very thing that demo
  shows (alignment across one row).
- **Controls opt back out, because a label is content.** This was a defect the
  release itself created: Tooltip's `default` trigger was cut to 34px of a 47px
  label, and a Code Block tab reading "npm" was squeezed into an **8px** box.
  Buttons, tab triggers, segment and toggle items keep their natural width.
- **A single strip of options scrolls inside itself.** A tab list, a segmented
  control and a toggle group are each one control whose options sit in a row;
  wrapping one into two rows stops it reading as a single control, and
  truncating "This quarter" loses the option's meaning. That is precisely what
  1.4.10 excepts as content requiring two-dimensional layout, with a scroll
  container as the accepted technique — and the scroll stays *inside* the strip,
  so the page never scrolls. The **cap** was the missing half: a content-sized
  strip inside a Stack takes its max-content width, so `overflow-x: auto` alone
  never engaged and the strip just grew.

**Three demos needed their own answer**, since a blanket rule cannot decide what
an example is for: Divider's nav strip wraps (a vertical rule still reads on
whichever line it lands on), Figure's 14rem media frame caps at the preview, and
Grid's alignment demo moves to `columns={{ base: 2, md: 3 }}` in **both** the
render and its code block — three `nowrap` padded cells need 68px in a 60px
track at 320, and saying so with the breakpoint map is better documentation than
implying three fit, that map being the component's headline feature.

**One measurement nearly sent this the wrong way, and the lesson is the check.**
Arrowing to an off-screen segment focused it without scrolling it into view,
which read as a stranded-focus defect serious enough to abandon the scrollers.
Before acting I reproduced it on a **minimal** page — a plain
`overflow-x: auto` flex row of four buttons — and it behaves identically, so it
is a headless-Chromium artifact, not anything in this CSS. Real browsers scroll
a focused element into view. **That cannot be verified in this sandbox**, so it
is stated as unverified rather than claimed: worth one look in a real browser
alongside the other visual QA.

Also corrected: the `render-check.mjs` comment that claimed the overflow scan
covered both axes. §6.0.20 records why it cannot.

### 6.0.23 Home section 3, and a pattern for the engine-backed diagrams (2026-09-12)

Section 3 ("You are already paying for a design system") is built and on the
page, between the proof strip and section 5. Section 4, the live density demo,
belongs between them and is still to come.

**PROBLEM-01 is rendered, not exported — and that is the better version of the
brief rather than a workaround.** Its own `assets` block asks for "button
(registry), primary variant, size md, deliberately mis-configured per instance
via inline overrides", and in code that is literally what it is: three real
`Button`s re-pointing their own contract knobs (`--primitiv-button-bg`,
`-height`, `-radius`, `-padding-inline`, `-font-weight`), which is exactly how
this happens in a real codebase — nobody forks the button, they tweak it in
place until it looks right on their screen. Verified the overrides land rather
than trusting the render: `#176fdd/#2c6ce7/#3966de`, heights 40/42/45, radii
4/6/10, the third label at 600 where the others are 500.

**The subtlety is gated, not judged.** The brief's craft note wants the
differences "right at the edge of perceptible" and its `must-not` forbids
exaggerating them ("a reader who thinks 'no team would ship that' has stopped
believing the section"). The engine places each colour in OkLCH off the brand
seed and reports the pairwise Oklab ΔE; the widest pair is **0.0257**, inside
the brief's 0.02–0.04 band, and **the generator throws above 0.04**. So a future
regeneration cannot quietly make the diagram argue the wrong case.

**This is now the pattern for the engine-backed sections**, and COLOUR-01 in
§6.0.20 was the first: where the engine already dumps the data, the home page
renders it live rather than shipping a raster. Three consequences worth having —
it needs no Figma export (the one thing this sandbox cannot do, §6.0.19), it
follows a palette regeneration by re-running one command, and it is the real
components rather than a picture of them. **What it does not replace** is
artwork that is genuinely an image: FIGMA-01 is a screenshot of the Figma UI and
CODE-01 is a screen recording of a real VS Code, and neither has a code-side
equivalent.

**The four per-dataset generators became one.** `gen-palette-sheet.mjs` is
replaced by `gen-engine-data.mjs`, which emits every `docs/generated/*` derived
file behind one `pnpm gen:engine-data` and one `check:engine-data`; the third
dataset (COLOUR-02's hue drift) is already committed and waiting. They share a
source directory, a staleness question, and the rule that nothing here computes
a colour, so one script is right.

#### Illustration state, precisely

| Item | State |
| --- | --- |
| The ten content-page briefs | **0 of 10.** Code side done and verified (§6.0.19); blocked on the 40-PNG export, which needs a human — `pnpm illustrations` prints the names |
| A11Y-01 (§2.9) | Landed — video, still, both breakpoints, both themes |
| COLOUR-01 (§2.5) | Landed, **live** |
| PROBLEM-01 (§2.3) | Landed, **live** |
| COLOUR-02 (§2.5) | Not built. Data committed (`colour-02-hue-drift.json`) — two ramps, their hues, and a hue-sweep track. Buildable live, unblocked |
| Section 4's density demo | Not built. Interactive, **no artwork at all**. Unblocked |
| FIGMA-01 (§2.6) | On the page but **needs a rebuild** — the dark composite carries a light Figma canvas and there is no mobile recomposition (§6.0.14). Needs Figma |
| CODE-01 (§2.7) | Section not built. A real VS Code recording from an earlier session sits in the recorder's gitignored `out/` (769KB mp4 + still) — **unreviewed**, so not committed |
