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
arithmetic finds 48 × 0.1875 = 9 and reads 8. The copy needs one qualifying
clause — the fraction snapped to the nearest step on the radius scale — rather
than the diagram hiding the numbers. Not changed here: the copy doc owns its
own words.

**2. Spacious and Comfortable are visually identical at the corner.** Whether
that is intended or a gap in the scale is a token question, not a copy one.
Worth a look before the density page publishes, because a reader comparing the
two columns in this very diagram will see two different heights and one
radius.

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
