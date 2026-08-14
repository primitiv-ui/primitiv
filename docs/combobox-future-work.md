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

### 1.2 The popup is not in the top layer (headless)

**Settled in Figma §G**, which lists "Popover-API popup layer (all four engines
have shipped it; the Firefox caveat closed at FF 125)" as explicitly **IN** for
v1. **Shipped: `Combobox.Content` unmounts while closed instead**, and never
touches `showPopover()` — unlike `Select.Content`, which does.

The registry works around it with `position: fixed` + CSS anchor positioning,
which is genuinely most of the way there: it escapes an ancestor's
`overflow: hidden` and flips above the control on viewport overflow. What it does
**not** escape is z-index stacking, so a later-painted sibling can cover the
panel. The documented escape hatch is wrapping `ComboboxContent` in the `Portal`
primitive.

Two further consequences of unmount-while-closed, both currently accepted:

- **No exit animation is possible.** React removes the node, so nothing can still
  match it. The panel animates in via `@starting-style` only. Select gets both
  because `[popover]` + `transition-behavior: allow-discrete` keeps the element
  painted through the close.
- **No light dismiss.** A `popover="auto"` gets outside-click dismissal from the
  UA for free. The headless owns Escape and commit-on-select, but clicking
  elsewhere on the page currently leaves the popup open. This is the more
  user-visible of the two.

**Deliberately not fixed in the registry.** It was considered: the wrapper could
set `popover="manual"` and call `showPopover()` in a mount effect, since with
unmount-while-closed "mounted" is exactly "open", so no state would be
duplicated. Rejected because (a) it puts layering behaviour in a file that is
copied into consumer repos and then diverges, (b) it fails *closed* — a
`[popover]` is `display: none` until shown, so any failure in that effect makes
the panel invisible rather than mispositioned, and (c) the layer decision belongs
to the headless layer, which is where `Select` makes it. Fix it there and the
registry sheet loses a caveat rather than gaining one.

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
