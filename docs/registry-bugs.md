# Registry bugs — surfaced by the docs-site build

Status as of 2026-08-21. All four were found while building `apps/docs-site`,
which is the **first consumer that imports registry components individually**
rather than through a barrel that pulls in all 63. That distinction is what
exposed them: the kitchen-sink imports everything, so three of these four are
invisible there.

Two are **fixed at source**; two are still **open** and need a decision.

Common thread worth keeping in mind: every one of these is a case where a
component behaves correctly in the kitchen-sink and incorrectly for a real
consumer, because the kitchen-sink's import-everything barrel accidentally
satisfies an undeclared dependency, or because nobody had used the component in
the configuration a real app needs.

---

## 1. `Button` — `asChild` links render underlined — FIXED

**Symptom.** `<Button asChild><Link…></Button>` renders with an underline.

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
  `<CodeBlock code=… />` form, which does not use tabs. Acceptable (one small
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
`@layer primitiv.reset { … }` block (its only top-level layer statement besides
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
