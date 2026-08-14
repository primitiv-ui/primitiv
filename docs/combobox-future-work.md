# Combobox — deferred work, session handoff

Status as of 2026-08-14: **all four stages are landed** — the Figma exploration
page (`1816:60308`) with all seven calls settled, the Figma component set
(`1816:61259`, 10 variants, md-first), the headless compound
(`packages/react/src/Combobox`, 100% lines/branches/functions/statements), and
now the **registry surface (`registry/components/combobox`) and the kitchen-sink
demo**.

**Headline outcome, worth keeping: this component needed no new design tokens of
any kind.** That is not a coincidence — it falls out of exploration §A1 + §B1
(the control is Input verbatim, the popup is a Dropdown panel), so every number
already existed. If either decision is revisited, the token cost comes straight
back.

This file records what was *deliberately left out*, and why, so a later session
does not have to re-derive it. Three kinds of item: gaps between the settled
design and the shipped code (§1), the exploration's own deferrals (§2), and
adjacent things noticed while building the registry (§3).

---

## 1 · Gaps between the settled design and the shipped code

These are places where the Figma record says one thing and the built component
does another. Each is a real follow-up, not a documentation error.

### 1.1 Groups — `ComboboxGroup` + `ComboboxGroupLabel` (headless, then registry)

**Settled in Figma §H**, which lists both parts and notes that groups **must** be
named (inherited from Listbox §E). **Shipped: neither.** The headless compound
has five parts (`Root` / `Input` / `Content` / `Item` / `Empty`) and the built
Figma set holds three flat rows with no grouping in it.

Confirmed with the human 2026-08-14: **omit from the registry, do it headless
first.** Grouping needs the headless layer to own the `role="group"` +
`aria-labelledby` wiring, exactly as `Listbox.Group` / `Listbox.GroupLabel`
already do. A registry-only pair would leave the consumer generating and matching
ids by hand — an accessibility contract that is easy to get wrong and worse than
not shipping it.

**When picking this up:** copy `Listbox.Group` / `Listbox.GroupLabel` outright.
They already solve this exact problem for the same row language, and Combobox's
rows are `Listbox / Option` instances in Figma precisely because the two were
designed to agree. The registry styling is then a straight port of
`.primitiv-listbox__group` / `__group-label` (including the `position: sticky`
heading, which matters more here — a filtered grouped list scrolls constantly).

### 1.0 No outside-click dismiss (headless) — the most user-visible gap

Reported from a real render, 2026-08-14: **clicking outside an open combobox does
not close it.** The headless layer handles Escape and commit-on-select and
nothing else — there is no pointerdown-outside listener anywhere in
`packages/react/src/Combobox`.

This is a genuine defect rather than a scoping decision. Every comparable popup
in the library gets dismissal for free from the Popover API's light-dismiss
(`popover="auto"`), which is exactly what §1.2 below is about — so fixing the
layer question fixes this at the same time, and that is the reason to prefer it
over hand-rolling an outside-click hook. If it is fixed independently, note that
the listener must be `pointerdown` rather than `click` (a `click` fires after
focus has already moved) and must not fire for a pointerdown that starts inside
the panel and ends outside it, which is the usual bug in hand-rolled versions.

APG's combobox pattern does not mandate outside-click dismissal, but every real
combobox has it and users expect it.

### 1.0b Escape restores the committed label over a cleared query (design gap)

Also reported 2026-08-14: with a value committed, clearing the input and pressing
Escape **puts the old value's label back** rather than leaving the field empty.

This is the settled behaviour, not a bug: exploration §D1 says "on close or
commit it shows the selected option's label", and `dismiss()` does
`setQueryState(committedLabel)` deliberately, so that the field can never sit
showing text that is not the value — §D1 explicitly rejected letting the raw
query persist for that reason.

**But the report is fair, because §D1 only considered two options and there is a
third.** It weighed "restore from the value" against "keep the raw query"; it
never considered that *clearing the field is itself an intent* — the user is
plausibly trying to deselect, and the component silently refuses. The options:

1. **Clearing the query clears the value** (`select("", "")` when the user empties
   a field that has a committed value). Matches the intent, keeps §D1's invariant
   intact — the field is empty *and* the value is empty, so it is still not
   lying — and needs `onValueChange("")` to fire, which consumers must handle.
2. **Keep today's behaviour**, and document that deselection is the consumer's job
   via a clear button (an `InputGroup`-style trailing affordance). This is what
   most libraries do.
3. Escape-on-empty clears, Escape-on-partial-query restores. Most faithful to
   intent, least predictable to explain.

Option 1 is the most defensible, but it changes a settled decision and fires a
value change the current demos do not expect, so it wants a deliberate call rather
than a drive-by fix. **Unresolved — needs a human decision.**

### 1.2 The panel needs the top layer, and the registry can only approximate it

**Settled in Figma §G**, which lists "Popover-API popup layer (all four engines
have shipped it; the Firefox caveat closed at FF 125)" as explicitly **IN** for
v1. **The headless shipped without it**: `Combobox.Content` unmounts while closed
and never touches `showPopover()` — unlike `Select.Content`, which does.

**The registry ships `z-index: 1000` instead. That works, and the route to it is
worth recording, because two plausible-looking attempts failed first.**

*Attempt 1 — `position: fixed` + anchor positioning alone,* with `Portal`
documented as the escape hatch for stacking. Wrong: a fixed panel escapes an
ancestor's `overflow: hidden` but still competes in the page's stacking contexts,
and **the kitchen-sink's own disabled-Combobox demo painted straight over the open
panel** — `opacity: 0.5` forms a stacking context and that demo sits later in the
DOM. Caught by rendering it; no test in this repo would have.

*Attempt 2 — `popover="manual"` + `showPopover()` in a mount effect on
`ComboboxContent`.* The reasoning was sound on paper (mount *is* open, since the
headless unmounts while closed, so there is nothing to desync; `manual` avoids UA
dismissal hiding a still-mounted element). **It did not fix the render.** The cause
was never established, because it cannot be from this sandbox: jsdom's
`showPopover()` is a **no-op stub** — verified directly, a bare
`div[popover=manual]` never matches `:popover-open` after `showPopover()`, while
the `:popover-open` selector itself parses fine — so no jsdom test can distinguish
"promotion failed" from "jsdom does not implement promotion". It was reverted
rather than left in place, on the grounds that unverifiable code carrying a comment
claiming it works is worse than no code.

That attempt also had a design flaw worth remembering: it paired the popover with
an **ungated `display`** so it would "fail open" if the API were missing — but
falling back to a plain fixed panel *was itself the broken state*. Fail-open only
means something if the fallback is correct on its own. The z-index is what makes
the fallback correct, which is why it should stay even once the top layer lands.

*What shipped — `--primitiv-combobox-content-z-index: 1000`.* Deterministic here,
and the reasoning is the point: none of the panel's ancestors forms a stacking
context (`.primitiv-combobox` is a static `<div>`; flex containers don't form
one), so the panel's nearest stacking context is the **root element**, and a
positive z-index there clears every `z-index: auto` positioned box and every
opacity/transform-induced context on the page. Confirmed fixed in the browser.
`1000` rather than `1` so it also clears a consumer's sticky header; a native
`<dialog>` or `[popover]` is in the top layer and still wins, which is correct — a
combobox inside a modal must not paint over the modal.

**Its limit, and why the top layer is still wanted:** a z-index cannot escape a
stacking context formed by an ancestor *of the combobox itself* — a transformed or
opacity-reduced card, say. `Portal` is the documented escape hatch. Do it properly
in the headless layer, with `popover="auto"`, and three things land at once: the
top layer, **outside-click dismissal for free** (§1.0), and the possibility of an
exit animation.

That last one is worth being precise about, because it follows from
unmount-while-closed rather than from layering: **no exit animation is possible
today.** React removes the node, so nothing can still match it, and the panel
animates in via `@starting-style` only. Select gets both because `[popover]` +
`transition-behavior: allow-discrete` keeps the element painted through the close —
which needs the headless layer to keep the element **mounted and merely hidden**,
a bigger change than adding `showPopover()`.

### 1.3 The chevron does nothing when clicked (headless)

**Figma §H names a `ComboboxTrigger`** part for the chevron. **Shipped as
`ComboboxIcon`** — a decorative `<span aria-hidden>` mirroring `SelectIcon`,
after checking with the human that Select's pattern is the established one.

It *is* the established pattern, but Select gets a free lunch that Combobox does
not: Select's whole frame is a `<button>`, so a click anywhere on it — chevron
included — opens the listbox. Combobox's frame is a `<div>` wrapping an
`<input>`, and the headless layer exposes no open-toggle for a trigger to call, so
the popup opens on typing or <kbd>↓</kbd> only. The glyph is
`pointer-events: none` so a click aimed at it at least falls through to the field
instead of landing on dead space.

Naming it `ComboboxTrigger` while it has no behaviour was rejected: every other
`*Trigger` in the library is interactive, so the name would mislead.

**To close this properly** the headless root needs to expose its open-state
setter to a part (or ship a real `Combobox.Trigger` with `tabIndex={-1}` +
`aria-hidden`, per APG's optional combobox trigger button). Then the registry part
can be renamed to `ComboboxTrigger`, keep the same class, and drop the
`pointer-events: none`. Note APG is explicit that such a button must stay out of
the tab order — the input is the single tab stop.

---

## 2 · The exploration's own deferrals (Figma §G, "OUT")

Recorded there verbatim; repeated here so this file is self-contained. These are
also the open questions already logged in `docs/select-future-work.md`.

- **A built-in `filter` prop / string-match predicate.** Consumer-owned filtering
  is a settled *decision*, not an omission (§G "IN"), so this would be an
  additive convenience rather than a fix. The README's position — async loading,
  fuzzy matching and sorting belong where the data lives — is the argument
  against.
- **Async option loading.** The blocking question is who owns request state
  (in-flight, error, stale-while-revalidate). Needs a design pass, not just code.
- **Multi-select, and token chips inside the input.** A separate
  *MultiCombobox* question. Note this interacts with §1.1: multi-select rows are
  where Listbox's `OptionCheckbox` row type would come across too.
- **Virtualization.** Open shape: a `windowed` prop versus a documented
  `react-virtual` recipe. The recipe is the cheaper answer and does not grow the
  component.
- **The Command Palette composite (Modal + Combobox)** — the docs-site §1.17 gap.
  It **composes** this component; it is not this component. RFC 0021 §4 lists it
  under "Tier 3 — blocked on a primitive-backlog item", where the blocking item
  was this component, so it is now unblocked.

The exploration's own note on all of these: "Answering them generously would make
Combobox the largest component in the library after Carousel; answering them this
narrowly keeps it small, and none of the four is needed by the docs site."

---

## 3 · Noticed while building the registry

### 3.1 The docs site's React component list is well behind the library

`apps/docs/.vitepress/components.mjs` — the single source of truth that
`gen-react-pages.mjs` and the VitePress sidebar both read — lists 39 components,
and **Combobox is not one of them**. Neither are `Listbox`, `NavigationMenu`,
`SplitButton`, `SegmentedControl`, `Pagination`, `Popover`, `Drawer`,
`ContextMenu`'s siblings, or several others. So none of them has a docs page,
even though every one has a consumer-facing README that the generator would pick
up for free.

Deliberately **not** fixed in this session: adding Combobox alone would be
arbitrary, and the list needs one sweep reconciled against `packages/react/src`
plus a group assignment per entry. It is a cheap, high-value job — one array, and
the pages generate themselves — and it is squarely part of "minimum features for
the docs site landing page", so it wants doing soon.

### 3.2 Figma `Input` has a hover state the registry `input` does not

The Figma `Input` set carries a `State` axis including `hover`; the committed
`registry/components/input/styles.css` has focus / invalid / disabled rules and
**no hover rule at all**. Combobox's control matched the code (no hover), since
§B1 is "Input verbatim" and drifting from the shipped `input` would be worse than
drifting from Figma.

Pre-existing `input` drift, not caused by this component — but whoever settles it
should settle Combobox's control in the same change, since the two must stay
identical by construction. Contrast `select`, which *does* have a hover border
(`border/strong`), so the three are currently inconsistent with each other.

### 3.3 The `ComboboxItemLabel` label trap

Not a bug, but the sharpest edge in the composed surface, so it is worth having
written down outside the README. The headless `ComboboxItem` computes
`label = typeof children === "string" ? children : itemValue`, because there is no
reliable way to read a label out of arbitrary JSX. So the moment a consumer wraps
row text in `ComboboxItemLabel` (or adds a leading icon), the committed
closed-state text silently becomes the **value** rather than the label.

Three documented ways out (README, and the part's own JSDoc): plain string
children and no label element (the row's flex layout copes, and
`ComboboxItemTrailing` self-aligns to the inline-end edge); or make `value` the
display label; or accept the value as the closed-state text.

A headless fix would be an explicit `label` prop on `Combobox.Item`, overriding
the children-derived value. That is small and additive, and it would make the row
slots free to use — currently the richest row shape and the nicest closed-state
label are mutually exclusive. **This is the smallest of the headless items here
and probably the best value.**
