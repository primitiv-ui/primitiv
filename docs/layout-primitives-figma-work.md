# Layout primitives — Figma work (COMPLETE, 2026-08-09)

> **All four steps are done.** Steps 1–3 landed 2026-08-09; step 4 was a
> deliberate no-op. The RFC 0025 breakpoint variables listed at the foot also
> landed in the same session, so `Container`'s widths bind to them rather than
> being literals. Kept for the record — nothing here is outstanding.
>
> **One correction.** Step 1 said *"Nothing in Figma consumes these"*. A
> `boundVariables` sweep before renaming found **9 nodes that do** — `Plate`
> frames on the *Main Design* page binding `topLeftRadius` to
> `container/sm/radius`. The rename was still safe (Figma bindings follow the
> variable id, not its name) and all 9 were verified intact afterwards, but the
> claim was wrong. Also: the family is **12** variables, not 16 — 4 slots × 3
> props, as this doc's own table shows.


Everything the Figma file still needs after RFC 0022's build-order step 3
(Container + Grid) landed on the web side, 2026-08-08. The code side is
complete and consistent; **Figma is out of step in three ways**, one of which
is a latent hazard rather than just a gap.

Nothing here is blocked on a decision — every value below is settled and
copied from `packages/tokens/src/context.json`, which is the source of truth.
Do them in the order given: the variable work must land before the component
set, because the set binds to variables created in step 2.

> **Bridge status — RESOLVED.** The pairing worked on 2026-08-09 with no
> special steps; the note below is kept for its troubleshooting value only.
>
> **Bridge status (2026-08-08).** Both attempts this session hit
> `MCP error -32003: MCP tool call requires approval` on a bare `figma_execute`
> read, the same failure the RFC 0025 breakpoint-variable work hit. All the
> Figma items in this repo are blocked on the same one session problem — fix
> the pairing once and this doc, plus the RFC 0025 items in
> `transfer-and-next-steps.md`, all unblock together. Per the
> `figma-bridge-token-sync` skill: re-pair with a fresh code, have the human
> toggle Cloud Mode off/on first, and check Figma Desktop for a pending
> approval prompt before retrying. Fall back to `use_figma` (official Figma
> MCP, no pairing) if the bridge still refuses.

---

## ✅ Step 1 — rename `container/*` → `surface/*` (DONE 2026-08-09)

**This is the hazard.** The layout `Container` needed the `container/*` Context
namespace, which was already occupied by an unrelated size-slotted
padding/gap/radius family — a near-duplicate of `card/*`, adopted by **no**
registry component, read only by two workbench stylesheets. The human
authorised taking the namespace (the workbench is a legacy surface the
kitchen-sink replaces), so on the code side that family **moved to `surface/*`**
and the eight workbench references were updated.

**Figma still carries the old `container/*` names.** Until this rename lands,
a sync-plugin backup would reintroduce the old family *and* drop the new
gutter family — silently undoing the web work. Do this before any backup.

16 variables to rename, across all four density modes. Values are unchanged —
this is a pure rename, so verify the numbers match rather than re-entering them:

| slot | prop | dense | compact | comfortable | spacious |
|---|---|---|---|---|---|
| sm | padding | 8 | 8 | 12 | 16 |
| sm | gap | 4 | 4 | 8 | 12 |
| sm | radius | 4 | 4 | 6 | 8 |
| md | padding | 10 | 12 | 16 | 24 |
| md | gap | 6 | 8 | 12 | 16 |
| md | radius | 4 | 6 | 8 | 12 |
| lg | padding | 14 | 20 | 24 | 32 |
| lg | gap | 10 | 12 | 16 | 20 |
| lg | radius | 6 | 10 | 12 | 16 |
| xl | padding | 20 | 28 | 32 | 48 |
| xl | gap | 14 | 16 | 20 | 32 |
| xl | radius | 8 | 12 | 16 | 20 |

`figma_rename_variable` is the direct tool; `figma_execute` works too. Nothing
in the Figma file *consumes* these (they were never bound to a component), so
the rename cannot break a binding — but confirm that with a quick
`boundVariables` sweep rather than assuming.

---

## ✅ Step 2 — create the two new Context families (DONE 2026-08-09)

Both are **new** variables in the existing **Context** collection (the
four-mode density collection: Dense / Compact / Comfortable / Spacious). Both
are aliases onto the `space/*` primitive scale, exactly as `stack/gap-*`
already is — create them as aliases, not raw numbers, so they track the scale.

### `container/gutter/{sm,md,lg}`

The responsive page-gutter ramp. Aliases (comfortable shown; each mode aliases
its own step):

| step | dense | compact | comfortable | spacious |
|---|---|---|---|---|
| sm | `space/space-8` (8) | `space/space-12` (12) | `space/space-16` (16) | `space/space-20` (20) |
| md | `space/space-12` (12) | `space/space-16` (16) | `space/space-24` (24) | `space/space-32` (32) |
| lg | `space/space-16` (16) | `space/space-24` (24) | `space/space-32` (32) | `space/space-48` (48) |

### `grid/gap/{xs,sm,md,lg,xl}`

Deliberately mirrors `stack/gap/*` step for step, so a Grid and a Stack at the
same step line up when nested. If `stack/gap/*` already exists in Figma, copy
its values verbatim — they are identical by design:

| step | dense | compact | comfortable | spacious |
|---|---|---|---|---|
| xs | 2 | 3 | 4 | 6 |
| sm | 4 | 6 | 8 | 10 |
| md | 8 | 12 | 16 | 20 |
| lg | 16 | 20 | 24 | 28 |
| xl | 20 | 24 | 32 | 40 |

---

## ✅ Step 3 — the `Container` component set (DONE 2026-08-09 — `1765:41081`)

The human's brief: *"a container surface with some padding and an empty Figma
Slot for placing content inside."* It is genuinely that simple — Container has
no border, no fill, no radius and no interaction. Do not add any.

**Page:** a new `Container` page, filed with the other layout work. (`Divider`
is currently the only entry under `---- LAYOUT ----`.)

**Variants: 7, one axis.** `Size` = `xs | sm | md | lg | xl | 2xl | full`.

Build **`lg` first** — it is the code default, and building the default variant
first is the only reliable way to get a default-first `Size` dropdown.
`ComponentSetNode.defaultVariant` is **read-only** via the plugin API, so a
retroactive reorder cannot fix it (logged on Collapsible and Select; solved on
NavigationMenu by building md first).

**Frame width per variant** — the breakpoint scale, in px:

| Size | width |
|---|---|
| xs | 360 |
| sm | 640 |
| md | 768 |
| lg | 1024 (default) |
| xl | 1280 |
| 2xl | 1536 |
| full | pick a representative canvas width (e.g. 1440) and note in the description that this variant has no cap |

**Layout:** vertical auto-layout, **hug** height, `padding-inline` bound to
`container/gutter/md` (see the divergence note below), `padding-block` 0.

**Content:** one `Slot`, hug both axes. Watch the `figma_execute` slot gotchas
in `CLAUDE.md` — `component.createSlot()` (not `figma.createSlot`), and it
**ignores its options object**, so set `name`, `layoutMode`, both sizing modes
and `itemSpacing` *after* creation and clear the slot's default `fills`.

### The one divergence to record in the description

**Figma auto-layout padding cannot be responsive.** The CSS gutter escalates
across three values (sm → md at 48rem → lg at 64rem); a Figma frame can only
show one. Bind `container/gutter/md` as the representative value and say so
explicitly in the component description, the way Card's three CSS-only
divergences are recorded. A designer needing the narrow or wide gutter
overrides the padding on their instance.

Also worth a line in the description: **`size` maps to the breakpoint scale**,
so a `Container` at `Size=lg` and a design frame at `lg (1024)` are the same
width by construction — the container fills that frame exactly, gutters
included (`box-sizing: border-box` on the web side).

---

## ✅ Step 4 — no `Grid` component set, deliberately (HONOURED — none built)

Do **not** build one. A grid's entire value is how it reflows across widths,
which a fixed-width Figma frame cannot express — a set would be a static
N-column frame that teaches a designer nothing they can't get from auto-layout
directly. This matches every other layout primitive (`Box`, `Stack`, `Spacer`,
`Center`, `AspectRatio` are all `—` in `ROADMAP.md`'s Figma column).

`Container` is the exception in this family precisely because a fixed
max-width column *is* something a design frame can show.

---

## ✅ Related — also landed 2026-08-09

The six `breakpoint/*` variables were created **before** step 3, exactly as the
note below suggested, so `Container`'s seven widths bind to them. **Collection
placement decided: the existing `Primitives` collection** — it is the only one
with a single, mode-independent mode (`Value`), and the DTCG already treats
breakpoints as a primitive category alongside `space`/`size`/`radii`, which all
live there. Elevation looked like a precedent for a separate collection, but it
is separate because its `shadow.color.*` values are theme-adjacent colours, not
because it is mode-independent.

RFC 0025 §3's design-frame presets remain unbuilt (lower priority).

## Related, same blocker (historical)

RFC 0025's own Figma items are still outstanding and share this bridge problem
— see `transfer-and-next-steps.md` → "📐 Responsive breakpoints":

- the six `breakpoint/*` values as Figma variables (**collection placement is
  still an open decision** — they are mode-independent, so they fit neither
  Context nor Intent; decide before creating anything);
- RFC 0025 §3's design-frame presets (`<Page> — xs (360)` ... `xl (1280)`).

Doing the breakpoint variables **before** step 3 above would be tidier: the
Container set's seven widths are exactly those values, so they could bind
rather than being entered as literals.
