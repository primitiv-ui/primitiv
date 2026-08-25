# RFC 0021 — Composite components

> **Status:** Draft — proposed
> **Author:** Claude, with architectural drafting
> **Date:** 2026-07-27
> **Builds on:** the full primitive inventory — 43 headless components in
> `packages/react` (see `.claude/skills/new-react-component/_generated/component-inventory.md`)
> and 27 registry surfaces in `registry/components` (see `ROADMAP.md`'s
> coverage table). Cites the `new-registry-component` skill for the
> mechanical add-a-component flow, and RFC 0019 §3/§6 as the one *shipped*
> precedent for building a widget as a composition rather than a new
> primitive (`Drawer` = `Modal` + a side axis; the composed mobile nav =
> `Drawer` + `Collapsible` + a shared `Link`).

## 1. Why this exists

The primitive layer is close to feature-complete: 43 headless components
cover almost every WAI-ARIA authoring pattern worth having, and 27 of them
already have a registry (styled, copy-in) surface with a kitchen-sink demo.
What's left on the primitive backlog (`ROADMAP.md` → "Components to build")
is now mostly components with **genuinely new interaction logic** — Calendar
(date math), Listbox (a bare selectable list), File Upload (drag/drop +
file state), Toolbar/Menubar (mixed-child roving tabindex), Splitter (drag
resize), QR Code (canvas generation).

That's the point at which the next unit of library value stops being "one
more ARIA pattern" and starts being **"the things developers actually build
websites and apps out of"** — a data table, a confirm dialog, a command
palette, a card, a stepper. None of these need new accessibility research;
they need existing primitives arranged, wired with a little local state, and
styled as one shipped unit. That's a **composite component**, and it is the
next phase of the roadmap.

## 2. What "composite" means here

A composite component is a registry surface (`registry/components/<name>/`,
installed via `primitiv add <name>`) that is:

1. **Built from ≥2 existing shipped primitives**, composed at the JSX level
   — not a new ARIA pattern invented from scratch.
2. **Free of new cross-cutting accessibility research.** Every part already
   carries its own correct role/keyboard/focus behaviour; the composite's
   job is arrangement, default styling, and small glue state (which step is
   active, which rows are selected, is the toast queue open) — not
   re-deriving `role="dialog"` focus-trap semantics from a spec.
3. **Registry-first.** Following the `code-block` / `inline-code` /
   `prose` precedent, most composites need no new headless package at all —
   the composition happens directly in the copied `<name>.tsx` wrapper,
   exactly like `code-block` composes headless `Tabs` + registry `Button`
   today. A composite only grows a `packages/react` presence if its glue
   state is worth reusing **outside** the styled wrapper (see §5, Tier 2).

This deliberately excludes `Drawer` and the composed mobile
`NavigationMenu` from the "composite" label even though both are
compositions — they're **headless** compositions, published as
`@primitiv-ui/react` primitives with their own test suite, because their
composed behaviour (a `side` axis; a shared nav data model across two
presentations) is something a consumer might reasonably reimplement in
their own JSX and still want type-safe, tested state for. A composite in
this RFC's sense skips that: it ships pre-arranged, and a consumer who
wants a different arrangement uses the underlying primitives directly
(that's what `add` copying source, not a compiled black box, is for).

## 3. Selection criteria

A candidate belongs on this list if it passes all four:

- **Composable today** — every part it needs already has a ✓ in
  `ROADMAP.md`'s coverage table, *or* the gap is a small, identifiable
  extension to an existing primitive (documented per-candidate below, not
  hidden).
- **Common enough to earn its keep** — it should be a thing most consumers
  building a real product screen would otherwise hand-roll badly (ad hoc
  focus handling, missed `aria-live`, a table with no keyboard row actions).
- **No new WAI-ARIA pattern.** If a candidate turns out to need one on
  inspection, it's a primitive-backlog item, not a composite — see §6 for
  the ones filtered out on this basis.
- **Cheap to keep in sync.** A composite that hardcodes a copy of another
  component's markup instead of importing it (e.g. re-declaring `Button`'s
  classes) is a maintenance trap the moment `Button` changes. Compose the
  real sub-components; don't reimplement them.

## 4. Candidate list

Grouped by tier: **Tier 1** ships against today's primitive set with zero
prerequisites. **Tier 2** wants one small shared piece extracted first
(a hook, a role prop) but nothing that changes an existing component's
public contract. **Tier 3** is genuinely blocked on a primitive-backlog
item landing first.

### Tier 1 — buildable now

| Composite | Composed of | Glue state | Notes |
|---|---|---|---|
| **Confirm / Alert Dialog** | `Modal` + `Button` (×2, cancel/confirm) | none beyond Modal's own open state | The highest-value quick win. A `Modal` preset: no light-dismiss by default, a tone-coloured leading icon (warning/danger), and a fixed footer button pair. Mirrors the `Drawer` precedent almost exactly — Modal + a variant axis, not new logic. `role="alertdialog"` is one prop; if `Modal.Content` doesn't already accept a `role` override, that's the one-line primitive extension, tracked as its own tiny prerequisite, not a blocker. |
| **Breadcrumb overflow menu** | `Breadcrumb` + `Dropdown` | which middle items are collapsed (pure CSS container-query or a simple width check) | Collapses the middle of a long trail into a "..." `Dropdown` trigger. Both parts are ✓ done, registry ✓ done, zero prerequisites — good candidate to build *first* to prove the pattern end-to-end before tackling anything bigger. |
| **Avatar group / stack** | `Avatar` (×N, overlapping) + `Tooltip` (name-on-hover) + a "+N" overflow badge | which avatars overflow past a max count | Pure layout composite. The "+N" chip is one `<span>`, no new primitive needed at this size — but see **Badge/Tag/Chip** below, which several composites want. |
| **Badge / Tag / Chip** | none — a styled leaf, like `Divider` | none | Not itself a composition, but flagged here because it's a **load-bearing dependency**: Select's slot work already logged "Tag/Chip/Badge swap in once built" (`docs/select-future-work.md`), RFC 0019's Framework dropdown wants a "Soon" badge, and four composites below (Avatar Group, Card, Data Table, Stat Tile) want one too. Build it before or alongside the first composite that needs it, as a `prose`-style hand-authored, primitive-less registry leaf. |
| **Card** | `Divider` (optional section rule) + `Avatar`/`Badge` (metadata) + `Button` (actions) inside named slots (Media/Header/Body/Footer) | none | Mostly pure CSS layout in the `prose` mould — ships useful with zero dependencies, gets more useful once Badge exists. |
| **Stepper / Wizard** | `Tabs` (manual activation, one panel active) + `Button` (Back/Next) + a decorative step-indicator row (`ToggleGroup`-style pill markup, read-only) + optional `Progress` | current step index (already what `Tabs`' controlled `value` gives you) | The step indicator is decoration, not a control — no new roving-tabindex logic; `Tabs` already owns activation and panel visibility. |
| **Pagination** | `Button` (prev/next/page numbers) + `Select` (jump-to-page, optional) | current page, page count | Reusable standalone and as the footer of Data Table below. |
| **Data Table** | `Table` + `Checkbox` (row + header select-all) + `Dropdown` (column visibility / row action menu) + `Select` or `SegmentedControl` (page size) + `Pagination` (above) + `InputGroup` (filter box) | sort column/direction, selected-row set, current page — all local `useState`, no new ARIA (sorting is just a clickable `Table.Head` + an icon, selection is just `Checkbox`) | The flagship composite. Big surface area, but genuinely zero new accessibility research — everything it needs already ships. Best built incrementally (bare sortable+selectable table first, pagination/filtering as follow-up cycles) rather than as one PR. |
| **Rating** | `RadioGroup` re-skinned with star icons | none | Currently sitting on the *primitive* backlog (Forms) — flagged here for **reclassification**: it needs no new headless logic at all, just `RadioGroup` + `Icon` styling. Recommend moving it from `ROADMAP.md`'s primitive list to this one. |
| **Stat / KPI tile** | `Progress` (or a simple ring built the same way) + `Badge` (trend indicator) + `Prose` typography | none | Dashboard-oriented; cheap once Badge exists. |
| **Notification / inbox popover** | `Popover` + `Badge` (unread count) + `Status` (live region for new-item announcement) | unread count (consumer-supplied) | A bell icon that opens a `Popover` list; nothing here is new interaction, just an arrangement. |

### Tier 2 — needs one small shared extraction first

| Composite | Composed of | What's missing | Notes |
|---|---|---|---|
| **Hover Card** | `Popover` (panel + positioning) + hover-intent timing | A reusable hover-intent hook. `Tooltip` and `NavigationMenu` *each* independently implement open-on-hover-with-delay/close-with-grace logic today (see `Tooltip.hover-interaction.test.tsx` and `NavigationMenu.hover-interaction.test.tsx`) — there is no shared `useHoverIntent`-style hook yet. Extracting one (used by both existing components plus this new composite) is a small, well-scoped refactor, not a new ARIA pattern. |
| **Toast / notification stack** | `Alert` or `Status` (the live-region announcement) + `Portal` + `Button` (dismiss) + optional `Progress` (countdown bar) | A small queueing hook (`useToastQueue` — enqueue/dismiss/auto-expire timers, stacking order). This is genuine new logic, but it's a queue, not an ARIA pattern — the accessibility all comes from the `Alert`/`Status` role it wraps. Worth landing as a tiny headless hook in `packages/react` (reusable outside the styled wrapper) rather than hiding it in the registry `.tsx`, since a consumer very plausibly wants to call `toast.success(...)` from anywhere in their app, not just from JSX composition. |

### Tier 3 — blocked on a primitive-backlog item

These are real composites, but they need a primitive that doesn't exist yet
underneath them. Listed so the dependency is explicit, not so they're
proposed for immediate work — the underlying primitive stays tracked in
`ROADMAP.md`'s existing backlog.

| Composite | Needs first | Once unblocked, composes |
|---|---|---|
| **Command Palette (⌘K)** | **Listbox** (backlog, Collections & Selection) — a bare selectable list with active-descendant highlighting and typeahead, factored out from what `Select`'s rich mode and `Dropdown` already do internally | `Modal` (or `Popover`) + `InputGroup` (search) + the new Listbox (grouped, filtered results) |
| **Search with suggestions** | Same Listbox gap as above | `InputGroup` + `Popover` (anchored suggestion panel) + Listbox |
| **Date Picker** | **Calendar** (backlog, Collections & Selection — real date math, not composition) | `Popover` (anchor) + Calendar (grid) + `Input` (text entry) + `Button` (month nav) |
| **File Upload UI (dropzone + previews)** | **File Upload** (backlog, Forms — drag/drop + file list state) | the new File Upload primitive + `Progress` (per-file upload %) + `Avatar`-style file-type icon + `Button` (remove/retry) + `Status` |

Cross-reference, not proposed here: **Combobox** is already tracked
separately in `docs/select-future-work.md` as a deferred `Select` extension,
not a new composite — this RFC doesn't duplicate that decision.

## 5. Filtered out — these need new ARIA, not composition

Worth naming so a future session doesn't rediscover the same dead end:

- **Toolbar / Menubar** — both need a genuine mixed-child roving-tabindex
  keymap (buttons, toggles, separators, and a menu button sharing one
  tabstop) that no existing primitive implements. Stay on the primitive
  backlog.
- **Splitter** — drag-to-resize with its own pointer/keyboard model; no
  existing primitive covers panel resizing. Primitive backlog.
- **QR Code** — canvas/SVG generation from data, not a UI composition at
  all. Primitive backlog (or arguably a plain utility function, not a
  component).

## 6. Conventions for building these

**Figma first, always — "zero prerequisites" is not "zero design work."**
The Tier 1 table above says these ship against today's primitive set with
no new ARIA pattern; that's a statement about *behaviour*, not about
*visual decisions*. Composing two ✓-done components together still
surfaces real design choices that only show up once the composition is
sitting on a canvas — which existing token family a nested part should
borrow versus needing a new one, how two components' anatomies actually
align pixel-for-pixel, what a shared interaction state (hover, focus)
should look like when it didn't exist on either piece in isolation. Alert
(a Tier 0 primitive-adjacent composite, but the same lesson applies one
tier up) is the reference case: building its dismiss button in Figma first
is what surfaced the need for a scalable `icon-offset-top` optical-
alignment token, that the dismiss control should be a real Icon Button
instance rather than a bare icon, and that its hover/active states needed
two brand-new token families (`feedback/*/soft/hover`,
`feedback/*/soft/active`). None of that was visible from "compose Button
+ Modal" as a sentence — every composite in this RFC gets the same
treatment: a Figma component set (or an exploration page, for the larger
composites like Data Table) lands *before* the registry build, and any new
tokens or cross-component alignment decisions get settled there. See
`CLAUDE.md`'s Working style §8 for the general rule this RFC's Tier 1
table doesn't get to skip.

Beyond that, follow the `new-registry-component` skill exactly as written
for the Tier 1 list — same six files under `registry/components/<name>/`,
same `registry.json` / `crates/primitiv-cli/src/ports/registry.rs` /
`crates/primitiv-cli/tests/cli.rs` three-edit registration, same
kitchen-sink hand-sync to verify pre-release. Two more additions specific
to composites:

- **`dependsOn.components` carries real weight here.** Where `code-block`
  depends on `button` for one reused class, a composite like Data Table
  depends on `table` + `checkbox` + `dropdown` + `select` — list every one
  the wrapper actually imports, so `add data-table` pulls in a working
  install rather than a broken partial one.
- **Definition of done stays the same as any component change** (per
  `CLAUDE.md`) — test, JSDoc/README, `packages/react/README.md` row where
  applicable, kitchen-sink demo, roadmap tick. The one adjustment: a
  Tier 1 composite with *no* new state (Card, Avatar Group, Confirm Dialog)
  needs no new unit test, mirroring `prose`/`inline-code`'s no-test
  precedent — there's nothing behavioural to assert on beyond what the
  composed primitives already cover. A composite that *does* carry new
  glue state (Data Table's sort/select, Stepper's step index, the Tier 2
  hooks) gets tests for that state exactly like any other behaviour change.

## 7. Suggested build order

1. **Breadcrumb overflow menu** — zero prerequisites, smallest surface,
   proves the composite pattern and the "compose two ✓ done things" claim
   end-to-end.
2. **Badge/Tag/Chip** — unblocks four other candidates and the
   already-logged Select slot gap.
3. **Confirm/Alert Dialog** — highest value-to-effort ratio; nearly every
   real app needs one.
4. **Card**, **Avatar Group**, **Stat Tile** — cheap, high visual payoff,
   good for filling out the kitchen-sink's "what a real page looks like"
   story.
5. **Pagination**, then **Data Table** (incrementally: sortable+selectable
   table → pagination → filtering as separate cycles).
6. **Stepper/Wizard**, **Notification popover**.
7. Tier 2 (Hover Card, Toast) once their shared extraction lands.
8. Tier 3 items resume once their blocking primitive ships — no new
   decision needed at that point, this RFC's table already specifies the
   composition.

This order front-loads the composites with the fewest moving parts so the
registry conventions for a *composed* (rather than generated or
hand-authored-from-nothing) wrapper get proven on low-stakes surfaces
before Data Table's larger one.
