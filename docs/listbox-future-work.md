# Listbox — design exploration, session handoff

Status as of 2026-08-06: **the headless compound is landed** (100% unit +
mutation, in `mutation-allowlist.json`); the **Figma exploration page is
built and all twelve design calls are settled**; the **Figma component sets
are landed** (four sets, 100 variants, all md-first); the **registry surface
and the kitchen-sink demo are not started.**

The exploration turned up two headless items. One was real and **has landed**
(a click now moves the cursor). The other — an `invalid` prop — turned out
**not to be needed at all** once the existing convention was checked; see
"Invalid needs no headless change". Neither was known before the exploration.

**Headline outcome: this component needs no new design tokens of any kind.**
No `listbox/*` geometry family, no new Intent roles. That is not a
coincidence — it falls out of one decision pair (§D → §B below), and if
either of those is revisited the token cost comes straight back.

## What already exists

`packages/react/src/Listbox` — headless compound, done, tested, documented
(`packages/react/src/Listbox/README.md` is the reference):

- `Listbox.Root` — `<div role="listbox">`, the tab stop, owns
  `aria-activedescendant`, context provider, `asChild`
- `Listbox.Option` — `<div role="option">`, `aria-selected`,
  `data-highlighted`, `disabled`, `asChild`
- `Listbox.Group` — `<div role="group">`, named by `label` or a nested
  `GroupLabel`, `asChild`
- `Listbox.GroupLabel` — `role="presentation"` visible heading; wires the
  group's `aria-labelledby`

The thing that makes it a separate component from `Select`'s popup listbox
is **virtual focus**: DOM focus never leaves the Root, the cursor is
published as `aria-activedescendant` and marked `data-highlighted`. That is
what lets an external input hold focus and drive the list, which is what
unblocks the Command Palette and Search-with-suggestions composites — both
listed in RFC 0021 §4 under "Tier 3 — blocked on a primitive-backlog item",
where the blocking item is this component.

Every visual decision below follows from that one fact plus its consequence:
**two independent row states are on screen simultaneously** — the cursor and
selection — which no other component in the library has to separate. In
`Select`'s popup the highlighted row *is* the DOM-focused row, so the
question never arises there.

## The exploration page

Figma page **"Listbox — exploration"** (`1554:41672`), last page in the
file, after "Split Button — exploration". Nine sections A–I following the
Split Button page's convention: title + intro, lettered `SECTION`s each
holding a `<letter> specimens` frame of `spec: …` frames, a verdict `TEXT`
beneath, closing with a contract-panel row.

Every colour binds to a real variable, and specimens are composed from real
component instances wherever one exists — `Dropdown / CheckboxItem`,
`Dropdown / Label`, `Dropdown / Separator`, `Checkbox`, `Input`,
`EmptyState`, `Icon`. That mattered twice: it is what made §D's comparison
trustworthy, and it is what exposed that §H's EmptyState option was being
argued unfairly (see "Specimens that had to be rebuilt").

## Settled decisions

All twelve settled 2026-08-06. Verdict text on the page carries the same
reasoning; this is the index.

| § | Call | Settled |
| --- | --- | --- |
| A | Container | **A1, input-like frame.** `surface/default` + 1px `border/default` + `framed-control/{size}/radius`. It is a form control: it holds the tab stop, sits under a `Field` label, can be invalid. Frame borrows `framed-control/{size}/*`; everything inside is `dropdown/{size}/*` — the split `Select` already ships |
| A5 | Frame states | **default / focus / invalid.** `border/invalid` on the frame only, rows untouched, matching Input/Textarea/Select's trigger. Styled from `[aria-invalid="true"]` — no headless prop needed, see below. **No root-level disabled** — the headless layer has no such prop |
| B | Cursor vs selection | **B1, Select's model verbatim.** Cursor = full-row `action/secondary/default`; selection = a checkmark in the reserved gutter. Zero new tokens |
| B5 | Hover vs cursor | **A weaker `action/ghost/hover` tint**, never the cursor tint. On the cursor row the cursor tint wins outright — hover does not composite over it |
| C | Focus | **C1 + C4 — one unconditional cursor.** Frame keeps the standard offset ring (`focus/ring/width` 2 at `focus/ring/offset` 2); the cursor keeps its full tint whether or not the frame is focused. Nothing deferred, nothing dimmed |
| D | Multi-select mark | **D2, real (presentational) Checkbox controls.** Single-select keeps the plain checkmark, so the two modes carry different marks |
| E | Groups | **E1 — reuse `Dropdown / Label` verbatim**, no indent, no separator between labelled groups. Sticky heading adopted for the scrollable case, CSS-only, not modelled in Figma |
| F | Row inset + height | **F1, inset rows.** Height consumer-owned via `--primitiv-listbox-max-block-size`, not a token |
| G | Size ramp | **Reuse wholesale — no `listbox/*` family.** Build the Figma set md-first |
| H | Empty state | **H1 — a `ListboxEmpty` presentational row**, `content/muted`, ~2 rows tall, message left to the consumer |
| — | Click and the cursor | **A click moves the cursor to the clicked option.** Landed 2026-08-06 |
| — | Named parts | **Expose `ListboxEmpty` and `ListboxGroupLabel`** on the registry surface |

### The one dependency that matters

§D and §B are not independent, and the order they were decided in is the
reason no tokens are needed:

- Giving multiple-selection a **real Checkbox** (§D) means the *control*
  carries multi-select scannability.
- That frees the **row tint to mean "cursor"** (§B), so `Select`'s existing
  row language is sufficient.
- Which is why **B4 was not needed** — no `action/primary/soft/default` or
  `/hover`.

Reverse §D (checkmark for multiple, per Dropdown's model) and B1's selection
degrades into a scatter of glyphs down the list — clearly visible in
section B's in-situ specimens, and not visible at all in the four-state
charts beside them. B4's two new Intent tokens come straight back.

### Why §D deliberately breaks with Dropdown

Dropdown explicitly rejected embedded controls in favour of a checkmark
indicator (a design mistake caught and fixed across 75 variants — see
`CLAUDE.md`). That decision does **not** transfer here, and the difference
is worth stating because it will look like an inconsistency:

- A **menu** is transient and dismisses on the first click, so a state
  *readout* is enough.
- A **multi-select listbox** is a form control you accumulate a selection in
  and submit. The affordance has to *invite* clicking, and an empty box is
  an unambiguous "not selected" in a way the *absence* of a checkmark is
  not.

Accessibility consequence for the build: the Checkbox is **presentational
(`aria-hidden`)**. The row's own `aria-selected` carries the state, because
`role="option"` is what the listbox pattern requires.

### Why hover must not drive the cursor

`Select`'s popup and `Dropdown` both move the highlight on pointer movement.
Listbox deliberately does not, and the headless layer has no pointer
handling at all to make it possible. A mouse resting anywhere over the list
would steal the cursor mid-keystroke — which is exactly what the palette
case cannot have, and is why `cmdk` does not do it either.

That is *also* why hover cannot reuse the cursor tint: two rows would look
active at once, and the pointer would appear to move a cursor it cannot
move.

## Facts the exploration surfaced

Four things that were not visible from the component's spec or its README.

### `surface/sunken`, `surface/subtle` and `action/secondary/default` are all `#d3dae3`

All three resolve to `color/neutral/100`. Two consequences, both load-bearing:

- A **sunken-well container is unusable** (§A4): the cursor row is painted
  in the container's own colour and disappears. Visible in the specimen —
  this is a much stronger rejection than the "reads read-only" argument the
  section was originally built to make.
- There is **no role to dim a cursor to** (§C5). Stepping the cursor down
  while the list is unfocused has to reach past the roles into the raw
  `color/neutral/50` primitive.

Worth remembering beyond this component: any design that needs two
distinguishable neutral tints has one fewer step available than the role
names suggest.

### The headless layer has no pointer handling whatsoever

No `onPointerEnter` / `onPointerMove` / `onMouseEnter` anywhere in
`packages/react/src/Listbox`. Hovering does not move the cursor. This is
fine — it is the settled behaviour (see above) — but it has to be a
*documented* decision rather than an accident, and it forces hover and the
cursor to be visually distinct.

### `onClick` selects without moving the cursor

`Listbox.tsx` (the `Listbox.Option` click handler) calls `select(value)` and
nothing else. So: click row 5, press ArrowDown, and the cursor resumes from
wherever focus seeding left it (the previously-selected row), not row 6.
Focus fires before click, so seeding has already run against the *old*
selection by the time the click lands.

**No test asserts this in either direction** — checked across all 21 test
files. So it is a genuine gap, not a deliberate choice, and APG treats the
clicked option as the focused option. Settled as: a click moves the cursor.

### Invalid needs no headless change — this doc originally said otherwise

The first version of this doc (and §A5's note on the Figma page) claimed the
build owed an `invalid` prop on `Listbox.Root`. It does not, and the reason is
worth recording because it applies to any future headless control:

- `ListboxRootBaseProps` extends `Omit<HTMLAttributes<HTMLDivElement>, …>`,
  and `...rest` is spread onto the root's `<div>`. **`aria-invalid` already
  reaches the DOM today** — verified with a throwaway probe test, which passed
  unmodified against the shipped code and was then deleted rather than
  committed (a test that passes on first run is a characterisation test, which
  this repo's TDD rules forbid).
- So the styling hook already exists: `[aria-invalid="true"]` on the root.
  **`InputGroup` sets the precedent** — it styles its frame with
  `:has(input[aria-invalid="true"])` rather than from a `data-*` mirror.
- A bespoke `invalid` prop would only restate what the ARIA attribute says,
  and it would add a prop-collision surface for nothing.

**The house convention for invalidity is `Field`, not a per-control prop.**
`Field.Root` owns `invalid`, and `useFieldProps` merges `aria-invalid` down to
the control with the consumer winning — that is how `Input`, `Textarea` and
`Select` get it. None of them defines its own `invalid` prop either.

Whether `Listbox` should become **Field-aware** (consume `useFieldProps`) is a
genuine open question and deliberately **not** settled here, because it is not
a drop-in:

- `useFieldProps` also merges `disabled` and `required`. Listbox has neither
  concept, and spreading them onto a `<div>` would emit meaningless
  attributes.
- `Field.Label` renders `<label for={id}>`, which **cannot** label a
  `<div role="listbox">` — `<label>` only labels labelable elements. A
  Field-aware Listbox would need `Field` to wire `aria-labelledby` instead,
  which is work on `Field`, not on `Listbox`.

Until that is decided, a consumer puts a Listbox in a `Field` by passing
`aria-labelledby` and `aria-invalid` themselves. Worth revisiting when the
registry surface is built and the Field composition gets exercised for real.

### Figma scripting gotcha — `resize()` clears `textAutoResize`

Calling `node.resize(w, h)` on a `TEXT` node forces `textAutoResize` to
`"NONE"`. Every note on the page was silently a 380×10 box overflowing its
frame, and every auto-layout parent reported a height short by exactly the
note's height — so verdict text landed on top of the notes. The parent
frames were correct; the text nodes were lying about their size.

Correct order is **resize first, then set the mode**:

```js
t.resize(width, 10);
t.textAutoResize = 'HEIGHT'; // recomputes height; must come AFTER resize
```

Add this to any future exploration-page script. The `redesign-explorations.js`
helper does not currently guard against it.

## Specimens that had to be rebuilt

Cases of a specimen quietly contradicting its own verdict — worth recording
because it is the failure mode an exploration page is most prone to, and
none was visible until it was rendered.

- **§F2 (full-bleed rows)** had no tint on the first or last row, so its
  central claim — that a square-cornered tint cuts into the frame's rounded
  corner — was invisible. Moved the cursor tint to the first row.
- **§F3 (row-boundary height)** was clipping on a clean row boundary while
  its note said "clipping mid-row, as here, deliberately". Height changed to
  land mid-row.
- **§H2 (EmptyState)** was built with media and actions switched *off*,
  where it looks perfectly reasonable — while the note argued it was too
  much furniture. Rebuilt with EmptyState's own defaults, as a consumer
  would actually drop it in. The stronger argument is now on the page:
  stripping EmptyState down far enough to fit just reproduces H1.

## Figma component sets — landed 2026-08-06

Page **"Listbox"** (`1569:150`), placed directly under the
"---- COLLECTIONS & SELECTION ----" divider, which was previously an empty
section. Four sets, 100 variants, **every one md-first** — `Size` reports
`["md","xs","sm","lg","xl"]` on all four, achieved by creating the md variants
before the others (the one thing that works, since `defaultVariant` is
read-only via the plugin API — the lesson Collapsible and Select couldn't
apply retroactively).

| Set | ID | Variants | Axes |
| --- | --- | --- | --- |
| `Listbox / Option` | `1569:2859` | 40 | Size × State `default\|hover\|cursor\|disabled` × Selected |
| `Listbox / CheckboxOption` | `1569:4221` | 40 | same |
| `Listbox / Empty` | `1569:4246` | 5 | Size |
| `Listbox` (composed) | `1569:4829` | 15 | Size × State `default\|focus\|invalid` |

**`State` carries four values, not three.** `cursor` is its own state
alongside `hover`, which is the whole reason this component exists separately
from a menu row — and the cursor tint is deliberately *stronger* than hover's,
with the cursor winning outright where both apply (§B5).

**The composed set is a real composition.** Its `Slot` holds live, size-matched
`Listbox / Option` instances, and `preferredValues` curates the picker to
`Option`, `CheckboxOption`, `Empty`, `Dropdown / Label` and
`Dropdown / Separator` — so a designer adds, removes and reorders rows natively
with no detaching.

### Figma API findings from this build

Five, all found by measuring rather than assuming. The first three will bite
any future component build.

1. **The Icon set's own size scale is 16 / 20 / 24 / 32 / 48 — NOT the
   `icon-size` token scale (12 / 14 / 16 / 20 / 24).** The house convention
   (read off `Dropdown / Item`) is to use the **`size=md`** variant everywhere
   and bind `width`/`height` to `dropdown/{size}/item/icon-size`. Using
   per-size Icon variants gives visibly wrong glyph sizes.
2. **Attaching an `INSTANCE_SWAP` property resets every nested instance to the
   property's single default**, so per-size nested instances cannot survive
   the property wiring. This is *why* convention 1 works — the bound
   dimensions do the sizing, not the variant.
3. **A bound variable cannot be overridden on a node inside an instance.**
   `setBoundVariable` returns without throwing and silently no-ops; the main
   component's binding wins. This is what forces `CheckboxOption` to be its
   own set rather than an instance of `Option` (it needs `checkbox/{size}/box-size`
   for its mark column, not `icon-size`).
4. **A SLOT can be created from scratch via the plugin API**, contrary to the
   note in `CLAUDE.md` that only writing into an *existing* slot works:
   `addComponentProperty('Slot','SLOT','')` succeeds (the `defaultValue` must
   be a string or boolean — `null` and `{}` both fail validation), and a `SLOT`
   node can be `clone()`d from `Dropdown / Panel` and re-pointed via
   `componentPropertyReferences = { slotContentId }`. `figma.createSlot` is
   undefined, and a cloned slot loses its `slotContentId` (the known
   clone-drops-refs gotcha).
5. **Figma ignores `spread` on `DROP_SHADOW` effects here**, so the CSS
   two-layer box-shadow focus ring cannot be reproduced as effects — it renders
   as nothing at all. Drawn instead as an absolutely-positioned rectangle
   outset by `focus/ring/offset + focus/ring/width` with
   `constraints: {horizontal:'STRETCH', vertical:'STRETCH'}` so it tracks the
   panel as slot content changes its height. The `framed-control/{size}/focus-ring-radius`
   + `/focus-ring-gap-radius` token pair existing at all is the signal that the
   house draws this geometrically.

Also confirmed (same boundary Card and ConfirmDialog hit): **a wrapper set
cannot expose a nested instance's `Label`** — `Cannot attach 'TEXT' component
property reference on a node that does not accept references of that type`.

## Remaining work

In order. Nothing here is blocked.

1. ~~**Headless — `invalid` on `Listbox.Root`.**~~ **Dropped** — not needed;
   `aria-invalid` already passes through. See "Invalid needs no headless
   change". The registry stylesheet styles `[aria-invalid="true"]`.
2. ~~**Headless — a click moves the cursor.**~~ **Landed** —
   `moveCursor(value)` in `Listbox.Option`'s `onClick`, inside the existing
   disabled guard, reusing the hook's one cursor-movement path (deliberately
   not `navigateTo`, which would re-apply `selectionFollowsFocus` and toggle
   the option straight back off in multiple mode). Two tests in
   `Listbox.active-descendant.test.tsx`: the cursor lands on the clicked
   option, and arrow navigation resumes from it. 113 tests, 100% lines /
   branches / functions / statements.
3. **Open question — should `Listbox` be Field-aware?** See "Invalid needs no
   headless change" for why it is not a drop-in (`disabled` / `required` do
   not apply to a `<div>`, and `Field.Label`'s `<label for>` cannot label a
   `role="listbox"`). Revisit when the registry surface exercises a real
   Field composition.
4. ~~**Figma component set.**~~ **Landed** — see "Figma component sets" above.
   Four sets, 100 variants, all md-first, no Orientation axis. Descriptions
   written on all four. Outstanding cosmetics, non-blocking: example specimens
   (light/dark) and the canonical entries in the
   `figma-component-descriptions` skill.
5. **Registry surface** `registry/components/listbox/` — see the
   `new-registry-component` skill for the mechanical flow. Exposes
   `ListboxEmpty` and `ListboxGroupLabel` as named parts. Roster count goes
   to 53; register in `registry/registry.json`,
   `crates/primitiv-cli/src/ports/registry.rs` and
   `crates/primitiv-cli/tests/cli.rs`.
6. **Kitchen-sink demo.** Single-select, multi-select (real Checkboxes), a
   grouped scrollable list, and the palette composition (`Input` + Listbox)
   that §C4 is built around — the last one is the point of the component.
7. **Component description** on the Figma set, plus the canonical entry in
   the `figma-component-descriptions` skill.
8. **`ROADMAP.md`** — the Listbox row (line ~111) still says "no Figma set,
   registry surface or kitchen-sink demo yet". Update as each lands.

## Reference IDs (Primitiv Design System file)

| Thing | ID |
| --- | --- |
| "Listbox — exploration" page | `1554:41672` |
| §A container + frame states | `1555:41837` |
| §B cursor / selection / hover | `1555:41989` |
| §C focus | `1555:42089` |
| §D multi-select mark | `1555:42233` |
| §E groups | `1555:42297` |
| §F scroll + row inset | `1555:42366` |
| §G size ramp | `1555:42428` |
| §H empty state | `1555:42466` |
| §I settled contract | `1555:42503` |
| "---- COLLECTIONS & SELECTION ----" divider | `391:3480` |
| **"Listbox" page** (the component sets) | `1569:150` |
| `Listbox / Option` | `1569:2859` |
| `Listbox / CheckboxOption` | `1569:4221` |
| `Listbox / Empty` | `1569:4246` |
| `Listbox` (composed, with the Slot) | `1569:4829` |

Instances the specimens are built from:

| Component | ID |
| --- | --- |
| `Dropdown / Item` | `401:18180` |
| `Dropdown / CheckboxItem` | `401:18278` |
| `Dropdown / Label` | `668:42192` |
| `Dropdown / Separator` | `668:42201` |
| `Dropdown / Panel` | `668:42210` |
| `Checkbox` | `369:30652` |
| `Input` | `393:6159` |
| `EmptyState` | `1523:889` |
| `Icon` (set) | `153:1754` |
