# RFC 0022 — Layout primitives

> **Status:** Partially landed — build-order steps 1 and 2 shipped 2026-07-28
> (Box, Stack, Spacer, Center, AspectRatio: registry + kitchen-sink). Step 3
> (Container, Grid — blocked on RFC 0025's breakpoint scale, see §4) remains
> proposed.
> **Author:** Claude, with architectural drafting
> **Date:** 2026-07-27
> **Builds on:** RFC 0008 (CSS architecture — the `@layer primitiv.*` stack
> these components render into), RFC 0009 (mode scoping — density as an
> inheritable attribute, and the **§5 responsive/container-query design
> that's deferred but not yet built** — directly relevant here, see §4), RFC
> 0016 (spacing & flow rhythm — the `space-*` primitive scale, the `flow/*`
> Context tokens, and its closing note that "`gap` stays the tool for
> component-internal spacing," which this RFC picks up literally). Prior art
> for the hand-authored, primitive-less registry shape: `prose`,
> `inline-code`, `code-block` (see the `new-registry-component` skill).
> Sibling proposals from the same planning session: RFC 0021 (composite
> components) and RFC 0023 (prose/content components) — RFC 0024 (app-shell
> patterns) depends on this one landing first.

## 1. Why this exists

Every component Primitiv ships today is a **widget** — something with its
own interaction, state, or ARIA role. Nothing arranges widgets *on a page*.
A consumer building a real screen still has to hand-roll their own Flexbox/
Grid CSS to stack a `Field` under a `Field`, centre a `Modal`'s content, or
lay out a sidebar next to a main column — exactly the kind of ad hoc,
inconsistent work the rest of the system exists to prevent. This is the
most conspicuous structural gap in the library, and the cheapest kind of
component to build: no ARIA research, mostly CSS, small API surface per
component.

## 2. Scope & non-goals

Every candidate here renders a plain element (or the consumer's own,
via `asChild`) with layout CSS and zero interactive behaviour. Like `prose`,
these are **hand-authored, primitive-less registry components** — no
`packages/react` headless companion, no new ARIA pattern, no behavioural
test suite (mirroring the existing no-test precedent for `prose`/
`inline-code`, since there's nothing behavioural to assert on). This is
explicitly **not** a new component-model layer or a CSS utility framework —
each primitive is a small, named component with a handful of props, in
keeping with everything else Primitiv ships.

## 3. Candidate primitives

| Component | What it is | Token surface | Design risk |
|---|---|---|---|
| **Box** | The escape hatch — a bare polymorphic element (`asChild`), no visual opinion. Exists so a consumer has *something* to attach a custom property or a one-off style to without reaching for a raw `<div>`. | none | None — the simplest possible registry component. |
| **Stack** | `display: flex`, `direction="column"` (default) or `"row"`, a `gap` prop resolved against the `space-*` scale (never a raw px value), optional `align`/`justify`. Directly continues RFC 0016's "`gap` is the tool for component-internal spacing" — this is that tool, generalised into a component instead of ad hoc CSS per consumer. | `space-*` (existing) | Low. |
| **Spacer** | A `flex: 1 0 0` blank element for pushing flex siblings apart (toolbar left/right groups, card footers, nav bars). | none | Low — trivial, but load-bearing once Data Table/Card/toolbars need it. |
| **Center** | Single- or both-axis Flexbox centring box. | none | Low. |
| **AspectRatio** | Constrains embedded media (image/video/map/iframe) to a ratio via CSS `aspect-ratio`. | a `ratio` prop (unitless, consumer-supplied) | Low — useful immediately for Figure's media slot (RFC 0023) and Card's media slot (RFC 0021). |
| **Container** | Centred, max-width content column with token-bound inline gutter padding. | needs a `size`/max-width scale — **the one open decision, see §4** | Medium. |
| **Grid** | CSS Grid wrapper — `columns` (a number), `gap` (token-bound), `rows`. | `space-*` for gap; **columns as a responsive prop touches §4** | Medium. |

Stretch, not part of the initial build: **Wrap** (flex-wrap tag/chip
layout) — useful once Badge/Tag/Chip (RFC 0021 Tier 1) ships, low priority
until then.

## 4. The open decision — responsiveness and the missing breakpoint scale

`Container` and `Grid` are the two candidates that *want* to answer "how
does this change across viewport widths" — and today **no breakpoint
primitive scale exists anywhere in the token system.** RFC 0009 already
designed (but explicitly deferred, D44) a container-query-based responsive
density model: each density exposed as a reusable declaration block an
`@container` query can apply. That's the same mechanism a responsive
`Grid`/`Container` would want, and building it twice — once for density,
once for layout — would be a real drift risk.

Two paths:

- **(a) Ship v1 non-responsive.** `Container` gets one fixed max-width per
  `size`; `Grid`'s `columns` is a plain number, no responsive object. A
  consumer who needs viewport-responsive behaviour writes their own media
  query around the component, same as they do today. This is the cheaper
  path and matches the precedent RFC 0009 already set (v1 ships the
  attribute-based mechanism; responsive is a designed, deferred follow-on).
- **(b) Design the breakpoint scale now**, so `columns`/`size` can take a
  responsive-object shape (`columns={{ base: 1, md: 2, lg: 3 }}`) emitted
  as `@container` blocks, landing alongside RFC 0009 §5 rather than
  colliding with it later.

**Recommendation: (a) for v1.** Scope creep into RFC 0009's deferred work
is a bigger commitment than this RFC should make unilaterally — flag it
here, land the fixed-size versions, and revisit responsive `Grid`/
`Container` as an explicit fast-follow *when* RFC 0009 §5 gets picked up,
so the two build on the same breakpoint mechanism instead of each
inventing its own.

## 5. Build pattern & conventions

Follow `new-registry-component`'s hand-authored flow exactly — the six
files under `registry/components/<name>/`, the `registry.json` +
`crates/primitiv-cli/src/ports/registry.rs` + `crates/primitiv-cli/tests/
cli.rs` three-edit registration, the kitchen-sink hand-sync. `contract.json`
mirrors `prose`'s shape (root element + class, `customProperties` for the
gap/max-width scale, no `dataAttributes` — there's no state to reflect).
Add a new **"Layout"** section to `ROADMAP.md`'s coverage table alongside
the existing categories.

The kitchen-sink demo for this family is unusually easy to make convincing:
wrap the kitchen-sink's *own* page shell in `Stack`/`Container` once they
exist, so the dogfooding is immediate and visible rather than a token
isolated example block.

## 6. Suggested build order

1. **Box, Stack, Spacer** — zero design risk, immediately useful, no
   breakpoint question at all (no responsive columns to decide on).
2. **Center, AspectRatio** — still simple, unlocks Figure's (RFC 0023) and
   Card's (RFC 0021) media slots.
3. **Container, Grid** — sequence last, after §4's decision is made
   deliberately rather than by default.

## 7. Relationship to the other proposals from this session

`Container`/`Stack` are a **hard prerequisite** for RFC 0024 (app-shell
patterns) — a Hero or Page Header is meaningless without something to
constrain its width and stack its children. RFC 0024 should not start
before this RFC lands.

## 8. Build outcome — step 1 (landed 2026-07-28)

Box, Stack and Spacer landed exactly as scoped in §6's build order, all
hand-authored/primitive-less per §2 — registry (`registry/components/{box,
stack,spacer}`) + kitchen-sink (a new "Layout Primitives" section, plus
`Stack` reused throughout the intro article to lay out the RFC 0023 demos
built alongside this batch). Three decisions made at build time, not
pre-settled by the draft:

- **`Stack`'s `gap` prop is a curated 5-step scale** (`none`/`xs`–`xl`), not
  the raw `space-*` scale directly. The draft's "resolved against the
  space-* scale" left the exact shape open; a curated set matches the
  `xs`–`xl` convention every other component in the system already uses,
  rather than exposing the full ~24-step primitive scale as modifier
  classes.
- **Each step (except `none`) is its own density-scaled `stack/gap-*`
  Context token, not a direct reference to a flat `space-*` primitive.**
  The first build bound the gap steps straight to `space-*` (`gap-md` →
  `space-space-16`, etc.), which meant a Stack's gap didn't re-tighten
  under `[data-density]` — every other spacing knob in the system that
  scales with a size-like axis (Accordion's `framed-control-{size}-gap`,
  Dropdown's `dropdown-{size}-item-gap`) does so through a dedicated
  Context-token family, not a raw primitive, so a fresh `stack/gap-*`
  family (5 new tokens × 4 density modes, sized proportionally against the
  existing `space-*` scale) was added to `context.json` and wired in as a
  follow-up fix. `none` is the one exception — zero has no density curve to
  scale, so it still pins `space-space-0` directly.
- **`align`/`justify` are inline-style passthroughs, not modifier
  classes** — they're plain Flexbox keywords (`"center"`,
  `"space-between"`, …), not design tokens, so there's no fixed enum to
  drive a `cva` variant from.

Center, AspectRatio (step 2) and Container, Grid (step 3, blocked on RFC
0025) remain unbuilt.

## 9. Build outcome — step 2 (landed 2026-07-28)

Center and AspectRatio landed the same session as the follow-up fix in §8,
both hand-authored/primitive-less per §2, registry + kitchen-sink (both
extend the "Layout Primitives" section from step 1 rather than earning a
dedicated one). No new tokens for either.

- **`Center` carries no sizing opinion** — like `Box`/`Stack`/`Spacer`, it
  forces no width or height, only alignment. Each `axis` variant
  (`"both"|"horizontal"|"vertical"`) sets *both* Flexbox alignment
  properties explicitly, rather than overriding one from a shared base, so
  the uncentred axis reads as `flex-start` (content-driven) instead of
  stretching to fill it — the draft didn't specify this, and stretching
  turned out to be the wrong default on inspection.
- **`AspectRatio` uses the modern `aspect-ratio` CSS property directly**, as
  the draft specified — no padding-bottom hack. `ratio` is a continuous
  numeric value, so it is set inline as `--primitiv-aspect-ratio` per
  instance (the same treatment `Stack` gives `align`/`justify`) rather than
  a modifier class. The child is wrapped in a `__content` element that fills
  the ratio box regardless of its own intrinsic size; an `<img>`/`<video>`
  still needs its own `object-fit` from the consumer to crop rather than
  distort.

  **Follow-up (2026-07-28) — the component was right; the *demo* was wrong.**
  The deployed kitchen-sink showed the 1:1 box painting over the two sections
  below it. The cause turned out to be **`align-items: start` on the container**,
  not anything in `AspectRatio`. `start`/`flex-start`/`center`/`end` take the
  items out of the row's sizing, so the row collapses to the content's own
  height while each box still renders at its ratio height. The default
  `stretch` is correct here and does *not* fight the ratio: `aspect-ratio` on a
  definite width is a **definite** block size, and stretch only applies to an
  `auto` one — so each box keeps its ratio and the row sizes to the tallest.

  Three plausible CSS diagnoses were shipped and wrong before this was pinned
  down (content out of flow → in flow → a percentage-padding spacer). What
  settled it was **measuring the deployed page in Chrome over the DevTools
  Protocol**, sweeping component × container combinations: only
  `grid` + default `stretch` produced row 472 with boxes 266/472. Two lessons
  worth keeping: `overflow: hidden` stays on the box as a backstop so a
  mis-sized ratio box crops instead of spilling; and a layout bug of this shape
  should be measured in a browser before any CSS is written, not reasoned about
  from a screenshot.

Container, Grid (step 3, blocked on RFC 0025) remain unbuilt.
