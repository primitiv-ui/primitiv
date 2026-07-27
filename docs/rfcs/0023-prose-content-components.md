# RFC 0023 — Prose & content components

> **Status:** Draft — proposed
> **Author:** Claude, with architectural drafting
> **Date:** 2026-07-27
> **Builds on:** RFC 0012 (Figma web typography build — the 27-item checklist
> and every token binding this RFC cites), RFC 0014 (Table — the already-
> landed React + registry crossover this proposal mirrors for the remaining
> elements), RFC 0015 (Figure + Figcaption — **explicitly Figma-only** per
> its own decision record; revisited in §2.5 below, not reversed), RFC 0016
> (spacing & flow rhythm — the `prose`/`<Prose>` registry precedent this
> family follows the shape of). Skills: `new-registry-component`
> (hand-authored flow), `figma-prose-component` (the Figma-side conventions
> already used to build every component named here — nothing here needs new
> Figma work). Sibling proposals from the same session: RFC 0021 (composite
> components), RFC 0022 (layout primitives).

## 1. Why this exists

RFC 0012 built a complete 27-element Figma typography library — text styles
and components for every HTML prose element, fully token-bound across all
three density modes and both themes. Of that library, only a handful of
elements ever crossed into `packages/react` + the registry: **Table** (RFC
0014), the flow-rhythm container (**`prose`**, RFC 0016), and the
hand-authored **Inline Code** / **Code Block** pair. **List, DescriptionList,
Blockquote, Pull Quote, and Kbd are fully designed — token-bound, every
density/theme variant built, zero outstanding Figma work — and sit
Figma-only today.**

That makes this the cheapest, lowest-risk expansion available anywhere in
the roadmap: the design has already been paid for. This is purely a code
build against specs that already exist, not a new design decision.

## 2. Scope

Five components, all hand-authored (no interactive primitive underneath,
following the `prose`/`inline-code`/`code-block` pattern — no
`packages/react` headless companion, no new ARIA pattern beyond the
semantic HTML element itself, no behavioural test suite beyond the registry
type-check, mirroring the existing no-test precedent already applied to
`prose`/`inline-code`).

### 2.1 List

`<ul>`/`<ol>` + `<li>`. Figma: `List` (Indent × Type × Size = 20 variants,
8 item slots) + `ListItem` (Type × Size × State = 20 variants) — RFC 0012
D9. Tokens already landed: `list/marker/foreground` (Intent), `list/item-gap`
/ `list/marker-gap` / `list/indent` (Context, density-scaled). API sketch:

```tsx
<List type="unordered" indent>
  <List.Item>First</List.Item>
  <List.Item>Second</List.Item>
</List>
```

### 2.2 DescriptionList

`<dl>`/`<dt>`/`<dd>`. Figma: 5 size variants, **no new tokens** — both text
nodes use `content/primary`, `<dt>` fixed to SemiBold across all density
modes (RFC 0012 D10).

```tsx
<DescriptionList>
  <DescriptionList.Term>Version</DescriptionList.Term>
  <DescriptionList.Details>0.1.0</DescriptionList.Details>
</DescriptionList>
```

### 2.3 Blockquote + Pull Quote

`<blockquote>` (left-stroke accent bar, Tone `default`/`accent`, Size ×
Citation — RFC 0012 D12, tokens `quote/padding-inline` +
`quote/body-gap/{size}`) and its sibling **Pull Quote** (a large centred
editorial quote with a decorative mark, no accent bar or attribution — D13,
no new tokens, rides the existing `heading/*` scale). Both come from the
same Figma family and are cheap to land together.

```tsx
<Blockquote tone="accent" cite="Author Name">
  The quoted text.
</Blockquote>

<PullQuote marks>A large editorial pull quote.</PullQuote>
```

### 2.4 Kbd

`<kbd>` — a leaf chip, sibling of Inline Code, differing only in surface
treatment (`surface/raised` + `border/default` instead of Inline Code's
`surface/subtle` + `border/subtle`, so it reads as a physical keycap — RFC
0012 D17). **No new tokens at all** — the simplest possible entry on this
list, and the recommended first build (see §5).

```tsx
<Kbd>Esc</Kbd>
```

### 2.5 Figure + Figcaption

`<figure>`/`<figcaption>` — media wrapper with a caption in one of three
positions (`below`/`above`/`overlay`), the `overlay` position compositing
Figcaption's `Tone=overlay` variant against the `inverse` token pair (RFC
0015). One new Context token, `figure/caption-gap`, already landed.

**RFC 0015 decided there is no headless React `Figure`** — that decision is
not being revisited here. What's proposed is the same kind of thing `prose`
is: a **registry-only, hand-authored wrapper** with zero behaviour, `asChild`
composition, no props beyond styling — not a stateful primitive. Pairs well
with `AspectRatio` from RFC 0022 for sizing the media slot, though it isn't
a hard dependency.

```tsx
<Figure captionPosition="overlay">
  <Figure.Media><img src="…" alt="…" /></Figure.Media>
  <Figure.Caption>A caption.</Figure.Caption>
</Figure>
```

## 3. What makes this build unusually low-risk

- **Zero new tokens to design for List, DescriptionList, Kbd, and Pull
  Quote** — everything they need is already in `context.json`/`intent.json`.
  Blockquote and Figure each have exactly one existing token to reuse
  (`quote/*`, `figure/caption-gap`) — nothing new to invent.
- **No Figma work at all.** Every component set, every variant, every grid-
  labels/example-frame furniture piece already exists (RFC 0012 built and
  landed all of it; RFC 0015 landed Figure). This RFC is purely "build the
  code side of a spec that's already done," the same shape as Table's
  crossover (RFC 0014) but for five components instead of one.
- **List's one Figma-side quirk doesn't carry over.** RFC 0012 D11 notes
  List's item slots stayed as named nested instances rather than
  INSTANCE_SWAP properties, purely because of a Figma-API restriction on
  unpublished local components. The web build has no analogous limitation —
  `List.Item` children are just real DOM children.

## 4. Definition of done

Standard CLAUDE.md bar per component: `contract.json` + `styles.css`/
`.scss` + recipe + wrapper + `README.md`, a row in `ROADMAP.md`'s coverage
table, a kitchen-sink demo. No `packages/react/README.md` row is needed for
any of these — there's no headless component to list there, same as
`prose`/`inline-code`/`code-block` today.

## 5. Suggested build order

1. **Kbd** — zero tokens, simplest possible leaf, proves the "pure
   mechanical crossover" pattern with the least surface area.
2. **Blockquote + Pull Quote** — one existing token family each, no
   item-slot complexity.
3. **List + DescriptionList** — the two with boolean-expansion (List's
   8-item-slot / `Show Item 5–8` pattern, DescriptionList's `Show pair 3/4`)
   to translate into React children logic.
4. **Figure + Figcaption** — last, since it benefits from `AspectRatio`
   (RFC 0022) existing first for its media slot, though it isn't blocked on
   it.
