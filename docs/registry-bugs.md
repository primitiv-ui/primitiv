# Registry bugs — surfaced by the docs-site build

Found while building `apps/docs-site`, which is the **first consumer that imports
registry components individually** rather than through a barrel that pulls in all
63. That distinction is what exposed them: the kitchen-sink imports everything,
so most of these are invisible there.

**All of them are now fixed at source (2026-08-25).** §1, §2 and §7a landed
earlier; §3, §4, §5, §7b and §8 closed in one pass, and every workaround they
justified has been deleted from `apps/docs-site` — including the two that reached
for `.primitiv-button__label`, a class `contract.json` never declared. §6 remains
a **deliberate** arrangement (depend on published `@primitiv-ui/icons`, not
`link:`) rather than an open bug.

Three things worth carrying forward, because each contradicted what the entry
below originally proposed:

- **§3's proposed fix could not work.** The registry source carries no stylesheet
  import at all — `add` prepends one computed from the consumer's configurable
  `styles.path` — so a hardcoded relative path would have been wrong for anyone
  who changed that setting. Importing the sibling wrapper for its side effect is
  path-independent.
- **§5 was twelve surfaces, not one.** The `wrapTextNodes` helper is *generated*
  into 5 wrappers and *copy-pasted by hand* into 7 more, so "fix the generator"
  only ever covered part of it. `stepper` turned out to be exempt (no `asChild`
  anywhere — its marker is a plain `<span>`).
- **§4 was arguably already settled** — RFC 0016 D69/D76 reject a global owl, and
  the unscoped `li + li` was one. Scoping it made the sheet agree with its own
  decision record rather than departing from it.

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

## 3. `code-block` — borrows `.primitiv-tabs__*` without importing that sheet — FIXED

**Fix (landed), and NOT the one proposed below.** `code-block.tsx` now does
`import "./tabs";` — a side-effect import of the sibling wrapper, which
self-imports its own stylesheet.

The proposed `import "../styles/primitiv/tabs/styles.css"` is impossible: the
registry source has **no** stylesheet import of its own. `add` prepends exactly
one line per tsx wrapper, computed from the consumer's configurable
`styles.path` (`crates/primitiv-cli/src/commands/add.rs`, the `styles_import`
field), so any path hardcoded here is wrong for a consumer who changed that
setting. The sibling import needs no path knowledge and reuses the mechanism the
adjacent `import { Button } from "./button"` already relies on;
`dependsOn.components` already listed `tabs`, so `add code-block` installs the
file it resolves to.

Verified in isolation rather than on a page, because the docs site turned out to
import `tabs` from two other places — a `vite build` of an entry importing only
`code-block` emits CSS containing `.primitiv-tabs__trigger`, and does not when
the line is commented out. Both docs-site workarounds (`InstallTabs.tsx` and a
second copy in `ModeCodeBlock.tsx`) are deleted.

Cost, accepted: the single-block `<CodeBlock code=... />` form now pulls in the
tabs wrapper module too — the same cost profile as the unconditional `./button`
import beside it.

<details>
<summary>Original entry</summary>

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

</details>

---

## 4. The reset-leak class, in CONSUMER markup — FIXED (option 1)

**Fix (landed).** `li + li` in `crates/primitiv-emit/assets/base.css` (and its
byte-identical `.scss` mirror, plus all three app copies) is now
`.primitiv-flow li + li`.

**The RFC argues for this, which inverts how the entry below reads.** RFC 0016
§1.4 kept the selector on the grounds that it already had the owl's *shape* — but
that is an argument about its form, while **D69/D76 are about its scope**: flow
rhythm is an opt-in container context, and a global owl is *explicitly rejected*
because any global rhythm is still a default the consumer did not ask for. The
unscoped `li + li` was a global owl. So this is the sheet catching up with its own
decision record, not a departure from it.

`list`'s `margin-block: 0` on `.primitiv-list__item` stays load-bearing — a
`List` inside `.primitiv-flow` is still matched, and its flex `gap` would double
up again without it. A new test,
`base_tests.rs::list_item_rhythm_is_scoped_to_the_flow_context`, pins the scope;
it scans comment-stripped source, because the rule's own comment discusses
`li + li` at length and a naive line filter passes vacuously.

**Measured, not assumed.** Every list that lost spacing on the kitchen-sink is
its own TOC navigation — whose CSS explicitly asks for `gap: 0` with a comment
about the gap "multiplying across ~50 entries", and was being silently overruled
8px at a time; the category list is now 96px shorter and the nested rows step
18px instead of 26px. Both genuine prose lists sit inside `.primitiv-flow` and
keep their rhythm. On the docs site nothing moved at all: no `li` there had a
non-zero margin before or after, so its `document.css` cancellation had nothing
left to cancel and is gone.

Note the docs site applies `.primitiv-flow` **nowhere**, so a consumer wanting
prose rhythm on a bare list must now opt in — which is the point.

<details>
<summary>Original entry</summary>

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

</details>

---

## 5. `Button` — `asChild` loses `text-box-trim` and `nowrap` — FIXED

**Fix (landed).** Both text-wrapping helpers take an `asChild` flag and, when it
is set and the child is a valid element, clone it with its own children run
through the helper:

```tsx
if (asChild && isValidElement<{ children?: ReactNode }>(children)) {
  return cloneElement(children, undefined, wrapTextNodes(children.props.children));
}
```

One level only. The clone is gated on **`asChild`**, not on "the single child is
an element" — ungated it would also rewrite `<Button><span>Save</span></Button>`,
nesting a label span inside markup the consumer wrote.

### It was twelve surfaces, not one

The entry below reasons about "the wrapper generator", and that is only 5 of
them. The helper is **copy-pasted by hand into 7 more components**, so a
single-source fix did not exist:

| | Components |
|---|---|
| **Generated** (`wrapper.rs` + regeneration) | `avatar`, `button`, `segmented-control`, `tabs`, `toggle-group` |
| **Hand-authored copies** (edited individually) | `accordion`, `badge`, `collapsible`, `miller-columns`, `tag`, `tree` |
| **Exempt** | `stepper` — no `asChild` anywhere, no headless part, its marker is a plain `<span>` |

Three of the hand-authored ones have their own helper *shape*, not just their own
copy: `badge`/`tag` bind `asChild` themselves (they render `Slot` directly, so the
call is `wrapTextNodes(children, asChild)` rather than `props.asChild`), and
`miller-columns`/`tree` share a `wrapRowTextNodes(children, className)` signature
that takes the label class as a parameter.

`emit_wrap_text_helper` and `emit_structural_wrap_text_helper` were two near-identical
copies in the emitter too; they now share one `emit_wrap_text_fn` body, because
"it affects every text-wrapping wrapper" is exactly the change that gets applied
to one copy and not the other.

### Typing, and what enforces it

The generated call reads `props.asChild`, which assumes a `wrapTextChildren` part
accepts `asChild` — true of all nine headless ones today. The enforcement is
`scripts/check-registry-types.mjs`, which type-checks all 63 wrappers against the
real `@primitiv-ui/react` types; a part that did not accept it would fail there
rather than reach a consumer. That check is green.

### Verification, given no local Rust

`cargo` is unavailable in this environment, so the emitter change is CI-verified —
but two things were checked locally first. The `accordion.wrapper.tsx` and
`collapsible.wrapper.tsx` goldens are byte-exact `assert_eq!`s against the
emitter's output for the **real** contracts, so `cargo test -p primitiv-emit`
catches a single byte of drift; both were rebuilt from `wrapper.rs`'s own string
literals and confirmed to match, as were all five generated registry wrappers.
Then the actual behaviour: the two docs-site hero CTAs, with their hand-written
spans deleted, now render `.primitiv-button__label` as a direct child of the
`<a>` carrying `text-box-trim: trim-both`, `text-box-edge: cap alphabetic` and
`white-space: nowrap` — the three properties the workaround was supplying by
hand.

<details>
<summary>Original entry</summary>

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

</details>

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

### 7b. The rich trigger has no chevron, but the native one does — FIXED

**Fix (landed): the first option.** `SelectTrigger` renders a `SelectIcon`
holding the house chevron when the consumer composes none — the smaller surprise,
and what every design in the Figma file draws.

The glyph is **inlined** (the same path `@primitiv-ui/icons` exports as
`ChevronDown`, and byte-identical to the one the stylesheet already inlines as a
data-URI for the native arrow) so `select` installs no icon package and the two
render paths draw one shape. `.primitiv-select__icon > svg` already sized it, so
no stylesheet change was needed. The check is for the *part*, not its contents, so
composing `SelectIcon` yourself still wins — and an empty `<SelectIcon />` opts
out of the mark entirely.

Verified in a browser on both surfaces: the kitchen-sink demo that composes no
part renders one 16px chevron identical to the ones beside it that spell it out,
and all four triggers on the docs Select page render exactly one — no doubling
where the part is already composed.

<details>
<summary>Original entry</summary>

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

</details>

---

## 8. `code-block` always wraps, and one consumer needs it not to — FIXED

**Fix (landed).** A boolean `wrap` contract modifier, default `true`, whose
`false` arm adds `.primitiv-code-block--nowrap` (`white-space: pre` +
`overflow-wrap: normal` on `__pre`; `overflow-x: auto` was already there to
provide the scroll surface).

Shaped exactly like Stepper's `compact` — a `false`/`true` option pair — which
also means the docs playground renders it as a `Switch` for free. **The default
does not change**: the sheet's mobile reasoning is right for ordinary snippets,
and this exists so the alignment-critical case need not override `__pre` from
outside the component.

The docs site's `.docs-anatomy` rule and its wrapper `<div>` are deleted;
`Anatomy.tsx` passes `wrap={false}` through `ModeCodeBlock`. Measured after: the
two anatomy blocks on the Select page carry `--nowrap` with `white-space: pre`
while every other block on the page stays `pre-wrap`. It applies to the `inline`
chip too, where a long line will then overflow — deliberate, and noted in the
component README next to the reasoning for the chip's own wrapping default.

<details>
<summary>Original entry</summary>

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

</details>

---

## 10. `Slider` — the Root's `aria-label` is announced nowhere — FIXED (docs)

Found while building the Slider docs page: measuring the rendered DOM showed
every thumb on the page carrying `role="slider"` with **no accessible name at
all**, while the label sat on the Root.

**Cause.** The Thumb is the `role="slider"` — it carries `aria-valuenow` /
`aria-valuemin` / `aria-valuemax`. The Root renders a plain `<span>` with
**`role=null`**, so an `aria-label` there is attached to nothing. It is a silent
failure: the slider looks and behaves correctly, and nothing warns.

**Why it spread.** The library documented it both ways. `Slider.Thumb`'s JSDoc
says "provide an accessible name with `aria-label` / `aria-labelledby`" and its
example is right — but `Slider.Root`'s JSDoc example, and the README's opening
and range examples, all put `aria-label` on the Root. Following the most visible
example produced an unnamed control.

**Second finding, same area.** A `Field` label does not reach the thumb either.
`Slider` does not read `FieldContext` (unlike `Input`, `Textarea` and `Switch`),
and a `<label htmlFor>` cannot associate with a `<span role="slider">` anyway. So
`<Field><Field.Label>Volume</Field.Label><Slider …/></Field>` — the obvious
composition, and the one the other form pages teach — leaves the thumb unnamed.
The working pattern is an id on the label plus `aria-labelledby` on each thumb.

**Fixed (docs only, no behaviour change).** The Root's JSDoc example, both README
examples, and a new README "Labelling" section now put the name on the Thumb and
state the `FieldContext` gap; the docs page teaches the same and names every
thumb in every example. 85 Slider tests unaffected.

**Not done, and worth a decision.** Two options would make the right thing the
default rather than the documented thing:

- **Have `Slider.Root` consume `FieldContext`** and pass an `aria-labelledby`
  down to its thumbs. It would make the Field composition work as every reader
  expects — but "one label, N thumbs" is ambiguous on a range, where the correct
  answer is two *different* names.
- **Warn in development** when a Thumb mounts with no accessible name, the way a
  missing `alt` is flagged. Cheap, catches the case at the moment it is written,
  and does not have to resolve the range ambiguity.

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
