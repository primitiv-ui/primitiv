# Registry bugs — surfaced by the docs-site build

Status as of 2026-08-21. The first six were found while building `apps/docs-site`,
which is the **first consumer that imports registry components individually**
rather than through a barrel that pulls in all 63. That distinction is what
exposed them: the kitchen-sink imports everything, so most of these are invisible
there.

Two are **fixed at source**, one is **worked around**, and three are still
**open** and need a decision. The
two open ones that matter most are §3 (a one-line import) and §5 (a change to the
wrapper generator, so it needs CI).

Common thread worth keeping in mind: every one of these is a case where a
component behaves correctly in the kitchen-sink and incorrectly for a real
consumer, because the kitchen-sink's import-everything barrel accidentally
satisfies an undeclared dependency, or because nobody had used the component in
the configuration a real app needs.

---

## 1. `Button` — `asChild` links render underlined — FIXED

**Symptom.** `<Button asChild><Link...></Button>` renders with an underline.

**Cause.** `.primitiv-button` never set `text-decoration`. A `<button>` is never
underlined, so nothing looked missing — but under `asChild` the rendered element
is usually an `<a>`, which inherits `primitiv-base.css`'s
`a { text-decoration-line: underline }`. Only the `--link` variant set
`text-decoration: underline`, i.e. the variant that *wants* it opted in while the
base never opted out.

**Fix (landed).** `text-decoration: none` on the base `.primitiv-button` rule.
The `--link` variant still opts back in. Applied to
`registry/components/button/styles.css`, its `styles.scss` mirror, and both app
copies (`apps/docs-site`, `apps/kitchen-sink` — the latter has the same latent
bug the moment anyone uses `Button asChild` with a link).

---

## 2. `List` — nested lists lay out horizontally — FIXED

**Symptom.** A `<List>` nested inside a `List.Item` rendered *beside* the item's
text instead of below it.

**Cause.** `.primitiv-list__item` is a flex row — its job is
`[marker ::before][content]` — so a nested `<ul>`/`<ol>` became a third row child
and was laid out horizontally. This cannot be the intent: `--primitiv-list-indent`
exists specifically to step nested levels in, so nesting is a supported pattern
that simply did not work.

**Fix (landed).**

```css
.primitiv-list__item                  { flex-wrap: wrap; }
.primitiv-list__item > .primitiv-list { flex-basis: 100%; }
```

Chosen over `flex-direction: column` on the item, which would move the marker
*above* the text on every marked list. Wrapping keeps marker and text on line
one and forces the nested list onto its own full-width line, so marker alignment
is untouched and the fix holds for bulleted and numbered lists, not just the
marker-less case that exposed it.

Applied to `registry/components/list/styles.css`, its `styles.scss` mirror, and
both app copies. `node scripts/check-registry-stylesheets.mjs` passes (126 sheets
parse, 63 scss match `emit_component_scss`).

---

## 3. `code-block` — borrows `.primitiv-tabs__*` without importing that sheet — OPEN

**Symptom.** `CodeBlock.Tabs` renders unstyled tab buttons.

**Cause.** `code-block.tsx` composes the headless `Tabs` primitive and reuses the
**`tabs` component's** `.primitiv-tabs__*` classes for the look — its own header
comment says so — but it imports only `../styles/primitiv/code-block/styles.css`.
The class dependency is real and undeclared as an import.

The kitchen-sink works purely by accident: its barrel imports all 63 stylesheets,
so `tabs/styles.css` is always present. Any consumer importing `code-block`
directly gets bare tabs.

**Workaround in place.** `apps/docs-site/src/site/InstallTabs.tsx` imports
`@/styles/primitiv/tabs/styles.css` explicitly, with a comment explaining why.

**Proposed fix — needs a decision.** Add
`import "../styles/primitiv/tabs/styles.css";` to
`registry/components/code-block/code-block.tsx`. One line, but it has knock-ons
worth checking before landing:

- `registry.json`'s `dependsOn` for `code-block` should already list `tabs` (so
  `primitiv add code-block` installs it) — confirm, because the import assumes
  the file is present.
- It makes `code-block` pull in the tabs sheet even for the single-block
  `<CodeBlock code=... />` form, which does not use tabs. Acceptable (one small
  sheet) but it is a real cost, and the alternative — documenting the dependency
  and making consumers import it — is worse DX.
- Check whether any other hand-authored component borrows another's classes the
  same way. `alert` is a known case of re-pointing *Button's* custom properties
  (already flagged in `qa:stylesheets`' generator heuristic), so this pattern
  exists elsewhere.

---

## 4. The reset-leak class, in CONSUMER markup — OPEN (scope refinement)

**This is not a new mechanism.** It is the fourth instance of the reset-leak bug
class already documented in `transfer-and-next-steps.md` → "The reset-leak bug
class — closed, with a standing check". Read that first. What is new is the
**scope**: that audit closed the surface for *registry parts*, and consumer-authored
markup is the surface it did not cover.

**Symptom.** Every hand-rolled `<ul>`/`<ol>` in a consumer app gets 8px between
items, including navigation lists that space themselves with flex `gap` — so the
gap and the margin **add**, exactly as they did inside `list` itself.

**Cause.** `primitiv-base.css` line 274:

```css
li + li { margin-block-start: var(--primitiv-list-item-gap); }
```

**Which layer:** `primitiv.reset`. The *entire* `primitiv-base.css` is one
`@layer primitiv.reset { ... }` block (its only top-level layer statement besides
the order declaration), so every bare-element rule in it — `p`, `li + li`,
`figcaption` — is in the lowest layer. Worth stating explicitly because the
filename says "base" and it is easy to assume the rules land in `primitiv.base`.

**Why an app-level reset does not save you.** Two independent reasons, both worth
knowing:

1. A blanket reset that zeroes `ul`/`ol` margins does nothing here — the margin
   is on the `li`.
2. Even `li { margin: 0 }` in the same layer loses: `li + li` is (0,0,2) and
   plain `li` is (0,0,1), so the reset rule out-specifies it. You need equal-or-
   greater specificity, or a higher layer.

**Measured impact** in `apps/docs-site` before it was handled: 8px of dead space
above the *second* item of the header nav, sidebar, footer, TOC and documentation
map. Found by measuring computed geometry with Playwright, after two wrong
guesses from reading stylesheets — see "How these were found" below.

**Why the prior audit did not catch it.** That sweep covered "all 20
`li`-rendering registry parts" and found `list` the only leak, concluding the
surface was closed. True *for registry components*: every other part either zeroes
`margin-block` or declares its own margin. But a consumer writing
`<nav><ul><li>` is not a registry part, and navigation is the common case for
hand-rolled lists — `List`'s prose defaults are usually wrong there anyway
(`apps/docs-site` re-points `--primitiv-list-item-gap` and
`--primitiv-list-indent` on every nav list it does build with `List`).

**Options, in rough order of preference.**

1. **Scope it to the flow context** — `.primitiv-flow li + li`. Prose already
   opts into `.primitiv-flow` for vertical rhythm (RFC 0016), so this puts list
   rhythm behind the same opt-in and leaves bare lists alone. Most consistent
   with how the rest of the prose spacing works. Note `list` itself would then
   need to keep its own `margin-block: 0` or not — check, because that
   declaration is currently load-bearing.
2. **Scope it to `.primitiv-list`** — but then `List` becomes the only way to get
   prose list spacing, and hand-written markdown-ish content loses it.
3. **Leave it and document it** — cheapest, but every consumer building
   navigation rediscovers it, and the discovery cost is high (it presents as a
   phantom margin with no matching declaration in your own CSS).

Option 1 changes the shared base sheet and therefore every consumer, so it wants
a deliberate call. The existing note that the reset has "exactly three non-zero
margins" (`li + li`, `dd`, `figcaption`) is the useful inventory — the other two
are neutralised by load-bearing `margin: 0` declarations in
`description-list__details` and `figure__caption`.

**Options, in rough order of preference.**

1. **Scope it to the flow context** — `.primitiv-flow li + li`. Prose already
   opts into `.primitiv-flow` for its vertical rhythm (RFC 0016), so this puts
   the list rhythm behind the same opt-in and leaves bare lists alone. Most
   consistent with how the rest of the prose spacing works.
2. **Scope it to `.primitiv-list`** — but then `List` is the only way to get
   prose list spacing, and hand-written markdown-ish content loses it.
3. **Leave it and document it** — cheapest, but every consumer building
   navigation rediscovers it.

Option 1 is a change to the shared base sheet, so it affects every consumer and
wants a deliberate call rather than a drive-by fix. Worth checking against the
prose specimens and `apps/kitchen-sink`'s prose sections before landing.

---

## 5. `Button` — `asChild` loses `text-box-trim` and `nowrap` — OPEN (generator)

**Symptom.** `<Button asChild><Link>Start Here</Link></Button>` renders without
optical text trimming, and without the `white-space: nowrap` that stops a button
shrinking below its own text in a flex row. A plain `<Button>Start Here</Button>`
gets both.

**Cause.** The two properties live on the label span, not the root:

```css
.primitiv-button__label {
  text-box-trim: trim-both;
  text-box-edge: cap alphabetic;
  white-space: nowrap;
}
```

and the stylesheet explains why: trimming "must be applied to the element
directly wrapping the text node — not the flex container — for engines to honour
it." The generated wrapper creates that span in `wrapTextNodes`, which maps only
`string | number` children:

```tsx
typeof child === "string" || typeof child === "number"
  ? <span className="primitiv-button__label">{child}</span>
  : child
```

Under `asChild` the single child is the consumer's ELEMENT (a `<Link>`, an
`<a>`), so it passes through untouched and its text sits one level deeper than
`wrapTextNodes` reaches. Nothing wraps it, so nothing is trimmed.

**Half-considered already.** `crates/primitiv-emit/src/wrapper.rs`'s doc comment
for `emit_wrap_text_helper` explicitly reasons about this case — it unwraps the
single-child array specifically so `<Button asChild><a>Text</a></Button>` "still
hands `Slot` a single element". Making `asChild` not *crash* was solved; giving
that element's text a label span was not.

**Where the fix belongs.** NOT in `button.tsx` — that file is generated ("Do not
edit by hand: change registry/components/button/contract.json and regenerate")
by `crates/primitiv-emit/src/wrapper.rs`. A hand edit is overwritten on the next
regeneration.

Proposed change, in the emitter: when `asChild` is set and `children` is a valid
element, clone it with its own children run through `wrapTextNodes`. Roughly

```tsx
const content =
  props.asChild && isValidElement(children)
    ? cloneElement(children, undefined, wrapTextNodes(children.props.children))
    : wrapTextNodes(children);
```

Points to settle before landing it:

- **It affects every text-wrapping wrapper**, not just Button — the same helper
  is emitted for each. That is probably desirable (the bug is identical
  everywhere) but it regenerates all 63 wrappers, so the emit fixtures in
  `crates/primitiv-emit/src/wrapper_tests.rs` move with it.
- `cloneElement` on a foreign element is a slightly stronger claim than `Slot`
  already makes — worth checking against a component whose `asChild` child is
  something unusual (a routing library's `<NavLink>`, a `<label>`).
- One level of recursion only, or all the way down? One level covers the real
  cases and keeps the behaviour predictable.
- Cannot be verified in this sandbox (no local Rust build). Needs CI — a
  throwaway workflow running `cargo test -p primitiv-emit` plus a regeneration
  diff would confirm it.

**Workaround in place.** `apps/docs-site` wraps the label by hand:

```tsx
<Button asChild>
  <Link href="/components/">
    <span className="primitiv-button__label">Start Here</span>
  </Link>
</Button>
```

Measured after: `text-box-trim: trim-both`, `text-box-edge: cap alphabetic`,
`white-space: nowrap` on both hero CTAs. Applied at both call sites — the hero,
and the Button page's own `asChild` example, whose *displayed snippet* was
updated too so the sample matches what actually renders.

**But note the workaround reaches for a private class.** `contract.json` declares
only `.primitiv-button` (the root) — `__label` is not part of the documented
surface, and the stylesheet comment says the component wraps text "so consumers
never need to do it by hand". Every one of these spans should be deleted when the
generator fix lands; they are marked with a comment saying so.

---

## 6. `@primitiv-ui/icons` is unusable as a `link:` dependency — WORKED AROUND

**Symptom.** Every icon rejects every prop. `<ChevronRight className="..." />`
fails to compile with *"Property 'className' does not exist on type
'IntrinsicAttributes & IconProps'"* — even though `IconProps extends
SVGProps<SVGSVGElement>`, which plainly has it.

**Cause.** `packages/icons` declares `@types/react` as a **peerDependency**. A
`link:` dependency is a bare symlink to a source directory with no
`node_modules` of its own, so nothing installs that peer. `import type {
SVGProps } from "react"` then fails to resolve, `IconProps extends SVGProps<...>`
degrades to `{}`, and the component accepts nothing.

**Sharp edge worth knowing:** plain `tsc` did NOT reproduce it. The app's
tsconfig `paths` mapping (`"react": ["./node_modules/@types/react"]`) satisfied
it and reported 0 errors, while `next build`'s own type-checker still failed.
Two checkers, two answers — so "typecheck passes" was not evidence here.

**Fix (in place).** Depend on the **published** package instead of linking it:

```json
"@primitiv-ui/icons": "^0.1.29"     // not link:../../packages/icons
```

pnpm then installs it properly and resolves the peer from the app's own tree
(`@primitiv-ui+icons@0.1.29_@types+react@19.2.17_react@19.2.8` — note it picks
up the *same* `@types/react` the app pins, which is what keeps the two React type
identities from diverging). Verified: icons accept `className` again, and the
hand-rolled workarounds (rendering icons prop-less, styling glyphs via
`.parent > svg`) are all removed.

**Costs nothing in freshness.** Published `0.1.29` *is* the current source
version, and icons are generated from SVGs so they change rarely — unlike
`@primitiv-ui/react`, which stays `link:`ed because it is under active
development.

**The real fix, if linking icons ever matters:** move `@types/react` from
`peerDependencies` to `devDependencies` as well (peers are for what the consumer
provides; the *types* are needed to compile the package itself), or give
`packages/icons` an install of its own. Until then, treat "link this package"
and "pass props to an icon" as mutually exclusive.

---

## Not a bug, but adjacent: the barrel forces `"use client"`

`@primitiv-ui/react`'s package `exports` resolve to a single
`src/index.ts`, so importing one symbol (`Slot`) pulls `Combobox`,
`useMediaQuery` and every other hook-using module into the module graph. In a
React Server Component that is a hard error, which is why **every page** in
`apps/docs-site` is `"use client"`.

This costs nothing in SSR or SEO terms — a client component still prerenders to
HTML and hydrates — but it does mean no consumer can use any Primitiv component
in an RSC. Granular subpath exports (`@primitiv-ui/react/Slot`) would fix it.
Recorded here because it is the same class of finding: invisible until a real
framework consumer exists.

---

## How these were found (method worth reusing)

All four came out of building a real consumer, and the two layout ones came out
of **measuring**, not reading.

`apps/kitchen-sink` has `@playwright/test` installed and Chromium is present in
the local cache, so computed geometry against a running dev server is available:

```sh
# from apps/kitchen-sink (it owns the playwright dep)
node measure.mjs   # chromium.launch() → goto localhost:4100 → page.evaluate()
```

Reporting `getComputedStyle` + `getBoundingClientRect` per element found the
`li + li` margin in one pass, after two wrong guesses from reading stylesheets
(first `box-sizing`, then inline-baseline descender space — both plausible, both
wrong). The same script later caught a bug nothing else would have: the sidebar's
nested link list was **absent from the DOM** because `trailingSlash: true` makes
`usePathname()` return `/components/select/` while nav hrefs had no trailing
slash, so no section auto-opened and `aria-current` never matched anywhere.

Lesson: for any "why is this spaced/positioned wrong" question, measure first.
Reading CSS finds rules you wrote; measuring finds rules you inherited.

---

## 7. `select` — the panel was not anchored, and the chevron is asymmetric — FIXED / OPEN

Two findings on the same component, from building its docs page.

### 7a. The panel pinned to the viewport corner — FIXED

**Symptom.** Every open Select listbox on the page painted at the top-left of the
viewport, over the site header.

**Measured**, not inferred (the CSS reads as if it should work): with the trigger
at `(425, 723)` the panel sat at `(0, 4)`, all four insets computing to `0px` and
`margin: auto` doing the positioning. `anchor-name` was `none` on all five
triggers.

**Cause.** `select` required the CONSUMER to wire the anchor pair by hand —
`style={{ anchorName }}` on the trigger, `style={{ positionAnchor }}` on Content
— per its own README and stylesheet. Nothing supplies it, so with no ident the
`anchor()` insets never resolve and the UA `[popover]` centring wins.

This is the third time the same bug has been fixed in this registry.
`dropdown`'s header comment already says it outright: *"every consumer ended up
writing the same useId-derived wrapper by hand"*, and `breadcrumb-overflow` and
`pagination` each derive their own. `select` was simply never given the same
treatment — and it needs it MORE than the others, because its panel is a
top-layer popover whose failure mode is landing in the corner of the screen
rather than merely a few pixels out.

**Fix (landed).** `Select` mints an ident from `useId()` and hands it to Trigger
and Content through context, exactly as `dropdown` does. The native path skips
the provider (the platform owns that popup). A consumer's own `style.anchorName`
/ `style.positionAnchor` still wins on spread order, which keeps "anchor the
panel to something else" available. Applied to `registry/components/select/`
(tsx, both stylesheets, `contract.json`, README) and both app copies.
Re-measured after: `dx: 0`, 4px below the trigger, panel width equal to the
trigger's, on all four instances.

**Worth generalising.** Four components have now hand-rolled the same
`toAnchorIdent` + context pair. It wants to be one shared helper — and the
remaining anchor-positioned components (`context-menu`, `popover`, `tooltip`,
`combobox`, `navigation-menu`) should be audited for the same gap rather than
waiting for a consumer to find each one.

### 7b. The rich trigger has no chevron, but the native one does — OPEN

**Symptom.** A rich `SelectTrigger` renders as bare text with no disclosure
affordance. Spotted on the rendered page, not in review.

**Cause.** Not a bug in the strict sense — `SelectIcon` is a part the consumer
composes, and the README's example includes it. But the two render paths
disagree: under `native` the STYLESHEET paints its own chevron over the UA arrow
(`contract.json` describes this as deliberate), so a native Select gets one for
free while a rich Select silently gets nothing. Same component, same prop
surface, two different answers to "is there a chevron".

Omitting it is also invisible in code review and obvious on screen, which is the
signature of a defaulting problem rather than a documentation one.

**Options.** Either have `SelectTrigger` render a default `SelectIcon` when the
consumer supplies none (matching the native path, and matching what every design
in the Figma file draws), or drop the native path's painted chevron so both
require the part. The first is the smaller surprise. Needs a decision — it is a
visual default change on a shipped component.

---

## 8. `code-block` always wraps, and one consumer needs it not to — WORKED AROUND

**Symptom.** The docs site's anatomy tree — component parts on the left, the DOM
they emit in an aligned trailing `//` comment — reflowed, dropping each
annotation onto the next line where it read as belonging to the part below.

**Cause, and it is deliberate.** `code-block`'s `__pre` sets
`white-space: pre-wrap; overflow-wrap: anywhere`, with a comment recording that a
horizontal scrollbar was worse on mobile. That is the right default for ordinary
snippets. It is wrong for content whose column alignment IS the content.

**Workaround in place.** `apps/docs-site` scopes `white-space: pre` +
`overflow-wrap: normal` to `.docs-anatomy`, so that one block scrolls inside its
own box — the same contract the props tables already use via `TableScrollArea`.

**Proposed fix.** A `wrap={false}` prop on `CodeBlock`, if a second consumer
wants it. Not worth changing the default: one consumer with alignment-critical
content does not outweigh the mobile reasoning already recorded in the sheet.

---

## 9. Not a registry bug: the docs column is 632px where the frame says 920

Recorded here because it was measured during the same pass and affects how every
code block and props table reads.

`.docs-grid` caps at `--primitiv-breakpoint-xl` (1280) and then subtracts two
container gutters and two grid gaps from the 260/1fr/260 columns, leaving **632px**
for the main column — and it does not grow past that at any viewport width. The
Figma component-page frame specifies 260/920/260 inside 1440, i.e. 824px of
content after the column's own padding.

Not changed here: it is a shell-wide property of the already-accepted Button page,
so widening it is a deliberate design call rather than a drive-by fix. It is the
reason the anatomy tree needed §8 at all — at 824px those lines fit.
