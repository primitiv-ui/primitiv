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
does not have to re-derive it. Four kinds of item: what was found and fixed after
the first pass (§0), remaining gaps between the settled design and the shipped
code (§1), the exploration's own deferrals (§2), and adjacent things noticed while
building the registry (§3).

---

## 0 · Found by rendering it, then fixed (2026-08-14)

Everything in this section was reported from a real browser after the registry
surface first landed, and **none of it would have been caught by a test in this
repo.** That is the takeaway worth keeping: this component's failure modes are all
paint-order and browser-API behaviour, which jsdom does not model.

### 0.1 The panel needs the top layer — three attempts to get there

Exploration §G listed the Popover API as **in** for v1. The headless shipped
without it, and closing that gap took three goes:

1. **`position: fixed` + anchor positioning, no popover.** Escapes an ancestor's
   `overflow: hidden`, so it looked right — but the panel still competes in the
   page's stacking contexts, and the kitchen-sink's own disabled-Combobox demo
   painted straight over the open panel (`opacity: 0.5` forms a stacking context,
   later in the DOM).
2. **`popover="manual"` + `showPopover()` in the registry wrapper.** Did nothing.
   The reason, found later: `manual` popovers have **no light dismiss at all**, and
   there was no `toggle` listener — so this was never going to work even if the
   promotion succeeded. Reverted rather than left in with a comment claiming it
   worked.
3. **`popover="auto"` + `showPopover()` + a `toggle` listener, in the headless.**
   Correct, and the established pattern — `useSelectContent` already does exactly
   this. Landed.

A `z-index: 1000` shipped briefly between (1) and (3) and did fix the overlap; it
was removed once the top layer landed, because a top-layer element ignores
z-index entirely and a knob that does nothing is worse than no knob.

**Two traps for whoever touches this next.** First, the `[popover]` UA defaults
(`margin: auto` + `inset: 0`) centre the panel in the viewport and fight the anchor
insets — the `primitiv.reset` block undoing them is **not optional**, and deleting
it produced a visibly misaligned popup. Second, `display` must be set *only* under
`:popover-open`; an ungated `display` was tried as a "fail open" hedge and was the
wrong instinct, because the state it fell back to was itself the broken one.

### 0.2 Light dismiss — clicking outside now closes it

Followed from 0.1: the browser does the hit-testing and reports it as a `toggle`
event. There is deliberately **no** hand-rolled pointerdown-outside listener. A
light dismiss runs the full `dismiss()` (now exposed on the context) rather than
just closing, so clicking away and pressing Escape leave the field identical.

**Bug found while building it, worth knowing about generally:** the internal ref
the popover needs was being clobbered by any consumer-passed `ref`, because it was
spread *before* `{...rest}`. That silently took out both the top layer and light
dismiss. Now composed with `composeRefs` (the `RadioGroup.tsx:206` pattern) and
pinned by a test.

`ComboboxItem` had the identical shape and was fixed the same way. At the time
that was a refactor rather than a red-green cycle, because nothing read the
`element` it registers — an absence that turned out to be the real finding, and is
now closed by §0.4.

### 0.3 Clearing the query now clears the value

Reported as "this doesn't feel like correct behaviour": with a value committed,
emptying the field and pressing Escape put the old label straight back. It was
behaving exactly as exploration §D1 specified — but §D1 weighed only "restore the
value" against "keep the raw query", and never considered that **clearing the
field is itself a deselect intent**.

Settled as: emptying the query clears the value, firing `onValueChange("")`. §D1's
invariant survives — empty text, empty value, so the field still isn't showing
something that is not the value. Guarded on there being something to clear, so an
already-empty field never reports a change the consumer didn't cause. More config
here (opt-out, a clear button) is plausible later; the headless needs other work
anyway.

### 0.4 The cursor now scrolls into view

Found by fixing `ComboboxItem`'s ref (§0.2): **`ComboboxItemMeta.element` had no
reader anywhere** — only `.label` was used, in the Enter branch. Its JSDoc called
it "kept for future scroll-into-view work", so it read as a spare field. It was
not: it was an **unfinished feature with a live symptom.** The styled panel caps at
`--primitiv-combobox-content-max-block-size: 18rem` and scrolls past it, so
arrowing down a filtered list walked the cursor off the bottom with nothing
following it, and Home/End jumped to an item that could be far outside the
viewport. Any list long enough to scroll was affected — for a combobox, the normal
case.

Fixed by copying Listbox's `moveCursor` exactly: a single callback that wraps
`setActiveValue` and scrolls, so **no path can move the cursor without bringing it
on screen**. That funnelling is the point — the arrow-key hook's `onNavigate` and
both first-cursor seeds (ArrowDown → first, ArrowUp → last) now go through it, and
a future cursor mover would have to opt out deliberately to reintroduce the bug.
`block: "nearest"` for the same reason Listbox chose it: it is the option that does
nothing when the item is already visible, so ordinary arrowing does not jerk the
list about.

`ComboboxItemMeta.element` is now typed `HTMLElement` rather than
`HTMLElement | null`, which is what it always was in practice — registration
happens in the item's own effect, so the ref has attached by then. That also
retires the §0.2 caveat: with a reader for `element`, the ref composition is
observable behaviour, and four tests now pin it.

**Correction to an earlier note in this file: Listbox does NOT share this gap.**
`useListboxRoot.ts` has done it since it was built. The suspicion was raised on the
grounds that the two share a registry shape, and checking it was what turned up the
implementation to copy.

### 0.5 The docs site's component list is reconciled

Was §3.1. `apps/docs/.vitepress/components.mjs` listed 39 of 46 components with
READMEs; it now lists all 46.

**The interesting part is why it had drifted**, because it would have drifted again
otherwise: `gen-react-pages.mjs` emitted an unconditional VitePress `<<<` include
for `apps/workbench/src/pages/<Name>Example/<Name>Example.tsx`, and a missing
`<<<` target is a **hard build error**. Since the 2026-07-25 decision moved
examples to the kitchen-sink, nothing built after that date has a workbench page —
so adding any of them to the list would have broken the docs build, and they were
quietly left out instead. The generator now picks per component: embed the
workbench source where it exists, otherwise link the kitchen-sink section. The
anchors agree for free, since the kitchen-sink's `sectionSlug` and the docs'
`slugFor` produce the same string for every component.

Only `Slot` is unlisted now, and correctly so — it has no README.

---

## 1 · Remaining gaps between the settled design and the shipped code

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

### 1.2 The chevron does nothing when clicked (headless)

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
